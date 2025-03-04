<script lang="ts">
  import type { Snippet } from "svelte";
  import Autocompleter from "./Autocompleter.svelte";
  import { Decimal } from "@cosmjs/math";
  import { getTranslator } from "@/stores/translate.svelte";
  const t = getTranslator();

  let {
    value = $bindable(),
    label,
    placeholder,
    type,
    error,
    children,
    onchange = () => {},
    readonly = false,
    // @ts-ignore
    completions = $bindable(),
    // @ts-ignore
    max,
  }: {
    label: string;
    placeholder: string;
    error?: boolean;
    readonly?: boolean;
    children?: Snippet<[]>;
    onchange?: () => void;
  } & (
    | {
        value?: string;
        type: "text" | "textarea" | "search";
      }
    | {
        type: "number";
        value?: string;
        max: string;
      }
    | {
        value?: string;
        type: "autocomplete";
        completions: string[];
      }
  ) = $props();

  let el: HTMLElement = $state()!;

  const reg =
    /(^[0-9][\.,][0-9]{0,6}$)|(^[0-9][\.,]?$)|(^[1-9][0-9]*[\.,]?$)|(^[1-9][0-9]*[\.,][0-9]{0,6}$)|(^$)/;
  const set = (v: string) => {
    if (!reg.test(v)) return;
    let wanted;
    if (v.endsWith(".") || v.endsWith(",")) {
      wanted = Decimal.fromUserInput(v + "0", 6);
    } else {
      wanted = Decimal.fromUserInput(v, 6);
    }
    if (wanted.isGreaterThan(Decimal.fromUserInput(max, 6))) return;
    value = v;
  };
  const get = () => {
    return value || "";
  };

  const clear = () => {
    value = "";
  };
  export const actions = {
    setValue(nv: typeof value) {
      value = nv;
    },
  };
  export { el as element };
</script>

<label class="input {type}" class:error class:readonly bind:this={el}>
  <div>{label}</div>
  {#if type == "text"}
    <input
      class="native"
      type="text"
      {placeholder}
      bind:value
      {onchange}
      {readonly}
      disabled={readonly}
    />
    {@render children?.()}
  {:else if type == "search"}
    {@render children?.()}
    <input
      class="native"
      type="text"
      {placeholder}
      bind:value
      {readonly}
      disabled={readonly}
    />
    <button aria-label={t.t("caring_polite_ape_sew")} onclick={clear}>
      {#if typeof value == "string" && value.length > 0}
        <i class="ri-close-line"></i>
      {:else}
        <i class="ri-search-line"></i>
      {/if}
    </button>
  {:else if type === "number"}
    <input
      type="text"
      class="native"
      inputmode="decimal"
      disabled={readonly}
      {readonly}
      {placeholder}
      bind:value={get, set}
    />
    {@render children?.()}
  {:else if type == "autocomplete" && typeof value !== "number"}
    <Autocompleter bind:value bind:completions {placeholder} />
    {@render children?.()}
  {:else}
    <textarea
      class="native"
      bind:value
      {placeholder}
      {onchange}
      {readonly}
      disabled={readonly}
    ></textarea>
    {@render children?.()}
  {/if}
</label>

<style lang="scss">
  .input {
    display: flex;
    align-items: center;
    position: relative;
    border: 1px solid var(--neutral-6);
    transition: all 200ms ease-in-out;
    border-radius: 2px;
    padding: 0 0.5rem;
    padding-top: 0.5rem;
    &.readonly {
      opacity: 0.5;
      pointer-events: none;
      cursor: default;
    }
    button {
      background-color: transparent;
      color: var(--neutral-10);
      border: none;
      outline: none;
      font-size: 1rem;
      cursor: pointer;
    }
    &:hover {
      border: 1px solid var(--neutral-8);
      div {
        color: var(--neutral-12);
      }
    }
    &:focus-within {
      border: 1px solid var(--main-10);
      :global(.native::placeholder) {
        color: var(--neutral-10);
      }
      div {
        top: 0%;
        transform: translateY(-50%) scale(0.8);
        color: var(--main-10);
      }
    }

    &:has(:global(.native:placeholder-shown)) {
      div {
        top: 1.75rem;
        transform: translateY(-50%);
      }
      &:focus-within {
        div {
          top: 0%;
          transform: translateY(-50%) scale(0.8);
        }
      }
    }

    div {
      position: absolute;
      left: 0.5rem;
      transition:
        color 100ms ease-in-out,
        transform 100ms ease-in-out,
        top 100ms ease-in-out;
      background-color: var(--parent-bg, var(--neutral-1));
      padding: 0 0.2rem;
      top: 0%;
      transform: translateY(-50%) scale(0.8);
      transform-origin: center left;
      color: var(--neutral-10);
      pointer-events: none;
      user-select: none;
    }

    :global(.native) {
      outline: none;
      background-color: transparent;
      border: none;
      height: var(--height-2);
      width: 100%;
      color: var(--neutral-12);
      &::selection {
        background: var(--main-6);
      }
      &::placeholder {
        color: transparent;
        transition: all 200ms ease-in-out;
        pointer-events: none;
        user-select: none;
      }
    }

    :global(.autocompleter) {
      height: 7rem;
      margin-top: 0.5rem;
    }
    :global(.autocompleter .native) {
      height: unset;
    }

    textarea {
      height: 7rem !important;
      resize: none;
    }

    &.error {
      border-color: var(--red-11);
      div {
        color: var(--red-11);
      }
    }
  }
</style>
