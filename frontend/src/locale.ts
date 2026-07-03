import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/ru';

export type Locale = 'en' | 'ru';

function detect(): Locale {
  // ?lang=ru / ?lang=en overrides the browser locale (handy for testing)
  const forced = new URLSearchParams(window.location.search).get('lang');
  if (forced === 'ru' || forced === 'en') return forced;
  return /^ru\b/i.test(navigator.language ?? '') ? 'ru' : 'en';
}

/** Site locale: Russian browsers get Russian, everyone else English. */
export const LOCALE: Locale = detect();

dayjs.locale(LOCALE);

/** Pick the localized variant, falling back to English when RU is empty. */
export function pickText(en: string, ru: string | null | undefined): string {
  return LOCALE === 'ru' && ru ? ru : en;
}

/** "ddd, MMM D" for English, natural "пн, 6 июля" for Russian. */
export function fmtDay(d: Dayjs, lang: Locale): string {
  return lang === 'ru'
    ? d.locale('ru').format('dd, D MMMM')
    : d.locale('en').format('ddd, MMM D');
}
