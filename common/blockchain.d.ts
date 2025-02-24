import type { MsgSend, MsgMultiSend } from 'osmojs/cosmos/bank/v1beta1/tx';
import type { MsgWithdrawDelegatorReward } from 'osmojs/cosmos/distribution/v1beta1/tx';
import type { MsgDelegate } from 'osmojs/cosmos/staking/v1beta1/tx';
import type { MsgExecuteContract } from 'osmojs/cosmwasm/wasm/v1/tx';
import type { MsgTransfer } from 'osmojs/ibc/applications/transfer/v1/tx';
import type { MsgRecvPacket } from 'osmojs/ibc/core/channel/v1/tx';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

type Amount = {
  amount: string
  denom: string
}[];

export type Msg = MsgTransfer | MsgSend | MsgRecvPacket | MsgExecuteContract | MsgDelegate | MsgWithdrawDelegatorReward | MsgMultiSend;

export interface EventType {
  MsgTransfer: MsgTransferData
  MsgSend: MsgTransferData
  MsgRecvPacket: MsgTransferData
  MsgExecuteContract: MsgExecuteContractData
  MsgDelegate: MsgDelegateData
  MsgWithdrawDelegatorReward: MsgWithdrawDelegatorRewardData
  MsgMultiSend: MsgTransferData
}

export type BlockchainEvent<T extends keyof EventType | undefined = undefined> = Extract<Values<{
  [k in keyof EventType]: {
    type: k
    hash: string
    height: number
    data: EventType[k]
    notify: string[]
  }
}>, T extends undefined ? object : { type: T }>;
type Values<T> = T[keyof T];

export interface MsgTransferData {
  sender: string
  receiver: string
  amount: Amount
}

export interface MsgExecuteContractData {
  sender: string
  contract: string
  amount: Amount
  message: Any
}

export interface MsgDelegateData {
  delegator: string
  validator: string
  amount: Amount
}

export interface MsgWithdrawDelegatorRewardData {
  delegator: string
  validator: string
}
