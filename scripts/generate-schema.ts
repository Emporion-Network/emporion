import { $ } from "bun";

await $`cd contracts/store-contract && cargo schema`.quiet()
await $`npx @cosmwasm/ts-codegen generate --plugin client --schema contracts/store-contract/schema --no-bundle --out ./client-ts --name Emporion`