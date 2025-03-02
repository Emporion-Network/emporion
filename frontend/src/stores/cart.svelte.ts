import type { ProductMetadata } from "@common";
import { Storage } from "./localStorage.svelte";

export const cart = new Storage<ProductMetadata[]>("cart", []);