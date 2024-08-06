import {
    S3Client,
    ListObjectsCommand,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { ResponseMetadata } from "@aws-sdk/types";
import { join, relative } from "path";

const client = new S3Client({
    endpoint: Bun.env.BUKET_ENDPOINT,
    region:  Bun.env.BUKET_REGION,
    credentials: {
        secretAccessKey: Bun.env.STORAGE_SECRET || 'error',
        accessKeyId: Bun.env.STORAGE_KEY || 'error',
    },
});




export class FileStorage<T> {
    private base: string
    private buket: string
    private ACL:"public-read"|"private"
    private isBinary:boolean;
    static MAX_ELS_PER_PAGE = 10;
    constructor(base: string,
        isPublic=false,
        binary = false,
        buket: string = Bun.env.STORAGE_BUKET||"") {
        this.ACL = isPublic ? "public-read" : "private"
        this.buket = buket;
        this.base = base;
        this.isBinary = binary;
    }
    private isSuccess(r: ResponseMetadata) {
        if (!((r.httpStatusCode || 0) >= 200 && (r.httpStatusCode || 400) <= 300)) {
            throw new Error(r.cfId)
        }
    }
    async get(id: string): Promise<T | undefined> {
        try {
            const cmd = new GetObjectCommand({
                Bucket: this.buket,
                Key: join(this.base, id),
            });
            const stream = await client.send(cmd);
            this.isSuccess(stream.$metadata);
            if(this.isBinary){
                return await stream.Body?.transformToByteArray() as T;
            }
            return JSON.parse(await stream.Body?.transformToString('utf8') || "undefined");
        } catch (e) {
            return undefined
        }
    }
    async set(id: string, v: T): Promise<boolean> {
        try {
            const f = this.isBinary ? await (v as Blob).arrayBuffer() : JSON.stringify(v);
            const cmd = new PutObjectCommand({
                ACL: this.ACL,
                Bucket: this.buket,
                // @ts-ignore
                Body: f,
                Key: join(this.base, id),
                ContentType: f instanceof File ? f.type  :  "application/json"
            });
            const stream = await client.send(cmd);
            this.isSuccess(stream.$metadata);
            return true;

        } catch (e){
            return false
        }

    }

    async update(id:string, fn:(v:undefined|T)=>T|Promise<T>){
        let v = await this.get(id);
        let newV = await fn(v);
        return await this.set(id, newV);
    }

    async paginated(startFromKey?:string):Promise<T[]>{
       let cmd = new ListObjectsCommand({
            Bucket: this.buket,
            Prefix:this.base,
            Marker:startFromKey ? join(this.base, startFromKey):undefined,
            MaxKeys:2,
        });
        const stream = await client.send(cmd);
        return (await Promise.all(stream.Contents?.map((e) => {
            if(!e.Key) return;
            return this.get(relative(this.base, e.Key));
        })||[])).filter(e => e !== undefined);
    }

    async keys(){
        let cmd = new ListObjectsCommand({
            Bucket: this.buket,
            Prefix:this.base,
        });
        const stream = await client.send(cmd);
        return stream.Contents?.map((e) => {
            return relative(this.base, e.Key||"")
        }).filter(e => e !== undefined)||[];
    }

    async delete(id:string){
        try {
          const cmd = new DeleteObjectCommand({
            Bucket:this.buket,
            Key:join(this.base, id),
          })
          const r = await client.send(cmd);
          this.isSuccess(r.$metadata);
          return true;
        } catch(e){
          return false;
        }
    }

    async has(id:string){
        try {
            let cmd = new ListObjectsCommand({
                Bucket: this.buket,
                Prefix:join(this.base, id),
                MaxKeys:1,
            });
            const stream = await client.send(cmd);
            return stream.Contents?.length === 1
        } catch{
            return false;
        }
       
    }


    async getList(ids:string[]):Promise<T[]>{
        const res = await Promise.all(ids.map(id => this.get(id)))
        return res.filter(e => e !== undefined)
    }

    prefix(key:string){
        return new FileStorage<T>(join(this.base, key), this.ACL == 'public-read', this.isBinary, this.buket)
    }

    async clear(){
        try {
            const cmd = new DeleteObjectsCommand({
              Bucket:this.buket,
              Delete:{
                Objects:(await this.keys()).map(e => ({Key:e}))
              }
            })
            await client.send(cmd);
            return true;
          } catch(e){
            return false;
          }
    }
}





