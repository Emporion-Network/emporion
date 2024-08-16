import shchema from "../contracts/emporion-core/schema/emporion-core.json";

const types = await Bun.file('./client-ts/Emporion.types.ts').text()

const eatString = (src:string, i:number):[string, number]=>{
    let srart = '"';
    let dump = "";
    i = i+1;
    while(true){
        if(!src[i]) break;
        if(src[i] === srart) break;
        dump += src[i];
        i++;
    }
    return [dump, i]
}

const skipSpaces = (src:string, i:number):number=>{
    while(true){
        if(src[i].match(/\s/)){
            i++;
        } else {
            break;
        }
    }
    return i;
}

const eatObject = (src:string, i:number):[any, number]=>{
    let obj = Object.create(null);
    let dump = '';
    let key = '';
    i = i+1;
    while(true){
        if(!src[i]) break;
        if(['"',"'", "`"].includes(src[i])){
            [dump, i] = eatString(src, i);
        } else if(src[i] === ':'){
            key = dump;
            dump = "";
        } else if([",", ";"].includes(src[i])) {
            obj[key] = dump;
            dump = "";
        } else if(src[i].match(/\s/)){

        } else if (src[i] === '{'){
            const [val, j] = eatObject(src, i);
            i = j;
            obj[key] = val;
            key = "";
        } else if(src[i]=='}'){
            i ++;
            i = skipSpaces(src, i);
            if(src[i] === ';'){
                i++;
            }
            break;
        } else {
            dump += src[i];
        }
        i++;
    }
    return [obj, i];
}

const extractTypeDeclaration = (src:string, type:string)=>{
    let match = src.match(new RegExp(`type\\s*${type}\\s*=\\s*`));
    if(!match || !match.index) return [];
    let i = match.index + match[0].length;
    const or:any[] = [];
    while(true){
        i = skipSpaces(src, i);
        if(src[i] === '|'){
            i++;
        }else if(src[i] == '{') {
            const [obj, j] = eatObject(src, i);
            or.push(obj);
            i = j;
        } else {
            break;
        }
    }
   return or;
}

const queryies = extractTypeDeclaration(types, 'QueryMsg');
const execute = extractTypeDeclaration(types, 'ExecuteMsg');

const createQclient = ()=>{
    const fns = queryies.map(q => {
        const name = Object.keys(q)[0] as keyof typeof shchema['responses'];
        if(!shchema['responses'][name]){
            throw Error(``)
        }
        let returnType = shchema['responses'][name].title.split('_').map(e=> `${e[0].toUpperCase()}${e.slice(1)}`).join('');

        return `async ${name}(msg:Extract<QueryMsg, {${name}:any}>["${name}"]):Promise<${returnType}>{
        return this.client.queryContractSmart(this.contractAddress, {
            ${name}:msg
        });
    }`
    });

return `export class EmporionQueryClient<T extends {queryContractSmart:(address:string, msg:any)=>Promise<any>}> {
    client: T;
    contractAddress: string;
    constructor(client: T, contractAddress: string) {
        this.client = client;
        this.contractAddress = contractAddress;
    }
    ${fns.join('\n\n    ')}
}`
}

const createSclient = ()=>{
    const fns = queryies.map(q => {
        const name = Object.keys(q)[0] as keyof typeof shchema['responses'];
        if(!shchema['responses'][name]){
            throw Error(``)
        }
        let returnType = shchema['responses'][name].title.split('_').map(e=> `${e[0].toUpperCase()}${e.slice(1)}`).join('');

        return `async ${name}(msg:Extract<QueryMsg, {${name}:any}>["${name}"]):Promise<${returnType}>{
        return this.client.queryContractSmart(this.contractAddress, {
            ${name}:msg
        });
    }`
    });

    const fns2 = execute.map(q => {
        const name = Object.keys(q)[0] as keyof typeof shchema['responses'];

        return `async ${name}(msg:Extract<ExecuteMsg, {${name}:any}>["${name}"], fee?:Parameters<T['execute']>[3] , memo?:Parameters<T['execute']>[4], funds?:Parameters<T['execute']>[5]):Promise<ReturnType<T['execute']>>{
        return this.client.execute(this.sender, this.contractAddress, {
            ${name}:msg
        },fee, memo, funds);
    }`
    });

return `export class EmporionClient<T extends {execute:(sender:string,contractAddress:string, msg:any, fee:any, memo:any, funds:any)=>Promise<any>,queryContractSmart:(address:string, msg:any)=>Promise<any>}> {
    client: T;
    contractAddress: string;
    sender: string;
    constructor(client: T, sender: string, contractAddress: string) {
        this.client = client;
        this.sender = sender;
        this.contractAddress = contractAddress;
    }
    ${fns.join('\n\n    ')}
    ${fns2.join('\n\n    ')}

}`
}

Bun.write('./client-ts/Emporion.client.ts', 
`${types}
${createQclient()}
${createSclient()}
`)
