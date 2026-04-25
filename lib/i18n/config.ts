export const locales = ["bn", "en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "bn";
export const rtlLocales: Locale[] = ["ar"];

export function isValidLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}

export function isRtl(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
