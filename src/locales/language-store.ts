import { isLanguageCode, type LanguageCode } from "./languages";

export const LANGUAGE_STORAGE_KEY = "drop-engine.dashboard.language";
let current: LanguageCode | undefined;
const listeners = new Set<() => void>();

function readLanguage(): LanguageCode {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguageCode(saved) ? saved : "en";
  } catch {
    return "en";
  }
}

export function getLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  return (current ??= readLanguage());
}

export function setLanguage(language: LanguageCode) {
  if (!isLanguageCode(language)) return;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Keep language switching usable when the iframe cannot access storage.
  }
  current = language;
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key !== LANGUAGE_STORAGE_KEY && event.key !== null) return;
  current = readLanguage();
  listeners.forEach((listener) => listener());
}

export function subscribeLanguage(listener: () => void) {
  if (!listeners.size) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", onStorage);
  };
}
