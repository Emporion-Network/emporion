<script lang="ts">
  import { getTranslator } from "@/stores/translate.svelte";
  import MultiSelect from "@/lib/MultiSelect.svelte";
  import { CATEGORIES } from "@common";
  let value = $state("");
  let categorie = $state(CATEGORIES[0]);
  let t = getTranslator();
</script>

<div class="search-bar">
  <MultiSelect options={CATEGORIES} value={categorie} multiple={false}>
    {#snippet valueRenderer(v)}
      {t.t(v as any)}
    {/snippet}
    {#snippet optionRenderer(v)}
      {t.t(v as any)}
    {/snippet}
  </MultiSelect>
  <input placeholder={t.t("blue_alert_scallop_hope")} type="text" bind:value />
  <button aria-label={t.t("careful_awful_myna_scold")}>
    <i class="ri-search-line"></i>
  </button>
</div>

<style lang="scss">
  @use "../../mixins" as *;
  .search-bar {
    display: flex;
    border: 1px solid var(--neutral-6);
    --bg-color: var(--neutral-3);
    margin: 1rem;
    border-radius: 3px;
    &:focus-within {
      border: 1px solid var(--main-10);
      input {
        border-color: var(--main-10);
      }
    }
    input {
      flex: 1;
      outline: none;
      border: none;
      color: var(--neutral-12);
      background-color: var(--neutral-2);
      border-left: 1px solid var(--neutral-6);
      padding-left: 1rem;
    }
    button {
      font-size: 1.2rem;
      width: 50px;
      outline: none;
      border: none;
      border-radius: 0 2px 2px 0;
      background-color: var(--neutral-3);
      color: var(--neutral-11);
    }
    :global(.multi-select .selected) {
      border: none;
      padding-left: 1rem;
      background-color: var(--neutral-3);
      &:hover {
        border: none;
      }
    }
    @include media('> phone'){
      :global(.multi-select .options) {
        width: max-content;
      }
    }
    :global(.multi-select) {
      border-radius: 2px 0px 0px 2px !important;
      margin-top: 0;
    }
  }
</style>
