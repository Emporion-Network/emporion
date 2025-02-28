<script lang="ts">
  import ts from "typescript";
  import ContextMenu from "./ContextMenu.svelte";
    import { getTranslator } from "@/stores/translate.svelte";
  const t = getTranslator();

  let {
    value = $bindable("FFFFFF"),
  }: {
    value: string;
  } = $props();

  const get = () => {
    return value;
  };

  const set = (v: string) => {
    v = v.replaceAll("#", "");
    if (!v.match(/^[a-f0-9]*$/i)) {
      return;
    }
    if (v.length > 8) {
      return;
    }
    value = v.toUpperCase();
  };

  let element: HTMLElement = $state()!;

  let invalid = $derived.by(() => {
    return [0, 1, 2, 5, 7].includes(value.length);
  });

  const c = [
    "0162AE",
    "008FFD",
    "00C0FD",
    "0AB9AE",
    "01B96D",
    "DDBC0E",
    "FFF1AE",
    "FF6B54",

    "EB0039",
    "AD0F0E",
    "BE108D",
    "FA6DE3",
    "7F43FF",
    "4643FE",
    "9295A2",
    "7D6F63",
  ];

  export const actions = {
    setValue(v: string) {
      value = v;
    },
    open() {
      element.querySelector("button")!.focus();
    },
  };

  export { element };
</script>

<div class="color-picker" bind:this={element}>
  <ContextMenu>
    {#snippet opener(ref)}
      {/*@ts-ignore*/ null}
      <button
        class="selected"
        bind:this={ref.get, ref.set}
        onfocus={ref.onfocus}
      >
        <div class="color" class:invalid style="--c:#{value}"></div>
        <span>#{value}</span>
        <i class="ri-arrow-down-s-line"></i>
      </button>
    {/snippet}
    {#snippet options()}
      <div class="drop-down">
        <div class="colors">
          {#each c as c}
            <button
              style="--c:#{c}"
              class:active={c == value}
              aria-label="{t.t("honest_warm_cod_fond")}"
              onclick={() => (value = c)}
            ></button>
          {/each}
        </div>
        <div class="custom-color">
          <span>{t.t("awful_left_iguana_nail")}</span>
          <div class="color-input">
            <div class="color" class:invalid style="--c:#{value}"></div>
            <input type="text" bind:value={get, set} placeholder="FA6DE3" />
          </div>
        </div>
      </div>
    {/snippet}
  </ContextMenu>
</div>

<style lang="scss">
  .color-picker {
    position: relative;
    &:focus-within {
      .drop-down {
        display: flex;
      }
      .selected,
      .selected:hover {
        border: 1px solid var(--main-10);
      }
    }
    .selected {
      display: flex;
      align-items: center;
      width: max-content;
      border: 1px solid var(--neutral-6);
      min-width: 100px;
      border-radius: 3px;
      padding: 0.75rem 0.5rem;
      gap: 0.5rem;
      background-color: transparent;
      color: var(--neutral-12);
      text-align: start;
      &:hover {
        border: 1px solid var(--neutral-8);
        i {
          color: var(--neutral-12);
        }
      }
      span {
        flex: 1;
        font-family: var(--font-mono);
        width: 9ch;
      }
      i {
        color: var(--neutral-6);
      }
    }

    .color {
      aspect-ratio: 1;
      height: 1.5rem;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
      &::before {
        width: 100%;
        height: 100%;
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        background: repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)
          50% / 0.5rem 0.5rem;
      }
      &::after {
        position: absolute;
        content: "";
        background-color: var(--c);
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
      }
      &.invalid {
        &::after {
          background: linear-gradient(
            to top left,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0) calc(50% - 0.8px),
            rgba(255, 0, 0, 1) 50%,
            rgba(0, 0, 0, 0) calc(50% + 0.8px),
            rgba(0, 0, 0, 0) 100%
          );
        }
        &::before {
          opacity: 0.1;
        }
      }
    }
    .drop-down {
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      max-width: 350px;
      gap: 1rem;
      position: absolute;
      top: 100%;
      left: 0;
      background-color: var(--neutral-2);
      border-radius: 3px;
      margin-top: 0.5rem;
      display: none;
      border: 1px solid var(--neutral-6);
      z-index: 2;
    }

    .colors {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 1rem;
      button {
        background-color: var(--c);
        aspect-ratio: 1;
        outline: none;
        border-radius: 3px;
        border: none;
        width: 1.5rem;
        &:hover {
          cursor: pointer;
          filter: brightness(1.5) saturate(1.5);
        }
        &.active {
          outline: 1px solid var(--main-10);
          outline-offset: 5px;
        }
      }
    }
    .custom-color {
      display: flex;
      align-items: flex-end;
      gap: 1rem;

      .color-input {
        display: flex;
        gap: 2px;
        justify-content: center;
        align-items: center;
        background-color: var(--neutral-3);
        padding: 5px;
        border-radius: 3px;
        input {
          min-width: 0;
          max-width: 9ch;
          font-family: var(--font-mono);
          height: 1.4rem;
          border: none;
          outline: none;
          background-color: transparent;
          color: var(--neutral-12);
        }
        .color {
          height: 1rem;
        }
      }

      span {
        flex: 1;
        color: var(--neutral-11);
      }
    }
  }
</style>
