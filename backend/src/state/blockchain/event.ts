import { Registry, type GeneratedType } from '@cosmjs/proto-signing';
import { defaultRegistryTypes } from '@cosmjs/stargate';
import { cosmosProtoRegistry, cosmwasmProtoRegistry, ibcProtoRegistry } from 'osmojs';
import { MsgMultiSend, MsgSend } from 'osmojs/cosmos/bank/v1beta1/tx';
import { MsgWithdrawDelegatorReward } from 'osmojs/cosmos/distribution/v1beta1/tx';
import { MsgDelegate } from 'osmojs/cosmos/staking/v1beta1/tx';
import { Tx } from 'osmojs/cosmos/tx/v1beta1/tx';
import { MsgExecuteContract } from 'osmojs/cosmwasm/wasm/v1/tx';
import { MsgTransfer } from 'osmojs/ibc/applications/transfer/v1/tx';
import { MsgRecvPacket } from 'osmojs/ibc/core/channel/v1/tx';
import type { BlockchainEvent, Msg } from '@common';
import { into } from '@common';

/**
 * Decode txs into events
 */
export class TxDecoder {
  private msgToEvent = new Map<string, (msg: Msg, height: number, hash: string) => (BlockchainEvent[])>();
  private registry: Registry;

  constructor() {
    this.msgToEvent.set(MsgTransfer.typeUrl, this.#decodeMsgTransfer);
    this.msgToEvent.set(MsgSend.typeUrl, this.#decodeMsgSend);
    this.msgToEvent.set(MsgRecvPacket.typeUrl, this.#decodeMsgRecvPacket);
    this.msgToEvent.set(MsgExecuteContract.typeUrl, this.#decodeMsgExecuteContract);
    this.msgToEvent.set(MsgDelegate.typeUrl, this.#decodeMsgDelegate);
    this.msgToEvent.set(MsgWithdrawDelegatorReward.typeUrl, this.#decodeMsgWithdrawDelegatorReward);
    this.msgToEvent.set(MsgMultiSend.typeUrl, this.#decodeMsgMultiSend);

    this.registry = new Registry([
      ...defaultRegistryTypes,
      ...ibcProtoRegistry,
      ...cosmosProtoRegistry,
      ...cosmwasmProtoRegistry,
      [Tx.typeUrl, Tx] as unknown as [string, GeneratedType],
    ]);
  }

  #decodeJson = (msg: Uint8Array) => {
    try {
      return JSON.parse(new TextDecoder().decode(msg));
    } catch { /**/ }
  };

  #decodeMsgTransfer = (msg: Msg, height: number, hash: string): BlockchainEvent<'MsgTransfer'>[] => {
    into<MsgTransfer>(msg);
    return [{
      hash,
      height,
      type: 'MsgTransfer',
      data: {
        sender: msg.sender,
        receiver: msg.receiver,
        amount: [msg.token],
      },
      notify: [msg.sender, msg.receiver],
    }];
  };

  #decodeMsgSend = (msg: Msg, height: number, hash: string): BlockchainEvent<'MsgSend'>[] => {
    into<MsgSend>(msg);
    return ([{
      hash,
      height,
      type: 'MsgSend',
      data: {
        sender: msg.fromAddress,
        receiver: msg.toAddress,
        amount: msg.amount,
      },
      notify: [msg.fromAddress, msg.toAddress],
    }]);
  };

  #decodeMsgRecvPacket = (msg: Msg, height: number, hash: string): BlockchainEvent<'MsgRecvPacket'>[] => {
    into<MsgRecvPacket>(msg);
    const data = this.#decodeJson(msg.packet.data);
    return [{
      hash,
      height,
      type: 'MsgRecvPacket',
      data: {
        sender: data.sender,
        receiver: data.receiver,
        amount: [{
          amount: data.amout,
          denom: data.denom,
        }],
      },
      notify: [data.sender, data.receiver],
    }];
  };

  #decodeMsgExecuteContract = (msg: Msg, height: number, hash: string): BlockchainEvent<'MsgExecuteContract'>[] => {
    into<MsgExecuteContract>(msg);
    return [{
      hash,
      height,
      type: 'MsgExecuteContract',
      data: {
        sender: msg.sender,
        contract: msg.contract,
        amount: msg.funds,
        message: this.#decodeJson(msg.msg),
      },
      notify: [msg.sender],
    }];
  };

  #decodeMsgDelegate = (msg: Msg, height: number, hash: string): BlockchainEvent<'MsgDelegate'>[] => {
    into<MsgDelegate>(msg);
    return [{
      hash,
      height,
      type: 'MsgDelegate',
      data: {
        delegator: msg.delegatorAddress,
        validator: msg.validatorAddress,
        amount: [msg.amount],
      },
      notify: [msg.delegatorAddress],
    }];
  };

  #decodeMsgWithdrawDelegatorReward = (msg: Msg, height: number, hash: string): BlockchainEvent<'MsgWithdrawDelegatorReward'>[] => {
    into<MsgWithdrawDelegatorReward>(msg);
    return [{
      hash,
      height,
      type: 'MsgWithdrawDelegatorReward',
      data: {
        delegator: msg.delegatorAddress,
        validator: msg.validatorAddress,
      },
      notify: [msg.delegatorAddress],
    }];
  };

  #decodeMsgMultiSend(msg: Msg, height: number, hash: string): BlockchainEvent<'MsgMultiSend'>[] {
    into<MsgMultiSend>(msg);
    return msg.outputs.map((output, i) => {
      return ({
        hash,
        height,
        type: 'MsgMultiSend',
        data: {
          sender: msg.inputs[0].address,
          receiver: output.address,
          amount: output.coins,
        },
        // notify the sender only once
        notify: i == 0 ? [msg.inputs[0].address, output.address] : [output.address],
      });
    });
  };

  getEvents(tx: Uint8Array, height: number, hash: string) {
    return ((this.registry.decode({
      typeUrl: Tx.typeUrl,
      value: tx,
    }) as Tx).body?.messages
      .filter((m) => {
        return this.msgToEvent.has(m.typeUrl);
      }).map((msg) => {
        const toEvent = this.msgToEvent.get(msg.typeUrl);
        /// we have filtered beforehand so this should allways be true
        into<NonNullable<typeof toEvent>>(toEvent);
        const decoded = this.registry.decode({
          typeUrl: msg.typeUrl,
          value: msg.value,
        }) as Msg;
        return toEvent(decoded, height, hash);
      }) || []).flat();
  }
}
