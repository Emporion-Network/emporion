import { writable } from "svelte/store";
import { EmporionQueryClient } from "../../../client-ts/Emporion.client";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const {
    VITE_ENDPOINT_RPC: ENDPOINT_RPC,
    VITE_STORE_ADDRESS: STORE_ADDRESS,
} = import.meta.env;

const client = new EmporionQueryClient(
    await CosmWasmClient.connect(ENDPOINT_RPC),
    STORE_ADDRESS,
);

export const clients = writable({
    emporionQueryClient:client,
})