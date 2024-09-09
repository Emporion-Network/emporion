import "bun";
import { z } from "zod";
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign, verify, type JwtVariables } from 'hono/jwt'
import { stream } from 'hono/streaming'
import type { ProductMetaData, Attribute, OrderMetaData, SoketMessage } from "../shared-types/index"
import { CATEGORIES } from "../shared-types/categories"
import { REGIONS } from "../shared-types/countries"
import markdownit from 'markdown-it'
import plaintext from 'markdown-it-plain-text'
import sqlstring from 'sqlstring';
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { EmporionQueryClient } from "../client-ts/Emporion.client";
import stringify from 'json-stable-stringify'
import { randomUUID } from "crypto";
import { assert, hash, ServerError, verifySignature, errors, getUniqueCollectionId, validateAddress, capitalize } from "./utils";
import { fromBech32 } from "@cosmjs/encoding";
import { FileStorage, Embedings, Search } from "./fileStorage";
import { pipeline } from "@huggingface/transformers";
import { createBunWebSocket } from 'hono/bun';
import { WSContext } from "hono/ws";

const { upgradeWebSocket, websocket } = createBunWebSocket()


const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: "fp32" });
const addressCountryAndCityExtractor = await pipeline('token-classification', 'Frakko729/bert-base-uncased-city-country-ner', { dtype: "fp32" })
const embed = async (t: string) => {
    const a1 = (await extractor(t, { pooling: "mean", normalize: true })).data;
    return a1 as number[]
}

const extractFrmAddress = async (text: string) => {
    text = text.replaceAll(/[^\p{L}]/ug, ' ').replaceAll(/ +/g, ' ')
    const resp = await addressCountryAndCityExtractor(text)
    return resp.reduce((acc, c: any) => {
        acc[c.entity.toLocaleLowerCase()] = capitalize(c.word)
        return acc;
    }, { country: "", city: "" })
}



const app = new Hono<{ Variables: JwtVariables }>();
const queryClient = await CosmWasmClient.connect(Bun.env.ENDPOINT || "");
const client = new EmporionQueryClient(queryClient, Bun.env.STORE_ADDRESS || "");

const USER_TO_ADDRESSES = new FileStorage<Record<string, string[]>>(`${Bun.env.NODE_ENV}/USER_TO_ADDRESSES`, false);
const PRODUCTS = new FileStorage<ProductMetaData>(`${Bun.env.NODE_ENV}/PRODUCTS`, true);
const COLLECTION_TO_PRODUCTS = new FileStorage<string[]>(`${Bun.env.NODE_ENV}/COLLECTION_TO_PRODUCTS`, true);
const FILES = new FileStorage<File>(`${Bun.env.NODE_ENV}/Files`, true, true);
const HASH_TO_PRODUCT_ID = new FileStorage<Record<string, string>>(`${Bun.env.NODE_ENV}/HASH_TO_PRODUCT_ID`, true);
const SELLER_COLLECTIONS = new FileStorage<string[]>(`${Bun.env.NODE_ENV}/SELLER_COLLECTIONS`, true);
const ORDERID_TO_ORDER_META = new FileStorage<OrderMetaData>(`${Bun.env.NODE_ENV}/ORDERID_TO_ORDER_META`, false);



app.use('*', cors({
    origin: "*"
}))

app.use(
    '/auth/*',
    jwt({
        secret: Bun.env.JWT_SECRET || "",
    })
)

const categories = CATEGORIES.map(e => e.value) as [typeof CATEGORIES[number]['value'], ...typeof CATEGORIES[number]['value'][]]
const regions = REGIONS as [typeof REGIONS[number], ...typeof REGIONS];

const ValidHash = z.string().regex(/^[0-9a-f]{64}$/, "invalid hash");
const ProductId = z.string().regex(/^(0|[1-9][0-9]*)$/, "invalid product id");
const AttributeSchema = z.object({
    trait_type: z.string(),
}).and(
    z.object({
        display_type: z.literal("switch"),
        value: z.boolean(),
    }).or(z.object({
        display_type: z.literal("radio-image"),
        value: z.object({
            src: z.string().url(),
            label: z.string()
        }),
    })
        .or(z.object({
            display_type: z.literal("region"),
            value: z.array(z.enum(regions))
        }))
        .or(z.object({
            display_type: z.enum(["radio-button", "select"]),
            value: z.string().max(100),
        })).or(z.object({
            display_type: z.literal("image"),
            value: z.string().max(300).url(),
        })).or(z.object({
            display_type: z.literal("color"),
            value: z.object({
                color: z.string().regex(/^#[0-9a-f]{8}$/),
                label: z.string().max(100),
            })
        }))
    )) satisfies z.ZodSchema<Attribute>;
const ProductMetaSchema = z.object({
    id: z.string().regex(/^(0|[1-9][0-9]*)$/),
    name: z.string().max(400),
    description: z.string().max(3000),
    image: z.string().url(),
    categories: z.array(z.enum(categories)),
    collection_id: z.string().max(400),
    attributes: z.array(AttributeSchema),
}) satisfies z.ZodSchema<ProductMetaData>;

const OrderMetaDataSchema = z.object({
    id: z.string().regex(/^(0|[1-9][0-9]*)$/),
    postalAddress: z.string().max(300),
    trackingNumber: z.string().max(20),
    countryCity: z.object({
        country: z.string().max(50),
        city: z.string().max(50)
    }),
    messages: z.array(z.object({
        text: z.string().max(500),
        media: z.array(z.string().url()),
        isBuyer: z.boolean(),
        date: z.number(),
    }))
}) satisfies z.ZodSchema<OrderMetaData>;

const SoketMessage = z.object({
        orderId:z.string().regex(/^(0|[1-9][0-9]*)$/),
        jwt:z.string(),
        media: z.array(z.string().url()),
        text:z.string().max(300)
    }).or(
        z.object({
            jwt:z.string(),
        })
    ) satisfies Zod.Schema<SoketMessage>


const NonceReq = z.object({
    address: z.string(),
});

const nonceToAddr = new Map<string, [address: string, timeout: number]>();
const md = new markdownit();
md.use(plaintext);

let prices = {};


app.post('/auth/create-product', async (c) => {
    const body = await c.req.json();
    let { address }: { address: string } = c.get('jwtPayload')
    let productMeta: ProductMetaData = ProductMetaSchema.parse(body);
    let tohash: Partial<ProductMetaData> = structuredClone(productMeta);
    delete tohash.id;
    let pHash = hash(stringify(tohash)).toLowerCase();
    const onChainProduct = await client.product_by_id({ product_id: Number(productMeta.id) });
    assert(onChainProduct.seller === address, errors.UNAUTHORIZED);
    assert(onChainProduct.meta_hash.toLowerCase() === pHash.toLocaleLowerCase(), "Invalid hash")
    assert(await PRODUCTS.has(productMeta.id) === false, "Product already created")
    assert(await PRODUCTS.set(productMeta.id, productMeta), errors.UNKNOWN_ERROR)
    assert(await COLLECTION_TO_PRODUCTS.update(getUniqueCollectionId(address, productMeta.collection_id), (arr = []) => {
        arr.push(productMeta.id)
        return arr;
    }), errors.UNKNOWN_ERROR);
    assert(await HASH_TO_PRODUCT_ID.update(pHash.slice(0, 3), (record = {}) => {
        record[pHash] = productMeta.id;
        return record;
    }), errors.UNKNOWN_ERROR)
    assert(await SELLER_COLLECTIONS.update(address, (v = []) => {
        if (!v.includes(productMeta.collection_id)) {
            v.push(productMeta.collection_id)
        }
        return v;
    }), errors.UNKNOWN_ERROR)
    md.render(productMeta.description)
    //@ts-ignore
    const toEmbed = `${productMeta.name}\n${md.plainText}`
    await Embedings.add([{
        id: BigInt(productMeta.id), vector: await embed(toEmbed)
    }])
    return c.json({})
})


app.post('/check-nonce', async (c) => {
    const body = await c.req.json();
    try {
        const isValidNonce = nonceToAddr.get(body.nonce);
        assert(isValidNonce !== undefined, "Invalid nonce");
        assert(await verifySignature(body.nonce, body), "Signature not valid");
        const [address, timeout] = isValidNonce;
        assert(timeout > Date.now(), "Expired");
        return c.json({
            token: await sign({
                exp: Math.floor(Date.now() / 1000) + 86400,
                address: address,
            }, Bun.env.JWT_SECRET || "")
        })
    } catch (e) {
        if (e instanceof ServerError) {
            return c.json({
                error: e.message
            }, 400)
        }
        return c.json({
            error: errors.UNKNOWN_ERROR
        }, 400)
    }
})

app.post('/nonce', async (c) => {
    nonceToAddr.forEach(([_, timeout], k) => {
        if (timeout < Date.now()) {
            nonceToAddr.delete(k)
        }
    })
    try {
        let req = NonceReq.parse(await c.req.json())
        fromBech32(req.address)
        let nonce = randomUUID();
        nonceToAddr.set(nonce, [req.address, Date.now() + 10000])
        return c.json({ nonce: nonce })
    } catch (e) {
        return c.json({
            error: "invalid request"
        }, 400)
    }
})


app.get('/product/:id', async (c) => {
    const id = c.req.param('id');
    ProductId.parse(id)
    let p = await PRODUCTS.get(id)
    assert(p !== undefined, "product not found", 404);
    return c.json(p)
})

app.get('/hash/:hash', async (c) => {
    const hash = c.req.param('hash').toLocaleLowerCase();
    ValidHash.parse(hash);
    const bkt = hash.slice(0, 3);
    const map = await HASH_TO_PRODUCT_ID.get(bkt)
    assert(map !== undefined, "product not found", 404);
    const id = map[hash]
    assert(id !== undefined, "product not found", 404);
    return c.json(await PRODUCTS.get(id));
})

app.get('/collection/:address/:collection', async (c) => {
    const { address, collection } = c.req.param();
    validateAddress(address)
    const productIds = await COLLECTION_TO_PRODUCTS.get(getUniqueCollectionId(address, collection));
    assert(productIds !== undefined, "collection not found", 404);
    const products = await PRODUCTS.getList(productIds)
    return c.json(products)
})

app.get('/collections/:address', async (c) => {
    const { address } = c.req.param();
    validateAddress(address)
    const collections = await SELLER_COLLECTIONS.get(address)
    return c.json(collections || [])
})


app.post('/auth/create-postal-address', async (c) => {
    let { address }: { address: string } = c.get('jwtPayload');
    const { postalAddress } = await c.req.json();
    z.string().max(300).min(5).parse(postalAddress);
    const k = address.slice(0, 10);
    await USER_TO_ADDRESSES.update(k, (addrs = {}) => {
        addrs[address] = addrs[address] ?? [];
        addrs[address].push(postalAddress);
        return addrs;
    })
    return c.json({}, 200);
})

app.post('/auth/remove-address', async (c) => {
    let { address }: { address: string } = c.get('jwtPayload');
    const { index } = await c.req.json();
    const k = address.slice(0, 10);
    await USER_TO_ADDRESSES.update(k, (addrs = {}) => {
        addrs[address] = addrs[address] ?? [];
        addrs[address] = addrs[address].filter((_, i) => i !== index);
        return addrs;
    })
    return c.json({}, 200);
})

app.get('/auth/addresses', async (c) => {
    let { address }: { address: string } = c.get('jwtPayload');
    const k = address.slice(0, 10);
    const bucket = await USER_TO_ADDRESSES.get(k) || {};
    return c.json(bucket[address] || [])
})

app.get("/products/:page?", async (c) => {
    const page = c.req.param('page');
    ProductId.optional().parse(page)
    return c.json(await PRODUCTS.paginated(page))
})

app.post('/auth/upload-image', async (c) => {
    const body = await c.req.parseBody();
    let { address }: { address: string } = c.get('jwtPayload');
    let files = body['file[]'] as unknown as File[];
    if (!Array.isArray(files)) {
        files = [files]
    }
    const urls = await Promise.all(files.map(async file => {
        assert(file instanceof File, "Sould be file");
        assert(file.type.startsWith('image/'), "Only images accepted");
        assert((file.size / (1000 * 1000)) < 5, "file size should be less than 5mb")
        const files = FILES.prefix(address);
        const key = `${Date.now()}-${randomUUID()}`
        await files.set(key, file);
        return key
    }))

    return c.json({
        urls: urls.map(u => `${address}/${u}`)
    })
})

app.get("/images/:address", async (c) => {
    const address = c.req.param('address');
    validateAddress(address);
    const files = FILES.prefix(address);
    return c.json({
        images: (await files.keys()).map(key => `${address}/${key}`)
    })
})

let lastFetch = Date.now();

app.get("/prices", async (c) => {
    if (lastFetch + 1000 > Date.now()) {
        return c.json(prices);
    }
    const ids = c.req.query('ids');
    const req = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&precision=3&include_24hr_change=true`);
    if (req.status != 200) {
        return c.json(prices)
    }
    lastFetch = Date.now();
    prices = await req.json()
    return c.json(prices);
})

app.get("/image/:address/:key", async (c) => {
    const { address, key } = c.req.param();
    validateAddress(address);
    z.string().regex(/^[0-9a-f-]{36,50}$/).parse(key);
    const file = await FILES.get(`${address}/${key}`);
    assert(file !== undefined, "File not found", 404);
    return stream(c, async (s) => {
        s.write(file as unknown as Uint8Array)
    })
})

app.get("/search/:page?", async (c) => {
    const page = c.req.param('page');
    const search = c.req.query('q');
    let categorie = c.req.query('categorie');
    categorie = categorie === 'all' ? undefined : categorie;
    if (!search) {
        return c.json([]);
    }
    const vect = embed(search)
    const ids: any[] = (await Embedings.search(vect)
        .distanceType('cosine')
        .where(`id >= ${page || '0'}`)
        .limit(100)
        .toArray()).filter(e => e._distance < 0.8)
    const results = (await PRODUCTS.getList(ids.map(e => e.id.toString())))
        .filter(e => categorie ? e.categories.includes(categorie) : true);
    return c.json(results)
})

app.get("/search-suggestions", async (c) => {
    const search = c.req.query('q');
    if (!search) {
        return c.json([]);
    }
    let escaped = sqlstring.escape(`%${search.replaceAll(/[%_]/g, '')}%`)
    const results: { text: string }[] = await Search.query()
        .where(`lower(text) LIKE ${escaped}`)
        .select(["text"])
        .limit(10).toArray();

    return c.json(results.map(e => e.text))
})

app.get('/extract-city-country', async (c) => {
    const search = c.req.query('q') || "";
    const resp = await extractFrmAddress(search)
    return c.json(resp)
})

app.post("/auth/create-order", async (c) => {
    let { address }: { address: string } = c.get('jwtPayload')
    const body = await c.req.json();
    let orderMeta: OrderMetaData = OrderMetaDataSchema.parse({
        id: body.id,
        postalAddress: body.postalAddress,
        trackingNumber: "",
        countryCity: await extractFrmAddress(body.postalAddress),
        messages: []
    });
    const o = await client.order({ order_id: Number(body.id) })
    assert(o.buyer == address, errors.UNAUTHORIZED)
    await ORDERID_TO_ORDER_META.set(body.id, orderMeta);
    return c.json({})
})


app.post('/auth/order-set-tracking-number', async (c) => {
    let { address }: { address: string } = c.get('jwtPayload')
    const body = await c.req.json();
    let id = OrderMetaDataSchema.shape.id.parse(body.id)
    let trackingNumber = OrderMetaDataSchema.shape.trackingNumber.parse(body.trackingNumber);
    const o = await client.order({ order_id: Number(id) });
    assert(o.seller === address, errors.UNAUTHORIZED);
    await ORDERID_TO_ORDER_META.update(body.id, (o) => {
        assert(o !== undefined, "Order not found");
        o.trackingNumber = trackingNumber;
        return o;
    });

    return c.json({})
})


app.post('/auth/order-add-message', async (c) => {
    let { address }: { address: string } = c.get('jwtPayload')
    const body = await c.req.json();
    let id = OrderMetaDataSchema.shape.id.parse(body.id)
    const o = await client.order({ order_id: Number(id) });
    const sender = o.buyer === address ? "buyer" : "seller";
    assert([o.buyer, o.seller].includes(address), errors.UNAUTHORIZED);
    let message = OrderMetaDataSchema.shape
        .messages.element.parse({
            ...body.message,
            date: Date.now(),
            sender,
        });
    assert(o.seller === address, errors.UNAUTHORIZED);
    await ORDERID_TO_ORDER_META.update(body.id, (o) => {
        assert(o !== undefined, "Order not found");
        o.messages.push(message)
        return o;
    });

    return c.json({})
});

app.get('/auth/order/:id', async (c) => {
    const id = c.req.param('id');
    let { address }: { address: string } = c.get('jwtPayload')
    const o = await client.order({ order_id: Number(id) });
    assert([o.buyer, o.seller].includes(address), errors.UNAUTHORIZED);
    return c.json(await ORDERID_TO_ORDER_META.get(id))
})

app.onError((e, c) => {
    console.log(e);
    if (e instanceof ServerError) {
        return c.json({
            error: e.message
        }, e.code)
    }
    if (e instanceof z.ZodError) {
        return c.json({
            error: e.errors[0].message
        }, 400)
    }
    return c.json({
        error: e.message
    }, 400)
})


const wsToUser = new Map<WSContext, {
    address:string,
    orders:Map<string, {isBuyer:boolean, other:string}>
}>

const addressToWs = new Map<string, WSContext>;

app.get(
    '/ws',
    upgradeWebSocket((c) => {
        return {
            async onMessage(event, ws) {
                try {
                    const msg:SoketMessage = SoketMessage.parse(JSON.parse(event.data.toString()));
                    const {address} = await verify(msg.jwt, Bun.env.JWT_SECRET||"") as {address:string};
                    if(!wsToUser.get(ws)){
                        wsToUser.set(ws, {
                            address,
                            orders:new Map(),
                        });
                        addressToWs.set(address, ws);
                    }
                    if(!('orderId' in msg)) return;
                    if(!wsToUser.get(ws)!.orders.get(msg.orderId)){
                        const o = await client.order({order_id:Number(msg.orderId)});
                        assert(o.buyer === address || o.seller === address, errors.UNAUTHORIZED);
                        let isBuyer = o.buyer === address;
                        const other = o.buyer === address ? o.seller : o.buyer;
                        wsToUser.get(ws)!.orders.set(msg.orderId, {
                            isBuyer,
                            other
                        })
                    }
                    const user = wsToUser.get(ws)!.orders.get(msg.orderId)!

                    const message:OrderMetaData['messages'][number] = {
                            text:msg.text,
                            media:msg.media,
                            isBuyer:user.isBuyer,
                            date:Date.now()
                    }
                    const traget = addressToWs.get(user.other);
                    traget?.send(JSON.stringify({
                        orderId:msg.orderId,
                        message,
                    }))

                    ORDERID_TO_ORDER_META.update(msg.orderId, ((m) => {
                        assert(m !== undefined, errors.UNKNOWN_ERROR)
                        m?.messages.push(message)
                        return m;
                    }))

                } catch (e) {
                    console.log(e)
                    ws.close()
                }
            },
            onClose: (_, ws) => {
                const address = wsToUser.get(ws)?.address;
                addressToWs.delete(String(address))
                wsToUser.delete(ws)
            },
        }
    })
)

export default {
    port: 3000,
    fetch: app.fetch,
    websocket
} 