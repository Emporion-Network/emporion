<script lang="ts">
  import ButtonGroup from "@/lib/ButtonGroup.svelte";
  import Input from "@/lib/Input.svelte";
  import Route from "@/lib/Route.svelte";
  import { humanTimeLeft } from "@/lib/utils";
  import { user } from "@/stores/user.svelte";
  import { Decimal } from "@cosmjs/math";

  let [claimable, unstaking] = $derived.by(() => {
    let claimable = user.bank.unstaking
      .filter((e) => {
        return Number(e.time) * 1e-6 < Date.now();
      })
      .reduce(
        (acc, c) => {
          return Decimal.fromAtomics(c.amount, 6).plus(acc);
        },
        Decimal.fromAtomics("0", 6),
      );
    let unstaking = user.bank.unstaking.filter((e) => {
      return Number(e.time) * 1e-6 > Date.now();
    });
    return [claimable, unstaking];
  });
  let tab = $state("Stake");
  let toStake = $state("0");
  let toUnstake = $state("0");
  let loading = $state({
    stake: false,
    claim: false,
    unstake: false,
    withdraw: false,
  });

  const setToStkTo = (percent: number, max: string) => {
    let v = (
      Decimal.fromAtomics(max, 6).toFloatApproximation() * percent
    ).toFixed(6);
    toStake = v;
  };
  const setUstkTo = (percent: number, max: string) => {
    let v = (
      Decimal.fromAtomics(max, 6).toFloatApproximation() * percent
    ).toFixed(6);
    toUnstake = v;
  };

  const claim = async () => {
    loading.claim = true;
    await user.claimRewards();
    loading.claim = false;
  };

  const stake = async () => {
    loading.stake = true;
    await user.stake(Decimal.fromUserInput(toStake, 6).atomics);
    loading.stake = false;
  };
  const unstake = async () => {
    loading.unstake = true;
    await user.unstake(Decimal.fromUserInput(toUnstake, 6).atomics);
    loading.unstake = false;
  };

  const withdrawUnstake = async () => {
    loading.withdraw = true;
    await user.withrawUnstaked();
    loading.withdraw = false;
  };
</script>

{#await user.getParams() then params}
  <div class="staking-page">
    <div class="grid">
      <div class="number">
        <h3>Staking</h3>
        <div>
          <span>Staked:</span>
          <span>{Decimal.fromAtomics(user.bank.staked, 6)} EMPR</span>
        </div>
        <div>
          <span>Voting power:</span>
          <span>
            {100 *
              Math.floor(
                Number(user.bank.staked) / Number(params.total_staked),
              )}
            %
          </span>
        </div>
      </div>
      <div class="number">
        <h3>Available</h3>
        <div>
          <span>EMPR</span>
          <span>{Decimal.fromAtomics(user.bank.stakable, 6)}</span>
        </div>
        <div>
          <span>JUNO</span>
          <span>{Decimal.fromAtomics(user.bank.native, 6)}</span>
        </div>
        <div>
          <span>USDC</span>
          <span>{Decimal.fromAtomics(user.bank.accepted, 6)}</span>
        </div>
      </div>
      <div class="number">
        <h3>Rewards</h3>
        <div>
          <span>Available:</span>
          <span>{Decimal.fromAtomics(user.bank.rewards, 6)} USDC</span>
        </div>
        <div>
          <span>Total left:</span>
          <span
            >{Decimal.fromAtomics(params.undistributed_rewards, 6)} USDC</span
          >
        </div>
      </div>
      <div class="number">
        <h3>Platform params</h3>
        <div>
          <span>Platform fee:</span>
          <span>{Number(params.platform_fee) * 100}%</span>
        </div>
        <div>
          <span>R&D:</span>
          <span>{Number(params.distribution.rnd) * 100}%</span>
        </div>
        <div>
          <span>Rewards:</span>
          <span>{Number(params.distribution.rewards) * 100}%</span>
        </div>
      </div>
      <div class="number">
        <h3>Accumulated Fees</h3>
        <div>
          <span>Rewards:</span>
          <span>{Decimal.fromAtomics(params.bank.rewards, 6)} USDC</span>
        </div>
        <div>
          <span>R&D:</span>
          <span>{Decimal.fromAtomics(params.bank.rnd, 6)} USDC</span>
        </div>
      </div>
      <div class="number">
        <h3>Total Supply</h3>
        <div>
          <span>Total supply:</span>
          <span>12M EMPR</span>
        </div>
        <div>
          <span>Total staked:</span>
          <span>{Decimal.fromAtomics(params.total_staked, 6)} EMPR</span>
        </div>
      </div>
    </div>

    <div class="claim-rewards">
      <h2>Claim your rewards</h2>
      <h1>{Decimal.fromAtomics(user.bank.rewards, 6)} USDC</h1>
      <button
        class="primary-accent-button"
        onclick={claim}
        disabled={loading.claim || Number(user.bank.rewards) == 0}
      >
        {#if loading.claim}
          <i class="ri-loader-2-line loader"></i>
        {:else}
          Claim
        {/if}
      </button>
    </div>

    <div class="stake">
      <ButtonGroup options={["Stake", "Unstake"]} bind:value={tab}>
        {#snippet optionRenderer(v)}
          {v}
        {/snippet}
      </ButtonGroup>
      {#if tab === "Stake"}
        <Input
          max={user.bank.stakable}
          type="number"
          label="Amount to Stake"
          placeholder="Amount to Stake"
          bind:value={toStake}
        >
          EMPR
        </Input>
        <div class="buttons">
          <button
            onclick={() => setToStkTo(0.1, user.bank.stakable)}
            class="secondary-button"
          >
            10%
          </button>
          <button
            onclick={() => setToStkTo(0.25, user.bank.stakable)}
            class="secondary-button"
          >
            25%
          </button>
          <button
            class="secondary-button"
            onclick={() => setToStkTo(0.5, user.bank.stakable)}
          >
            50%
          </button>
          <button
            class="secondary-button"
            onclick={() => setToStkTo(0.75, user.bank.stakable)}
          >
            75%
          </button>
          <button
            class="secondary-button"
            onclick={() => setToStkTo(1, user.bank.stakable)}
          >
            100%
          </button>
        </div>
        <button
          class="primary-button"
          disabled={loading.stake || Number(toStake) == 0}
          onclick={stake}
        >
          {#if loading.stake}
            <i class="ri-loader-2-line loader"></i>
          {:else}
            Stake
          {/if}
        </button>
      {:else}
        <Input
          max={user.bank.staked}
          type="number"
          label="Amount to Unstake"
          placeholder="Amount to Unstake"
          bind:value={toUnstake}
        >
          EMPR
        </Input>
        <div class="buttons">
          <button
            onclick={() => setUstkTo(0.1, user.bank.staked)}
            class="secondary-button"
          >
            10%
          </button>
          <button
            onclick={() => setUstkTo(0.25, user.bank.staked)}
            class="secondary-button"
          >
            25%
          </button>
          <button
            class="secondary-button"
            onclick={() => setUstkTo(0.5, user.bank.staked)}
          >
            50%
          </button>
          <button
            class="secondary-button"
            onclick={() => setUstkTo(0.75, user.bank.staked)}
          >
            75%
          </button>
          <button
            class="secondary-button"
            onclick={() => setUstkTo(1, user.bank.staked)}
          >
            100%
          </button>
        </div>
        <button
          class="primary-button"
          disabled={loading.unstake || Number(toUnstake) == 0}
          onclick={unstake}
        >
          {#if loading.unstake}
            <i class="ri-loader-2-line loader"></i>
          {:else}
            Unstake
          {/if}
        </button>
      {/if}
      <div class="info">
        <h3><i class="ri-information-line"></i> Unstaking period: 1 week</h3>
        <p>
          It will take one week from the time you unstake your tokens until you
          can withdraw them. During this period, you will not receive voting
          power for the unstaked tokens, nor will you be able to cancel the
          unstaking process.
        </p>
      </div>
    </div>

    <div class="claims">
      <h2>Unstaking claims</h2>
      {#if claimable.isGreaterThan(Decimal.zero(6))}
        <div class="available">
          <i class="ri-checkbox-circle-fill"></i>
          <span>Available</span>
          <div class="amount">
            <span>{claimable}</span> EMPR
          </div>
          <button
            class="primary-accent-button"
            disabled={loading.withdraw}
            onclick={withdrawUnstake}
          >
            {#if loading.withdraw}
              <i class="ri-loader-2-line loader"></i>
            {:else}
              Withdraw
            {/if}
          </button>
        </div>
      {/if}
      {#each unstaking as unstaking}
        <div class="unstaking">
          <i class="ri-hourglass-line"></i>
          <span>Unstaking</span>
          <div class="amount">
            <span>{Decimal.fromAtomics(unstaking.amount, 6)}</span> EMPR
          </div>
          <div>
            {humanTimeLeft("en", new Date(Number(unstaking.time) / 1e6))}
          </div>
        </div>
      {/each}
      {#if claimable.equals(Decimal.zero(6)) && unstaking.length == 0}
        <p class="empty">You have no unstaking claims.</p>
      {/if}
    </div>
  </div>
{/await}

<style lang="scss">
  @use "../../mixins" as *;
  .staking-page {
    max-width: 1100px;
    display: flex;
    flex-direction: column;
    margin: auto;
    gap: 1rem;
    padding: 2.5%;
    .loader {
      display: inline-block;
      animation: rotate infinite linear forwards 1s;
      @keyframes rotate {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    }
    .empty {
      text-align: center;
      font-size: 1.2rem;
      color: var(--neutral-11);
      background-color: var(--neutral-2);
      padding: 2rem;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 0.5rem;
      @include media("<=tablet-lg") {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr 1fr;
      }
      @include media("<=phone") {
        grid-template-columns: 1fr;
        grid-template-rows: repeat(1fr, 6);
      }
      .number {
        background-color: var(--neutral-2);
        border-radius: 3px;
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        span {
          font-family: var(--font-mono);
        }
        h3 {
          font-weight: 400;
          color: var(--neutral-10);
          font-size: 1rem;
        }
        div {
          display: flex;
          justify-content: space-between;
        }
      }
    }
    .info {
      color: var(--orange-12);
      background-color: var(--orange-a1);
      border: 1px solid var(--orange-6);
      padding: 1rem;
      border-radius: 3px;
      h3 {
        color: var(--orange-12);
      }
    }
    .claim-rewards {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: 0.5rem;
      background-color: var(--main-2);
      padding: 1rem;
      border-radius: 3px;
      position: relative;
      h1 {
        font-family: var(--font-mono);
        font-weight: 900;
      }
      h2 {
        font-weight: 400;
        font-size: 1.2rem;
        color: var(--neutral-12);
      }
    }
    .stake {
      display: flex;
      gap: 1rem;
      flex-direction: column;
      --parent-bg: var(--neutral-2);
      background-color: var(--parent-bg);
      padding: 2rem;
      .buttons {
        display: flex;
        gap: 0.5rem;
        button {
          height: auto;
          background-color: var(--neutral-3);
          border-color: transparent;
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 80px;
          font-family: var(--font-mono);
        }
      }
    }
    .claims {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      .primary-accent-button {
        height: var(--height-2);
        padding: 0 1rem;
      }
      & > div {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 1rem;
        background-color: var(--neutral-2);
        gap: 1rem;
        border-radius: 3px;
        &.unstaking > i {
          display: inline-block;
          animation: tick infinite linear alternate 5s;
          @keyframes tick {
            0% {
              transform: rotate(0deg);
            }
            45% {
              transform: rotate(0deg);
            }
            55% {
              transform: rotate(180deg);
            }
            100% {
              transform: rotate(180deg);
            }
          }
        }
        &.available > i {
          color: var(--green-11);
        }
        & > span {
          width: 100px;
        }
        .amount {
          flex: 1;
          font-family: var(--font-mono);
        }
      }
    }
    .primary-button,
    .primary-accent-button {
      padding: 0 2rem;
      max-width: max-content;
    }
  }
</style>
