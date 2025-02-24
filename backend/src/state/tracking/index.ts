import type { Carrier } from './carriers/base';
import { Dhl } from './carriers/dhl';
import { FedEx } from './carriers/fedex';
import { Ups } from './carriers/ups';
import type { TrackingResponse } from '@common';

/**
 * This class is responsible for providing the parcel tracking api
 * it should be the entry point for any requests related to tracking
 */
export class Tracking {
  carriers = new Map<string, Carrier>();
  constructor(
    {
      dhlApiKey,
      upsClientId,
      upsClientSecret,
      fedexClientId,
      fedexClientSecret,
    }: {
      dhlApiKey: string
      upsClientId: string
      upsClientSecret: string
      fedexClientId: string
      fedexClientSecret: string
    },
  ) {
    [
      new Dhl(dhlApiKey),
      new Ups(upsClientId, upsClientSecret),
      new FedEx(fedexClientId, fedexClientSecret),
    ].forEach((e) => {
      this.carriers.set(e.name, e);
    });
  }

  async track(carier: TrackingResponse['carrier'], trackingNumber: string) {
    const carrier = this.carriers.get(carier);
    if (!carrier) {
      return undefined;
    }
    return await carrier.track(trackingNumber);
  }
}
