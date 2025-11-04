import {
  createDirectus,
  readItems,
  readTranslations,
  rest,
  staticToken,
} from "@directus/sdk"
import type {
  CategoriesPosts,
  DBSchema,
  NavigationItems,
  Pages,
  Posts,
  TranslationsCommon,
} from "./directus.types"
import { getRelativeLocaleUrl } from "astro:i18n"

const directus = createDirectus<DBSchema>(import.meta.env.DIRECTUS_URL)
  .with(rest())
  .with(staticToken(import.meta.env.DIRECTUS_TOKEN))

export default directus

const translationMap = {
  es: "es-ES",
  en: "en-US",
  ja: "ja-JP",
}

function mapTranslation(langKey: string) {
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

// MIME type to extension mapping
function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/svg+xml": ".svg",
    "video/mp4": ".mp4",
    "video/mpeg": ".mpeg",
    "video/quicktime": ".mov",
    "video/x-msvideo": ".avi",
    "video/webm": ".webm",
    "video/x-matroska": ".mkv",
  }
  return mimeMap[mimeType] || ""
}

export function formatImageURL(
  id?: string | null,
  params?: string,
  type?: string | null,
) {
  if (!id) return null

  if (import.meta.env.PROD) {
    // In production, use local assets with correct extension
    // Images -> .webp, Videos -> .mp4
    let ext = ""
    if (type) {
      if (type.startsWith("image/")) {
        ext = ".webp"
      } else if (type.startsWith("video/")) {
        ext = ".mp4"
      } else {
        ext = getExtensionFromMimeType(type)
      }
    }
    return `/assets/${id}${ext}`
  }
  return `${import.meta.env.DIRECTUS_URL}/assets/${id}?${params ?? ""}`
}

export function transformMediaInHTML(
  html?: string,
  maxWidth: number = 800,
): string {
  if (!html) return ""

  const directusUrl = import.meta.env.DIRECTUS_URL
  const assetPattern = new RegExp(
    `${directusUrl}/assets/([a-f0-9-]+)(\\.\\w{3,4})?`,
    "g",
  )

  return html.replace(assetPattern, (match, assetId) => {
    // In production, use the actual file extensions from our download script
    if (import.meta.env.PROD) {
      // Look backwards in the HTML to find the tag type
      const indexInHtml = html.indexOf(match)
      const before = html.substring(Math.max(0, indexInHtml - 100), indexInHtml)

      // Check if it's in a video tag -> .mp4 (ffmpeg output)
      if (before.includes("<video") || before.includes("<source")) {
        return `/assets/${assetId}.mp4`
      }
      // Assume image -> .webp (Directus transformation output)
      return `/assets/${assetId}.webp`
    }
    return match
  })
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
  }
}

export function parseMenuItems(items: NavigationItems[], lang: string) {
  return items
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((m) => {
      let title = m.title ?? ""
      let url = m.url ?? ""

      if (m.type === "page" && m.page) {
        const page = m.page as Pages
        const translations = getTranslations(page.translations, lang)
        if (translations?.title) {
          title = translations?.title
        }
        url = getRelativeLocaleUrl(lang, page.permalink ?? "", {
          normalizeLocale: false,
        })
      }
      if (m.type === "post" && m.post) {
        const post = m.post as Posts
        const translations = getTranslations(post.translations, lang)
        if (translations?.title) {
          title = translations?.title
        }
        url = getRelativeLocaleUrl(lang, `/post/${post.id}`, {
          normalizeLocale: false,
        })
      }

      return { url, title }
    })
    .filter((m) => !!m.url && !!m.title)
}

export async function getPosts(
  categoryLink: string | null,
  language: string,
  includeProtected?: boolean,
) {
  let numProtected = 0
  let rows = [] as Posts[]

  if (categoryLink) {
    const categories = await directus.request(
      readItems("categories", {
        filter: {
          permalink: {
            _eq: categoryLink,
          },
        },
        fields: [
          "password",
          {
            posts: [
              "*",
              {
                posts_id: [
                  "*",
                  {
                    translations: ["*"],
                    image: ["*"],
                  },
                ],
              },
            ],
          },
        ],
      }),
    )
    const category = categories[0]
    const allPosts = (category?.posts ?? []).map((p) => p.posts_id as Posts)
    const unprotectedPosts = includeProtected
      ? allPosts
      : allPosts.filter((p) => p.protected !== true)
    numProtected = category.password
      ? allPosts.length - unprotectedPosts.length
      : 0
    rows = unprotectedPosts
  } else {
    const allPosts = (await directus.request(
      readItems("posts", {
        fields: ["*", { translations: ["*"], image: ["*"] }],
      }),
    )) as Posts[]
    const unprotectedPosts = allPosts.filter((p) => p.protected !== true)
    numProtected = 0 //allPosts.length - unprotectedPosts.length
    rows = unprotectedPosts
  }

  return {
    numProtected,
    posts: rows.map((p) => {
      const translations = getTranslations(p.translations, language)
      const title = translations?.title ?? ""
      const content = translations?.content ?? ""
      const imageFile = typeof p.image === "object" && p.image ? p.image : null
      return {
        id: p.id,
        title,
        content,
        image: formatImageURL(imageFile?.id, undefined, imageFile?.type) ?? "",
      }
    }),
  }
}

export async function getAllPosts() {
  const allPosts = (await directus.request(
    readItems("posts", {
      fields: ["*", { translations: ["*"], image: ["*"] }],
    }),
  )) as Posts[]
  return allPosts
}

export async function getPost(id: string) {
  const post = await directus.request(
    readItems("posts", {
      filter: { id: { _eq: id } },
      fields: ["*", { translations: ["*"], image: ["*"] }],
    }),
  )
  return post[0]
}

export async function getCategories(language: string) {
  const rows = await directus.request(
    readItems("categories", {
      fields: [
        "*",
        {
          translations: ["*"],
          posts: ["*"],
          blocks: [
            "*",
            {
              item: {
                block_embed: ["*"],
                block_gallery: ["*"],
                block_richtext: [
                  "*",
                  {
                    translations: ["*"],
                  },
                ],
              },
            },
          ],
        },
      ],
    }),
  )
  return rows.map((category) => {
    const translations = getTranslations(category.translations, language)
    const name = translations?.name
    const postIds = category.posts?.map(
      (p) => (p as CategoriesPosts).posts_id as string,
    )

    return {
      name,
      id: category.id,
      status: category.status,
      background: category.background,
      permalink: category.permalink,
      postIds,
      blocks: category.blocks,
      link: getRelativeLocaleUrl(language, `/archive/${category.permalink}`, {
        normalizeLocale: false,
      }),
    }
  })
}

export function getPageBlockQuery() {
  return [
    "*",
    {
      item: {
        block_posts: ["*"],
        block_categories: [
          "*",
          {
            categories: [
              "*",
              {
                categories_id: [
                  "*",
                  { translations: ["*"], background: ["*"] },
                ],
              },
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
  ] as const
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
          blocks: getPageBlockQuery(),
        },
      ],
      limit: 1,
    }),
  )
  return pages[0]
}

export async function translateString(key: string, langKey: string) {
  const data = await directus.request(
    readTranslations({ filter: { key: { _eq: key } } }),
  )
  const item = data.find((d) => d.language === mapTranslation(langKey))
  return item?.value ?? key
}
