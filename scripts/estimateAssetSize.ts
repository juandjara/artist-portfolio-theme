import {
  createDirectus,
  readItems,
  readFiles,
  rest,
  staticToken,
} from "@directus/sdk"
import type { DBSchema } from "../src/lib/directus.types"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

const directus = createDirectus<DBSchema>(process.env.DIRECTUS_URL!)
  .with(rest())
  .with(staticToken(process.env.DIRECTUS_TOKEN!))

async function estimateAssetSize() {
  console.log("🔍 Fetching all content from Directus...\n")

  const assetIds = new Set<string>()
  let totalAssets = 0

  // 1. Get all posts with images
  const posts = await directus.request(
    readItems("posts", {
      fields: ["*", { translations: ["*"], image: ["*"] }],
    }),
  )

  console.log(`📄 Found ${posts.length} posts`)

  posts.forEach((post: any) => {
    // Post image
    if (post.image?.id) {
      assetIds.add(post.image.id)
    }

    // Images/videos in HTML content
    post.translations?.forEach((trans: any) => {
      if (trans.content) {
        const matches = trans.content.matchAll(/\/assets\/([a-f0-9-]+)/g)
        for (const match of matches) {
          assetIds.add(match[1])
        }
      }
    })
  })

  // 2. Get all categories with backgrounds and blocks
  const categories = await directus.request(
    readItems("categories", {
      fields: [
        "*",
        {
          background: ["*"],
          blocks: [
            "*",
            {
              item: {
                block_richtext: ["*", { translations: ["*"] }],
                block_gallery: [
                  "*",
                  {
                    items: ["*", { directus_file: ["*"] }],
                  },
                ],
              },
            },
          ],
        },
      ],
    }),
  )

  console.log(`📁 Found ${categories.length} categories`)

  categories.forEach((category: any) => {
    // Category background
    if (category.background?.id) {
      assetIds.add(category.background.id)
    }

    // Blocks
    category.blocks?.forEach((block: any) => {
      if (block.item) {
        const item = block.item as any

        // Rich text blocks
        if (item.translations) {
          item.translations.forEach((trans: any) => {
            if (trans.content) {
              const matches = trans.content.matchAll(/\/assets\/([a-f0-9-]+)/g)
              for (const match of matches) {
                assetIds.add(match[1])
              }
            }
          })
        }

        // Gallery blocks
        if (item.items) {
          item.items.forEach((galleryItem: any) => {
            if (galleryItem.directus_file?.id) {
              assetIds.add(galleryItem.directus_file.id)
            }
          })
        }
      }
    })
  })

  // 3. Get all pages with blocks
  const pages = await directus.request(
    readItems("pages", {
      fields: [
        "*",
        {
          blocks: [
            "*",
            {
              item: {
                block_richtext: ["*", { translations: ["*"] }],
                block_gallery: [
                  "*",
                  {
                    items: ["*", { directus_file: ["*"] }],
                  },
                ],
                block_hero: ["*", { image: ["*"] }],
              },
            },
          ],
        },
      ],
    }),
  )

  console.log(`📃 Found ${pages.length} pages`)

  pages.forEach((page: any) => {
    page.blocks?.forEach((block: any) => {
      if (block.item) {
        const item = block.item as any

        // Rich text blocks
        if (item.translations) {
          item.translations.forEach((trans: any) => {
            if (trans.content) {
              const matches = trans.content.matchAll(/\/assets\/([a-f0-9-]+)/g)
              for (const match of matches) {
                assetIds.add(match[1])
              }
            }
          })
        }

        // Gallery blocks
        if (item.items) {
          item.items.forEach((galleryItem: any) => {
            if (galleryItem.directus_file?.id) {
              assetIds.add(galleryItem.directus_file.id)
            }
          })
        }

        // Hero blocks
        if (item.image?.id) {
          assetIds.add(item.image.id)
        }
      }
    })
  })

  console.log(`\n✅ Found ${assetIds.size} unique assets\n`)

  // Fetch file metadata for all assets
  console.log("📊 Calculating sizes...\n")

  const files = await directus.request(
    readFiles({
      filter: {
        id: {
          _in: Array.from(assetIds),
        },
      },
      fields: [
        "id",
        "filesize",
        "type",
        "width",
        "height",
        "filename_download",
      ],
    }),
  )

  let totalOriginalSize = 0
  let totalTransformedSize = 0
  let imageCount = 0
  let videoCount = 0
  let otherCount = 0

  files.forEach((file: any) => {
    const originalSize = file.filesize || 0
    totalOriginalSize += originalSize

    if (file.type?.startsWith("image/")) {
      imageCount++
      // Estimate transformed size (800px width with 80% quality)
      // Rough estimate: transformed images are typically 30-50% of original
      const transformedSize = Math.floor(originalSize * 0.4)
      totalTransformedSize += transformedSize
    } else if (file.type?.startsWith("video/")) {
      videoCount++
      // Videos aren't transformed by Directus
      totalTransformedSize += originalSize
    } else {
      otherCount++
      totalTransformedSize += originalSize
    }
  })

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  console.log("═══════════════════════════════════════════")
  console.log("           ASSET SIZE ESTIMATE")
  console.log("═══════════════════════════════════════════\n")

  console.log("📦 Asset Breakdown:")
  console.log(`   Images:  ${imageCount}`)
  console.log(`   Videos:  ${videoCount}`)
  console.log(`   Other:   ${otherCount}`)
  console.log(`   Total:   ${assetIds.size}\n`)

  console.log("💾 Size Estimates:")
  console.log(`   Original size:    ${formatBytes(totalOriginalSize)}`)
  console.log(`   Transformed (800px): ${formatBytes(totalTransformedSize)}\n`)

  console.log("📊 Netlify Free Plan Limits:")
  console.log(`   Storage limit:    10 GB`)
  console.log(
    `   Your usage:       ${formatBytes(totalTransformedSize)} (${Math.round((totalTransformedSize / (10 * 1024 * 1024 * 1024)) * 100)}%)`,
  )
  console.log(`   Bandwidth limit:  100 GB/month\n`)

  if (totalTransformedSize < 1 * 1024 * 1024 * 1024) {
    console.log("✅ RECOMMENDATION: Safe to download assets at build time!")
    console.log("   Your transformed assets are well under Netlify limits.")
  } else if (totalTransformedSize < 5 * 1024 * 1024 * 1024) {
    console.log("⚠️  RECOMMENDATION: Proceed with caution.")
    console.log("   Assets are significant but manageable.")
  } else {
    console.log("❌ RECOMMENDATION: Consider alternatives.")
    console.log("   Assets may be too large for Netlify free plan.")
  }

  console.log("\n═══════════════════════════════════════════\n")

  // List largest files
  const sortedFiles = files
    .sort((a: any, b: any) => (b.filesize || 0) - (a.filesize || 0))
    .slice(0, 10)

  if (sortedFiles.length > 0) {
    console.log("📌 Top 10 Largest Files:")
    sortedFiles.forEach((file: any, index: number) => {
      console.log(
        `   ${index + 1}. ${file.filename_download} - ${formatBytes(file.filesize || 0)} (${file.type})`,
      )
    })
  }
}

estimateAssetSize().catch(console.error)
