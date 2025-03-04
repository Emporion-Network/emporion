<script lang="ts">
  import ScrolledNumber from "@/lib/ScrolledNumber.svelte";
  import { getTranslator } from "@/stores/translate.svelte";
  let t = getTranslator();
</script>

<div class="numbers">
  <div class="number">
    <h2>{t.t("blue_odd_owl_kiss")}</h2>
    <h3><ScrolledNumber n={"12"} />M</h3>
  </div>
  <div class="number">
    <h2>{t.t("steep_warm_cheetah_push")}</h2>
    <h3><ScrolledNumber n={"4"} />M</h3>
  </div>
  <div class="number">
    <h2>{t.t("flat_watery_bison_pet")}</h2>
    <h3><ScrolledNumber n={"6.8"} />M</h3>
  </div>
  <div class="number">
    <h2>{t.t("free_royal_rook_favor")}</h2>
    <h3><ScrolledNumber n={"1.2"} />M</h3>
  </div>
</div>

<style lang="scss">
  @use "../../mixins" as *;
  .numbers {
    display: flex;
    margin: 5%;
    width: 90%;
    justify-content: center;
    align-items: center;
    .number {
      flex: 1;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      h2 {
        color: var(--white-a9);
        font-size: 1.3rem;
      }
      h3 {
        color: var(--white-a12);
        font-size: 80px;
        text-align: center;
        width: 100%;
      }
    }
    @include media("<= phone") {
      flex-direction: column;
    }
  }
</style>
