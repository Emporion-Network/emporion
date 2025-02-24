import { expect, test } from 'bun:test';
import { getSignedApi } from './auth_utils';

// test('list files', async () => {
//   const { api } = await getSignedApi();
//   const res = await api.getFiles('cosmos1g9r5wzt8qxemc5kdrfnsn976xvpk9valcgyrp9');
//   expect(res.error).toBe(false);
// });

test('upload file', async () => {
  const { api } = await getSignedApi();
  const filePath = `${__dirname}/resources/test_image.jpg`;
  const f = await Bun.file(filePath);
  const files = new FormData();
  files.append('files[]', f);
  const res = await api.uploadFiles(files);
  expect(res.error).toBe(false);
});
