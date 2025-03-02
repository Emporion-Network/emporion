import { type ProductMetadata, type ScrollProducts, stringify, type T } from '@common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { embedDocument } from './embeddings';

const mergeTranslated = (a: T<string>): string => {
  return Object.keys(a).reduce((acc, k) => {
    return acc + a[k as keyof T<string>];
  }, '');
};

export class Db {
  private client: QdrantClient;
  private ProductMetadataName = 'products';

  embedDocument: typeof embedDocument;

  constructor(url: string) {
    this.client = new QdrantClient({ url });
    this.embedDocument = embedDocument;
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
      this.client.createPayloadIndex(this.ProductMetadataName, {
        field_name: 'metadata_url',
        field_schema: {
          type: 'keyword',
          lookup: true,
        },
      });
    }
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
      group_size: 100,
      limit: 100,
    });
    return res.groups.map(h => ({ collection: h.id, products: h.hits.map(h => ({ id: h.id.toString(), ...h.payload })) }));
  }

  async getCollection(id: string) {
    const seller = (await this.getProduct(id))?.seller;
    if (!seller) return [];
    return (await this.client.queryGroups(this.ProductMetadataName, {
      group_by: 'collection',
      filter: {
        must: [
          {
            key: 'seller',
            match: {
              value: seller,
            },
          },
        ],
      },
      with_payload: true,
      group_size: 100,
    })).groups[0]?.hits.map(e => e.payload);
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

  async scrollProducts(params: ScrollProducts['req']) {
    type QueryParam = Parameters<typeof this.client.query>[1];
    const filter: QueryParam['filter'] = {
      ...(params.search
        ? {
            should: [
              {
                key: '_title',
                match: {
                  text: params.search,
                },
              },
              {
                key: '_description',
                match: {
                  text: params.search,
                },
              },
            ],
          }
        : {}),
      must: [
        // {
        //   key: 'listed',
        //   match: {
        //     value: true,
        //   },
        // },
        ...(params.category
          ? [{
              key: 'category',
              match: {
                value: params.category,
              },
            }]
          : []),
        ...(params.seller
          ? [{
              key: 'seller',
              match: {
                value: params.seller,
              },
            }]
          : []),
        ...(params.max_price || params.min_price
          ? [{
              key: 'price',
              range: {
                lte: params.max_price ? Number(params.max_price) : undefined,
                gte: params.min_price ? Number(params.min_price) : undefined,
              },
            }]
          : []),
      ],
    };
    const common: QueryParam = {
      with_payload: {
        exclude: ['_description', '_title'],
      },
      with_vector: false,
      limit: Math.min(params?.limit ? Number(params.limit) : 100, 100),
      offset: params?.start_after ? Number(params.start_after) : undefined,
      filter,
      ...(params.search || params.sort
        ? {
            query: {
              ...(params.search
                ? {
                    nearest: await this.embedDocument(params.search),
                  }
                : {}),
              ...(params.sort
                ? {
                    order_by: {
                      key: 'price',
                      direction: params.sort === 'asc' ? 'asc' : 'desc',
                    },
                  }
                : {}),
            },
          }
        : {}),
    };
    try {
      return (await this.client.query(this.ProductMetadataName, {
        ...common,
      })).points.map(e => e.payload as unknown as ProductMetadata);
    } catch (e: unknown) {
      console.error((e as { data: string }).data);
    }
    return [];
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
