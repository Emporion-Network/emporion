<script>
  import { getTranslator } from "@/stores/translate.svelte";
  import { user } from "@/stores/user.svelte";
  let t = getTranslator();
</script>

<div class="orders">
  <h2>{t.t("mushy_due_jackdaw_pride")}</h2>
  {#if [].length > 0}
    <div class="table"></div>
  {:else}
    <p>{t.t("this_left_vulture_blink")}</p>
  {/if}
</div>

<style lang="scss">
  p {
    padding: 2rem 1rem;
    background-color: var(--neutral-2);
    color: var(--neutral-11);
    text-align: center;
    margin-bottom: 1rem;
  }
</style>
