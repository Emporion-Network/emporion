import { translatedString } from '../../../../stores/translate.svelte';

export const defaultValue = {
  display_type: 'select' as const,
  trait_type: '',
  value: translatedString(),
};
export type Attribute = typeof defaultValue;

const bindClone = (a: Attribute) => {
  return {
    display_type: a.display_type,
    trait_type: a.trait_type,
    value: translatedString(),
  };
};

export const meta = {
  type: defaultValue.display_type,
  defaultValue,
  label: 'close_legal_crossbill_seek',
  bindClone,
};
