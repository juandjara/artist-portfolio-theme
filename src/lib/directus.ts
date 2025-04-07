import {
  authentication,
  createDirectus,
  rest,
  staticToken,
  type DirectusFile,
} from "@directus/sdk";
import type {
  DBSchema,
  Languages,
  NavigationItems,
  Pages,
  Posts,
  TranslationsCommon,
} from "./directus.types";

const directus = createDirectus<DBSchema>(import.meta.env.DIRECTUS_URL)
  .with(rest())
  .with(staticToken(import.meta.env.DIRECTUS_TOKEN));

export default directus;

// anything on T can be "undefined" if not requested by the client "fields"
// anything on T can be "null" if is nullable in the DB
export function getTranslations<T extends TranslationsCommon>(
  items: (Partial<T> | string)[] | null,
  lang: string,
) {
  let arr = items ?? [];
  let okItems = arr.filter((a) => a && typeof a !== "string") as Partial<T>[];
  return okItems.find((item) => item.languages_code === lang);
}

export function formatImageURL(id?: string | null, params?: string) {
  return id && `${import.meta.env.DIRECTUS_URL}/assets/${id}?${params ?? ""}`;
}

export function getLanguageFilterBlock(lang: string) {
  return {
    deep: {
      translations: {
        _filter: {
          _and: [
            {
              languages_code: { _eq: lang },
            },
          ],
        },
      },
    },
  };
}

export function parseMenuItems(items: NavigationItems[], lang: string) {
  return items
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((m) => {
      let title = m.title ?? "";
      let url = m.url ?? "";

      if (m.type === "page") {
        const page = m.page as Pages;
        const translations = getTranslations(page.translations, lang);
        if (translations?.title) {
          title = translations?.title;
        }
        url = page.permalink ?? "";
      }
      if (m.type === "post") {
        const post = m.post as Posts;
        const translations = getTranslations(post.translations, lang);
        if (translations?.title) {
          title = translations?.title;
        }
        url = `/post/${post.slug}`;
      }

      return { url, title };
    });
}
