import type { Result } from '.';

export interface FileMetaRes {
  name: string
  path: string
  tags: string[]
}

export interface FileMetaReq {
  name: string
  tags: string[]
}

export interface ReqFiles {
  req: string
  res: Result<FileMetaRes[]>
  method: 'get'
  path: `/files/${string}`
}

export interface UploadFiles {
  req: FormData
  res: Result<FileMetaRes[]>
  method: 'post'
  path: `/upload-files`
}

export interface UpdateFileMeta {
  req: FileMetaReq,
  res: Result<FileMetaRes[]>,
  method: 'post',
  path: `/update-file-metadata/${string}`
}
