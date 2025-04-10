import {
  authentication,
  createDirectus,
  readItem,
  readItems,
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
import { getRelativeLocaleUrl } from "astro:i18n";

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
        url = getRelativeLocaleUrl(lang, page.permalink ?? "", { normalizeLocale: false });
      }
      if (m.type === "post") {
        const post = m.post as Posts;
        const translations = getTranslations(post.translations, lang);
        if (translations?.title) {
          title = translations?.title;
        }
        url = getRelativeLocaleUrl(lang, `/post/${post.slug}`, { normalizeLocale: false });
      }

      return { url, title };
    });
}

export async function getPosts(categoryId: string | null, language: string) {
  let numProtected = 0
  let rows = [] as Posts[]

  if (categoryId) {
    const categories = await directus.request(readItems('categories', {
      filter: {
        permalink: {
          _eq: categoryId
        }
      },
      fields: [{
        posts: ['*', {
          posts_id: ['*', {
            translations: ['*']
          }]
        }]
      }]
    }))
    const category = categories[0]
    const allPosts = (category?.posts ?? []).map((p) => p.posts_id as Posts)
    const unprotectedPosts = allPosts.filter((p) => p.protected !== true)
    numProtected = allPosts.length - unprotectedPosts.length
    rows = unprotectedPosts
  } else {
    const allPosts = await directus.request(readItems('posts', {
      fields: ["*", { translations: ["*"] }]
    })) as Posts[]
    const unprotectedPosts = allPosts.filter((p) => p.protected !== true)
    numProtected = 0 //allPosts.length - unprotectedPosts.length
    rows = unprotectedPosts
  }

  return {
    numProtected,
    posts: rows.map((p) => {
      const translations = getTranslations(p.translations, language)
      const title = translations?.title ?? ''
      const content = translations?.content ?? ''
      return {
        id: p.id,
        title,
        content,
        image: p.image,
        slug: p.slug,
      }
    })
  }
}

export async function getCategories(language: string) {
  const rows = await directus.request(readItems('categories', {
    fields: ["*", { translations: ["*"] }]
  }))
  return rows.map((category) => {
    const translations = getTranslations(category.translations, language);
    const name = translations?.name;
  
    return {
      name,
      id: category.id,
      status: category.status,
      background: category.background,
      permalink: category.permalink,
      link: getRelativeLocaleUrl(language, `/archive/${category.permalink}`, { normalizeLocale: false })
    };
  });
}

export async function getPage(link: string) {
  const pages = await directus.request(
    readItems("pages", {
      filter: {
        permalink: {
          _eq: link,
        },
      },
      fields: [
        "*",
        { translations: ["*"] },
        {
          blocks: [
            "*",
            {
              item: {
                block_posts: ["*"],
                block_categories: [
                  "*",
                  {
                    categories: [
                      "*",
                      { categories_id: ["*", { translations: ["*"] }] },
                    ],
                  },
                ],
                block_form: ["*"],
                block_gallery: ["*"],
                block_heading: ["*", { translations: ["*"] }],
                block_hero: ["*", { translations: ["*"] }],
                block_richtext: ["*", { translations: ["*"] }],
              },
            },
          ],
        },
      ],
      limit: 1,
    }),
  );
  return pages[0]
}
