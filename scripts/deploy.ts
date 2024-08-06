import {$} from "bun";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { EmporionClient } from "../client-ts/Emporion.client"
import { InstantiateMsg } from "../client-ts/Emporion.types";
import { InstantiateMsg as InstantiateMsgEmporionVoting } from "../client-ts/EmporionVoting.types";

import * as DAOCore from '../DAO/types/DaoDaoCore';
import * as DAOProposalSingle from '../DAO/types/DaoProposalSingle.v2';
import * as DAOPreProposeSingle from '../DAO/types/DaoPreProposeSingle';
import { Secp256k1HdWallet } from "@cosmjs/amino";
import { loadEnvFile, envToString, assert } from "./utils";



const encodeMessage = (message: any) => {
    return btoa(JSON.stringify(message))
}

const {
    ENDPOINT = "",
    MNEMONIC_1 = "",
} = Bun.env;

let adminClient = await Secp256k1HdWallet.fromMnemonic(MNEMONIC_1, {
    prefix: "neutron",
});
let adminAddress = (await adminClient.getAccounts())[0].address;

let signer = await SigningCosmWasmClient.connectWithSigner(ENDPOINT, adminClient, {
    gasPrice: GasPrice.fromString("25untrn"),
});


const deploy = async () => {
    const DAY = 24 * 60 * 60;
    let emporion_core_wasm = new Uint8Array(await Bun.file('artifacts/emporion_core.wasm').arrayBuffer());
    let emporion_voting_module_wasm = new Uint8Array(await Bun.file('artifacts/emporion_voting_module.wasm').arrayBuffer());
    let dao_core_wasm = new Uint8Array(await Bun.file('DAO/dao_dao_core.wasm').arrayBuffer());
    let dao_proposal_single_wasm = new Uint8Array(await Bun.file('DAO/dao_proposal_single.wasm').arrayBuffer());
    let dao_pre_propose_single_wasm = new Uint8Array(await Bun.file('DAO/dao_pre_propose_single.wasm').arrayBuffer());

    let { codeId: VOTING_CODE_ID } = await signer.upload(adminAddress, emporion_voting_module_wasm, "auto");
    let { codeId: CORE_CODE_ID } = await signer.upload(adminAddress, emporion_core_wasm, "auto");
    let { codeId: DAO_CODE_ID } = await signer.upload(adminAddress, dao_core_wasm, "auto");
    let { codeId: PRE_PROPOSE_SINGLE_CODE_ID } = await signer.upload(adminAddress, dao_pre_propose_single_wasm, "auto");
    let { codeId: PROPOSE_SINGLE_CODE_ID } = await signer.upload(adminAddress, dao_proposal_single_wasm, "auto");

    let instantiate_core: InstantiateMsg = {
        admin: adminAddress,
        dev:adminAddress,
        fee_ratio: [1, 100],
        investment_distribution: {
            to_claim_reserve: [80, 100],
            to_investors: [0, 100],
            to_dev: [20, 100],
        },
        fee_distribution: {
            to_claim_reserve: [60, 100],
            to_investors: [20, 100],
            to_dev: [20, 100],
        },
        max_contract_risk_share: [60, 100],
        publication_fee: [],
        publication_fee_distribution: {
            to_claim_reserve: [60, 100],
            to_investors: [20, 100],
            to_dev: [20, 100],
        },
        unbounding_duration: {
            time: 3 * DAY
        },
        reward_rate: {
            time: 7 * DAY,
        },
        weighted_accepted_assets: [
            [{ native: "untrn" }, 1],
            [{ native: "uibcusdc" }, 1],
            [{ native: "uibcatom" }, 1],
        ],
    };


    let instantiate_pre_propose_single: DAOPreProposeSingle.InstantiateMsg = {
        extension: {},
        deposit_info: {
            amount: "100000000",
            denom: {
                token: {
                    denom: {
                        native: "untrn"
                    }
                }
            },
            refund_policy: 'only_passed',
        },
        open_proposal_submission: true,
    };

    let instantiate_propose_single: DAOProposalSingle.InstantiateMsg = {
        allow_revoting: true,
        max_voting_period: {
            time: 14 * DAY,
        },
        close_proposal_on_execution_failure: true,
        min_voting_period: null,
        only_members_execute: true,
        pre_propose_info: {
            module_may_propose: {
                info: {
                    admin: {
                        core_module: {}
                    },
                    code_id: PRE_PROPOSE_SINGLE_CODE_ID,
                    label: "Emporion DAO Prepropose Single",
                    funds: [],
                    msg: encodeMessage(instantiate_pre_propose_single),
                }
            }
        },
        threshold: {
            threshold_quorum: {
                quorum: {
                    percent: "0.1",
                },
                threshold: {
                    percent: "0.5"
                }
            }
        },
        veto: {
            vetoer: adminAddress,
            veto_before_passed: false,
            early_execute: false,
            timelock_duration: {
                time: DAY
            },
        }

    }

    

    let result = await signer.instantiate(adminAddress, CORE_CODE_ID, instantiate_core, "Emporion Core", "auto")
    let STORE_ADDRESS = result.contractAddress;

    let instantiate_voting: InstantiateMsgEmporionVoting  = {
        core_address:STORE_ADDRESS,
    }

    let instantiate_dao: DAOCore.InstantiateMsg = {
        automatically_add_cw20s: false,
        automatically_add_cw721s: false,
        name: "Emporion DAO",
        description: "The Emporion network DAO",
        voting_module_instantiate_info: {
            code_id: VOTING_CODE_ID,
            msg: encodeMessage(instantiate_voting),
            label: "Emporion Voting",
            funds: [],
        },
        proposal_modules_instantiate_info: [
            {
                code_id: PROPOSE_SINGLE_CODE_ID,
                label: "Emporion DAO Propose Single",
                msg: encodeMessage(instantiate_propose_single),
                funds: [],
            }
        ]
    }

    result = await signer.instantiate(adminAddress, DAO_CODE_ID, instantiate_dao, "Emporion DAO Core", "auto")
    let DAO_ADDRESS = result.contractAddress;

    let env = loadEnvFile(await Bun.file(`.env.${Bun.env.NODE_ENV}`).text());
    env['STORE_ADDRESS'] = STORE_ADDRESS;
    env['DAO_ADDRESS'] = DAO_ADDRESS;


    await new EmporionClient(signer, adminAddress, STORE_ADDRESS).updateAdmin({
        newAdmin:DAO_ADDRESS,
    });

    await Bun.write(`.env.${Bun.env.NODE_ENV}`, envToString(env))
    /// update front env
    env = loadEnvFile(await Bun.file(`dapp/.env.${Bun.env.NODE_ENV}`).text());
    env['VITE_STORE_ADDRESS'] = STORE_ADDRESS;
    await Bun.write(`dapp/.env.${Bun.env.NODE_ENV}`, envToString(env))

    /// update back env 
    env = loadEnvFile(await Bun.file(`backend/.env.${Bun.env.NODE_ENV}`).text());
    env['STORE_ADDRESS'] = STORE_ADDRESS;
    env['DAO_ADDRESS'] = DAO_ADDRESS;
    await Bun.write(`backend/.env.${Bun.env.NODE_ENV}`, envToString(env))

    return {
        STORE_ADDRESS,
        DAO_ADDRESS,
    }
}

const testDeployement = async ({ DAO_ADDRESS, STORE_ADDRESS }: { DAO_ADDRESS: string, STORE_ADDRESS: string }) => {
    let params = await new EmporionClient(signer, adminAddress, STORE_ADDRESS).params();
    assert(params.admin === DAO_ADDRESS, "DAO should be the admin");
    console.log('✅ Deployement is ready!')
}


await $`bun scripts/build.ts`;

await testDeployement(await deploy())


