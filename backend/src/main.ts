import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { State } from './state';
import ms, { type StringValue } from 'ms';
import b from 'bytes';

import auth from '@/services/auth';
import translate from '@/services/translation';
import fileUploder from '@/services/files';
import metadata from '@/services/metadata';
import autocomplete from '@/services/autocomplete';

import { wsHandler, websocket } from '@/services/ws/ws';
import { logger } from 'hono/logger';
import { Indexer } from './state/blockchain';
import { version } from 'package.json';

const app = new Hono<{ Variables: { state: State } }>();
const {
  S3_SECRET_KEY = '',
  S3_ACCESS_KEY = '',
  S3_ENDPOINT = '',
  S3_REGION = '',
  S3_BUCKET = '',
  JWT_SECRET = '',
  TRANSLATION_API_KEY = '',
  TRANSLATION_API_ENDPOINT = '',
  JWT_LIFETIME = '1day',
  NONCE_LIFETIME = '1min',
  UPLOAD_MAX_SIZE = '20MB',
  QDRANT_ENDPOINT = '',
  FEDEX_CLIENT_ID = '',
  FEDEX_CLIENT_SECRET = '',
  DHL_API_KEY = '',
  UPS_CLIENT_ID = '',
  UPS_CLIENT_SECRET = '',
  PORT = '3000',
  EMPORION_CONTRACT_ADDRESS = '',
  DOMAIN_NAME = 'emporion.network',
  WS_RPCS = 'wss://rpc-juno.mib.tech/websocket,wss://juno-rpc.publicnode.com:443/websocket',
} = Bun.env;

/**
 * This is the global state of the app
 * all services should use this state to store data
 * this would make the migration to a distributed system easier
*/
const state = new State({
  domainName: DOMAIN_NAME,
  jwtSecret: JWT_SECRET,
  translationApiKey: TRANSLATION_API_KEY,
  translationApiEndpoint: TRANSLATION_API_ENDPOINT,
  nonceLifetime: ms(NONCE_LIFETIME as StringValue),
  jwtLifetime: ms(JWT_LIFETIME as StringValue),
  s3AccessKey: S3_ACCESS_KEY,
  s3SecretKey: S3_SECRET_KEY,
  s3Endpoint: S3_ENDPOINT,
  s3Bucket: S3_BUCKET,
  s3Region: S3_REGION,
  uploadMaxSize: b(UPLOAD_MAX_SIZE) || 0,
  qdrantEndpoint: QDRANT_ENDPOINT,
  fedexClientId: FEDEX_CLIENT_ID,
  fedexClientSecret: FEDEX_CLIENT_SECRET,
  dhlApiKey: DHL_API_KEY,
  upsClientId: UPS_CLIENT_ID,
  upsClientSecret: UPS_CLIENT_SECRET,
});

const blockchain = new Indexer(WS_RPCS.split(','), state, {
  emporionContractAddress: EMPORION_CONTRACT_ADDRESS,
});

app
  .use(async (c, next) => {
    const method = c.req.method;
    c.res.headers.append('Access-Control-Allow-Origin', '*');
    c.res.headers.append('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.res.headers.append('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (method === 'OPTIONS') {
      return c.text('');
    }
    await next();
  })
  .use(async (c, next) => {
    c.set('state', state);
    await next();
  })
  .use(logger())
  .get('/api/', async (c) => {
    return c.json({ version: version });
  })
  .route('/api/', fileUploder)
  .route('/api/', auth)
  .route('/api/', translate)
  .route('/api/', autocomplete)
  .route('/api/', metadata)
  .route('/api/', wsHandler)
  .use('*', serveStatic({
    root: '../frontend/dist/',
    rewriteRequestPath: path => path,
  }))
  .use('*', async (c) => {
    return c.html(await Bun.file('../frontend/dist/index.html').text());
  })
  .notFound((c) => {
    return c.json({
      error: true,
      message: 'Not Found',
    }, 404);
  });

blockchain.listen();

export default {
  port: PORT,
  fetch: app.fetch,
  websocket,
};
