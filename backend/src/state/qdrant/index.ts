import { type Notification, type OrderData, type PostalAddress, type ProductMetadata, type ScrollProducts, stringify, type T, toUUID, type UpdateUserData, type UserData } from '@common';
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
  private UserDataName = 'user';
  private OrderDataName = 'orders';

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
        this.#initUserData(),
        this.#initOrderData(),
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

  async #initUserData() {
    const e = await (await this.client.collectionExists(this.UserDataName)).exists;
    if (!e) {
      await this.client.createCollection(this.UserDataName, {
        vectors: {
          size: 1,
          distance: 'Cosine',
        },
      });
      await this.client.createPayloadIndex(this.UserDataName, {
        field_name: 'addr',
        field_schema: {
          type: 'keyword',
          lookup: true,
        },
      });
    }
  }

  async #initOrderData() {
    const e = await (await this.client.collectionExists(this.OrderDataName)).exists;
    if (!e) {
      await this.client.createCollection(this.OrderDataName, {
        vectors: {
          size: 1,
          distance: 'Cosine',
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
    })).groups[0]?.hits.map(e => e.payload) as unknown as ProductMetadata[];
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
      ...(params.q
        ? {
            should: [
              {
                key: '_title',
                match: {
                  text: params.q,
                },
              },
              {
                key: '_description',
                match: {
                  text: params.q,
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
      ...(params.q || params.sort
        ? {
            query: {
              ...(params.q
                ? {
                    nearest: await this.embedDocument(params.q),
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

  #newUserData(addr: string): UserData {
    return {
      id: toUUID(addr),
      addr,
      postalAddresses: [],
      positiveProducts: [],
      negativeProducts: [],
      notifications: [],
    };
  }

  async updateUserData(addr: string, newUserData: UpdateUserData) {
    let old = (await this.client.query(this.UserDataName, {
      filter: {
        must: [{
          key: 'addr',
          match: {
            value: addr,
          },
        }],
      },
      with_payload: true,
    })).points[0]?.payload as unknown as UserData;
    if (!old) return;
    old = {
      ...old,
      postalAddresses: newUserData.postalAddresses,
      positiveProducts: newUserData.positiveProducts,
      negativeProducts: newUserData.negativeProducts,
    };
    try {
      await this.client.upsert(this.UserDataName, {
        points: [{
          id: old.id,
          vector: [0],
          payload: old as unknown as Record<string, unknown>,
        }],
      });
    } catch (e) {
      console.log((e as Record<string, string>).data);
    }
    return old;
  }

  async getUserData(addr: string): Promise<UserData | undefined> {
    const res = await this.client.query(this.UserDataName, {
      filter: {
        must: [{
          key: 'addr',
          match: {
            value: addr,
          },
        }],
      },
      with_payload: true,
      consistency: 'all',
    });
    let user = res.points[0]?.payload as unknown as UserData;
    if (!user) {
      user = this.#newUserData(addr);
      try {
        await this.client.upsert(this.UserDataName, {
          points: [{
            id: user.id,
            vector: [0],
            payload: user as unknown as Record<string, unknown>,
          }],
          wait: true,
        });
      } catch (e) {
        console.log((e as unknown as { data: string }).data);
      }
    }
    return user as UserData;
  }

  async pushNotification(addr: string, n: Notification) {
    const res = await this.client.query(this.UserDataName, {
      filter: {
        must: [{
          key: 'addr',
          match: {
            value: addr,
          },
        }],
      },
      with_payload: true,
      consistency: 'all',
    });
    const user = res.points[0]?.payload as unknown as UserData;
    if (!user) return;
    user.notifications.push(n);
    await this.client.upsert(this.UserDataName, {
      points: [{
        id: user.id,
        vector: [0],
        payload: user as unknown as Record<string, unknown>,
      }],
    });
  }

  #newOrderData({
    id,
    seller,
    buyer,
    postalAddress,
  }: {
    id: string
    seller: string
    buyer: string
    postalAddress: PostalAddress
  }) {
    return {
      id,
      seller,
      buyer,
      postalAddress,
      trackingNumber: '',
      messages: [],
    };
  }

  async createOrderData(orderData: {
    id: string
    seller: string
    buyer: string
    postalAddress: PostalAddress
  }) {
    try {
      await this.client.upsert(this.OrderDataName, {
        points: [{
          // @ts-expect-error accepts number and bigint
          id: BigInt(orderData.id),
          vector: [0],
          payload: this.#newOrderData(orderData) as unknown as Record<string, unknown>,
        }],
        wait: true,
      });
    } catch (e) {
      console.log((e as unknown as { data: string }).data);
    }
  }

  async getOrderData(id: string) {
    try {
      return (await this.client.retrieve(this.OrderDataName, {
        // @ts-expect-error accepts number and bigint
        ids: [BigInt(id)],
        with_payload: true,
      }))[0]?.payload as unknown as OrderData;
    } catch (e) {
      console.log((e as unknown as { data: string }).data);
    }
  }

  async updateOrderData(id: string, order: OrderData) {
    await this.client.overwritePayload(this.OrderDataName, {
      // @ts-expect-error accepts number and bigint
      points: [BigInt(id)],
      payload: order as unknown as Record<string, unknown>,
    });
  }
}
