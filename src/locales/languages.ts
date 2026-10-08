export const languages = [
  { code: "en", name: "English", direction: "ltr" },
  { code: "es", name: "Español", direction: "ltr" },
  { code: "fr", name: "Français", direction: "ltr" },
  { code: "de", name: "Deutsch", direction: "ltr" },
  { code: "pt", name: "Português", direction: "ltr" },
  { code: "it", name: "Italiano", direction: "ltr" },
  { code: "nl", name: "Nederlands", direction: "ltr" },
  { code: "pl", name: "Polski", direction: "ltr" },
  { code: "ru", name: "Русский", direction: "ltr" },
  { code: "uk", name: "Українська", direction: "ltr" },
  { code: "tr", name: "Türkçe", direction: "ltr" },
  { code: "ar", name: "العربية", direction: "rtl" },
  { code: "hi", name: "हिन्दी", direction: "ltr" },
  { code: "bn", name: "বাংলা", direction: "ltr" },
  { code: "id", name: "Bahasa Indonesia", direction: "ltr" },
  { code: "vi", name: "Tiếng Việt", direction: "ltr" },
  { code: "th", name: "ไทย", direction: "ltr" },
  { code: "ja", name: "日本語", direction: "ltr" },
  { code: "ko", name: "한국어", direction: "ltr" },
  { code: "zh", name: "中文", direction: "ltr" },
] as const;

export type LanguageCode = (typeof languages)[number]["code"];
export function isLanguageCode(value: unknown): value is LanguageCode {
  return languages.some(({ code }) => code === value);
}
export const languageDirection = (code: LanguageCode) =>
  languages.find((language) => language.code === code)?.direction ?? "ltr";
