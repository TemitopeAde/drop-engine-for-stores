import { en, type MessageKey } from "./en";
import { guide } from "./guide.en";
import { getLanguage } from "./language-store";
import type { LanguageCode } from "./languages";
import type { Translation } from "./types";
import es from "./messages/es.json";
import fr from "./messages/fr.json";
import de from "./messages/de.json";
import pt from "./messages/pt.json";
import it from "./messages/it.json";
import nl from "./messages/nl.json";
import pl from "./messages/pl.json";
import ru from "./messages/ru.json";
import uk from "./messages/uk.json";
import tr from "./messages/tr.json";
import ar from "./messages/ar.json";
import hi from "./messages/hi.json";
import bn from "./messages/bn.json";
import id from "./messages/id.json";
import vi from "./messages/vi.json";
import th from "./messages/th.json";
import ja from "./messages/ja.json";
import ko from "./messages/ko.json";
import zh from "./messages/zh.json";

export const catalogs: Record<Exclude<LanguageCode, "en">, Translation> = {
  es,
  fr,
  de,
  pt,
  it,
  nl,
  pl,
  ru,
  uk,
  tr,
  ar,
  hi,
  bn,
  id,
  vi,
  th,
  ja,
  ko,
  zh,
};

export function translate(key: MessageKey, locale: LanguageCode): string {
  return locale === "en"
    ? en[key]
    : (catalogs[locale].messages[key] ?? en[key]);
}

export const t = (key: MessageKey) => translate(key, getLanguage());

export function getGuide(locale: LanguageCode) {
  const text = locale === "en" ? undefined : catalogs[locale].guide;
  return {
    ...guide,
    steps: guide.steps.map((step, index) => ({
      ...step,
      ...text?.steps[index],
    })),
    lifecycle: guide.lifecycle.map((stage, index) => ({
      ...stage,
      body: text?.lifecycle[index] ?? stage.body,
    })),
    sidePaths: guide.sidePaths.map((stage, index) => ({
      ...stage,
      body: text?.sidePaths[index] ?? stage.body,
    })),
    checkout: text?.checkout ?? guide.checkout,
    actions: guide.actions.map((action, index) => ({
      ...action,
      ...text?.actions[index],
    })),
    faqCategories: text?.faqCategories ?? guide.faqCategories,
    faq: guide.faq.map((item, index) => ({ ...item, ...text?.faq[index] })),
  };
}
