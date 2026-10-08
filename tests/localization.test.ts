import { describe, expect, it } from "vitest";
import { en } from "../src/locales/en";
import { guide } from "../src/locales/guide.en";
import { languages } from "../src/locales/languages";
import { catalogs, getGuide, translate } from "../src/locales/translations";

describe("dashboard language coverage", () => {
  it("provides 20 unique language options with complete interface and help text", () => {
    expect(languages).toHaveLength(20);
    expect(new Set(languages.map(({ code }) => code)).size).toBe(20);
    for (const { code } of languages) {
      if (code === "en") continue;
      const { messages, guide: text } = catalogs[code];
      expect(Object.keys(messages).sort()).toEqual(Object.keys(en).sort());
      expect(Object.values(messages).every((value) => value.trim())).toBe(true);
      expect(text.steps).toHaveLength(guide.steps.length);
      expect(text.lifecycle).toHaveLength(guide.lifecycle.length);
      expect(text.sidePaths).toHaveLength(guide.sidePaths.length);
      expect(text.actions).toHaveLength(guide.actions.length);
      expect(text.faq).toHaveLength(guide.faq.length);
      expect(Object.keys(text.faqCategories).sort()).toEqual(
        Object.keys(guide.faqCategories).sort(),
      );
      expect(Object.keys(text.checkout).sort()).toEqual(
        Object.keys(guide.checkout).sort(),
      );
      const allHelp = JSON.stringify(text);
      expect(allHelp).not.toContain('""');
      expect(text.steps[0]?.body).not.toBe(guide.steps[0].body);
      expect(text.faq[0]?.a).not.toBe(guide.faq[0].a);
    }
  });

  it("keeps launch status, icons and FAQ categories consistent in every language", () => {
    for (const { code } of languages) {
      const translated = getGuide(code);
      expect(translated.lifecycle.map(({ status }) => status)).toEqual(
        guide.lifecycle.map(({ status }) => status),
      );
      expect(translated.steps.map(({ icon }) => icon)).toEqual(
        guide.steps.map(({ icon }) => icon),
      );
      expect(translated.faq.map(({ category }) => category)).toEqual(
        guide.faq.map(({ category }) => category),
      );
      expect(translate("app", code)).toBe("Drop Engine");
    }
  });
});
