export let activeElement: { el: HTMLElement | null } = $state({ el: null });

$effect.root(() => {
  const update = () => {
    activeElement.el = document.activeElement as HTMLElement;
    requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
});
