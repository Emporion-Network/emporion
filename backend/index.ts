import "bun";
import { z } from "zod";
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign, type JwtVariables } from 'hono/jwt'
import { stream } from 'hono/streaming'
import type { ProductMetaData, Attribute } from "../shared-types/index"
import { CATEGORIES } from "../shared-types/categories"
import { REGIONS } from "../shared-types/countries"
import markdownit from 'markdown-it'
import plaintext from 'markdown-it-plain-text'
import sqlstring from 'sqlstring';
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { EmporionQueryClient } from "../client-ts/Emporion.client";
import stringify from 'json-stable-stringify'
import { randomUUID } from "crypto";
import { assert, hash, ServerError, verifySignature, errors, getUniqueCollectionId, validAddress as validateAddress, embed } from "./utils";
import { fromBech32 } from "@cosmjs/encoding";
import { FileStorage, Embedings, Search } from "./fileStorage";


const app = new Hono<{ Variables: JwtVariables }>();
const queryClient = await CosmWasmClient.connect(Bun.env.ENDPOINT || "");
const client = new EmporionQueryClient(queryClient, Bun.env.STORE_ADDRESS || "");

const PRODUCTS = new FileStorage<ProductMetaData>('PRODUCTS', true);
const COLLECTION_TO_PRODUCTS = new FileStorage<string[]>('COLLECTION_TO_PRODUCTS', true);
const FILES = new FileStorage<File>('Files', true, true);
const HASH_TO_PRODUCT_ID =  new FileStorage<Record<string, string>>("HASH_TO_PRODUCT_ID", true);
const SELLER_COLLECTIONS = new FileStorage<string[]>('SELLER_COLLECTIONS', true);


app.use('*', cors({
    origin: "*"
}))

app.use(
    '/auth/*',
    jwt({
        secret: Bun.env.JWT_SECRET || "",
    })
)

const categories = CATEGORIES.map(e=> e.value) as [typeof CATEGORIES[number]['value'], ...typeof CATEGORIES[number]['value'][]]
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
            value: z.string(),
        })).or(z.object({
            display_type: z.literal("image"),
            value: z.string().url(),
        })).or(z.object({
            display_type: z.literal("color"),
            value: z.string().regex(/^#[0-9a-f]{8}$/),
        }))
    )) satisfies z.ZodSchema<Attribute>;
const ProductMetaSchema = z.object({
    id: z.string().regex(/^(0|[1-9][0-9]*)$/),
    name: z.string(),
    description: z.string(),
    image: z.string().url(),
    categories: z.array(z.enum(categories)),
    collection_id: z.string(),
    attributes: z.array(AttributeSchema),
}) satisfies z.ZodSchema<ProductMetaData>;

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
    const onChainProduct = await client.productById({ productId: Number(productMeta.id) });
    assert(onChainProduct.seller === address, errors.UNAUTHORIZED);
    assert(onChainProduct.meta_hash.toLowerCase() === pHash.toLocaleLowerCase(), "Invalid hash")
    assert(await PRODUCTS.has(productMeta.id) === false, "Product already created")
    assert(await PRODUCTS.set(productMeta.id, productMeta), errors.UNKNOWN_ERROR)
    assert(await COLLECTION_TO_PRODUCTS.update(getUniqueCollectionId(address, productMeta.collection_id), (arr = []) => {
        arr.push(productMeta.id)
        return arr;
    }), errors.UNKNOWN_ERROR);
    assert(await HASH_TO_PRODUCT_ID.update(pHash.slice(0, 3),(record={})=>{
        record[pHash]=productMeta.id;
        return record;
    }), errors.UNKNOWN_ERROR)
    assert(await SELLER_COLLECTIONS.update(address, (v=[])=>{
        if(!v.includes(productMeta.collection_id)){
            v.push(productMeta.collection_id)
        }
        return v;
    }),errors.UNKNOWN_ERROR)
    md.render(productMeta.description)
    //@ts-ignore
    const toEmbed = `${productMeta.name}\n${md.plainText}`
    await Embedings.add([{
        id:BigInt(productMeta.id), vector:await embed(toEmbed)
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
    const {address, collection} = c.req.param();
    validateAddress(address)
    const productIds = await COLLECTION_TO_PRODUCTS.get(getUniqueCollectionId(address, collection));
    assert(productIds !== undefined, "collection not found", 404);
    const products = await PRODUCTS.getList(productIds)
    return c.json(products)
})

app.get('/collections/:address', async(c)=>{
    const {address} = c.req.param();
    validateAddress(address)
    const collections = await SELLER_COLLECTIONS.get(address)
    return c.json(collections||[])
})

app.get("/auth/test", async (c) => {
    const payload = c.get('jwtPayload')
    return c.json({
        payload
    })
})

app.get("/products/:page?", async (c)=>{
    const page = c.req.param('page');
    ProductId.optional().parse(page)
    return c.json(await PRODUCTS.paginated(page))
})

app.post('/auth/upload-image', async(c)=>{
    const body = await c.req.parseBody();
    let { address }: { address: string } = c.get('jwtPayload');
    const file = body['file'];
    assert(file instanceof File, "Sould be file");
    assert(file.type.startsWith('image/'), "Only images accepted");
    assert((file.size / (1000 * 1000)) < 5, "file size should be less than 5mb")
    const files = FILES.prefix(address);
    const key = randomUUID()
    await files.set(key, file);
    return c.json({
        url:`${address}/${key}`
    })
})

app.get("/images/:address", async(c)=>{
    const address = c.req.param('address');
    validateAddress(address);
    const files = FILES.prefix(address);
    return c.json({
        images:(await files.keys()).map(key => `${address}/${key}`)
    })
})

let lastFetch = Date.now();

app.get("/prices", async (c)=>{
    if(lastFetch + 1000 > Date.now()){
        return c.json(prices);
    }
    const ids = c.req.query('ids');
    const req = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&precision=3&include_24hr_change=true`);
    if(req.status != 200){
        return c.json(prices)
    }
    lastFetch = Date.now();
    prices = await req.json()
    return c.json(prices);
})

app.get("/image/:address/:key", async(c)=>{
    const {address, key} = c.req.param();
    validateAddress(address);
    z.string().uuid().parse(key);
    const file = await FILES.get(`${address}/${key}`);
    assert(file !== undefined, "File not found", 404);
    return stream(c, async (s)=>{
        s.write(file as unknown as Uint8Array)
    })
})

app.get("/search", async (c)=>{
    const search = c.req.query('q');
    let categorie = c.req.query('categorie');
    categorie = categorie === 'all' ? undefined : categorie;
    if(!search){
        return c.json([]);
    }
    const vect = embed(search)
    const ids:any[] = (await Embedings.search(vect)
    .distanceType('cosine').limit(10).toArray()).filter(e => e._distance < 0.8)
    const results =  (await PRODUCTS.getList(ids.map(e => e.id.toString())))
    .filter(e => categorie ? e.categories.includes(categorie) : true);
    return c.json(results)
})

app.get("/search-suggestions", async(c)=>{
    const search = c.req.query('q');
    if(!search){
        return c.json([]);
    }
    let escaped = sqlstring.escape(`%${search.replaceAll(/[%_]/g,'')}%`)
    const results:{text:string}[] = await Search.query()
    .where(`lower(text) LIKE ${escaped}`)
    .select(["text"])
    .limit(10).toArray();

    return c.json(results.map(e=>e.text))
})


app.onError((e, c) => {
    if (e instanceof ServerError) {
        return c.json({
            error: e.message
        }, e.code)
    }
    if(e instanceof z.ZodError){
        return c.json({
            error: e.errors[0].message
        }, 400)
    }
    return c.json({
        error: e.message
    }, 400)
})

export default {
    port: 3000,
    fetch: app.fetch,
} 