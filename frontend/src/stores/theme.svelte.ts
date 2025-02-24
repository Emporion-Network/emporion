let theme: 'dark' | 'light' = $state('light');

function getColorScheme() {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

$effect.root(() => {
  theme = getColorScheme();
  $effect(() => {
    document.documentElement.className = theme;
  });
});

export const getTheme = () => {
  return {
    get theme() {
      return theme;
    },
    set theme(v: typeof theme) {
      theme = v;
    },
    toggle() {
      theme = theme == 'light' ? 'dark' : 'light';
    },
  };
};
