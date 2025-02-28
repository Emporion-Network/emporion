<script lang="ts">
  import { user } from "@/stores/user.svelte";
  import { getTheme } from "@/stores/theme.svelte";
  import Address from "./Address.svelte";
  import ContextMenu from "./ContextMenu.svelte";
  import { Decimal } from "@cosmjs/math";
  import { getLocation } from "@/stores/location.svelte";
  import { getTranslator } from "@/stores/translate.svelte";
  let { goTo } = getLocation();
  let theme = getTheme();
  const t = getTranslator();
</script>

<div class="account">
  {#if user.address}
    <ContextMenu --margin="0.5rem 0 0 0">
      {#snippet opener({ get, set, ...props })}
        {/* @ts-ignore */ null}
        <button
          class="secondary-accent-button"
          bind:this={get, set}
          {...props}
          aria-labelledby="{t.t("weird_aqua_sawfish_reap")}"
        >
          <i class="ri-user-line"></i>
          <Address address={user.address!} />
        </button>
      {/snippet}
      {#snippet options()}
        <div class="bank">
          <div class="amount">
            <span>{Decimal.fromAtomics(user.bank.accepted, 6).toString()}</span>
            <span>USDC</span>
          </div>
          <div class="amount">
            <span>{Decimal.fromAtomics(user.bank.native, 6).toString()}</span>
            <span>JUNO</span>
          </div>
          <div class="amount">
            <span>{Decimal.fromAtomics(user.bank.stakable, 6).toString()}</span>
            <span>EMPR</span>
          </div>

          <button class="primary-accent-button">
            Claim {Decimal.fromAtomics(user.bank.rewards, 6)} USDC
          </button>

          <button class="secondary-button" onclick={() => goTo("/staking")}>
            <i class="ri-bank-fill"></i>
            {t.t("patchy_bad_mallard_belong")}
          </button>

          <button class="secondary-button" onclick={() => goTo("/my-store")}>
            <i class="ri-store-2-line"></i>
            {t.t("sad_tasty_racoon_pop")}
          </button>

          <button class="secondary-button" onclick={() => theme.toggle()}>
            {#if theme.theme == "dark"}
              <i class="ri-sun-fill"></i>
              {t.t("key_trick_badger_expand")}
            {:else}
              <i class="ri-moon-fill"></i>
             {t.t("vivid_awful_alligator_evoke")}
            {/if}
          </button>
          <button class="secondary-button" onclick={() => user.logout()}>
            <i class="ri-logout-box-line"></i>
            {t.t("gray_early_wombat_hunt")}
          </button>
        </div>
      {/snippet}
    </ContextMenu>
    <button class="secondary-button" aria-labelledby="{t.t("real_mellow_niklas_snap")}">
      <i class="ri-notification-fill"></i>
    </button>
  {:else}
    <button
      class="primary-accent-button"
      aria-labelledby="{t.t("weird_aqua_sawfish_reap")}"
      onclick={() => user.auth()}
    >
      {t.t("teary_gross_boar_gasp")}
    </button>
  {/if}
</div>

<style lang="scss">
  @use "../mixins" as *;

  .account {
    display: flex;
    gap: 1rem;
    @include media("<=phone") {
      .secondary-accent-button {
        aspect-ratio: 1/1 !important;
        width: auto;
        padding: 0;
      }
      :global(.secondary-accent-button > .address) {
        display: none;
      }
    }
    .secondary-button {
      min-width: var(--height-2);
      aspect-ratio: 1/1;
      border-color: transparent;
    }
  }
  .bank {
    background-color: var(--neutral-1);
    min-width: 250px;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    .amount {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: var(--font-mono);
      & > span:nth-child(2) {
        font-family: var(--font-1);
      }
    }

    .primary-accent-button {
      height: var(--height-2);
      font-family: var(--font-1);
    }

    .secondary-button {
      height: var(--height-2);
      display: flex;
      width: 100%;
      align-items: center;
      gap: 0.5rem;
      background-color: var(--neutral-3);
      border: transparent;
    }
  }
</style>
