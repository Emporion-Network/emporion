import type { TrackingResponse } from '@common';
import { Carrier } from './base';

interface DhlTrackingResponse {
  shipments: {
    id: string
    status: {
      timestamp: string
      location: {
        address: {
          addressLocality: string
          addressRegion: string
          countryCode: string
        }
      }
      statusCode: string
      status: string
      description: string
    }
    origin: {
      address: {
        addressLocality: string
        addressRegion: string
        countryCode: string
      }
    }
    destination: {
      address: {
        addressLocality: string
        addressRegion: string
        countryCode: string
      }
    }
    estimatedTimeOfDelivery: string | null
    events: {
      timestamp: string
      location: {
        address: {
          addressLocality: string
          addressRegion: string
          countryCode: string
        }
      }
      statusCode: string
      status: string
      description: string
    }[]
  }[]
}

export class Dhl extends Carrier {
  #dhlApiKey: string;
  constructor(dhlApiKey: string) {
    super('DHL');
    this.#dhlApiKey = dhlApiKey;
  }

  private async getDhlTrackingInfo(trackingnumber: string, dhlApiKey: string): Promise<DhlTrackingResponse | undefined> {
    try {
      const req = await fetch(`https://api-eu.dhl.com/track/shipments?trackingNumber=${trackingnumber}`, {
        method: 'GET',
        headers: {
          'DHL-API-Key': dhlApiKey,
          'Content-Type': 'application/json',
        },
      });
      return await req.json();
    } catch {
      //
    }
  };

  private mapDhlTrackingResponse(response: DhlTrackingResponse): TrackingResponse[] {
    return response.shipments.map((shipment) => {
      // Calculate delivery status and progress based on status code
      const isDelivered = shipment.status.statusCode === 'delivered';
      const statusCode = shipment.status.statusCode;

      // Calculate progress based on shipping stage
      let progress = 0;
      switch (statusCode) {
        case 'picked-up':
        case 'processed':
          progress = 0.2;
          break;
        case 'in-transit':
        case 'departed-facility':
        case 'arrived-facility':
          progress = 0.5;
          break;
        case 'out-for-delivery':
        case 'with-delivery-courier':
          progress = 0.8;
          break;
        case 'delivered':
          progress = 1;
          break;
        default:
          progress = 0.1; // Order processed but not yet picked up
      }

      // Format current location
      const currentLocationStr = shipment.status.location?.address
        ? `${shipment.status.location.address.addressLocality}, ${shipment.status.location.address.addressRegion}, ${shipment.status.location.address.countryCode}`
        : 'Unknown';

      return {
        tracking_number: shipment.id,
        carrier: 'DHL',
        status: shipment.status.status,
        status_code: shipment.status.statusCode,
        status_description: shipment.status.description,
        origin: {
          location: shipment.origin?.address
            ? `${shipment.origin.address.addressLocality}, ${shipment.origin.address.addressRegion}, ${shipment.origin.address.countryCode}`
            : 'Unknown',
          timestamp: shipment.events[shipment.events.length - 1]?.timestamp || new Date().toISOString(),
        },
        destination: {
          location: shipment.destination?.address
            ? `${shipment.destination.address.addressLocality}, ${shipment.destination.address.addressRegion}, ${shipment.destination.address.countryCode}`
            : 'Unknown',
        },
        estimated_delivery: shipment.estimatedTimeOfDelivery,
        current_location: {
          location: currentLocationStr,
          timestamp: shipment.status.timestamp,
        },
        events: shipment.events.map(event => ({
          status: event.status,
          location: event.location?.address
            ? `${event.location.address.addressLocality}, ${event.location.address.addressRegion}, ${event.location.address.countryCode}`
            : 'Unknown',
          timestamp: event.timestamp,
          status_code: event.statusCode,
        })),
        delivered: isDelivered,
        progress,
      };
    });
  };

  protected async _track(trackingnumber: string): Promise<TrackingResponse | undefined> {
    const response = await this.getDhlTrackingInfo(trackingnumber, this.#dhlApiKey);
    if (!response) {
      return undefined;
    }
    return this.mapDhlTrackingResponse(response)[0];
  }
}
