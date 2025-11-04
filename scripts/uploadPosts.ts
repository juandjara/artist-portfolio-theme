import fs from "fs/promises"
import {
  createDirectus,
  createItem,
  importFile,
  rest,
  staticToken,
} from "@directus/sdk"
import type { DBSchema } from "../src/lib/directus.types"
import { basename, join } from "path"
import { createReadStream } from "fs"
import FormData from "form-data"
import axios from "axios"
import dedent from "dedent"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

const UPLOADS_FOLDER = "e6308546-92fb-4b10-b586-eefaf1d97f7f"
const ASSET_PREFIX = "https://directus.djara.dev/assets"

const directus = createDirectus<DBSchema>(process.env.DIRECTUS_URL!)
  .with(rest())
  .with(staticToken(process.env.DIRECTUS_TOKEN!))

type ArtStationItem = {
  title: string
  description: string
  created_at: string // ISO date
  updated_at: string // ISO date
  published_at: string // ISO date
  slug: string
  tag_list: null | string[]
  cover: {
    small_square_url: string
  }
}

type ArtStationData = {
  data: ArtStationItem[]
  total_count: number
}

type NewData = {
  id?: string
  upload?: "complete" | "partial"
  slug: string
  title: string
  description: string
  category: string
  thumbnail: string
  files: {
    id?: string
    type: string
    url: string
  }[]
}

async function uploadFile(path: string) {
  const fd = new FormData()
  const _path = join(process.cwd(), path)
  const file = createReadStream(_path)
  fd.append("folder", UPLOADS_FOLDER)
  fd.append("file", file)
  const res = await axios.post("https://directus.djara.dev/files", fd)
  console.log(res.data)
  return res.data.data
}

async function importThumbnail(post: NewData) {
  const imageUrl = post.thumbnail
  if (imageUrl.startsWith("http")) {
    const req = await directus.request(
      importFile(imageUrl, {
        title: post.title,
        description: post.description,
        tags: [post.category],
        folder: UPLOADS_FOLDER,
      }),
    )
    return req.id
  } else {
    const req = await uploadFile(post.thumbnail)
    return req.id
  }
}

function getIframeHtml(url: string) {
  const params = new URL(url).searchParams
  const start = params.get("t")
  const id = params.get("v")
  const src = `https://www.youtube-nocookie.com/embed/${id}?start=${start}`

  return dedent`
  <iframe
    width="560"
    height="315"
    src="${src}"
    title="YouTube video player"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen
  ></iframe>`
}

async function getFileHtml(file: NewData["files"][number]) {
  if (file.type === "embed/youtube") {
    return getIframeHtml(file.url)
  } else {
    let id = file.id
    if (!id) {
      const res = await uploadFile(file.url)
      id = res.id
    }

    const src = `${ASSET_PREFIX}/${id}`
    if (file.type.startsWith("image/")) {
      return `<figure><img data-type="${file.type}" class="directus-file directus-file-image" src="${src}" alt="${basename(file.url)}" /></figure>`
    } else if (file.type.startsWith("video/")) {
      return `<video data-type="${file.type}" class="directus-file directus-file-video" src="${src}" controls />`
    } else {
      return `<div data-type="${file.type}" class="directus-file directus-file-other"><a href="${src}">${src}</a></div>`
    }
  }
}

async function main() {
  try {
    const file = await fs.readFile("./new_data.json")
    const text = file.toString()
    const data = JSON.parse(text) as NewData[]

    // TODO: Delete files and items from posts and posts_translations
    for (const post of data) {
      if (post.upload === "complete") {
        console.log(`Post ${post.title} already uploaded`)
        continue
      }

      let postId

      if (post.upload === "partial") {
        console.log("Continuing upload for post ", post.title)
        if (!post.id) {
          throw new Error("cannot continue post upload without a post id")
        }

        postId = post.id
      } else {
        console.log(`Uploading post "${post.title}"`)
        console.log(`Importing thumbnail "${post.thumbnail}"`)
        const thumbnailId = await importThumbnail(post)
        console.log(`✅ Thumbnail imported with id ${thumbnailId}`)
        const newPost = await directus.request(
          createItem("posts", {
            id: post.id,
            status: "published",
            protected: false,
            sort: data.indexOf(post),
            image: thumbnailId,
          }),
        )
        postId = newPost.id
        console.log("✅ Post created")
      }

      let content = ""
      for (const file of post.files) {
        const fragment = await getFileHtml(file)
        content += `${fragment}<br /><br />`
      }

      console.log(`Creating translation for post "${post.title}"`)
      await directus.request(
        createItem("posts_translations", {
          posts_id: postId,
          languages_code: "en-US",
          title: post.title,
          description: post.description,
          content,
        }),
      )
      console.log("✅ Translation created")
    }

    // for (const post of json.data.slice(1)) {
    //   const fileUrl = post.cover.small_square_url
    //   console.log(`Importing file ${fileUrl}...`)
    //   const file = await directus.request(importFile(fileUrl, {
    //     title: post.title,
    //     description: post.description,
    //     tags: post.tag_list ?? [],
    //     folder: 'ece7bab9-5433-4a63-b9f7-bde8b517d6d9' // Folder 1. Public
    //   }))
    //   console.log('✅ File imported')

    //   console.log(`Creating post "${post.title}"`)
    //   const newPost = await directus.request(createItem('posts', {
    //     slug: post.slug,
    //     tags: JSON.stringify(post.tag_list ?? []),
    //     status: 'published',
    //     sort: json.data.indexOf(post),
    //     protected: false,
    //     published_at: post.published_at,
    //     image: file.id,
    //   }))
    //   console.log('✅ Post created')

    //   console.log(`Creating translation for post "${post.title}"`)
    //   await directus.request(createItem('posts_translations', {
    //     posts_id: newPost.id,
    //     languages_code: 'en-US',
    //     title: post.title,
    //     content: post.description,
    //   }))
    //   console.log('✅ Translation created')
    // }
  } catch (err) {
    if ("errors" in (err as any)) {
      console.error("⭕️ Error: ", (err as any).errors)
    } else {
      console.error("⭕️ Error: ", err)
    }
  }
}
main()
