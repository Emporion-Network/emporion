import { $ } from "bun";
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
import {
    S3Client,
    DeleteObjectsCommand,
    ListObjectsV2Command
} from "@aws-sdk/client-s3";


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

    let cw20: string | undefined = "";
    if (Bun.env.NODE_ENV === 'development') {

        const {
            STORAGE_SECRET,
            STORAGE_KEY,
            BUKET,
            BUKET_ENDPOINT,
            BUKET_REGION,
            STORAGE_BUKET,
        } = loadEnvFile(await Bun.file('./backend/.env').text());

        const client = new S3Client({
            endpoint: BUKET_ENDPOINT,
            region: BUKET_REGION,
            credentials: {
                secretAccessKey: STORAGE_SECRET || 'error',
                accessKeyId: STORAGE_KEY || 'error',
            },
        });

        async function deleteFolder(location) {
            let count = 0; // number of files deleted
            async function recursiveDelete(token) {
              // get the files
              const listCommand = new ListObjectsV2Command({
                Bucket: BUKET, 
                Prefix: location,
                ContinuationToken: token
              });
              let list = await client.send(listCommand);
              if (list.KeyCount) { // if items to delete
                // delete the files
                const deleteCommand = new DeleteObjectsCommand({
                  Bucket: STORAGE_BUKET,
                  Delete: {
                    Objects: list.Contents!.map((item) => ({ Key: item.Key })),
                    Quiet: false,
                  },
                });
                let deleted = await client.send(deleteCommand);
                count += deleted.Deleted?.length || 0;
                // log any errors deleting files
                if (deleted.Errors) {
                  deleted.Errors.map((error) => console.log(`${error.Key} could not be deleted - ${error.Code}`));
                }
              }
              // repeat if more files to delete
              if (list.NextContinuationToken) {
                recursiveDelete(list.NextContinuationToken);
              }
              // return total deleted count when finished
              return `${count} files deleted.`;
            };
            // start the recursive function
            try {
                return recursiveDelete(location);
            } catch(e){
            }
          };

        await deleteFolder('development')

        let cw20_base = new Uint8Array(await Bun.file('artifacts/cw20_base.wasm').arrayBuffer());
        let { codeId: CW_20_CODE_ID } = await signer.upload(adminAddress, cw20_base, "auto");
        let result = await signer.instantiate(adminAddress, CW_20_CODE_ID, {
            name: "CW20",
            symbol: "CWT",
            decimals: 6,
            initial_balances: [{
                address: adminAddress,
                amount: "1000000000000"
            }]

        }, "CW20", "auto")
        cw20 = result.contractAddress;
        let coinsInfo = Bun.file('./dapp/src/COIN_DATA.development.ts').text();
        let newCoins = (await coinsInfo).replaceAll(/(coinMinimalDenom|onChainDenom):"neutron.*?"/g, `$1:"${result.contractAddress}"`)
        await Bun.write('./dapp/src/COIN_DATA.development.ts', newCoins);
        console.log('CW20 address:', result.contractAddress);
    }

    let instantiate_core: InstantiateMsg = {
        admin: adminAddress,
        dev: adminAddress,
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
            //@ts-ignore
            ...(cw20 ? [[{ cw20 }, 1]] : []),
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

    let instantiate_voting: InstantiateMsgEmporionVoting = {
        core_address: STORE_ADDRESS,
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


    await new EmporionClient(signer, adminAddress, STORE_ADDRESS).update_admin({
        new_admin: DAO_ADDRESS,
    }, "auto");

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
    let params = await new EmporionClient(signer, adminAddress, STORE_ADDRESS).params({});
    assert(params.admin === DAO_ADDRESS, "DAO should be the admin");
    console.log('✅ Deployement is ready!')
}


await $`bun scripts/build.ts`;
await testDeployement(await deploy())


