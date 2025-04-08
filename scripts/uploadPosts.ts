import fs from 'fs/promises'
import { createDirectus, createItem, importFile, readItem, readItems, rest, staticToken, updateItem } from '@directus/sdk'
import type { DBSchema } from '../src/lib/directus.types';

const directus = createDirectus<DBSchema>('https://directus.djara.dev')
  .with(staticToken('f7GIzNPiTJLFspkCRTfue1HiG0POny3u'))
  .with(rest())

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
  data: ArtStationItem[],
  total_count: number
}

async function main() {
  try {
    const file = await fs.readFile('./nes_projects.json')
    const text = file.toString()
    const json = JSON.parse(text) as ArtStationData
    
    // TODO: Delete files and items from posts and posts_translations

    const posts = await directus.request(readItems('posts'))
    for (const post of posts) {
      const filePost = json.data.find((d) => d.slug === post.slug)
      if (filePost) {
        console.log(`upadting post "${filePost.slug}"`)
        await directus.request(updateItem('posts', post.id, {
          tags: filePost.tag_list
        }))
        console.log(`post "${filePost.slug}" updated`)
      } else {
        console.log(`post "${post.slug}" not found in file`)
      }
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
    console.error('⭕️ Error: ', (err as any).errors)    
  }
}
main()
