import { $ } from "bun";

await $`cd contracts/emporion-core && cargo schema`.quiet()
await $`npx @cosmwasm/ts-codegen generate --plugin client --schema contracts/emporion-core/schema --no-bundle --out ./client-ts --name Emporion`