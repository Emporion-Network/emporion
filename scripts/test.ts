import "bun";
import { EmporionClient } from "../client-ts/Emporion.client";

import { Secp256k1HdWallet } from "@cosmjs/amino";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";


const {
    ENDPOINT = "",
    MNEMONIC_1 = "",
    STORE_ADDRESS = "",
    DAO_ADDRESS = "",
} = Bun.env;

let adminClient = await Secp256k1HdWallet.fromMnemonic(MNEMONIC_1, {
    prefix: "neutron",
});
let adminAddress = (await adminClient.getAccounts())[0].address;

let signer = await SigningCosmWasmClient.connectWithSigner(ENDPOINT, adminClient, {
    gasPrice: GasPrice.fromString("10000untrn"),
});


let client = await new EmporionClient(signer, adminAddress, STORE_ADDRESS);


// await client.invest('auto', "", [{
//     amount:"100000",
//     denom:"untrn"
// }])

let r = await signer.queryContractSmart(DAO_ADDRESS, {
    voting_power_at_height: {
        address: adminAddress
    }
});

console.log(r);

r = await signer.queryContractSmart(DAO_ADDRESS, {
    voting_module:{}
});

r = await signer.queryContractSmart(r, {
    info:{}
});

const x = await client.params({})

console.log(x.weighted_accepted_assets);