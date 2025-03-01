import { sha256 } from '@cosmjs/crypto';
import { TxDecoder } from './event';
import type { State } from '@/state';
import { bechToBech, ceheckIsVaildMetadata, type BlockchainEvent } from '@common';
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
  #height = 0;

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
    const pong = () => {
      if (ws.readyState !== ws.OPEN) return;
      ws.pong();
      setTimeout(pong, 300);
    };
    ws.onopen = () => {
      ws.send(this.#getSubscribeQuery());
      pong();
    };
    ws.onmessage = (event) => {
      const eventData = JSON.parse(event.data);
      if (!eventData.result) {
        ws.close();
        return;
      }
      if (eventData && eventData.result && eventData.result.data) {
        const height = eventData.result.data.value.TxResult.height;
        if (height <= this.#height) return;
        this.#height = height;
        const txBuf = Buffer.from(eventData.result.data.value.TxResult.tx, 'base64');
        const hash = Buffer.from(sha256(txBuf)).toString('hex');
        const tx = new Uint8Array(txBuf);
        const events = this.#txDecoder.getEvents(tx, height, hash);
        console.log(`RPC:${idx} Indexing height:${height} hash:${hash}`);
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
      console.log(`RPC:${idx} Reopening...`);
      this.#sokets[idx] = this.#initEndpoint(url, idx);
    };
    ws.onerror = (e) => {
      console.log(e);
      ws.close();
    };
    return ws;
  }

  async #handleContractEvent(msg: BlockchainEvent<'MsgExecuteContract'>, evts: Events) {
    try {
      if (msg.data.contract !== this.#contracts['emporionContractAddress']) return;
      const data = msg.data.message as ExecuteMsg;
      if ('create_product' in data) {
        if (evts['wasm.action'][0] != 'create_product') return;
        const url = data.create_product.meta_data_url;
        const id = evts['wasm.id'][0];
        const metadata = await (await fetch(url)).json();
        if (!ceheckIsVaildMetadata(metadata)) return;
        await this.#state.db.upsertProduct({
          ...metadata,
          id: id,
          listed: data.create_product.listed,
          seller: bechToBech(msg.data.sender, 'cosmos'),
          price: data.create_product.price,
          metadata_url: url,
        });
      }
      if ('create_bulk_products' in data) {
        const chainIds = evts['wasm.product_ids']['0'].split(', ');
        const inserts = data.create_bulk_products.products.map(async (d, i) => {
          const url = d.meta_data_url;
          const metadata = await (await fetch(url)).json();
          if (!ceheckIsVaildMetadata(metadata)) return;
          const productId = chainIds[i];
          return this.#state.db.upsertProduct({
            ...metadata,
            id: productId,
            listed: d.listed,
            seller: bechToBech(msg.data.sender, 'cosmos'),
            price: d.price,
            metadata_url: url,
          });
        });
        await Promise.all(inserts);
      }
      if ('update_product' in data) {
        const content = data.update_product;
        if (content.meta_data_url) {
          // if metadata url is provided, update the metadata
          const url = content.meta_data_url;
          const metadata = await (await fetch(url)).json();
          if (!ceheckIsVaildMetadata(metadata)) return;
          await this.#state.db.upsertProduct({
            ...metadata,
            id: content.product_id,
            listed: content.listed ?? metadata.listed,
            seller: bechToBech(msg.data.sender, 'cosmos'),
            price: content.price ?? metadata.price,
            metadata_url: url,
          });
          return;
        }
        const product = await this.#state.db.getProduct(content.product_id);
        if (!product) return;
        await this.#state.db.upsertProduct({
          ...product,
          listed: content.listed ?? product.listed,
          seller: bechToBech(msg.data.sender, 'cosmos'),
          price: content.price ?? product.price,
          metadata_url: product.metadata_url,
        });
      }
      if ('update_bulk_product' in data) {
        data.update_bulk_product.products.map(async (e) => {
          const content = e;
          if (content.meta_data_url) {
            // if metadata url is provided, update the metadata
            const url = content.meta_data_url;
            const metadata = await (await fetch(url)).json();
            if (!ceheckIsVaildMetadata(metadata)) return;
            await this.#state.db.upsertProduct({
              ...metadata,
              id: content.product_id,
              listed: content.listed ?? metadata.listed,
              seller: bechToBech(msg.data.sender, 'cosmos'),
              price: content.price ?? metadata.price,
            });
            return;
          }
          const product = await this.#state.db.getProduct(content.product_id);
          if (!product) return;
          await this.#state.db.upsertProduct({
            ...product,
            listed: content.listed ?? product.listed,
            seller: bechToBech(msg.data.sender, 'cosmos'),
            price: content.price ?? product.price,
          });
        });
      }
    } catch (e) {
      console.log(e);
    }
  }
}
