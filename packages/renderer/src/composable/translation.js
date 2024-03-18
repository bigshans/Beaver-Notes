export async function useTranslate({ lang, translations }) {
  if (!lang) {
    lang = lang || localStorage.getItem('selectedLanguage') || 'en';
  }
  try {
    const translationModule = await import(
      `../pages/settings/locales/${lang}.json`
    );
    if (translations) {
      const loadedTranslations = translationModule.default;
      if (loadedTranslations) {
        Object.assign(translations, loadedTranslations);
      }
    }
    return translationModule.default;
  } catch (error) {
    console.error('Error loading translations:', error);
    return null;
  }
}
