<script lang="ts">
  import type { Snippet } from "svelte";
  import { getLocation } from "../stores/location.svelte";

  let {
    children,
    path,
  }: {
    path: string;
    children?: Snippet;
  } = $props();
  let location = getLocation();
</script>

{#if location.url.pathname == path}
  {@render children?.()}
{/if}
