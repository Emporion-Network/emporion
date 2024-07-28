
export const loadEnvFile = (txt: string) => {
    return txt.split('\n').reduce((acc, l) => {
        if (l.trim().length > 0) {
            let [key, value] = l.split('=').map(e => e.trim());
            acc[key] = value.startsWith('"') ? value.replaceAll('"', '') :
                value.startsWith("'") ? value.replaceAll("'", '') : value;
        }
        return acc;
    }, {} as Record<string, string>);
};
export const envToString = (env: Record<string, string>) => {
    let ret = "";
    Object.entries(env).forEach(([k, v]) => {
        ret += `${k}=${JSON.stringify(v)}\n`;
    });
    return ret;
};


export const assert = (b:boolean, message:string) =>{
    if (!b) throw new Error(message)
}