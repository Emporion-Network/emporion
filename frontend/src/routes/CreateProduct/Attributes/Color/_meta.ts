import { translatedString } from '../../../../stores/translate.svelte';

const defaultValue = {
  display_type: 'color' as const,
  trait_type: '',
  value: 'FFFFFF',
  label: translatedString(),
};
export type Attribute = typeof defaultValue;

const bindClone = (a: Attribute) => {
  return {
    get display_type() { return a.display_type; },
    get trait_type() { return a.trait_type; },
    value: "FFFFFF",
    label: translatedString(),
  };
};

export const meta = {
  type: defaultValue.display_type,
  defaultValue,
  label: 'light_real_cow_twirl',
  bindClone,
};
