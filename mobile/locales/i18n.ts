import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

import de from '../locales/de.json';
import en from '../locales/en.json';
import es from '../locales/es.json';

const i18n = new I18n({
  en,
  es,
  de,
});

i18n.locale = Localization.getLocales()[0].languageCode || 'en';
i18n.enableFallback = true;

export default i18n;
