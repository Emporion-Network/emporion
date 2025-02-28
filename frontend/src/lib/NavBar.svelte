<script lang="ts">
  import { getLocation } from "@/stores/location.svelte";
  import AccountButton from "./AccountButton.svelte";
  import Logo from "./logo.svelte";
  const { goTo } = getLocation();
</script>

<nav>
  <button class="logo" onclick={() => goTo("/store")}>
    <Logo></Logo>
    <span>Emporion</span>
  </button>
  <AccountButton></AccountButton>
</nav>

<style lang="scss">
  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 9;
    position: relative;
    padding: 1rem;
    border-bottom: 1px solid var(--neutral-6);
    :global(.multi-select) {
      width: 300px;
    }
    .logo {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.6rem;
      font-size: 1.7rem;
      font-weight: bold;
      font-family: var(--font-2);
      background-color: transparent;
      outline: none;
      border: none;
      color: inherit;
      cursor: pointer;
    }
    :global(svg) {
      width: 2.5rem;
      height: 2.5rem;
    }
  }
</style>
