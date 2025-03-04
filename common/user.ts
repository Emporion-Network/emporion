import type { BlockchainEvent } from "./blockchain";

export interface UserData {
  postalAddresses: {
    postalAddress: string,
    name: string,
  }[],
  addr: string,
  id: string,
  positiveProducts: number[],
  negativeProducts: number[],
  notifications: BlockchainEvent[],
}