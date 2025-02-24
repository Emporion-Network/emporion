import type { BlockchainEvent as Bevent } from './blockchain';

export interface ChatMessage {
  send: {
    chatId: string
    to: string
    message: string
  }
  recv: {
    chatId: string
    from: string
    message: string
    at: number
  }
}
