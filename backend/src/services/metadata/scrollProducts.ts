import type { Db } from '@/state/qdrant';

export const scrollProducts = async ({
  limit,
  category,
  start_after,
  q,
  seller,
  sort,
  min_price,
  max_price,
}: {
  limit: string
  category: string
  start_after: string
  q: string
  seller: string
  sort: string
  min_price: string
  max_price: string
}, db: Db) => {
  return await db.scrollProducts({
    start_after,
    limit,
    category,
    q,
    seller,
    sort,
    min_price,
    max_price,
  });
};
