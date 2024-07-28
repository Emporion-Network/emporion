import "bun";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { StargateClient, GasPrice } from "@cosmjs/stargate";
import { EmporionClient } from "../client-ts/Emporion.client"
import { InstantiateMsg } from "../client-ts/Emporion.types";
import { appendFile } from "node:fs/promises";
import * as DAOCore from '../DAO/types/DaoDaoCore';
import * as DAOProposalSingle from '../DAO/types/DaoProposalSingle.v2';
import * as DAOPreProposeSingle from '../DAO/types/DaoPreProposeSingle';


import { Secp256k1HdWallet } from "@cosmjs/amino";

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
    gasPrice: GasPrice.fromString("10000untrn"),
});


const loadEnvFile = (txt: string) => {
    return txt.split('\n').reduce((acc, l) => {
        if (l.trim().length > 0) {
            let [key, value] = l.split('=').map(e => e.trim());
            acc[key] = value.startsWith('"') ? value.replaceAll('"', '') :
                value.startsWith("'") ? value.replaceAll("'", '') : value;
        }
        return acc;
    }, {} as Record<string, string>)
}

const envToString = (env: Record<string, string>) => {
    let ret = "";
    Object.entries(env).forEach(([k, v]) => {
        ret += `${k}=${JSON.stringify(v)}\n`
    });
    return ret;
}

const deploy = async () => {
    const DAY = 24 * 60 * 60;
    let emporion_store_wasm = new Uint8Array(await Bun.file('artifacts/store.wasm').arrayBuffer());
    let dao_core_wasm = new Uint8Array(await Bun.file('DAO/dao_dao_core.wasm').arrayBuffer());
    let dao_proposal_single_wasm = new Uint8Array(await Bun.file('DAO/dao_proposal_single.wasm').arrayBuffer());
    let dao_pre_propose_single_wasm = new Uint8Array(await Bun.file('DAO/dao_pre_propose_single.wasm').arrayBuffer());

    let { codeId: STORE_CODE_ID } = await signer.upload(adminAddress, emporion_store_wasm, "auto");
    let { codeId: DAO_CODE_ID } = await signer.upload(adminAddress, dao_core_wasm, "auto");
    let { codeId: PRE_PROPOSE_SINGLE_CODE_ID } = await signer.upload(adminAddress, dao_pre_propose_single_wasm, "auto");
    let { codeId: PROPOSE_SINGLE_CODE_ID } = await signer.upload(adminAddress, dao_proposal_single_wasm, "auto");

    let instantiate_store: InstantiateMsg = {
        admin: adminAddress,
        fee: [1, 100],
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

    let instantiate_dao: DAOCore.InstantiateMsg = {
        automatically_add_cw20s: false,
        automatically_add_cw721s: false,
        name: "Emporion DAO",
        description: "The Emporion network DAO",
        voting_module_instantiate_info: {
            code_id: STORE_CODE_ID,
            msg: encodeMessage(instantiate_store),
            label: "Emporion store",
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

    let result = await signer.instantiate(adminAddress, DAO_CODE_ID, instantiate_dao, "Emporion DAO Core", "auto")

    let attributes = result.events.map(e => e.attributes).flat();
    let STORE_ADDRESS = attributes.find(a => a.key === "voting_module")!.value;
    let DAO_ADDRESS = result.contractAddress;

    let env = loadEnvFile(await Bun.file(`.env.${Bun.env.NODE_ENV}`).text());
    env['STORE_ADDRESS'] = STORE_ADDRESS;
    env['DAO_ADDRESS'] = DAO_ADDRESS;

    await Bun.write(`.env.${Bun.env.NODE_ENV}`, envToString(env))
    return {
        STORE_ADDRESS,
        DAO_ADDRESS,
    }
}

const testDeployement = async ({ DAO_ADDRESS, STORE_ADDRESS }: { DAO_ADDRESS: string, STORE_ADDRESS: string }) => {
    await new EmporionClient(signer, adminAddress, STORE_ADDRESS).params();
    await signer.queryContractSmart(DAO_ADDRESS, {
        voting_power_at_height: {
            address: adminAddress
        }
    });
    console.log('✅ Deployement is ready!')
}

await testDeployement(await deploy())


