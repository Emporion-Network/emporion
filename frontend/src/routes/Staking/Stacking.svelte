<script lang="ts">
  import ButtonGroup from "@/lib/ButtonGroup.svelte";
  import Input from "@/lib/Input.svelte";
  import { humanTimeLeft } from "@/lib/utils";
  import { getTranslator } from "@/stores/translate.svelte";
  import { user } from "@/stores/user.svelte";
  import { Decimal } from "@cosmjs/math";

  const t = getTranslator();

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
        <h3>{t.t("muddy_weary_halibut_enjoy")}</h3>
        <div>
          <span>{t.t("bald_spare_cowfish_loop")}</span>
          <span>{Decimal.fromAtomics(user.bank.staked, 6)} EMPR</span>
        </div>
        <div>
          <span>{t.t("top_every_earthworm_expand")}</span>
          <span>
            {(
              (100 * Number(user.bank.staked)) /
              Number(params.total_staked)
            ).toFixed(2)}%
          </span>
        </div>
      </div>
      <div class="number">
        <h3>{t.t("silly_least_mole_hope")}</h3>
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
        <h3>{t.t("key_brave_pig_taste")}</h3>
        <div>
          <span>{t.t("kind_quiet_macaw_slide")}</span>
          <span>{Decimal.fromAtomics(user.bank.rewards, 6)} USDC</span>
        </div>
        <div>
          <span>{t.t("short_less_chicken_drum")}</span>
          <span
            >{Decimal.fromAtomics(params.undistributed_rewards, 6)} USDC</span
          >
        </div>
      </div>
      <div class="number">
        <h3>{t.t("vexed_large_bison_charm")}</h3>
        <div>
          <span>{t.t("topical_mad_flea_favor")}</span>
          <span>{Number(params.platform_fee) * 100}%</span>
        </div>
        <div>
          <span>{t.t("home_ok_skate_build")}</span>
          <span>{Number(params.distribution.rnd) * 100}%</span>
        </div>
        <div>
          <span>{t.t("least_nimble_ostrich_spur")}</span>
          <span>{Number(params.distribution.rewards) * 100}%</span>
        </div>
      </div>
      <div class="number">
        <h3>{t.t("real_noisy_gadfly_dazzle")}</h3>
        <div>
          <span>{t.t("ornate_lost_puma_talk")}</span>
          <span>{Decimal.fromAtomics(params.bank.rewards, 6)} USDC</span>
        </div>
        <div>
          <span>{t.t("home_ok_skate_build")}</span>
          <span>{Decimal.fromAtomics(params.bank.rnd, 6)} USDC</span>
        </div>
      </div>
      <div class="number">
        <h3>{t.t("royal_deft_shrike_express")}</h3>
        <div>
          <span>{t.t("smart_inclusive_polecat_accept")}</span>
          <span>12M EMPR</span>
        </div>
        <div>
          <span>{t.t("lucky_nimble_meerkat_strive")}</span>
          <span>{Decimal.fromAtomics(params.total_staked, 6)} EMPR</span>
        </div>
      </div>
    </div>

    <div class="claim-rewards">
      <h2>{t.t("brave_zany_tern_dazzle")}</h2>
      <h1>{Decimal.fromAtomics(user.bank.rewards, 6)} USDC</h1>
      <button
        class="primary-accent-button"
        onclick={claim}
        disabled={loading.claim || Number(user.bank.rewards) == 0}
      >
        {#if loading.claim}
          <i class="ri-loader-2-line loader"></i>
        {:else}
          {t.t("sunny_dry_chicken_promise")}
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
          label={t.t("awful_game_guppy_bubble")}
          placeholder={t.t("awful_game_guppy_bubble")}
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
            {t.t("raw_fine_myna_push")}
          {/if}
        </button>
      {:else}
        <Input
          max={user.bank.staked}
          type="number"
          label={t.t("cool_acidic_goldfish_buy")}
          placeholder={t.t("cool_acidic_goldfish_buy")}
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
        <h3>
          <i class="ri-information-line"></i>
          {t.t("stock_aware_otter_rush")}
        </h3>
        <p>
          {t.t("glad_small_rook_bask")}
        </p>
      </div>
    </div>

    <div class="claims">
      <h2>{t.t("fresh_light_pigeon_jolt")}</h2>
      {#if claimable.isGreaterThan(Decimal.zero(6))}
        <div class="available">
          <i class="ri-checkbox-circle-fill"></i>
          <span>{t.t("fine_pretty_marten_love")}</span>
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
              {t.t("ok_giant_termite_cheer")}
            {/if}
          </button>
        </div>
      {/if}
      {#each unstaking as unstaking}
        <div class="unstaking">
          <i class="ri-hourglass-line"></i>
          <span>{t.t("short_aloof_eagle_clip")}</span>
          <div class="amount">
            <span>{Decimal.fromAtomics(unstaking.amount, 6)}</span> EMPR
          </div>
          <div>
            {humanTimeLeft("en", new Date(Number(unstaking.time) / 1e6))}
          </div>
        </div>
      {/each}
      {#if claimable.equals(Decimal.zero(6)) && unstaking.length == 0}
        <p class="empty">{t.t("tense_knotty_lionfish_skip")}</p>
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
