import { writable } from "svelte/store";
import type { Product } from "../../../client-ts/Emporion.types";
import type { ProductMetaData } from "../../../shared-types";
import { id } from "../lib/utils";

type CartItem = {product:Product, meta:ProductMetaData, coinDenom:string};

export const cart = writable<(CartItem&{key:string})[]>(JSON.parse(localStorage.getItem('cart')||"[]"))
export const isVisible = writable(false);

export const addItem = (item:CartItem)=>{
    cart.update((c)=>{
        
        c.push({
            ...item,
            key:id(),
        })
        localStorage.setItem('cart', JSON.stringify(c))
        return c;
    })
}

export const removeItem = (key:string)=>{
    cart.update((c)=>{
        c = c.filter(e => e.key !== key);
        localStorage.setItem('cart', JSON.stringify(c))
        return c;
    })
}

export const clear = ()=>{
    cart.set([]);
    localStorage.setItem('cart', JSON.stringify([]));
}

export const clearItems = (items:string[])=>{
    cart.update(c => {
        c = c.filter(i => !items.includes(i.key))
        localStorage.setItem('cart', JSON.stringify(c));
        return c;
    })
}

export const openCart = ()=>{
    isVisible.set(true);
}