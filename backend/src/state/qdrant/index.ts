import { type ProductMetadata, stringify, type T } from '@common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { embedDocument, embedQuery } from './embeddings';
import { randomUUIDv7 } from 'bun';

const mergeTranslated = (a: T<string>): string => {
  return Object.keys(a).reduce((acc, k) => {
    return acc + a[k as keyof T<string>];
  }, '');
};

export class Db {
  private client: QdrantClient;
  private ProductMetadataName = 'products';
  private waitingMap = new Map<string, {
    data: ProductMetadata
    createdAt: number
  }>();

  embedDocument: typeof embedDocument;
  embedQuery: typeof embedQuery;

  constructor(url: string) {
    this.client = new QdrantClient({ url });
    this.embedDocument = embedDocument;
    this.embedQuery = embedQuery;
    this.init();
  }

  async init() {
    await Promise.all([
      this.#initProductMetadataName(),
    ]);
  }

  async #initProductMetadataName() {
    const e = await (await this.client.collectionExists(this.ProductMetadataName)).exists;
    if (!e) {
      this.client.createCollection(this.ProductMetadataName, {
        vectors: {
          size: 768,
          distance: 'Cosine',
          on_disk: true,
        },
      });
      this.client.createPayloadIndex(this.ProductMetadataName, {
        field_name: 'price',
        field_schema: {
          type: 'integer',
          lookup: false,
          range: true,
        },
      });
      this.client.createPayloadIndex(this.ProductMetadataName, {
        field_name: 'seller',
        field_schema: {
          type: 'keyword',
        },
      });
      this.client.createPayloadIndex(this.ProductMetadataName, {
        field_name: 'category',
        field_schema: {
          type: 'keyword',
        },
      });
      this.client.createPayloadIndex(this.ProductMetadataName, {
        field_name: 'collection',
        field_schema: {
          type: 'keyword',
        },
      });
      this.client.createPayloadIndex(this.ProductMetadataName, {
        field_name: '_description',
        field_schema: {
          type: 'text',
          tokenizer: 'word',
          min_token_len: 2,
          max_token_len: 20,
          lowercase: true,
        },
      });
      this.client.createPayloadIndex(this.ProductMetadataName, {
        field_name: '_title',
        field_schema: {
          type: 'text',
          tokenizer: 'prefix',
          min_token_len: 2,
          max_token_len: 20,
          lowercase: true,
        },
      });
      this.client.createPayloadIndex(this.ProductMetadataName, {
        field_name: '_description',
        field_schema: {
          type: 'text',
          tokenizer: 'prefix',
          min_token_len: 2,
          max_token_len: 20,
          lowercase: true,
        },
      });
      this.client.createPayloadIndex(this.ProductMetadataName, {
        field_name: 'price',
        field_schema: {
          type: 'integer',
          lookup: false,
          range: true,
        },
      });
    }
  }

  #clearExpired() {
    const now = Date.now();
    this.waitingMap.forEach((v, k) => {
      if (now - v.createdAt > 1000 * 60 * 10) {
        this.waitingMap.delete(k);
      }
    });
  }

  async getCollections(addr: string) {
    const res = await this.client.queryGroups(this.ProductMetadataName, {
      group_by: 'collection',
      filter: {
        must: [
          {
            key: 'seller',
            match: {
              value: addr,
            },
          },
        ],
      },
      query: {
        order_by: 'price',
      },
      with_payload: true,
      group_size: 500,
      limit: 100,
    });
    console.log(res);
    return res.groups.map(h => ({ collection: h.id, products: h.hits.map(h => ({ id: h.id.toString(), ...h.payload })) }));
  }

  async insertProduct({
    id,
    addr,
    chainId: chain_id,
    price,
  }: {
    id: string
    addr: string
    chainId: string
    price: string
  }) {
    const product = this.waitingMap.get(id)?.data;
    if (!product) return;
    if (product.seller !== addr) return;
    const vector = await this.embedDocument(stringify(product));
    try {
      await this.client.upsert(this.ProductMetadataName, {
        points: [
          {
            vector,
            // @ts-expect-error bigint is accepted but not in the types
            id: BigInt(chain_id),
            payload: {
              ...product,
              price: BigInt(price),
              _description: mergeTranslated(product.description),
              _title: mergeTranslated(product.description),
            } as unknown as Record<string, unknown>,
          },
        ],
      });
    } catch (e: unknown) {
      const message = (e as { data: unknown }).data;
      console.error(message);
    }
    this.waitingMap.delete(id);
    this.#clearExpired();
  }

  getId(metadata: ProductMetadata) {
    const id = randomUUIDv7();
    this.waitingMap.set(id, {
      createdAt: Date.now(),
      data: metadata,
    });
    return id;
  }
}
