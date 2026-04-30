import type { TranslationsCommon } from "./directus.types"

const translationMap = {
  es: "es-ES",
  en: "en-US",
  ja: "ja-JP",
}

export function mapTranslation(langKey: string) {
  return translationMap[langKey as keyof typeof translationMap] || langKey
}

// anything on T can be "undefined" if not requested by the client "fields"
// anything on T can be "null" if is nullable in the DB
export function getTranslations<T extends TranslationsCommon>(
  items: (Partial<T> | string)[] | null,
  langKey: string,
) {
  const lang = mapTranslation(langKey)
  const arr = items ?? []
  const okItems = arr.filter((a) => a && typeof a !== "string") as Partial<T>[]
  return okItems.find((item) => item.languages_code === lang)
}
