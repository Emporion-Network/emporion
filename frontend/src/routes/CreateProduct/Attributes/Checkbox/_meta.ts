import { translatedString } from '../../../../stores/translate.svelte';

export const defaultValue = {
  display_type: 'checkbox' as const,
  trait_type: '',
  description: translatedString(),
  value: false,
};
export type Attribute = typeof defaultValue;

const bindClone = (a: Attribute) => {
  return {
    get display_type() { return a.display_type; },
    get trait_type() { return a.trait_type; },
    get description() { return a.description; },
    value: false,
  };
};

export const meta = {
  type: defaultValue.display_type,
  defaultValue,
  label: 'ago_top_stingray_pop',
  bindClone,
};
