<script lang="ts">
  import { user } from "@/stores/user.svelte";
  import { getTheme } from "@/stores/theme.svelte";
  import Address from "./Address.svelte";
  import ContextMenu from "./ContextMenu.svelte";
  import { Decimal } from "@cosmjs/math";
  import { getLocation } from "@/stores/location.svelte";
  let { goTo } = getLocation();
  let theme = getTheme();
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
          aria-labelledby="user profile"
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
            Stake
          </button>

          <button class="secondary-button" onclick={() => goTo("/my-store")}>
            <i class="ri-store-2-line"></i>
            My store
          </button>

          <button class="secondary-button" onclick={() => theme.toggle()}>
            {#if theme.theme == "dark"}
              <i class="ri-sun-fill"></i>
              Light Mode
            {:else}
              <i class="ri-moon-fill"></i>
              Dark Mode
            {/if}
          </button>
          <button class="secondary-button" onclick={() => user.logout()}>
            <i class="ri-logout-box-line"></i>
            Log out
          </button>
        </div>
      {/snippet}
    </ContextMenu>
    <button class="secondary-button" aria-labelledby="notifications">
      <i class="ri-notification-fill"></i>
    </button>
  {:else}
    <button
      class="primary-accent-button"
      aria-labelledby="user profile"
      onclick={() => user.auth()}
    >
      Connect wallet
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
        aspect-ratio: 1;
      }
      :global(.secondary-accent-button > .address) {
        display: none;
      }
    }
    .secondary-button {
      min-width: var(--height-2);
      aspect-ratio: 1;
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
