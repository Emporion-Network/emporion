import type { TrackingResponse } from '@common';
import { Carrier } from './base';

interface FedexTrackingResponse {
  output: {
    completeTrackResults: {
      trackingNumber: string
      trackResults: {
        latestStatusDetail: {
          code: string
          derivedCode: string
          statusByLocale: string
        }
        dateAndTimes: {
          type: string
          dateTime: string
        }[]
        serviceDetail: {
          type: string
          description: string
        }
        latestStatusLocation: {
          locationContactAndAddress: {
            address: {
              city: string
              stateOrProvinceCode: string
              countryCode: string
            }
          }
        }
        destinationLocation: {
          locationContactAndAddress: {
            address: {
              city: string
              stateOrProvinceCode: string
              countryCode: string
            }
          }
        }
      }[]
    }[]
  }
}

export class FedEx extends Carrier {
  #token: string;
  #lastAuth = 0;
  #fedexClientId: string;
  #fedexClientSecret: string;
  constructor(fedexClientId: string, fedexClientSecret: string) {
    super('FedEx');
    this.#token = '';
    this.#fedexClientId = fedexClientId;
    this.#fedexClientSecret = fedexClientSecret;
  }

  private async updateAuth() {
    try {
      const res = await fetch('https://apis.fedex.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=client_credentials&client_id=${this.#fedexClientId}&client_secret=${this.#fedexClientSecret}`,
      });
      const x = await res.json();
      const token = x.access_token;
      this.#token = token;
      this.#lastAuth = Date.now();
    } catch {
      //
    }
  };

  private async mapFedexTrackingResponse(response: FedexTrackingResponse): Promise<TrackingResponse[]> {
    return response.output.completeTrackResults.map((result) => {
      const trackResult = result.trackResults[0];
      const location = trackResult?.latestStatusLocation?.locationContactAndAddress?.address;

      // Calculate delivery status and progress based on status code
      const isDelivered = trackResult?.latestStatusDetail?.code === 'DL';
      const statusCode = trackResult?.latestStatusDetail?.code || '';

      // Calculate progress based on shipping stage
      let progress = 0;
      switch (statusCode) {
        case 'PU': // Picked up
        case 'OC': // Origin scan
          progress = 0.2;
          break;
        case 'IT': // In transit
        case 'AR': // Arrived at FedEx location
        case 'DP': // Departed FedEx location
          progress = 0.5;
          break;
        case 'OD': // Out for delivery
        case 'OF': // At local FedEx facility
          progress = 0.8;
          break;
        case 'DL': // Delivered
          progress = 1;
          break;
        default:
          progress = 0.1; // Order processed but not yet picked up
      }

      // Format current location
      const currentLocationStr = location
        ? `${location.city}, ${location.stateOrProvinceCode}, ${location.countryCode}`
        : 'Unknown';

      // Get estimated delivery date
      const estimatedDelivery = trackResult?.dateAndTimes?.find(
        d => d.type === 'ESTIMATED_DELIVERY',
      )?.dateTime || null;

      // Get origin info - using first event if available
      const firstEvent = trackResult?.dateAndTimes?.[0];

      return {
        tracking_number: result.trackingNumber,
        carrier: 'FedEx',
        status: trackResult?.latestStatusDetail?.statusByLocale || 'Unknown',
        status_code: trackResult?.latestStatusDetail?.code || 'Unknown',
        status_description: trackResult?.latestStatusDetail?.derivedCode || '',
        origin: {
          location: 'Origin Location', // FedEx API doesn't provide explicit origin
          timestamp: firstEvent?.dateTime || new Date().toISOString(),
        },
        destination: {
          location: trackResult?.destinationLocation?.locationContactAndAddress?.address
            ? `${trackResult.destinationLocation.locationContactAndAddress.address.city}, ${trackResult.destinationLocation.locationContactAndAddress.address.stateOrProvinceCode}, ${trackResult.destinationLocation.locationContactAndAddress.address.countryCode}`
            : 'Unknown',
        },
        estimated_delivery: estimatedDelivery,
        current_location: {
          location: currentLocationStr,
          timestamp: trackResult?.dateAndTimes?.[0]?.dateTime || new Date().toISOString(),
        },
        events: trackResult?.dateAndTimes?.map(event => ({
          status: trackResult?.latestStatusDetail?.statusByLocale || 'Unknown',
          location: currentLocationStr,
          timestamp: event.dateTime,
          status_code: trackResult?.latestStatusDetail?.code || 'Unknown',
        })) || [],
        delivered: isDelivered,
        progress,
      };
    });
  };

  private async getFedexTrackingInfo(trackingnumbers: string[]) {
    try {
      if (this.#lastAuth + 3600000 < Date.now()) {
        await this.updateAuth();
      }
      const res = await fetch('https://apis.fedex.com/track/v1/trackingnumbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.#token}`,
        },
        body: JSON.stringify({
          trackingInfo: trackingnumbers.map((n) => {
            return {
              trackingNumberInfo: {
                trackingNumber: n,
              },
            };
          }),
          includeDetailedScans: false,
        }),
      });
      return (await res.json()) as FedexTrackingResponse;
    } catch {
      //
    }
  };

  protected async _track(trackingNumber: string): Promise<TrackingResponse | undefined> {
    const res = await this.getFedexTrackingInfo([trackingNumber]);
    if (!res) {
      return;
    }
    const trackingInfo = await this.mapFedexTrackingResponse(res);
    return trackingInfo[0];
  }
}
