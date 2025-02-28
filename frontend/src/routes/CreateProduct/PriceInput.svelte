<script lang="ts">
  import Input from "@/lib/Input.svelte";
  import { getTranslator } from "@/stores/translate.svelte";
  import { Decimal } from "@cosmjs/math";
  const t = getTranslator();

  let {
    value = $bindable(),
  }: {
    value: string;
  } = $props();
  let zero = false;
  let dot = false;
  const get = () => {
    const v = Decimal.fromAtomics(value, 6);
    if (v.equals(Decimal.zero(6))) {
      return zero ? "0" : dot ? "0." : "";
    }
    if (dot) {
      return v.toString() + ".";
    }
    return v.toString();
  };
  const set = (v: string) => {
    if (v.endsWith(".")) {
      v = v + "0";
      zero = false;
      dot = true;
    } else if (v == "0") {
      zero = true;
      dot = false;
    } else {
      zero = false;
      dot = false;
    }
    value = Decimal.fromUserInput(v, 6).atomics;
  };
</script>

<Input
  label={t.t("super_calm_buzzard_roar")}
  placeholder={t.t("super_calm_buzzard_roar")}
  type="number"
  bind:value={get, set}
  max="100000000000"
>
  <span>USDC</span>
</Input>
