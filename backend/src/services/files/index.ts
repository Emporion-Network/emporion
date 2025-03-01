import type { FileMetaRes, ReqFiles, UploadFiles } from '@common';
import { jwt } from '@/middlewares/jwt';
import { assert, isValidBech, assertIsFileMeta, bechToBech, assertIsDefinedUnsafe } from '@common';
import { randomUUIDv7 } from 'bun';
import { Hono } from 'hono';
import { fileTypeFromBuffer } from 'file-type';
// import { fileT } from 'file-type';

const uploadFile = new Hono()
  .use('/upload-files', jwt)
  .post('/upload-files', async (c) => {
    const body = await c.req.parseBody();
    let files = body['files[]'] as unknown as File[];
    const meta = JSON.parse(body['meta'] as string) as FileMetaRes[];
    assert(Array.isArray(meta), 'invalid meta');
    meta.forEach((meta) => {
      assertIsFileMeta(meta);
    });
    if (!Array.isArray(files)) {
      files = [files];
    }
    for (const f of files) {
      assert(f instanceof File, 'Invalid file');
      const b = await f.arrayBuffer();
      const type = await fileTypeFromBuffer(b);
      assertIsDefinedUnsafe(type, 'Invalid file');
      assert(type.mime.startsWith('image/'), 'File is not an image');
      assert(f.size < c.var.state.uploadMaxSize, 'File is too large');
    }
    const fileNames = files.map(async (f, i) => {
      const fileName = `${c.var.user.addr}/${randomUUIDv7()}`;
      meta[i].path = `https://${c.var.state.domainName}/api/files/fileName`;
      const file = c.var.state.fs.file(fileName, {
        type: f.type,
        acl: 'public-read',
      });
      file.write(f);
      return fileName;
    });
    await Promise.all(fileNames);
    let oldMeta;
    try {
      oldMeta = JSON.parse(await c.var.state.fs.file(`${c.var.user.addr}/meta.json`).text());
    } catch {
      oldMeta = [];
    }
    await c.var.state.fs.file(`${c.var.user.addr}/meta.json`, {
      type: 'application/json',
      acl: 'public-read',
    }).write(JSON.stringify([...meta, ...oldMeta]));

    return c.json({
      error: false,
      result: meta,
    } satisfies UploadFiles['res']);
  })
  .use('/update-file-metadata/:id', jwt)
  .post('/update-file-metadata/:id', async (c) => {
    const newMeta = await c.req.json();
    assertIsFileMeta(newMeta);
    const id = c.req.param('id');
    const oldMeta = JSON.parse(await c.var.state.fs.file(`${c.var.user.addr}/meta.json`).text()) as FileMetaRes[];
    const toChange = oldMeta.find(f => f.path.split('/').pop() === id);
    assertIsDefinedUnsafe(toChange, 'File not found');
    toChange.name = newMeta.name;
    toChange.tags = newMeta.tags;
    await c.var.state.fs.file(`${c.var.user.addr}/meta.json`, {
      type: 'application/json',
      acl: 'public-read',
    }).write(JSON.stringify(oldMeta));
    return c.json({
      error: false,
      res: oldMeta,
    });
  })
  .get('/files/:address', async (c) => {
    let address = c.req.param('address');
    assert(isValidBech(address), 'Invali address');
    address = bechToBech(address, 'cosmos');
    let files;
    try {
      files = JSON.parse(await c.var.state.fs.file(`${address}/meta.json`).text());
    } catch (e) {
      console.log(e);
      files = [];
    }
    return c.json({
      error: false,
      result: files,
    } satisfies ReqFiles['res']);
  })
  .get('/files/:address/:id', async (c) => {
    const state = c.var.state;
    let address = c.req.param('address');
    assert(isValidBech(address), 'Invali address');
    address = bechToBech(address, 'cosmos');
    const id = c.req.param('id');
    return c.body(await state.fs.file(`${address}/${id}`).stream());
  });

export default uploadFile;
