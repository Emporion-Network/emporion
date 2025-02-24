import type { Action } from "svelte/action";

export function trapFocus(node: HTMLElement) {
  const previous = document.activeElement as HTMLElement;

  function focusable() {
    return Array.from(
      node.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ) as HTMLElement[];
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;

    const current = document.activeElement;

    const elements = focusable();
    const first = elements.at(0) as HTMLElement;
    const last = elements.at(-1) as HTMLElement;

    if (event.shiftKey && current === first) {
      last?.focus();
      event.preventDefault();
    }

    if (!event.shiftKey && current === last) {
      first.focus();
      event.preventDefault();
    }
  }

  $effect(() => {
    focusable()[0]?.focus();
    node.addEventListener('keydown', handleKeydown);

    return () => {
      node.removeEventListener('keydown', handleKeydown);
      previous?.focus();
    };
  });
}


export const intersect: Action<
  HTMLElement,
  string,
  {
    onenter: () => void;
    onexit: () => void;
  }
> = (el: HTMLElement, rootMargin: string) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          el.dispatchEvent(new CustomEvent('enter'));
        } else {
          el.dispatchEvent(new CustomEvent('exit'));
        }
      });
    },
    {
      root: null,
      rootMargin,
    },
  );
  console.log(el);
  observer.observe(el);
  $effect(() => {
    return () => {
      observer.disconnect();
    };
  })
}