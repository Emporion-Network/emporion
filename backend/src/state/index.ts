import { randomUUID } from 'crypto';
import type { WSContext } from 'hono/ws';
import { Fs } from './fs';
import { Db } from './qdrant';
import { Tracking } from './tracking';
import { Indexer } from './blockchain';

export class State {
  private nonces: Map<string, { nonce: string, lifeTime: number }>;
  private addrToWs = new Map<string, WSContext>();
  readonly nonceLifetime: number;
  readonly jwtSecret: string;
  readonly jwtLifetime: number;
  readonly translationApiKey: string;
  readonly translationApiEndpoint: string;
  readonly uploadMaxSize: number;
  readonly db: Db;
  readonly fs: Fs;
  readonly tracking: Tracking;
  readonly domainName: string;
  readonly addressAutocompleteApiKey: string;
  readonly blockchain: Indexer;

  constructor(params: {
    jwtSecret: string
    translationApiKey: string
    translationApiEndpoint: string
    nonceLifetime: number
    jwtLifetime: number
    s3AccessKey: string
    s3SecretKey: string
    s3Endpoint: string
    s3Bucket: string
    s3Region: string
    uploadMaxSize: number
    qdrantEndpoint: string
    dhlApiKey: string
    upsClientId: string
    upsClientSecret: string
    fedexClientId: string
    fedexClientSecret: string
    domainName: string
    addressAutocompleteApiKey: string
    wsEndpoints: string
    rpcEndpoints: string
    emporionContractAddress: string
  }) {
    this.nonces = new Map();
    this.domainName = params.domainName;
    this.nonceLifetime = params.nonceLifetime;
    this.jwtSecret = params.jwtSecret;
    this.jwtLifetime = params.jwtLifetime;
    this.translationApiKey = params.translationApiKey;
    this.translationApiEndpoint = params.translationApiEndpoint;
    this.uploadMaxSize = params.uploadMaxSize;
    this.addressAutocompleteApiKey = params.addressAutocompleteApiKey;
    this.fs = new Fs({
      s3AccessKey: params.s3AccessKey,
      s3SecretKey: params.s3SecretKey,
      s3Endpoint: params.s3Endpoint,
      s3Region: params.s3Region,
      s3Bucket: params.s3Bucket,
    });
    this.db = new Db(params.qdrantEndpoint);
    this.tracking = new Tracking({
      dhlApiKey: params.dhlApiKey,
      upsClientId: params.upsClientId,
      upsClientSecret: params.upsClientSecret,
      fedexClientId: params.fedexClientId,
      fedexClientSecret: params.fedexClientSecret,
    });
    this.blockchain = new Indexer({
      state: this,
      wsEndpoints: params.wsEndpoints.split(','),
      rpcEndpoints: params.rpcEndpoints.split(','),
      contracts: {
        emporionContractAddress: params.emporionContractAddress,
      },
    });
    this.blockchain.listen();
  }

  #clearExpired() {
    const now = Date.now();
    for (const [nonce, { lifeTime: lifeTime }] of this.nonces) {
      if (now - lifeTime > this.nonceLifetime) {
        this.nonces.delete(nonce);
      }
    }
  }

  checkNonce(addr: string, nonce: string): boolean {
    this.#clearExpired();
    const exists = this.nonces.get(addr);
    if (exists) {
      const { nonce: storedNonce } = exists;
      if (nonce === storedNonce) {
        this.nonces.delete(addr);
        return true;
      }
      return false;
    }
    return false;
  }

  getNonce(addr: string): string {
    this.#clearExpired();
    const exists = this.nonces.get(addr);
    if (exists) {
      return exists.nonce;
    }
    const nonce = randomUUID().replaceAll('-', '');
    this.nonces.set(addr, { nonce, lifeTime: Date.now() });
    return nonce;
  }

  addSocket(addr: string, ws: WSContext) {
    this.addrToWs.set(addr, ws);
  }

  getSocket(addr: string) {
    return this.addrToWs.get(addr);
  }

  removeSocket(addr: string) {
    this.addrToWs.delete(addr);
  }
}
