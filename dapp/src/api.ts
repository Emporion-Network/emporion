import type { StdSignature } from "@keplr-wallet/types";
import type { OrderMetaData, ProductMetaData } from "../../shared-types";

class ApiError extends Error { }


function catchAndDefault(defaultValue: any): any {
    return function (_: any, key: any, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any) {
            try {
                return await originalMethod.apply(this, args);
            } catch (e: any) {
                console.error(`${key}: ${e.message}`);
                return defaultValue
            }
        }
        return descriptor
    };
}

function catchAndNotify(errorMessage: string, successMessage?: string): any {
    return function (target: any, _: any, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            try {
                const res = await originalMethod.apply(this, args);
                target.constructor.notify(null, successMessage)
                return res;
            } catch (e: any) {
                console.log(e);
                target.constructor.notify(errorMessage)
            }
        }
        return descriptor
    };
}


export class Api {
    private baseUrl: string;
    private token: string;
    static notify = (err: string, log: string) => (log ?? err) && console[log ? "log" : "error"](log ?? err);

    constructor(baseUrl: string, token: string) {
        this.token = token;
        this.baseUrl = baseUrl;
    }

    setToken(token: string) {
        this.token = token;
    }

    getToken(){
        return this.token;
    }

    private assert(value: boolean, message: string): asserts value {
        if (!value) {
            throw new ApiError(message)
        }
    }

    async get<R>(url: string): Promise<R> {
        const req = await fetch(url, {
            method: "GET",
            headers: {
                'Authorization': `bearer ${this.token}`,
            },
        });
        this.assert(req.ok, `Unexpected status ${req.status}`);
        return req.json()
    }


    async post<T, R>(url: string, body: T): Promise<R> {
        const req = await fetch(url, {
            method: "POST",
            body: body instanceof FormData ? body : JSON.stringify(body),
            headers: {
                'Authorization': `bearer ${this.token}`,
            },
        });
        this.assert(req.ok, `Unexpected status ${req.status}`);
        return req.json()
    }



    @catchAndNotify('Could not upload files')
    async filesUpload(files: File[]) {
        const data = new FormData()
        files.forEach(f => {
            data.append('file[]', f);
        });
        return (await this.post<FormData, { urls: string[] }>(
            `${this.baseUrl}/auth/upload-image`, data
        )).urls.map(url => `${this.baseUrl}/image/${url}`)
    }


    @catchAndDefault([])
    async imagesGet(address: string) {
        return (await this.get<{ images: string[] }>(`${this.baseUrl}/images/${address}`))
            .images.map(url => `${this.baseUrl}/image/${url}`)
    }

    @catchAndDefault([])
    async sellerCollectionsMetasGet(address: string, collection: string) {
        return (await this.get<ProductMetaData[]>(`${this.baseUrl}/collection/${address}/${collection}`))
    }

    @catchAndNotify('Product not found')
    async productGet(id: string) {
        return (await this.get<ProductMetaData>(`${this.baseUrl}/product/${id}`))
    }

    @catchAndDefault([])
    async sellerCollectionNamesGet(address: string) {
        return (await this.get<string[]>(`${this.baseUrl}/collections/${address}`))
    }

    @catchAndNotify('Could not upload metadata', 'Product created successfuly')
    async metaUpload(meta: ProductMetaData) {
        await this.post(`${this.baseUrl}/auth/create-product`, meta)
        return true;
    }

    @catchAndDefault([])
    async suggestionsGet(query: string) {
        const url = new URL(`${this.baseUrl}/search-suggestions`)
        url.searchParams.set('q', query);
        return (await this.get<string[]>(url.href))
    }

    @catchAndDefault([])
    async productsSearch(query: string, categorie?: string, page?: string) {
        const url = page ? new URL(`${this.baseUrl}/search/${page}`) : new URL(`${this.baseUrl}/search`);
        url.searchParams.set('q', query);
        if (categorie) url.searchParams.set('categorie', categorie);
        return await this.get<ProductMetaData[]>(url.href)
    }

    @catchAndDefault([])
    async productsList(page?: string) {
        const url = page ? new URL(`${this.baseUrl}/products/${page}`) : new URL(`${this.baseUrl}/products`);
        return await this.get<ProductMetaData[]>(url.href)
    }

    @catchAndDefault([])
    async postalAddressesGet() {
        return await this.get<string[]>(`${this.baseUrl}/auth/addresses`)
    }


    @catchAndNotify('Could not create delivery address')
    async postalAddressCreate(postalAddress: string) {
        await this.post(`${this.baseUrl}/auth/create-postal-address`, {
            postalAddress
        })
    }

    @catchAndNotify('Could not delete delivery address')
    async postalAddressDelete(postalAddressIndex: number) {
        await this.post(`${this.baseUrl}/auth/delete-postal-address`, {
            postalAddressIndex
        })
    }


    @catchAndNotify('Could not create order', 'Order created successfuly')
    async orderMetaDataCreate(postalAddress: string, id: string) {
        await this.post(`${this.baseUrl}/auth/create-order`, {
            postalAddress,
            id,
        })
    }

    @catchAndNotify('Could not set tracking number')
    async orderMetaDataTrackingNumberSet(trackingNumber: string, id: string) {
        await this.post(`${this.baseUrl}/auth/order-set-tracking-number`, {
            trackingNumber,
            id,
        })
    }


    @catchAndNotify('Could not add message')
    async orderMetaDataMessageAdd(text: string, medias: string[], id: string) {
        await this.post(`${this.baseUrl}/auth/order-add-message`, {
            message:{
                text,
                medias,
            },
            id
        })
    }

    @catchAndNotify('Order not found')
    async orderMetaDataGet(id: string) {
        return await this.get<OrderMetaData>(`${this.baseUrl}/auth/order/${id}`)
    }


    @catchAndDefault(undefined)
    async countryAndCityFromAddress(postalAddress: string) {
        const url = new URL(`${this.baseUrl}/extract-city-country`)
        url.searchParams.set('q', postalAddress);
        return await this.get<{ country: string, city: string }>(url.href)
    }

    @catchAndNotify('Could get nonce')
    async nonce(address:string){
       return await this.post<{ address: string }, {nonce:string}>(`${this.baseUrl}/nonce`, {
            address
        })
    }

    @catchAndNotify('Could get jwt')
    async requestJWT(signature:StdSignature, nonce:string, address:string){
       return await this.post<any, { token: string }>(`${this.baseUrl}/check-nonce`, {
            ...signature,
            nonce,
            address,
        })
    }

}
