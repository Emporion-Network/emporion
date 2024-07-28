import { Binary, CosmosMsgForEmpty, Empty, Uint64 } from './common'

export type ExecuteMsg =
  | {
      query: {
        callback: CallbackRequest
        msgs: QueryRequestForEmpty[]
        timeout_seconds: Uint64
      }
    }
  | {
      execute: {
        callback?: CallbackRequest | null
        msgs: CosmosMsgForEmpty[]
        on_behalf_of?: string | null
        timeout_seconds: Uint64
      }
    }
export type QueryRequestForEmpty =
  | {
      bank: BankQuery
    }
  | {
      custom: Empty
    }
  | {
      staking: StakingQuery
    }
  | {
      stargate: {
        data: Binary
        path: string
      }
    }
  | {
      ibc: IbcQuery
    }
  | {
      wasm: WasmQuery
    }
export type BankQuery =
  | {
      supply: {
        denom: string
      }
    }
  | {
      balance: {
        address: string
        denom: string
      }
    }
  | {
      all_balances: {
        address: string
      }
    }
export type StakingQuery =
  | {
      bonded_denom: {}
    }
  | {
      all_delegations: {
        delegator: string
      }
    }
  | {
      delegation: {
        delegator: string
        validator: string
      }
    }
  | {
      all_validators: {}
    }
  | {
      validator: {
        address: string
      }
    }
export type IbcQuery =
  | {
      port_id: {}
    }
  | {
      list_channels: {
        port_id?: string | null
      }
    }
  | {
      channel: {
        channel_id: string
        port_id?: string | null
      }
    }
export type WasmQuery =
  | {
      smart: {
        contract_addr: string
        msg: Binary
      }
    }
  | {
      raw: {
        contract_addr: string
        key: Binary
      }
    }
  | {
      contract_info: {
        contract_addr: string
      }
    }
  | {
      code_info: {
        code_id: number
      }
    }
export interface CallbackRequest {
  msg: Binary
  receiver: string
}
export interface InstantiateMsg {
  block_max_gas: Uint64
  controller?: string | null
  pair?: Pair | null
}
export interface Pair {
  connection_id: string
  remote_port: string
}
export type QueryMsg =
  | 'active_channel'
  | 'pair'
  | 'controller'
  | {
      remote_address: {
        local_address: string
      }
    }
  | 'block_max_gas'
export type NullableString = string | null
export type NullablePair = Pair | null
