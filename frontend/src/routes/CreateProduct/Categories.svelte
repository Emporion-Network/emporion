<script lang="ts">
  import type { SvelteSet } from "svelte/reactivity";
  import MultiSelect from "@/lib/MultiSelect.svelte";
  import { getTranslator } from "@/stores/translate.svelte";
  import Checkbox from "@/lib/Checkbox.svelte";
  import { CATEGORIES } from "@common";
  let t = getTranslator();
  let {
    value = $bindable(),
  }: {
    value: SvelteSet<(typeof CATEGORIES)[number]>;
  } = $props();
</script>

<MultiSelect
  options={CATEGORIES.slice(1)}
  bind:value
  multiple={true}
  label={t.t("gray_strong_monkey_bask")}
>
  {#snippet valueRenderer(o)}
    {Array.from(o.values())
      .map((e) => t.t(e as never))
      .join(", ")}
  {/snippet}
  {#snippet optionRenderer(o)}
    <Checkbox
      bind:value={() => value.has(o),
      () => (value.has(o) ? value.delete(o) : value.add(o))}
    ></Checkbox>
    {t.t(o as never)}
  {/snippet}
</MultiSelect>
