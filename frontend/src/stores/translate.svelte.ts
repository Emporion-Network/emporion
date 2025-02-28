import { langs } from '../../messages.d.js';
import { I18n } from 'i18n-js';
import en from '../../../messages/en.json';
import { storage } from './localStorage.js';

const tst = $derived.by(() => {
  const _ = lang;
  return (text: string) => {
    return window.ini.t(text);
  };
});

let lang: SupportedLanguage = $state('en');

const store = storage<SupportedLanguage>('lang');

$effect.root(() => {
  let defLang: SupportedLanguage = 'en';
  if (store.exists()) {
    defLang = store.get() || 'en';
  } else {
    const prefered = navigator.languages;
    const p = prefered.filter((e) => {
      return langs.includes(e as SupportedLanguage);
    }) as SupportedLanguage[];
    if (p.length > 0) {
      defLang = p[0];
      store.set(defLang);
    }
  }

  const ini = new I18n({
    en: en,
  }, {
    locale: 'en',
  });
  window.ini = ini;
  import(`../../../messages/${defLang}.json`).then((e) => {
    window.ini.locale = defLang;
    window.ini.store({
      [defLang]: e,
    });
    lang = defLang;
  });
});

export const getTranslator = () => {
  return {
    get lang() {
      return lang;
    },
    set lang(v) {
      store.set(v);
      import(`../../../messages/${v}.json`).then((e) => {
        window.ini.locale = v;
        window.ini.store({
          [v]: e,
        });
        lang = v;
      });
    },
    get t() {
      return tst;
    },
  };
};

export const TranslatedLanguages = {
  'en': 'caring_last_jellyfish_tap',
  'es': 'antsy_pretty_jannes_scoop',
  'fr': 'round_many_guppy_comfort',
  'ko': 'round_noble_swan_slurp',
  'pl': 'fit_cozy_platypus_hope',
  'pt-br': 'just_sweet_swallow_fry',
  'ro': 'born_house_bulldog_sprout',
  'tr': 'raw_zany_gorilla_quiz',
  'zh-cn': 'game_moving_salmon_nail',
  'zh-tw': 'sleek_full_felix_build',
  'zh-hk': 'spare_wise_goat_dial',
  'fa': 'close_busy_boar_dig',
  'ja': 'caring_inclusive_tortoise_link',
  'de': 'next_patient_pony_hint',
  'hi': 'weak_hour_dragonfly_dial',
  'ru': 'zesty_lower_bumblebee_pinch',
  'gu': 'bright_real_lemur_emerge',
} as const satisfies Record<typeof langs[number], string>;

export const supportedLangs = langs as unknown as SupportedLanguage[];

export const Languages = {
  'en': 'English',
  'es': 'Español',
  'fr': 'Français',
  'ko': '한국어',
  'pl': 'Polski',
  'pt-br': 'Português',
  'ro': 'Românã',
  'tr': 'Türkçe',
  'zh-cn': '简体中文',
  'zh-tw': '繁體中文',
  'zh-hk': '香港繁體中文',
  'fa': 'فارسی',
  'ja': '日本語',
  'de': 'Deutsch',
  'hi': 'हिन्दी',
  'ru': 'Русский',
  'gu': 'ગુજરાતી',
} satisfies Record<typeof langs[number], string>;

export type SupportedLanguage = typeof langs[number];

export type T<K> = {
  -readonly [k in keyof typeof TranslatedLanguages]: K;
};

export const translatedString = () => {
  return langs.reduce((acc, lang) => {
    acc[lang] = '';
    return acc;
  }, {} as T<string>);
};

export const translatedArray = <U>() => {
  return langs.reduce((acc, lang) => {
    acc[lang] = [];
    return acc;
  }, {} as T<U[]>);
};
