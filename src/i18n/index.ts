import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';

import en from './en.json';
import ar from './ar.json';
import fr from './fr.json';

export type SupportedLanguage = 'en' | 'ar' | 'fr';

export const SUPPORTED: SupportedLanguage[] = ['en', 'ar', 'fr'];

function detectLanguage(): SupportedLanguage {
  const locales = Localization.getLocales();
  const code = (locales[0]?.languageCode ?? 'en').toLowerCase();
  if (code.startsWith('ar')) return 'ar';
  if (code.startsWith('fr')) return 'fr';
  return 'en';
}

export function isRTL(lang: SupportedLanguage): boolean {
  return lang === 'ar';
}

export function setLanguage(lang: SupportedLanguage): void {
  const wantRTL = isRTL(lang);
  if (I18nManager.isRTL !== wantRTL) {
    I18nManager.allowRTL(wantRTL);
    I18nManager.forceRTL(wantRTL);
  }
  i18n.changeLanguage(lang);
}

export function initI18n(initial?: SupportedLanguage): void {
  const lng = initial ?? detectLanguage();
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources: {
        en: { translation: en },
        ar: { translation: ar },
        fr: { translation: fr },
      },
      lng,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
    });
  }
  setLanguage(lng);
}

export default i18n;
