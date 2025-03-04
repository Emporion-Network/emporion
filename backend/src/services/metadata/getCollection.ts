import type { Db } from '@/state/qdrant';

export const getCollectionFromProductId = (id: string, db: Db) => {
  return db.getCollection(id);
};
