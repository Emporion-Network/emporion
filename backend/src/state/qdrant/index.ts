import { type ProductMetadata, stringify, type T } from '@common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { embedDocument, embedQuery } from './embeddings';

const mergeTranslated = (a: T<string>): string => {
  return Object.keys(a).reduce((acc, k) => {
    return acc + a[k as keyof T<string>];
  }, '');
};

export class Db {
  private client: QdrantClient;
  private ProductMetadataName = 'products';

  embedDocument: typeof embedDocument;
  embedQuery: typeof embedQuery;

  constructor(url: string) {
    this.client = new QdrantClient({ url });
    this.embedDocument = embedDocument;
    this.embedQuery = embedQuery;
    this.init();
  }

  async init() {
    try {
      await Promise.all([
        this.#initProductMetadataName(),
      ]);
    } catch (e: unknown) {
      console.error((e as { data: string }).data);
    }
  }

  async #initProductMetadataName() {
    const e = await (await this.client.collectionExists(this.ProductMetadataName)).exists;
    if (!e) {
      this.client.createCollection(this.ProductMetadataName, {
        vectors: {
          size: 384,
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
    }
    this.client.createPayloadIndex(this.ProductMetadataName, {
      field_name: 'metadata_url',
      field_schema: {
        type: 'keyword',
        lookup: true,
      },
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
    return res.groups.map(h => ({ collection: h.id, products: h.hits.map(h => ({ id: h.id.toString(), ...h.payload })) }));
  }

  async upsertProduct(metaData: ProductMetadata) {
    const vector = await this.embedDocument(stringify(metaData));
    try {
      await this.client.upsert(this.ProductMetadataName, {
        points: [
          {
            vector,
            // @ts-expect-error bigint is accepted but not in the types
            id: BigInt(metaData.id),
            payload: {
              ...metaData,
              price: BigInt(metaData.price),
              _description: mergeTranslated(metaData.description),
              _title: mergeTranslated(metaData.title),
            } as unknown as Record<string, unknown>,
          },
        ],
      });
    } catch (e: unknown) {
      const message = (e as { data: unknown }).data;
      console.error(message);
    }
  }

  async getProduct(id: string) {
    const res = await this.client.retrieve(this.ProductMetadataName, {
      // @ts-expect-error bigint is accepted but not in the types
      ids: [BigInt(id)],
      with_payload: true,
    });
    return res[0]?.payload as unknown as ProductMetadata | undefined;
  }
}
