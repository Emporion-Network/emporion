import type { TrackingResponse } from '@common';
import { Carrier } from './base';

export interface UPSTrackingResponse {
  trackResponse: {
    shipment: {
      inquiryNumber: string
      package: {
        accessPointInformation?: {
          pickupByDate: string
        }
        activity: {
          date: string | null
          gmtDate: string | null
          gmtOffset: string | null
          gmtTime: string | null
          location: {
            address: {
              city: string
              stateProvince: string
              country: string
            }
          } | null
          status: {
            type: string
            description: string
            code: string
          } | null
          time: string | null
        }[]
        additionalAttributes?: string[]
        additionalServices?: string[]
        alternateTrackingNumber?: {
          number: string | null
          type: string | null
        }[]
        currentStatus?: {
          code: string
          description: string
          simplifiedTextDescription: string
          statusCode: string
          type: string
        }
        deliveryDate: {
          date: string | null
          type: string | null
        }[]
        deliveryInformation?: {
          deliveryPhoto?: {
            isNonPostalCodeCountry: boolean | null
            photo: string | null
            photoCaptureInd: string | null
            photoDispositionCode: string | null
          }
          location?: string
          receivedBy?: string
          signature?: {
            image: string | null
          }
          pod?: {
            content: string | null
          }
        }
        deliveryTime?: {
          endTime: string
          startTime: string
          type: string
        }
        dimension?: {
          height: string
          length: string
          unitOfDimension: string
          width: string
        }
        isSmartPackage?: boolean
        milestones?: {
          category: string | null
          code: string | null
          current: boolean | null
          description: string | null
          linkedActivity: string | null
          state: string | null
          subMilestone: string | null
        }[]
        packageAddress?: {
          address: string | null
          attentionName: string | null
          name: string | null
          type: string | null
        }[]
        packageCount?: number
        paymentInformation?: {
          amount: number | null
          currency: string | null
          id: string | null
          paid: boolean | null
          paymentMethod: string | null
          type: string | null
        }[]
        referenceNumber?: {
          number: string | null
          type: string | null
        }[]
        service?: {
          code: string
          description: string
          levelCode: string
        }
        statusCode?: string
        statusDescription?: string
        suppressionIndicators?: string
        trackingNumber?: string
        ucixStatus?: string
        weight?: {
          unitOfMeasurement: string
          weight: string
        }
        originAddress: {
          city: string
          stateProvince: string
          country: string
        }
        deliveryAddress: {
          city: string
          stateProvince: string
          country: string
        }
      }[]
      userRelation?: string
      warnings?: {
        code: string
        message: string
      }[]
    }[]
  }
}

export class Ups extends Carrier {
  #token = '';
  #lastAuth = 0;
  #upsClientId: string;
  #upsClientSecret: string;
  constructor(upsClientId: string, upsClientSecret: string) {
    super('UPS');
    this.#upsClientId = upsClientId;
    this.#upsClientSecret = upsClientSecret;
  }

  private async getUpsJWT() {
    try {
      const res = await fetch('https://onlinetools.ups.com/security/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.#upsClientId}:${this.#upsClientSecret}`).toString('base64')}`,
        },
        body: `grant_type=client_credentials`,
      });
      const tokenResp = await res.json();
      this.#token = tokenResp.access_token;
      this.#lastAuth = Date.now();
    } catch (e) {
      console.log(e);
      //
    }
  };

  private async getUpsTrackingInfo(trackingNumber: string): Promise<undefined | UPSTrackingResponse> {
    try {
      if (this.#lastAuth + 3600000 < Date.now()) {
        await this.getUpsJWT();
      }
      return (await fetch(`https://wwwcie.ups.com/api/track/v1/details/${trackingNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.#token}`,
        },
      },
      )).json();
    } catch {
      //
    }
  };

  private mapUpsTrackingResponse(response: UPSTrackingResponse): TrackingResponse[] {
    return response.trackResponse.shipment.map((shipment) => {
      const pkg = shipment.package[0]; // Get first package info
      const latestActivity = pkg.activity[0]; // Most recent activity

      // Calculate delivery status and progress
      const isDelivered = pkg.currentStatus?.code === 'D';
      const statusCode = pkg.currentStatus?.code || '';

      // Calculate progress based on shipping stage
      let progress = 0;
      switch (statusCode) {
        case 'P': // Pickup
        case 'O': // Origin scan
          progress = 0.2;
          break;
        case 'I': // In transit
        case 'M': // Arrival scan
          progress = 0.5;
          break;
        case 'X': // Out for delivery
        case 'L': // Destination scan
          progress = 0.8;
          break;
        case 'D': // Delivered
          progress = 1;
          break;
        default:
          progress = 0.1; // Order processed
      }

      // Format current location
      const currentLocationStr = latestActivity?.location?.address
        ? `${latestActivity.location.address.city}, ${latestActivity.location.address.stateProvince}, ${latestActivity.location.address.country}`
        : 'Unknown';

      // Get estimated delivery date
      const estimatedDelivery = pkg.deliveryDate?.find(d => d.type === 'SCHEDULED')?.date || null;

      return {
        tracking_number: shipment.inquiryNumber,
        carrier: 'UPS',
        status: pkg.currentStatus?.description || 'Unknown',
        status_code: statusCode,
        status_description: pkg.currentStatus?.simplifiedTextDescription || '',
        origin: {
          location: pkg.originAddress
            ? `${pkg.originAddress.city}, ${pkg.originAddress.stateProvince}, ${pkg.originAddress.country}`
            : 'Unknown',
          timestamp: pkg.activity[pkg.activity.length - 1]?.date || new Date().toISOString(),
        },
        destination: {
          location: pkg.deliveryAddress
            ? `${pkg.deliveryAddress.city}, ${pkg.deliveryAddress.stateProvince}, ${pkg.deliveryAddress.country}`
            : 'Unknown',
        },
        estimated_delivery: estimatedDelivery,
        current_location: {
          location: currentLocationStr,
          timestamp: latestActivity?.date || new Date().toISOString(),
        },
        events: pkg.activity.map(activity => ({
          status: activity.status?.description || 'Unknown',
          location: activity.location?.address
            ? `${activity.location.address.city}, ${activity.location.address.stateProvince}, ${activity.location.address.country}`
            : 'Unknown',
          timestamp: activity.date || new Date().toISOString(),
          status_code: activity.status?.code || 'Unknown',
        })),
        delivered: isDelivered,
        progress,
      };
    });
  };

  protected async _track(trackingNumber: string): Promise<TrackingResponse | undefined> {
    const res = await this.getUpsTrackingInfo(trackingNumber);
    if (!res) {
      return undefined;
    }
    const mapped = this.mapUpsTrackingResponse(res);
    return mapped[0];
  }
}
