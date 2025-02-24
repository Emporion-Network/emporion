<script lang="ts">
  import { user } from "@/stores/user.svelte";
  import { untrack, type Snippet } from "svelte";
  import Input from "@/lib/Input.svelte";
  let {
    value = $bindable(),
    label,
    children,
  }: {
    children?: Snippet;
    value: string;
    label: string;
  } = $props();
  let completions = $state([""]);
  let timeout: ReturnType<typeof setTimeout> = null!;
  const autocomlete = () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      if (value.length == 0) return;
      user.autocomlete({ description: value }).then((v) => {
        if (v.error) return;
        completions.push(...v.result);
        if (completions.length > 20) {
          completions = completions.slice(10);
        }
      });
    }, 500);
  };
  $effect(() => {
    value;
    untrack(() => autocomlete());
    return () => clearTimeout(timeout);
  });
</script>

<Input type="autocomplete" placeholder={label} {label} bind:value {completions}>
  {@render children?.()}
</Input>
