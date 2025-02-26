import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Api } from '@ts-client/api';
import { EmporionClient, EmporionQueryClient } from '@ts-client/Emporion.client';
import { bechToBech, type FileMetaReq, type FileMetaRes, type ProductMetadata, type Result, type UploadFiles } from '@common';
import { GasPrice } from '@cosmjs/stargate';
import { storage } from './localStorage';
import { Decimal } from "@cosmjs/math"

class User extends Api {
  wc: Promise<SigningCosmWasmClient | CosmWasmClient>;
  ec: Promise<EmporionClient | EmporionQueryClient>;
  #rpcUrl: string;
  #contractAddress: string;
  #stakeAddress: string;
  #rewardsAddress: string;
  #nativeDenom: string;
  #stakeDenom: string;
  #acceptedDenom: string;
  address: string | undefined = $state(undefined);
  bank = $state({
    native: '0',
    accepted: '0',
    stakable: '0',
    staked: '0',
    unstaking: [] as {
      amount: string
      time: string
    }[],
    rewards: '0',
  });

  constructor({
    apiRoot,
    rpcUrl,
    contractAddress,
    stakeAddress,
    rewardsAddress,
    nativeDenom,
    stakeDenom,
    acceptedDenom,
  }: {
    apiRoot: string
    rpcUrl: string
    contractAddress: string
    stakeAddress: string
    rewardsAddress: string
    nativeDenom: string
    stakeDenom: string
    acceptedDenom: string;
  }) {
    super(apiRoot, true);
    this.wc = SigningCosmWasmClient.connect(rpcUrl);
    this.#rpcUrl = rpcUrl;
    this.#contractAddress = contractAddress;
    this.#stakeAddress = stakeAddress;
    this.#rewardsAddress = rewardsAddress;
    this.#nativeDenom = nativeDenom;
    this.#stakeDenom = stakeDenom;
    this.#acceptedDenom = acceptedDenom;
    // TODO: Find a way to remove ts gymnastics
    this.ec = this.wc.then(wc => new EmporionQueryClient(wc as Parameters<typeof EmporionQueryClient['bind']>[0], this.#contractAddress));
    window.addEventListener('keplr_keystorechange', () => {
      storage('token').clear();
      this.auth();
    });
    if (storage('token').exists()) {
      this.auth();
    }
  }

  async auth() {
    try {
      if (!window.keplr) return;
      const chainId = await (await this.wc).getChainId();
      const offlineSigner = window.keplr.getOfflineSigner(chainId);
      this.wc = SigningCosmWasmClient.connectWithSigner(this.#rpcUrl, offlineSigner, {
        gasPrice: GasPrice.fromString(`0.012${this.#nativeDenom}`),
      });
      this.address = (await offlineSigner.getAccounts())[0].address;
      this.ec = this.wc.then(wc => new EmporionClient(wc as Parameters<typeof EmporionClient['bind']>[0], this.address!, this.#contractAddress));
      if (storage('token').exists()) {
        this.token = storage<{
          token: string
          address: string
        }>('token').get()!.token;
      } else {
        const addr = bechToBech(this.address, 'cosmos');
        const nonceReq = await this.requestNonce({ addr });
        if (nonceReq.error) return;
        const nonce = nonceReq.result;
        const signature = await window.keplr.signArbitrary('cosmoshub-4', addr, nonce);
        const res = await this.requestToken({
          signature: signature.signature,
          pubKey: signature.pub_key,
          nonce,
        });
        if (res.error) {
          this.address = undefined;
          return;
        }
        storage<{
          token: string
          address: string
        }>('token').set({
          token: res.result,
          address: this.address,
        });
      }
      await this.updateWalletBalance();
    } catch (e) {
      console.log(e);
      this.address = undefined;
    }
  }

  async updateWalletBalance() {
    if (!this.address) return;
    const wc = await this.wc;
    const params = await (await this.ec).getParams();
    const accepted = (await wc.getBalance(this.address, params.accepted_denom)).amount;
    const native = (await wc.getBalance(this.address, this.#nativeDenom)).amount;
    const stakable = (await wc.getBalance(this.address, this.#stakeDenom)).amount;

    const staked = (await wc.queryContractSmart(this.#stakeAddress, {
      voting_power_at_height: {
        address: this.address,
      },
    })).power;
    const unstaking = (await wc.queryContractSmart(this.#stakeAddress, {
      claims: {
        address: this.address,
      },
    })).claims.map((c: {
      amount: string
      release_at: {
        at_time: string
      }
    }) => {
      return {
        amount: c.amount,
        time: c.release_at.at_time,
      };
    });

    const rewards = (await wc.queryContractSmart(this.#rewardsAddress, {
      pending_rewards: {
        address: this.address,
      },
    })).pending_rewards
      .find((e: { denom: { native: string } }) => e.denom.native == params.accepted_denom)
      .pending_rewards;

    this.bank.rewards = rewards;
    this.bank.staked = staked;
    this.bank.accepted = accepted;
    this.bank.native = native;
    this.bank.unstaking = unstaking;
    this.bank.stakable = stakable;
  }

  async stake(amount: string) {
    try {
      if (!this.address) return;
      const wc = await this.wc as SigningCosmWasmClient;
      await wc.execute(this.address, this.#stakeAddress, {
        stake: {},
      }, 'auto', '', [
        {
          amount,
          denom: this.#stakeDenom,
        },
      ]);
      this.updateWalletBalance();
    } catch { }
  }

  async unstake(amount: string) {
    try {
      if (!this.address) return;
      const wc = await this.wc as SigningCosmWasmClient;
      await wc.execute(this.address, this.#stakeAddress, {
        unstake: {
          amount,
        },
      }, 'auto');
      this.updateWalletBalance();
    } catch { }
  }

  logout() {
    this.address = undefined;
    this.token = '';
    storage('token').clear();
  }

  async getParams() {
    const wc = await this.wc;
    const ec = await this.ec;
    let totalStaked: string = (await wc.queryContractSmart(this.#stakeAddress, {
      total_power_at_height: {},
    })).power;

    let undistributedRewards: string = await wc.queryContractSmart(this.#rewardsAddress, {
      undistributed_rewards: { id: 1 },
    });
    let distribution = await ec.getDistribution();
    return {
      ...await ec.getParams(),
      total_staked: totalStaked,
      undistributed_rewards: undistributedRewards,
      bank: distribution,
    }
  }


  async withrawUnstaked() {
    try {
      if (!this.address) return;
      const wc = await this.wc as SigningCosmWasmClient;
      await wc.execute(this.address, this.#stakeAddress, {
        claim: {},
      }, "auto");
      this.updateWalletBalance();
    } catch { }
  }


  async claimRewards() {
    try {
      if (!this.address) return;
      const wc = await this.wc as SigningCosmWasmClient;
      await wc.execute(this.address, this.#rewardsAddress, {
        claim: {
          id: 1,
        },
      }, 'auto');
      this.updateWalletBalance();
    } catch { }
  }

  async createProducts(p: Parameters<Api['uploadMetadata']>['0']) {
    try {
      if (!this.address) return;
      let urls = await this.uploadMetadata(p);
      if (urls.error) return;
      const ec = await this.ec as EmporionClient;
      await ec.createBulkProducts({
        products: urls.result.map((url, i) => {
          return {
            meta_data_url: url,
            price: p[i].price,
            listed: p[i].listed
          }
        })
      }, "auto", "", [
        {
          amount: urls.result.reduce((a, _, i) => a.plus(Decimal.fromUserInput(i.toString(), 6)), Decimal.zero(6)).atomics,
          denom: this.#acceptedDenom,
        }
      ])
    } catch (e) {
      console.log(e);
    }
  }


}

export const user = new User({
  apiRoot: `${location.protocol}//${location.hostname}:${location.port}/api/`,
  rpcUrl: 'https://juno-rpc.publicnode.com:443',
  contractAddress: 'juno18w8zvwp5g7truxq6gjae0anxydpqdvwfgx0t9rudhvtz3wtksdesgc6sm7',
  stakeAddress: 'juno1jz0jvrea3jxzt3xrz3h5f962epsg7ljtlexj02lnue6dftdc520qgckeln',
  rewardsAddress: 'juno1ehg2q7a9pj5pv99wv2tngqts5z5ydc3uadk73805fjxxxyl3qvhq5prf72',
  nativeDenom: 'ujuno',
  stakeDenom: 'factory/juno1zjqsel42pj5e6wvxxw7hjs9gn06yqz4m3ffyua3x2v44m4l8trjsr92q9s/empr',
  acceptedDenom: "ibc/4A482FA914A4B9B05801ED81C33713899F322B24F76A06F4B8FE872485EA22FF",
});
