import { useMemo, useSyncExternalStore } from "react";
import { getLanguage, setLanguage, subscribeLanguage } from "./language-store";
import { languageDirection, type LanguageCode } from "./languages";
import { translate } from "./translations";
import type { MessageKey } from "./en";

export function useTranslation() {
  const locale = useSyncExternalStore<LanguageCode>(
    subscribeLanguage,
    getLanguage,
    () => "en",
  );
  const t = useMemo(
    () => (key: MessageKey) => translate(key, locale),
    [locale],
  );
  return { locale, direction: languageDirection(locale), setLanguage, t };
}
