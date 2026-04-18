import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import en from './locales/en.json';
import hi from './locales/hi.json';

const LANGUAGE_KEY = 'app_language';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

// Load saved language preference
if (Platform.OS !== 'web' || typeof window !== 'undefined') {
  AsyncStorage.getItem(LANGUAGE_KEY).then((lang) => {
    if (lang && resources[lang as keyof typeof resources]) {
      i18n.changeLanguage(lang);
    }
  }).catch(() => {});
}

export const changeLanguage = async (lang: string) => {
  await i18n.changeLanguage(lang);
  if (Platform.OS !== 'web' || typeof window !== 'undefined') {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang).catch(() => {});
  }
};

export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

export default i18n;
