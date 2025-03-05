import {
  toUUID,
  type AddressAutocomplete,
  type Autocomplete,
  type CheckToken,
  type FileMetaReq,
  type GetCollection,
  type GetCollections,
  type ReqFiles,
  type RequestNonce,
  type RequestToken,
  type ReqUpdateUserData,
  type ReqUserData,
  type ResponseSuccess,
  type Result,
  type ScrollProducts,
  type Translate,
  type UpdateFileMeta,
  type UpdateMetadata,
  type UploadFiles,
  type UploadMetadata
} from '../common';


/**
 * Asserts that the result is a success, useful for type narrowing
 * @param v - result
 */
export function assertSucess<T>(v: Result<T>): asserts v is ResponseSuccess<T> {
  if (v.error) {
    throw Error('Should be success');
  }
}


/**
 * Api client for the server
 * @param root - root url of the server
 * @param useHeaderToken - if true, the token will be sent in the header instead of cookie
 */
export class Api {
  root: string;
  useHaderToken: boolean;
  token = '';
  extraHeaders: Record<string, string>;
  ws: WebSocket

  constructor(root: string, useHeaderToken = false) {
    this.root = root;
    this.useHaderToken = useHeaderToken;
    const url = new URL(root);
    this.ws = new WebSocket(`wss://${url.host}${url.pathname}ws`);
    this.extraHeaders = {};
  }

  private async get<T>(path: string) {
    return fetch(new URL(`.${path}`, this.root), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.extraHeaders,
        ...(this.useHaderToken ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    }).then(res => res.json()) as T;
  }

  private async post<T>(path: string, body: unknown) {
    return fetch(new URL(`.${path}`, this.root), {
      method: 'POST',
      headers: {
        ...this.extraHeaders,
        ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(this.useHaderToken ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: body instanceof FormData ? body : JSON.stringify(body),
    }).then(res => res.json()) as T;
  }

  /**
   * The nonce returned has a lifetime, you should use it as soon as possible
   * @param req - bech32 address
   * @returns nonce
   */

  async requestNonce(req: RequestNonce['req']) {
    return this['post' satisfies RequestNonce['method']]<RequestNonce['res']>('/request_nonce' satisfies RequestNonce['path'], req);
  }

  /**
   * Requests a jwt token from the server </br>
   * **You should reqest a nonce first**
   * @param req - address and nonce
   */

  async requestToken(req: RequestToken['req']) {
    const reqst = await this['post' satisfies RequestToken['method']]<RequestToken['res']>('/request_token' satisfies RequestToken['path'], req);
    if (this.useHaderToken) {
      assertSucess(reqst);
      this.token = reqst.result;
      this.ws.send(this.token)
    }
    return reqst;
  }

  /**
   * Checks if the token is valid
   */

  async checkToken() {
    return this['get' satisfies CheckToken['method']]<CheckToken['res']>('/check_token' satisfies CheckToken['path']);
  }

  /**
   * Translates a text from one language to another </br>
   * The target language should be left empty
   * @example
   * ```ts
   *  api.translate({fr:"Bonjour", en:""}) // {fr:"Bonjour", en:"Hello"}
   * ```
   * @param req - text to translate
   */

  async translate(req: Translate['req']) {
    return this['post' satisfies Translate['method']]<Translate['res']>('/translate' satisfies Translate['path'], req);
  }

  /**
   * Gets a list of urls to uploaded files
   * @param addr - bech32 address
   * @returns
   */
  async getFiles(addr: ReqFiles['req']) {
    return this['get' satisfies ReqFiles['method']]<ReqFiles['res']>(`/files/${addr}` satisfies ReqFiles['path']);
  }

  /**
   * Uploads files to the server
   * files should be in a form data with the key `files[]`
   * @param req - files to upload
   * @returns - list of urls to the uploaded files
   */
  async uploadFiles(req: File[], meta: FileMetaReq[]) {
    const form = new FormData();
    req.forEach((f, i) => {
      form.append('files[]', f, meta[i].name);
    });
    form.set('meta', JSON.stringify(meta));
    return this['post' satisfies UploadFiles['method']]<UploadFiles['res']>(`/upload-files` satisfies UploadFiles['path'], form);
  }

  async updateFileMeta(id: string, req: FileMetaReq) {
    return this['post' satisfies UpdateFileMeta['method']]<UpdateFileMeta['res']>(`/update-file-metadata/${id}` satisfies UpdateFileMeta['path'], req);
  }

  async autocomlete(req: Autocomplete['req']) {
    return this['post' satisfies Autocomplete['method']]<Autocomplete['res']>(`/autocomplete` satisfies Autocomplete['path'], req);
  }

  async uploadMetadata(req: UploadMetadata["req"]) {
    return this['post' satisfies UploadMetadata['method']]<UploadMetadata['res']>(`/upload-metadata` satisfies UploadMetadata['path'], req);
  }

  async updateMetadata(req: UpdateMetadata["req"]) {
    return this['post' satisfies UpdateMetadata['method']]<UpdateMetadata['res']>(`/update-metadata` satisfies UpdateMetadata['path'], req);
  }

  async getCollections(req: GetCollections["req"]) {
    return this['get' satisfies GetCollections['method']]<GetCollections['res']>(`/collections/${req}` satisfies GetCollections['path']).then(e => {
      if (e.error) return e;
      e.result.sort((a, b) => a.products[0].id > b.products[0].id ? -1 : 1)
      e.result.map(e => {
        e.products.sort((a, b) => a.id > b.id ? -1 : 1)
      })
      return e;
    });
  }

  async getCollection(req: GetCollections["req"]) {
    return this['get' satisfies GetCollection['method']]<GetCollection['res']>(`/collection/${req}` satisfies GetCollection['path']).then(e => {
      if (e.error) return e;
      e.result.sort((a, b) => a.id > b.id ? -1 : 1);
      return e;
    });
  }

  async addressAutocomplete(req: AddressAutocomplete['req']) {
    return this['get' satisfies AddressAutocomplete['method']]<AddressAutocomplete['res']>(`/address-autocomplete?q=${req}` satisfies AddressAutocomplete['path'])
  }

  async scrollProducts(req: ScrollProducts["req"]) {
    const params = new URLSearchParams(Object.fromEntries(
      Object.entries(req).filter(([_, value]) => value)
    )).toString();
    return this['get' satisfies ScrollProducts['method']]<ScrollProducts['res']>(`/search?${params}` satisfies ScrollProducts['path']);
  }

  async getUserData() {
    return this['get' satisfies ReqUserData['method']]<ReqUserData['res']>('/user-data' satisfies ReqUserData['path']);
  }

  async updateUserData(req: ReqUpdateUserData['req']) {
    return this['post' satisfies ReqUpdateUserData['method']]<ReqUpdateUserData['res']>('/update-user-data' satisfies ReqUpdateUserData['path'], req);
  }
}

//@ts-ignore
window.toUUID = toUUID;



export type * from '../common';