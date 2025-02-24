import { S3Client } from 'bun';
import { ListObjectsV2Command, S3 } from '@aws-sdk/client-s3';
import { relative } from 'path';

/**
 * FS is an abstraction over the file system.
 * Currently it is implemented using S3.
 * @privateRemarks
 * TODO: make functions closer to a real fs
 */
export class Fs {
  private s3: S3Client;
  private lister: S3;
  private bucket: string;
  file: S3Client['file'];
  write: S3Client['write'];
  delete: S3Client['delete'];
  exists: S3Client['exists'];
  stat: S3Client['stat'];

  constructor({
    s3AccessKey,
    s3SecretKey,
    s3Endpoint,
    s3Bucket,
    s3Region,
  }: {
    s3AccessKey: string
    s3SecretKey: string
    s3Endpoint: string
    s3Bucket: string
    s3Region: string
  }) {
    this.s3 = new S3Client({
      accessKeyId: s3AccessKey,
      secretAccessKey: s3SecretKey,
      endpoint: s3Endpoint,
      region: s3Region,
      bucket: s3Bucket,
    });
    this.lister = new S3({
      credentials: {
        accessKeyId: s3AccessKey,
        secretAccessKey: s3SecretKey,
      },
      endpoint: s3Endpoint,
      region: s3Region,
    });
    this.bucket = s3Bucket;
    this.file = this.s3.file.bind(this.s3);
    this.write = this.s3.write.bind(this.s3);
    this.delete = this.s3.delete.bind(this.s3);
    this.exists = this.s3.exists.bind(this.s3);
    this.stat = this.s3.stat.bind(this.s3);
  }

  async readdir(path: string) {
    const cmd = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: path,
    });
    return (await this.lister.send(cmd)).Contents?.map((e) => {
      return relative(path, e.Key || '');
    }) || [];
  }
}
