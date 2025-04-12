import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import directus, { formatImageURL, getPosts } from "../lib/directus";
import { readItems, verifyHash } from "@directus/sdk";

export const passwordCheckAction = defineAction({
  input: z.object({
    language: z.string(),
    categoryLink: z.string(),
    password: z.string(),
  }),
  handler: async ({ categoryLink, password, language }) => {
    const categories = await directus.request(readItems('categories', {
      filter: {
        permalink: {
          _eq: categoryLink
        }
      },
    }))
    const category = categories[0]
    if (!category) {
      throw new Error(`Category "${category}" not found`)
    }
    if (!category.password) {
      throw new Error(`Category "${category}" does not have a password`)
    }
    const valid = await directus.request(verifyHash(password, category.password))
    if (!valid) {
      throw new Error('Invalid password')
    }

    const { posts } = await getPosts(categoryLink, language, true)
    return posts
  }
})