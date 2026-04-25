import { type Locale, defaultLocale, isValidLocale } from "./config";

export type Dictionary = typeof import("./locales/en.json");

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  bn: () => import("./locales/bn.json").then((m) => m.default),
  en: () => import("./locales/en.json").then((m) => m.default),
  ar: () => import("./locales/ar.json").then((m) => m.default),
};

/**
 * Loads the dictionary for the given locale.
 * Falls back to the default locale if the provided locale is invalid.
 */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const targetLocale = isValidLocale(locale) ? locale : defaultLocale;
  const loader = dictionaries[targetLocale] ?? dictionaries[defaultLocale];
  return loader();
}
