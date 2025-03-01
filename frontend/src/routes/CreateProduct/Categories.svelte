<script lang="ts">
  import type { SvelteSet } from "svelte/reactivity";
  import MultiSelect from "@/lib/MultiSelect.svelte";
  import { getTranslator } from "@/stores/translate.svelte";
  import Checkbox from "@/lib/Checkbox.svelte";
  import { CATEGORIES } from "@common";
  import Input from "@/lib/Input.svelte";
  let t = getTranslator();
  let {
    value = $bindable(),
  }: {
    value: SvelteSet<(typeof CATEGORIES)[number]>;
  } = $props();
  let search = $state("");
  const f = (v: string) => {
    return t.t(v).toLocaleLowerCase().includes(search.toLocaleLowerCase());
  };
</script>

<MultiSelect
  options={CATEGORIES.slice(1)}
  bind:value
  multiple={true}
  label={t.t("gray_strong_monkey_bask")}
  filter={f}
>
  {#snippet filterRenderer()}
    <Input type="search" label="" placeholder="" bind:value={search} />
  {/snippet}
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
