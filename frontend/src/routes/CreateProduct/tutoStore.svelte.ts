import type { SvelteComponent } from 'svelte';

const registry: Record<string, SvelteComponent | HTMLElement> = $state({});

export const getTutoRegistry = () => {
  return registry;
};
