import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import de from './de.json'

export const SUPPORTED_LANGUAGES = ['en', 'de']

function setDocumentLanguage(language) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = SUPPORTED_LANGUAGES.includes(language) ? language : 'en'
}

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'en'
  const savedLanguage = window.localStorage?.getItem('starlost:language')
  return SUPPORTED_LANGUAGES.includes(savedLanguage) ? savedLanguage : 'en'
}

const initialLanguage = getInitialLanguage()

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de }
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES,
  nonExplicitSupportedLngs: false,
  interpolation: {
    escapeValue: false,
  },
})

setDocumentLanguage(initialLanguage)

i18n.on('languageChanged', (language) => {
  setDocumentLanguage(language)
  if (typeof window === 'undefined') return
  const nextLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : 'en'
  window.localStorage?.setItem('starlost:language', nextLanguage)
})

export default i18n
