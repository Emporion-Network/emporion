import { meta as buttonMeta, type Attribute as ButtonAttribute } from './Buttons/_meta';
import { meta as checkboxMeta, type Attribute as CheckboxAttribute } from './Checkbox/_meta';
import { meta as selectMeta, type Attribute as SelectAttribute } from './Select/_meta';
import { meta as colorMeta, type Attribute as ColorAttribute } from './Color/_meta';
import { meta as titleMeta, type Attribute as TitleAttribute } from './Title/_meta';
import { meta as paragraphMeta, type Attribute as ParagraphAttribute } from './Paragraph/_meta';
import { meta as imageButtonsMeta, type Attribute as ImageButtonsAttribute } from './ImageButtons/_meta';

import { getKeys } from '../../../lib/utils';

export const metas = {
  [buttonMeta.type]: buttonMeta,
  [checkboxMeta.type]: checkboxMeta,
  [selectMeta.type]: selectMeta,
  [colorMeta.type]: colorMeta,
  [titleMeta.type]: titleMeta,
  [paragraphMeta.type]: paragraphMeta,
  [imageButtonsMeta.type]: imageButtonsMeta,
};

export const attributeTypeValues = getKeys(metas);

export type Attribute =
  | ButtonAttribute
  | CheckboxAttribute
  | SelectAttribute
  | ColorAttribute
  | TitleAttribute
  | ParagraphAttribute
  | ImageButtonsAttribute;
