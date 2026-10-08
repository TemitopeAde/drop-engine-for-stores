import type { MessageKey } from "./en";
import type { FaqCategory } from "./guide.en";

export type Messages = Record<MessageKey, string>;
export interface GuideTranslation {
  steps: { title: string; body: string }[];
  lifecycle: string[];
  sidePaths: string[];
  checkout: { open: string; locked: string; depends: string };
  actions: { title: string; body: string }[];
  faqCategories: Record<FaqCategory, string>;
  faq: { q: string; a: string }[];
}
export interface Translation {
  messages: Messages;
  guide: GuideTranslation;
}
