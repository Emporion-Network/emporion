import { writable } from "svelte/store";
import type { Product } from "../../../client-ts/Emporion.types";

export const products = writable<Product[]>([]);

