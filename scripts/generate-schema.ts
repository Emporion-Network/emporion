import { $ } from "bun";

await $`cd contracts/emporion-core && cargo schema`.quiet()
await $`npx @cosmwasm/ts-codegen@latest generate --typesOnly --schema contracts/emporion-core/schema --no-bundle --out ./client-ts --name Emporion`
await $`bun scripts/typesToClient.ts`
