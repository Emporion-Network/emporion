<script lang="ts">
  import { metas, type Attribute } from "./_metas";
  import { type SupportedLanguage } from "@/stores/translate.svelte";

  import Buttons from "./Buttons/Rendered.svelte";
  import Checkbox from "./Checkbox/Rendered.svelte";
  import Select from "./Select/Rendered.svelte";
  import Color from "./Color/Rendered.svelte";
  import Title from "./Title/Rendered.svelte";
  import Paragraph from "./Paragraph/Rendered.svelte";
  import ImageButtons from "./ImageButtons/Rendered.svelte";
  import { intersect } from "@/lib/utils";
  import type { Component } from "svelte";
  import type { ProductMetadata } from "@common";

  const map = {
    [metas.buttons.type]: Buttons,
    [metas.checkbox.type]: Checkbox,
    [metas.select.type]: Select,
    [metas.color.type]: Color,
    [metas.title.type]: Title,
    [metas.paragraph.type]: Paragraph,
    [metas.image_buttons.type]: ImageButtons,
  };

  let {
    products,
    selectedLang,
    selectedProductIdx = $bindable(),
  }: {
    selectedProductIdx: number;
    products: ProductMetadata[];
    selectedLang: SupportedLanguage;
  } = $props();

  let attributes = $derived.by(() => {
    let ret: Attribute[][] = [];
    products.forEach((p) => {
      p.attributes.forEach((a, j) => {
        ret[j] = ret[j] ?? [];
        ret[j].push(a);
      });
    });
    return ret;
  });

  let pref: number[][] = $state([]);

  const update = (v: number[]) => {
    const tgt = intersect(...pref);
    if (tgt.length === 0) {
      let val = [...v].sort((b, a) => {
        return (
          pref.reduce((acc, p) => acc + p.indexOf(a), 0) -
          pref.reduce((acc, p) => acc + p.indexOf(b), 0)
        );
      })[0];
      selectedProductIdx = val;
    } else {
      // should always have only 1
      // otherways its the same product and picking any of them is fine
      selectedProductIdx = tgt[0];
    }
  };
</script>

<div class="attributes">
  {#each attributes as attr, i}
    {@const Component = map[attr[0].display_type] as Component}
    <Component
      bind:pref={pref[i]}
      attributes={attributes[i]}
      {selectedLang}
      value={selectedProductIdx}
      prefs={pref}
      onupdate={update}
    />
  {/each}
</div>
