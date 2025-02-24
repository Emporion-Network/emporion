import { sha256 } from '@cosmjs/crypto';
import { TxDecoder } from './event';
import type { State } from '@/state';
import { bechToBech, type BlockchainEvent } from '@common';
import type { ExecuteMsg } from '../../../../ts-client/Emporion.types';

type Events = Record<string, string[]>;

/**
 * Connects to an websoket endpoints and forwards events to connected websocket clients.
 * The instance will automatically reconnect to the endpoints if the connection is lost.
 */
export class Indexer {
  #sokets: WebSocket[] = [];
  #txDecoder = new TxDecoder();
  #state: State;
  #enpoints: string[];
  #contracts: Record<string, string>;

  constructor(
    endpoints: string[],
    state: State,
    contracts: Record<string, string>,
  ) {
    this.#enpoints = endpoints;
    this.#state = state;
    this.#contracts = contracts;
  }

  listen() {
    this.#sokets = this.#enpoints.map((url, idx) => this.#initEndpoint(url, idx));
  }

  #getSubscribeQuery() {
    return JSON.stringify({
      jsonrpc: '2.0',
      method: 'subscribe',
      id: Math.floor((Math.random() * 1e15)).toString(16),
      params: {
        query: `tm.event = 'Tx'`,
      },
    });
  }

  #initEndpoint(url: string, idx: number) {
    const ws = new WebSocket(url);
    ws.onopen = () => {
      ws.send(this.#getSubscribeQuery());
    };
    ws.onmessage = (event) => {
      const eventData = JSON.parse(event.data);
      if (eventData && eventData.result && eventData.result.data) {
        const txBuf = Buffer.from(eventData.result.data.value.TxResult.tx, 'base64');
        const hash = Buffer.from(sha256(txBuf)).toString('hex');
        const height = eventData.result.data.value.TxResult.height;
        const tx = new Uint8Array(txBuf);
        const events = this.#txDecoder.getEvents(tx, height, hash);
        if (events.length) {
          events.forEach((e) => {
            e.notify.forEach((addr) => {
              this.#state.getSocket(bechToBech(addr, 'cosmos'))?.send(JSON.stringify(e));
            });
            if (e.type === 'MsgExecuteContract') {
              this.#handleContractEvent(e, eventData.result.events as Events);
            }
          });
        }
      }
    };
    ws.onclose = () => {
      this.#sokets[idx] = this.#initEndpoint(url, idx);
    };
    return ws;
  }

  async #handleContractEvent(msg: BlockchainEvent<'MsgExecuteContract'>, evts: Events) {
    if (msg.data.contract === this.#contracts['emporionContractAddress']) {
      const data = msg.data.message as ExecuteMsg;
      console.log(data);
      if ('create_product' in data) {
        if (evts['wasm.action'][0] != 'create_product') return;
        const id = data.create_product.meta_data_url.split('/').pop() || '';
        const chainId = evts['wasm.id'][0];
        await this.#state.db.insertProduct({
          id,
          addr: msg.data.sender,
          chainId: chainId,
          price: data.create_product.price,
        });
      }
      if ('create_bulk_products' in data) {
        const chainIds = evts['wasm.product_ids']['0'].split(', ');
        console.log(chainIds);
        const inserts = data.create_bulk_products.products.map((d, i) => {
          const id = d.meta_data_url.split('/').pop() || '';
          const chainId = chainIds[i];
          return this.#state.db.insertProduct({
            id,
            addr: bechToBech(msg.data.sender, 'cosmos'),
            chainId: chainId,
            price: d.price,
          });
        });
        await Promise.all(inserts);
      }
    }
  }
}
