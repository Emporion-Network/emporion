<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { storage } from "@/stores/localStorage.svelte";
  import { getTranslator } from "@/stores/translate.svelte";
  import Form from "./Form.svelte";
  import Tuto from "./Tuto.svelte";
  import Preview from "./Preview.svelte";
  import { getLocation } from "@/stores/location.svelte";
  import { user } from "@/stores/user.svelte";
  import type { ProductMetadata } from "@common";
  let t = getTranslator();

  let didTutorial = storage<boolean>("product-tutorial");
  let selectedLang = $state(t.lang);
  let selectedProduct = $state(0);
  let products: ProductMetadata[] = $state([]);
  let l = getLocation();

  const ondone = () => {
    didTutorial.set(true);
  };

  const loadCollection = () => {
    if (l.url.searchParams.has("name") && user.address) {
      user.getCollections(user.address!).then((result) => {
        if (result.error) return;
        const collection = result.result.find(
          (c) => c.collection === l.url.searchParams.get("name"),
        );
        if (!collection) return;
        products = collection.products;
      });
    }
  };
  $effect(() => {
    l.url.searchParams;
    user.address;
    untrack(() => {
      loadCollection();
    });
  });

  onMount(() => {
    setTimeout(() => {
      selectedLang = t.lang;
    }, 10);
  });
</script>

<div class="create-product">
  <Form bind:products bind:selectedLang bind:selectedProduct></Form>
  <Preview {products} {selectedLang} bind:selectedProduct></Preview>
  {#if !didTutorial.get()}
    <Tuto {ondone} bind:products></Tuto>
  {/if}
</div>

<style lang="scss">
  @use "../../mixins" as *;
  .create-product {
    display: flex;
    position: relative;
    min-height: 100vh;
    background-color: var(--neutral-2);
    border-bottom: 1px solid var(--neutral-6);
    isolation: isolate;
  }
</style>
