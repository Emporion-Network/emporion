import ms from 'ms';
import type { TrackingResponse } from '@common';

/**
 * All future carriers should extend this class
 */
export abstract class Carrier {
  #cache: Map<string, [number, TrackingResponse]>;
  #cacheExpirationMs: number;
  name: string;
  /** @virtual */
  protected abstract _track(trackingNumber: string): Promise<TrackingResponse | undefined>;

  constructor(name: TrackingResponse['carrier'], cacheExpirationMs = ms('1d')) {
    this.#cache = new Map();
    this.#cacheExpirationMs = cacheExpirationMs;
    this.name = name;
    setInterval(() => {
      this.#cleanupOld();
    }, ms('1h'));
  }

  #cleanupOld() {
    const now = Date.now();
    for (const [trackingNumber, [lastUpdated]] of this.#cache) {
      if (now - lastUpdated > ms('1week')) {
        this.#cache.delete(trackingNumber);
      }
    }
  }

  /** @sealed */
  async track(trackingNumber: string): Promise<TrackingResponse | undefined> {
    const cached = this.#cache.get(trackingNumber);
    if (cached) {
      const [lastUpdated, res] = cached;
      if (Date.now() - lastUpdated < this.#cacheExpirationMs) {
        return res;
      }
    }
    const res = await this._track(trackingNumber);
    if (res) {
      this.#cache.set(trackingNumber, [Date.now(), res]);
    }
  }
}
