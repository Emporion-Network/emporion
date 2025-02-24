/**
 * This is a unified response for all cariers
 */
export interface TrackingResponse {
  tracking_number: string
  carrier: 'UPS' | 'FedEx' | 'DHL' | 'OTHER' // Extendable for more carriers
  status: string
  status_code: string
  status_description: string
  origin: {
    location: string
    timestamp: string // ISO 8601 format
  }
  destination: {
    location: string
  }
  estimated_delivery: string | null // ISO 8601 format or null if unknown
  current_location: {
    location: string
    timestamp: string
  }
  events: {
    status: string
    location: string
    timestamp: string
    status_code: string
  }[]
  delivered: boolean
  progress: number // 0 to 1
}
