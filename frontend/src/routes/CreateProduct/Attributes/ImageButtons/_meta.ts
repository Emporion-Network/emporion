import { translatedString } from '../../../../stores/translate.svelte';

const defaultValue = {
  display_type: 'image_buttons' as const,
  trait_type: '',
  value: '',
  label: translatedString(),
};
export type Attribute = typeof defaultValue;

const bindClone = (a: Attribute) => {
  return {
    get display_type() { return a.display_type; },
    get trait_type() { return a.trait_type; },
    get value() { return a.value; },
    set value(v: string) { a.value = v; },
    label: translatedString(),
  };
};

export const meta = {
  type: defaultValue.display_type,
  defaultValue,
  label: 'major_dry_samuel_view',
  bindClone,
};
