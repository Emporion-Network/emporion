<script lang="ts">
  import { user } from "@/stores/user.svelte";
  import Input from "./Input.svelte";
  import { onMount } from "svelte";
  import { activeElement } from "@/stores/activeElement.svelte";
  import { blur } from "./utils";
  import { getTranslator } from "@/stores/translate.svelte";
  import ButtonGroup from "./ButtonGroup.svelte";

  let {
    name = $bindable(),
    postalAddress = $bindable(),
  }: {
    name: string;
    postalAddress: string;
  } = $props();
  const t = getTranslator();
  let tmt: ReturnType<typeof setTimeout>;
  let el: HTMLElement = $state()!;
  let completions: string[] = $state([]);
  type PostalAddress = NonNullable<
    typeof user.userData
  >["postalAddresses"][number];
  let form = $state({
    name: "",
    postalAddress: "",
  });

  const getPostalAddress = () => {
    return form.postalAddress;
  };
  const setPostalAddress = (v: string) => {
    if (tmt) {
      clearTimeout(tmt);
    }
    tmt = setTimeout(async () => {
      const req = await user.addressAutocomplete(form.postalAddress);
      if (req.error) return;
      completions = req.result;
    }, 500);
    form.postalAddress = v;
  };
  const select = (s: string) => () => {
    form.postalAddress = s;
    blur();
  };
  const labels = {
    new: t.t("variable_upstairs_alarm_personality"),
    saved: t.t("juicy_grandiose_twist_arm"),
  };
  let tab: "saved" | "new" = $state("new");
  const savedAddrsses = $derived.by(() => {
    console.log(user.userData?.postalAddresses);
    return (user.userData?.postalAddresses || []).toReversed();
  });
  $effect(() => {
    user.userData?.postalAddresses;
    if (savedAddrsses.length) {
      postalAddress = savedAddrsses[0].postalAddress;
      name = savedAddrsses[0].name;
      tab = "saved";
    }
  });
  onMount(() => {
    return () => clearTimeout(tmt);
  });
  const addPostalAddress = () => {
    if (!user.userData) return;
    user.updateUserData({
      postalAddresses: [...user.userData.postalAddresses, form],
      positiveProducts: user.userData.positiveProducts,
      negativeProducts: user.userData.negativeProducts,
    });
  };
  const set = (p: PostalAddress) => () => {
    postalAddress = p.postalAddress;
    name = p.name;
  };
</script>

<div class="postal-address">
  <ButtonGroup bind:value={tab} options={["saved", "new"] as const}>
    {#snippet optionRenderer(v)}
      {labels[v]}
    {/snippet}
  </ButtonGroup>
  {#if tab == "new"}
    <Input
      type="text"
      label={t.t("far_friendship_untimely_text")}
      placeholder={t.t("far_friendship_untimely_text")}
      bind:value={form.name}
    />
    <div class="wpr" bind:this={el}>
      <Input
        type="text"
        label={t.t("discount_admirable_plant_complex")}
        placeholder={t.t("discount_admirable_plant_complex")}
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
    <button class="secondary-button" onclick={addPostalAddress}>
      {t.t("appointment_appeal_weekly_arctic")}
    </button>
  {:else}
    <div class="saved hide-scrollbar">
      {#each savedAddrsses as p}
        <button
          onclick={set(p)}
          class:selected={p.name === name && p.postalAddress == postalAddress}
        >
          <div>
            {p.name}
            <p>{p.postalAddress}</p>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .postal-address {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    .saved {
      display: flex;
      overflow-y: auto;
      gap: 1rem;
      button {
        min-width: max-content;
        padding: 1rem;
        display: flex;
        background-color: transparent;
        border: 1px solid var(--neutral-6);
        color: inherit;
        border-radius: 3px;
        cursor: pointer;
        align-items: flex-start;
        justify-content: center;
        text-align: left;
        p {
          max-width: 200px;
        }
        &.selected {
          border: 1px solid var(--main-10);
        }
      }
    }
    .wpr {
      position: relative;
    }
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
