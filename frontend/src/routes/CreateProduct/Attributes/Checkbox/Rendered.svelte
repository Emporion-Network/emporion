<script lang="ts">
  import { untrack } from "svelte";
  import type { SupportedLanguage } from "@/stores/translate.svelte";
  import type { Attribute } from "./_meta";
  import { intersect } from "@/lib/utils";
  import Checkbox from "@/lib/Checkbox.svelte";
  let {
    attributes,
    selectedLang,
    value,
    pref = $bindable(),
    prefs,
    onupdate,
  }: {
    attributes: Attribute[];
    selectedLang: SupportedLanguage;
    value: number;
    pref: number[];
    prefs: number[][];
    onupdate: (v: number[]) => void;
  } = $props();

  let options = $derived.by(() => {
    const map: Record<string, number[]> = {
      true: [],
      false: [],
    };
    attributes.forEach((a, i) => {
      map[a.value.toString()].push(i);
    });
    return map;
  });

  $effect(() => {
    let _ = value;
    untrack(() => {
      pref = options[get().toString()];
    });
  });

  const get = () => {
    return options["true"].includes(value);
  };
  const set = (i: boolean) => {
    console.log(i);
    pref = options[i.toString()];
    onupdate(options[i.toString()]);
  };

  const isAvailable = () => {
    let fut = prefs.filter((e) => e !== pref);
    return intersect(options[(!get()).toString()], ...fut).length > 0;
  };
</script>

<label
  class="checkbox"
  class:active={get()}
  class:readonly={options["true"].length == 0 || options["false"].length == 0}
  class:unavailable={!isAvailable()}
>
  <Checkbox
    bind:value={get, set}
    readonly={options["true"].length == 0 || options["false"].length == 0}
  ></Checkbox>
  {attributes[0].label[selectedLang]}
</label>

<style lang="scss">
  .checkbox {
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 1px solid var(--neutral-6);
    padding: 1rem;
    border-radius: 3px;
    transition: all 200ms ease-in-out;
    cursor: pointer;
    &.readonly {
      opacity: 0.3;
      cursor: default;
    }
    &.active {
      background-color: var(--main-2);
      border-color: var(--main-10);
      font-weight: 900;
    }

    &.unavailable {
      opacity: 0.8;
    }
  }
</style>
