import { $ } from "bun";

let release = 'v2.4.2';
let releases: {
    tag_name: string, url: string,
    assets: { name: string, browser_download_url: string }[] 
}[] = await $`curl https://api.github.com/repos/DA0-DA0/dao-contracts/releases`.json();
let assets = releases.find(r => r.tag_name === release)?.assets || [];
assets = assets.filter(e => e.name.endsWith('.wasm'))

await Promise.all(assets.map(async ({ browser_download_url, name }) => {
    let resp = await (await fetch(browser_download_url)).arrayBuffer();
    Bun.write(`DA0/${name}`, resp);
}))
console.log(assets);
