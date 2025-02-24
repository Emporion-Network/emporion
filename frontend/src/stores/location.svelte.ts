import { SvelteURL } from 'svelte/reactivity';

const location = new SvelteURL(document.location.href);

$effect.root(() => {
  const update = () => {
    location.href = document.location.href;
    requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
});

export const getLocation = () => {
  return {
    get url() {
      return location;
    },
    goTo(href: string) {
      history.pushState('', '', href);
      document.documentElement.scrollTop = 0
    },
    back() {
      history.back();
    },
    replace(href: string) {
      history.replaceState('', '', href);
    },
  };
};
