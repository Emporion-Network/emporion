import { writable } from "svelte/store";

export const href = writable(new URL(location.href));
export const matched = writable(false);

const reroute = (url:string)=>{
    matched.set(false);
    href.set(new URL(url));
}

export const historyPush = (url:string)=>{
    history.pushState(null, "", url);
    reroute(url)
}

export const historyReplace = (url:string)=>{
    history.replaceState(null, "", url);
    reroute(url)
}

export const goTo = (url:string)=>()=>{
    historyPush(url);
}

window.addEventListener("popstate", () => {
    matched.set(false);
    reroute(location.href);
    console.log('pop')
});