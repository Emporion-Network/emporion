<script lang="ts">
  import { minimalSetup, EditorView } from 'codemirror';
  // @ts-ignore
  import { markdown } from '@codemirror/lang-markdown';

  import { onMount } from 'svelte';
  onMount(() => {
    let myTheme = EditorView.theme(
      {
        '&': {
          color: 'var(--neutral-12)',
          backgroundColor: 'var(--neutral-2)',
        },
        '&.cm-focused .cm-cursor': {
          borderLeftColor: 'var(--neutral-12)',
        },
        '.cm-selectionBackground': {
          backgroundColor: 'var(--main-6) !important',
        },
        '.cm-scroller': {
          fontFamily: 'var(--font-1)',
        },
        '.ͼ7': {
          textDecoration: 'none',
          color: 'var(--main-11)',
          fontWeight: '700',
        },
        '.ͼ8': {
          color: 'var(--main-11)',
        },
        '.ͼ9': {
          fontWeight: '900',
          color: 'var(--main-11)',
        },
        '.ͼ5.ͼ6': {
          color: 'var(--neutral-12)',
        },
        '.ͼ6.ͼc': {
          color: 'var(--main-11)',
        },
      },
      { dark: true },
    );
    let view = new EditorView({
      doc: [
        '# A simple title',
        'A paragraph with some bold text **Bold**',
        'A paragraph with some italic text *italic*',
        '[title](https://www.example.com)',
        '---',
      ].join('\n'),
      extensions: [minimalSetup, markdown(), myTheme],
      parent: el,
    });
  });
  let el: HTMLElement;
</script>

<div class="editor">
  <div bind:this={el}></div>
</div>

<style lang="scss">
</style>
