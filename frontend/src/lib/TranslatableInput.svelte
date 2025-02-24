<script lang="ts">
  import {
    getTranslator,
    TranslatedLanguages,
    type SupportedLanguage,
    type T,
  } from "../stores/translate.svelte";
  import { user } from "../stores/user.svelte";
  import Description from "./Description.svelte";
  import Input from "./Input.svelte";
  import ToolTip from "./ToolTip.svelte";
  import { getKeys } from "./utils";

  let {
    value = $bindable(),
    selectedLang,
    type,
    label,
  }: {
    value: T<string>;
    selectedLang: SupportedLanguage;
    type: "textarea" | "text" | "autocomplete";
    label: string;
  } = $props();

  let missingTranslations = $derived.by(() => {
    let allEmpty = getKeys(value).every((v) => value[v] == "");
    if (allEmpty) return [];
    return getKeys(value).filter((v) => {
      return value[v] == "";
    });
  });

  let t = getTranslator();
  let percent = $state(1);
  let element: HTMLElement = $state()!;

  const translate = () => {
    let target = selectedLang;
    if (value[selectedLang] == "") {
      target = getKeys(value).find((v) => {
        return value[v] != "";
      })!;
    }
    percent = 0;
    let dt = 1 / missingTranslations.length;
    missingTranslations.forEach(async (k, i) => {
      const req = { [target]: value[target], [k]: "" };
      const res = await user.translate(req);
      if (res.error) return;
      value[k] = res.result[k];
      percent += dt;
    });
  };
  const retranslate = () => {
    percent = 0;
    const keys = getKeys(value);
    let dt = 1 / (keys.length - 1);
    keys.forEach(async (k) => {
      if (k === selectedLang) return;
      const req = { [selectedLang]: value[selectedLang], [k]: "" };
      const res = await user.translate(req);
      if (res.error) return;
      percent += dt;
      value[k] = res.result[k];
    });
  };

  export const actions = {
    setValue(v: string) {
      value[selectedLang] = v;
    },
  };

  export { element };
</script>

{#snippet button()}
  {#if missingTranslations.length}
    <ToolTip openTimout={200}>
      <button aria-label="Auto translate" class="warn" onclick={translate}>
        <i class="ri-translate"></i>
      </button>
      {#snippet content()}
        <p>{t.t("empty_quiet_ladybug_pull")}</p>
        <ul>
          {#each missingTranslations as lang}
            <li>{t.t(TranslatedLanguages[lang])}</li>
          {/each}
        </ul>
      {/snippet}
    </ToolTip>
  {:else if value[selectedLang] !== ""}
    <ToolTip openTimout={200}>
      <button aria-label="Re translate" class="ok" onclick={retranslate}>
        <i class="ri-translate"></i>
      </button>
      {#snippet content()}
        <p>{t.t("candid_empty_ladybug_gleam")}</p>
      {/snippet}
    </ToolTip>
  {:else}
    <button aria-label="Re translate" disabled>
      <i class="ri-translate"></i>
    </button>
  {/if}
{/snippet}

<div class="translatable-input" style="--percent:{percent}" bind:this={element}>
  {#if type === "autocomplete"}
    <Description bind:value={value[selectedLang]} {label}>
      {@render button()}
    </Description>
  {:else}
    <Input {type} bind:value={value[selectedLang]} {label} placeholder={label}>
      {@render button()}
    </Input>
  {/if}
</div>

<style lang="scss">
  .translatable-input {
    display: flex;
    :global(.input) {
      flex: 1;
    }
    :global(.tooltip) {
      align-self: flex-start;
    }
    button {
      max-width: max-content;
      border: none;
      outline: none;
      aspect-ratio: 1;
      border-radius: 3px;
      border-width: 3px;
      align-self: flex-start;
      border-image: conic-gradient(
          var(--border-color) calc(var(--percent) * 360deg),
          transparent calc(var(--percent) * 360deg) 360deg
        )
        1;
      border-style: solid;
      clip-path: inset(1.5px 1.5px 1.5px 1.5px round 3px);

      &.ok {
        color: var(--green-11);
        background-color: var(--green-a2);
        --border-color: var(--green-6);
      }
      &.warn {
        color: var(--orange-11);
        background-color: var(--orange-a2);
        --border-color: var(--orange-6);
      }
      &:disabled {
        background-color: transparent;
        color: var(--neutral-5);
        --border-color: var(--neutral-5);
      }
    }
  }
</style>
