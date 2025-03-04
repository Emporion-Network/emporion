import type { FileMetaReq } from './files';
import { assert, assertIsDefinedUnsafe, into, isBoolean, isHexColor, isString, isUrl } from './utils';
import type { Result } from "."

export const LANGS = ['en', 'es', 'de', 'fa', 'fr', 'gu', 'hi', 'ja', 'ko', 'pl', 'pt-br', 'ro', 'ru', 'tr', 'zh-cn', 'zh-hk', 'zh-tw'] as const;
export const CATEGORIES = [
  'category_all',
  'accessories',
  'action_figures',
  'art_supplies',
  'arts_crafts',
  'automotive',
  'automotive_accessories',
  'baby_products',
  'baby_clothing',
  'baby_toys',
  'bakery_items',
  'bakeware',
  'bath_shower_products',
  'beauty',
  'bedding',
  'belts',
  'beverages',
  'bicycle_accessories',
  'board_games',
  'books',
  'fashion_boys',
  'cameras_photography',
  'camping_gear',
  'car_care_products',
  'card_games',
  'cleaning_supplies',
  'clothing',
  'computer_accessories',
  'computers',
  'cookware',
  'craft_supplies',
  'curtains_blinds',
  'cutlery',
  'dairy_products',
  'deals',
  'desk_accessories',
  'digital_music',
  'dolls_accessories',
  'drawing_supplies',
  'electronics',
  'filing_supplies',
  'fitness_apparel',
  'fitness_equipment',
  'footwear',
  'fragrances',
  'frozen_food',
  'furniture',
  'garden_tools',
  'gift_items',
  'fashion_girls',
  'glassware',
  'grocery',
  'haircare',
  'handbags',
  'hats_caps',
  'headphones',
  'hpc',
  'health_supplements',
  'kitchen',
  'home_appliances',
  'home_decor',
  'industrial',
  'jewelry',
  'knitting_crochet_supplies',
  'lighting',
  'lingerie',
  'luggage',
  'mattresses',
  'meat_poultry',
  'fashion_mens',
  'microphones',
  'mobile_accessories',
  'motorcycle_gear',
  'movies_tv',
  'music_instruments',
  'music',
  'musical_accessories',
  'office_furniture',
  'office_supplies',
  'packaging_supplies',
  'painting_supplies',
  'paper_products',
  'party_supplies',
  'personal_care_products',
  'pets',
  'printers_scanners',
  'puzzle_games',
  'rugs_carpets',
  'school_supplies',
  'seafood',
  'security_systems',
  'sewing_supplies',
  'skincare',
  'sleepwear',
  'smart_home_devices',
  'snacks',
  'socks',
  'software',
  'speakers',
  'sporting',
  'sports_equipment',
  'stationery',
  'strollers_car_seats',
  'sunglasses',
  'swimwear',
  'tableware',
  'tools',
  'toys_and_games',
  'travel_accessories',
  'tv_home_theater_systems',
  'underwear',
  'video_game_consoles',
  'videogames',
  'wallets',
  'watches',
  'wedding_supplies',
  'fashion_womens',
  'writing_instruments',
  'smartphone_accessories',
  'collectibles',
  'luxury_goods',
];
export type SupportedLanguage = typeof LANGS[number];
export type T<K> = Record<typeof LANGS[number], K>;
export type TranslatedString = T<string>;
export const DISPLAY_TYPES = ['buttons', 'checkbox', 'select', 'color', 'title', 'paragraph', 'image_buttons'] as const;


export const findClosestLanguage = (prefered: string[]): SupportedLanguage => {
  const baseA = new Set(LANGS.map(l => l.split('-')[0].toLowerCase()));
  const defaultL: SupportedLanguage = 'en';
  for (const b of prefered) {
    if (LANGS.includes(b as SupportedLanguage)) return b as SupportedLanguage;
    const baseB = b.split('-')[0].toLowerCase();
    if (baseA.has(baseB)) return LANGS.find(l => l.split('-')[0].toLowerCase() === baseB) || defaultL;
  }
  return defaultL;
};

interface ButtonAttribute {
  display_type: 'buttons'
  trait_type: string
  value: TranslatedString
}

interface CheckboxAttribute {
  display_type: 'checkbox'
  trait_type: string
  description: TranslatedString
  value: boolean
};

interface SelectAttribute {
  display_type: 'select'
  trait_type: string
  value: TranslatedString
}

interface ColorAttribute {
  display_type: 'color'
  trait_type: string
  value: string
  label: TranslatedString
}

interface TitleAttribute {
  display_type: 'title'
  trait_type: string
  value: TranslatedString
};

interface ParagraphAttribute {
  display_type: 'paragraph'
  trait_type: string
  value: TranslatedString
}

interface ImageButtonsAttribute {
  display_type: 'image_buttons'
  trait_type: string
  value: string
  label: TranslatedString
}

export type Attribute =
  | ButtonAttribute
  | CheckboxAttribute
  | SelectAttribute
  | ColorAttribute
  | TitleAttribute
  | ParagraphAttribute
  | ImageButtonsAttribute;

export type Gallery = Record<SupportedLanguage, string[]>;
export interface ProductMetadata {
  id: string
  metadata_url: string
  listed: boolean
  seller: string
  title: T<string>
  description: T<string>
  collection: string
  gallery: Gallery
  attributes: Attribute[]
  price: string
  category: string[]
}

export type CreateProductMetadata = Omit<ProductMetadata, 'seller' | 'id' | 'metadata_url'>;

export interface UploadMetadata {
  req: CreateProductMetadata[],
  res: Result<string[]>,
  method: 'post',
  path: '/upload-metadata',
}

export interface UpdateMetadata {
  req: Omit<ProductMetadata, 'seller'>[],
  res: Result<string[]>,
  method: 'post',
  path: '/update-metadata',
}


export interface GetCollections {
  req: string,
  res: Result<{ collection: string, products: ProductMetadata[] }[]>,
  method: 'get',
  path: `/collections/${string}`,
}

export interface GetCollection {
  req: string,
  res: Result<ProductMetadata[]>,
  method: 'get',
  path: `/collection/${string}`,
}

export interface ScrollProducts {
  req: {
    start_after?: string,
    limit?: string
    category?: string
    q?: string
    seller?: string
    sort?: string
    min_price?: string
    max_price?: string
  },
  res: Result<ProductMetadata[]>,
  method: 'get',
  path: `/search?${string}`,
}

/**
 * Validate metadata
 * @throws If metadata is invalid
 * @param metadata - Metadata to validate
 */

export function assertIsValidMetadata(metadata: unknown): asserts metadata is ProductMetadata {
  assertIsDefinedUnsafe<ProductMetadata>(metadata, 'Metadata is undefined');
  assert(Array.isArray(metadata.attributes), 'Metadata attributes is not valid');
  metadata.attributes.forEach((e) => {
    assertAttribute(e);
  });
  assertIsValidCategory(metadata.category);
  assert(isString(metadata.collection), 'Collection name not valid');
  assertIsValidTranslatedString(metadata.description);
  assertIsGallery(metadata.gallery);
  assert(/^[1-9][0-9]*$/.test(metadata.price), 'Price is not valid');
  assertIsValidTranslatedString(metadata.title);
};

export function ceheckIsVaildMetadata(metadata: unknown): metadata is ProductMetadata {
  try {
    assertIsValidMetadata(metadata);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * @throws if value is not a valid translated string
 * @param value - Translated text
 */
export function assertIsValidTranslatedString(value: unknown): asserts value is TranslatedString {
  assertIsDefinedUnsafe<Record<SupportedLanguage, string>>(value, 'Translated string is undefined');
  assert(typeof value === 'object', 'Translated string is not an object');
  const langs = Object.keys(value) as SupportedLanguage[];
  assert(langs.length > 0, 'Should have at least one value');
  langs.forEach((lang) => {
    assert(LANGS.includes(lang), `Translated string value for key ${lang.slice(0, 10)} is not a string`);
    assert(isString(value[lang]), `Translated string value for key ${lang.slice(0, 10)} is not a string`);
  });
}

export function assertIsValidCategory(v: unknown): asserts v is typeof CATEGORIES[number] {
  into<string[]>(v);
  assert(Array.isArray(v), 'Category is not valid');
  assert(v.length > 0, 'Category can not be empty');
  v.forEach((c) => {
    // ignore all
    assert(CATEGORIES.slice(1).includes(c), `Invalid category ${c.slice(0, 10)}`);
  });
}

function assertButtonAttribute(v: unknown): asserts v is ButtonAttribute {
  assertIsDefinedUnsafe<ButtonAttribute>(v, 'invalid attribute');
  assert(v.display_type === 'buttons', 'Invalid display type');
  assert(isString(v.trait_type), 'Invalid trait type');
  assertIsValidTranslatedString(v.value);
}

function assertSelectAttribute(v: unknown): asserts v is SelectAttribute {
  assertIsDefinedUnsafe<SelectAttribute>(v, 'invalid attribute');
  assert(v.display_type === 'select', 'Invalid display type');
  assert(isString(v.trait_type), 'Invalid trait type');
  assertIsValidTranslatedString(v.value);
}

function assertCheckboxAttribute(v: unknown): asserts v is CheckboxAttribute {
  assertIsDefinedUnsafe<CheckboxAttribute>(v, 'invalid attribute');
  assert(isBoolean(v.value), 'Invalid trait type');
  assert(v.display_type === 'checkbox', 'Invalid display type');
  assert(isString(v.trait_type), 'Invalid trait type');
  assertIsValidTranslatedString(v.description);
}

function assertColorAttribute(v: unknown): asserts v is ColorAttribute {
  assertIsDefinedUnsafe<ColorAttribute>(v, 'invalid attribute');
  assert(v.display_type === 'color', 'Invalid display type');
  assert(isString(v.trait_type), 'Invalid trait type');
  assert(isHexColor(v.value), 'Invalid value');
  assertIsValidTranslatedString(v.label);
}

function assertTitleAttribute(v: unknown): asserts v is TitleAttribute {
  assertIsDefinedUnsafe<TitleAttribute>(v, 'invalid attribute');
  assert(v.display_type === 'title', 'Invalid display type');
  assert(isString(v.trait_type), 'Invalid trait type');
  assertIsValidTranslatedString(v.value);
}

function assertParagraphAttribute(v: unknown): asserts v is ParagraphAttribute {
  assertIsDefinedUnsafe<ParagraphAttribute>(v, 'invalid attribute');
  assert(v.display_type === 'paragraph', 'Invalid display type');
  assert(isString(v.trait_type), 'Invalid trait type');
  assertIsValidTranslatedString(v.value);
}

function assertImageButtonsAttribute(v: unknown): asserts v is ImageButtonsAttribute {
  assertIsDefinedUnsafe<ImageButtonsAttribute>(v, 'invalid attribute');
  assert(v.display_type === 'image_buttons', 'Invalid display type');
  assert(isString(v.trait_type), 'Invalid trait type');
  assertIsValidTranslatedString(v.label);
  assert(isUrl(v.value), 'Invalid url');
}

const attrTypeToAssert: Record<Attribute['display_type'], (v: unknown) => void> = {
  buttons: assertButtonAttribute,
  checkbox: assertCheckboxAttribute,
  color: assertColorAttribute,
  image_buttons: assertImageButtonsAttribute,
  paragraph: assertParagraphAttribute,
  select: assertSelectAttribute,
  title: assertTitleAttribute,
};

function assertAttribute(v: unknown): asserts v is Attribute {
  assertIsDefinedUnsafe<Attribute>(v, 'Invalid attribute');
  assertIsDefinedUnsafe(attrTypeToAssert[v.display_type], 'Invalid attribute');
  attrTypeToAssert[v.display_type](v);
}

function assertIsGallery(v: unknown): asserts v is Gallery {
  assertIsDefinedUnsafe<Gallery>(v, 'Invalid gallery');
  assert(typeof v == 'object', 'Invalid gallery');
  const keys = Object.keys(v) as SupportedLanguage[];
  keys.forEach((k) => {
    into<SupportedLanguage>(k);
    assert(LANGS.includes(k), 'Invalid language');
    v[k].forEach((img) => {
      assert(isUrl(img), 'Invalid url');
    });
  });
}

export function stringify(v: ProductMetadata) {
  return `
#${v.title['en']}
${v.description['en']}
categories: ${v.category.join(', ')}
`;
}


export function assertIsFileMeta(v: unknown): asserts v is FileMetaReq {
  into<FileMetaReq>(v);
  assertIsDefinedUnsafe<FileMetaReq>(v, 'Invalid file meta');
  assert(isString(v.name), 'Invalid name');
  assert(Array.isArray(v.tags), 'Invalid tags');
  v.tags.forEach((t) => {
    assert(isString(t), 'Invalid tag');
  });
}