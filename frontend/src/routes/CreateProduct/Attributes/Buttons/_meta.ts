import { translatedString } from '@/stores/translate.svelte';

const defaultValue = {
  display_type: 'buttons' as const,
  trait_type: '',
  value: translatedString(),
};
export type Attribute = typeof defaultValue;

const bindClone = (a: Attribute) => {
  return {
    get display_type() { return a.display_type; },
    get trait_type() { return a.trait_type; },
    value: translatedString(),
  };
};

export const meta = {
  type: defaultValue.display_type,
  defaultValue,
  label: 'sleek_vivid_koala_dare',
  bindClone,
};
