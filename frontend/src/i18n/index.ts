import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LOCALE } from '../locale';
import en from './en.json';
import ru from './ru.json';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: LOCALE,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
