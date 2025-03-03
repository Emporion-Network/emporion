<script lang="ts">
  import { user } from "@/stores/user.svelte";
  import Input from "./Input.svelte";
  import { onMount } from "svelte";
  import { activeElement } from "@/stores/activeElement.svelte";
  import { blur } from "./utils";

  let {
    name = $bindable(),
    postalAddress = $bindable(),
  }: {
    name: string;
    postalAddress: string;
  } = $props();
  let t: ReturnType<typeof setTimeout>;
  let el: HTMLElement = $state()!;
  let completions: string[] = $state([]);
  const getPostalAddress = () => {
    return postalAddress;
  };
  const setPostalAddress = (v: string) => {
    if (t) {
      clearTimeout(t);
    }
    t = setTimeout(async () => {
      const req = await user.addressAutocomplete(postalAddress);
      if (req.error) return;
      completions = req.result;
    }, 500);
    postalAddress = v;
  };

  const select = (s: string) => () => {
    postalAddress = s;
    blur();
  };
  onMount(() => {
    return () => clearTimeout(t);
  });
</script>

<div class="postal-address">
  <Input type="text" label="Name" placeholder="Name" bind:value={name} />
  <div class="wpr" bind:this={el}>
    <Input
      type="text"
      label="Address"
      placeholder="Address"
      bind:value={getPostalAddress, setPostalAddress}
    />
    {#if completions.length && el.contains(activeElement.el)}
      <div class="options">
        {#each completions as addr}
          <button onclick={select(addr)}>{addr}</button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .postal-address {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    .options {
      top: 100%;
      left: 0;
      min-width: 100%;
      display: flex;
      flex-direction: column;
      position: absolute;
      background-color: var(--neutral-2);
      margin-top: 0.5rem;
      border-radius: 3px;
      max-height: 200px;
      border: 1px solid var(--neutral-6);
      overflow-y: auto;
      overscroll-behavior: contain;
      &::-webkit-scrollbar {
        display: none;
      }
      button {
        background-color: transparent;
        border: none;
        color: inherit;
        height: max-content;
        display: flex;
        align-items: flex-start;
        text-align: justify;
        padding: 0.5rem;
      }
    }
  }
</style>
