import dotenv from "dotenv"
import {
  createDirectus,
  readItems,
  readFiles,
  rest,
  staticToken,
} from "@directus/sdk"
import type { DBSchema } from "../src/lib/directus.types"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { exec as execCallback } from "child_process"
import sharp from "sharp"
import crypto from "crypto"
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg"
import ffprobeInstaller from "@ffprobe-installer/ffprobe"

// Load environment variables
dotenv.config()

// Set ffmpeg and ffprobe paths
const FFMPEG_PATH = ffmpegInstaller.path
const FFPROBE_PATH = ffprobeInstaller.path

const exec = promisify(execCallback)

const directus = createDirectus<DBSchema>(process.env.DIRECTUS_URL!)
  .with(rest())
  .with(staticToken(process.env.DIRECTUS_TOKEN!))

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

const PUBLIC_ASSETS_DIR = path.join(process.cwd(), "public", "assets")
const CACHE_FILE = path.join(PUBLIC_ASSETS_DIR, ".asset-cache.json")
const MAX_WIDTH = 800
const IMAGE_QUALITY = 80
const VIDEO_CRF = 28 // Constant Rate Factor (lower = better quality, 18-28 is good)

interface AssetCache {
  [assetId: string]: {
    hash: string
    processedAt: number
    originalSize: number
    processedSize: number
  }
}

interface AssetInfo {
  id: string
  type: string
  filesize: number
  filename: string
  url: string
}

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function loadCache(): AssetCache {
  if (fs.existsSync(CACHE_FILE)) {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"))
  }
  return {}
}

function saveCache(cache: AssetCache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

function getFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath)
  return crypto.createHash("md5").update(fileBuffer).digest("hex")
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  fs.writeFileSync(outputPath, buffer)
}

async function optimizeImage(
  inputPath: string,
  outputPath: string,
): Promise<number> {
  await sharp(inputPath)
    .resize(MAX_WIDTH, null, {
      withoutEnlargement: true,
      fit: "inside",
    })
    .jpeg({ quality: IMAGE_QUALITY })
    .png({ quality: IMAGE_QUALITY })
    .webp({ quality: IMAGE_QUALITY })
    .toFile(outputPath)

  const stats = fs.statSync(outputPath)
  return stats.size
}

async function optimizeVideo(
  inputPath: string,
  outputPath: string,
): Promise<number> {
  // Get video dimensions using installed ffprobe
  const probeCmd = `"${FFPROBE_PATH}" -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${inputPath}"`
  const { stdout } = await exec(probeCmd)
  const [width, height] = stdout.trim().split("x").map(Number)

  // Calculate new dimensions maintaining aspect ratio
  let newWidth = width
  let newHeight = height
  if (width > MAX_WIDTH) {
    newWidth = MAX_WIDTH
    newHeight = Math.round((height * MAX_WIDTH) / width)
    // Ensure even numbers for video encoding
    newHeight = newHeight % 2 === 0 ? newHeight : newHeight + 1
  }

  // Optimize video with installed ffmpeg
  const ffmpegCmd = `"${FFMPEG_PATH}" -i "${inputPath}" -vf "scale=${newWidth}:${newHeight}" -c:v libx264 -crf ${VIDEO_CRF} -preset medium -c:a aac -b:a 128k -movflags +faststart -y "${outputPath}"`

  try {
    await exec(ffmpegCmd)
    const stats = fs.statSync(outputPath)
    return stats.size
  } catch (error) {
    console.warn(`⚠️  Failed to optimize video, using original: ${error}`)
    fs.copyFileSync(inputPath, outputPath)
    return fs.statSync(outputPath).size
  }
}

async function processAsset(
  asset: AssetInfo,
  cache: AssetCache,
): Promise<{ saved: boolean; size: number }> {
  // Get file extension from MIME type or original filename
  const ext = getExtensionFromMimeType(asset.type) || path.extname(asset.filename) || ""
  const tempPath = path.join(PUBLIC_ASSETS_DIR, `temp_${asset.id}${ext}`)
  const finalPath = path.join(PUBLIC_ASSETS_DIR, `${asset.id}${ext}`)

  // Download file
  await downloadFile(asset.url, tempPath)
  const fileHash = getFileHash(tempPath)

  // Check cache
  if (
    cache[asset.id] &&
    cache[asset.id].hash === fileHash &&
    fs.existsSync(finalPath)
  ) {
    fs.unlinkSync(tempPath)
    return { saved: false, size: cache[asset.id].processedSize }
  }

  // Process based on type
  let processedSize: number

  if (asset.type.startsWith("image/")) {
    processedSize = await optimizeImage(tempPath, finalPath)
  } else if (asset.type.startsWith("video/")) {
    processedSize = await optimizeVideo(tempPath, finalPath)
  } else {
    // Copy other files as-is
    fs.copyFileSync(tempPath, finalPath)
    processedSize = fs.statSync(finalPath).size
  }

  // Clean up temp file
  fs.unlinkSync(tempPath)

  // Update cache
  cache[asset.id] = {
    hash: fileHash,
    processedAt: Date.now(),
    originalSize: asset.filesize,
    processedSize,
  }

  return { saved: true, size: processedSize }
}

async function collectAssetIds(): Promise<Set<string>> {
  const assetIds = new Set<string>()

  console.log("🔍 Scanning content for assets...\n")

  // 1. Posts
  const posts = await directus.request(
    readItems("posts", {
      fields: ["*", { translations: ["*"], image: ["*"] }],
    }),
  )

  posts.forEach((post: any) => {
    if (post.image?.id) assetIds.add(post.image.id)
    post.translations?.forEach((trans: any) => {
      if (trans.content) {
        const matches = trans.content.matchAll(/\/assets\/([a-f0-9-]+)/g)
        for (const match of matches) assetIds.add(match[1])
      }
    })
  })

  // 2. Categories
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
                block_gallery: ["*", { items: ["*", { directus_file: ["*"] }] }],
              },
            },
          ],
        },
      ],
    }),
  )

  categories.forEach((category: any) => {
    if (category.background?.id) assetIds.add(category.background.id)
    category.blocks?.forEach((block: any) => {
      if (block.item) {
        const item = block.item as any
        if (item.translations) {
          item.translations.forEach((trans: any) => {
            if (trans.content) {
              const matches = trans.content.matchAll(/\/assets\/([a-f0-9-]+)/g)
              for (const match of matches) assetIds.add(match[1])
            }
          })
        }
        if (item.items) {
          item.items.forEach((galleryItem: any) => {
            if (galleryItem.directus_file?.id)
              assetIds.add(galleryItem.directus_file.id)
          })
        }
      }
    })
  })

  // 3. Pages
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
                block_gallery: ["*", { items: ["*", { directus_file: ["*"] }] }],
                block_hero: ["*", { image: ["*"] }],
              },
            },
          ],
        },
      ],
    }),
  )

  pages.forEach((page: any) => {
    page.blocks?.forEach((block: any) => {
      if (block.item) {
        const item = block.item as any
        if (item.translations) {
          item.translations.forEach((trans: any) => {
            if (trans.content) {
              const matches = trans.content.matchAll(/\/assets\/([a-f0-9-]+)/g)
              for (const match of matches) assetIds.add(match[1])
            }
          })
        }
        if (item.items) {
          item.items.forEach((galleryItem: any) => {
            if (galleryItem.directus_file?.id)
              assetIds.add(galleryItem.directus_file.id)
          })
        }
        if (item.image?.id) assetIds.add(item.image.id)
      }
    })
  })

  console.log(`   Found ${assetIds.size} unique assets`)
  return assetIds
}

async function main() {
  console.log("🚀 Starting asset download and optimization\n")
  console.log("═══════════════════════════════════════════\n")

  // Setup
  await ensureDir(PUBLIC_ASSETS_DIR)
  const cache = loadCache()

  // Collect asset IDs
  const assetIds = await collectAssetIds()

  // Fetch asset metadata
  console.log("\n📥 Fetching asset metadata...\n")
  const files = await directus.request(
    readFiles({
      filter: { id: { _in: Array.from(assetIds) } },
      fields: ["id", "filesize", "type", "filename_download"],
    }),
  )

  const assets: AssetInfo[] = files.map((file: any) => ({
    id: file.id,
    type: file.type || "application/octet-stream",
    filesize: file.filesize || 0,
    filename: file.filename_download,
    url: `${process.env.DIRECTUS_URL}/assets/${file.id}`,
  }))

  // Categorize assets
  const images = assets.filter((a) => a.type.startsWith("image/"))
  const videos = assets.filter((a) => a.type.startsWith("video/"))
  const others = assets.filter(
    (a) => !a.type.startsWith("image/") && !a.type.startsWith("video/"),
  )

  console.log(`   Images: ${images.length}`)
  console.log(`   Videos: ${videos.length}`)
  console.log(`   Others: ${others.length}`)

  // Process assets
  console.log("\n⚙️  Processing assets...\n")

  let processedCount = 0
  let skippedCount = 0
  let totalOriginalSize = 0
  let totalProcessedSize = 0

  for (const asset of assets) {
    const prefix =
      asset.type.startsWith("image/")
        ? "🖼️ "
        : asset.type.startsWith("video/")
          ? "🎬"
          : "📄"

    try {
      const result = await processAsset(asset, cache)

      totalOriginalSize += asset.filesize
      totalProcessedSize += result.size

      if (result.saved) {
        processedCount++
        const savedPercent = Math.round(
          ((asset.filesize - result.size) / asset.filesize) * 100,
        )
        console.log(
          `   ${prefix} ${asset.filename} - ${formatBytes(asset.filesize)} → ${formatBytes(result.size)} (${savedPercent}% saved)`,
        )
      } else {
        skippedCount++
        console.log(`   ⏭️  ${asset.filename} - cached`)
      }
    } catch (error) {
      console.error(`   ❌ Failed to process ${asset.filename}: ${error}`)
    }
  }

  // Save cache
  saveCache(cache)

  // Clean up orphaned files
  console.log("\n🧹 Cleaning up orphaned files...")
  const existingFiles = fs
    .readdirSync(PUBLIC_ASSETS_DIR)
    .filter((f) => f !== ".asset-cache.json")
  const validIds = new Set(assets.map((a) => a.id))
  let removedCount = 0

  existingFiles.forEach((file) => {
    if (!validIds.has(file) && !file.startsWith("temp_")) {
      fs.unlinkSync(path.join(PUBLIC_ASSETS_DIR, file))
      delete cache[file]
      removedCount++
    }
  })

  if (removedCount > 0) {
    console.log(`   Removed ${removedCount} orphaned files`)
    saveCache(cache)
  } else {
    console.log(`   No orphaned files found`)
  }

  // Summary
  const totalSaved = totalOriginalSize - totalProcessedSize
  const savedPercent = Math.round((totalSaved / totalOriginalSize) * 100)

  console.log("\n═══════════════════════════════════════════")
  console.log("              SUMMARY")
  console.log("═══════════════════════════════════════════\n")
  console.log(`📊 Assets processed:  ${processedCount}`)
  console.log(`⏭️  Assets cached:     ${skippedCount}`)
  console.log(`🗑️  Assets removed:    ${removedCount}`)
  console.log(`\n💾 Original size:     ${formatBytes(totalOriginalSize)}`)
  console.log(`📦 Optimized size:    ${formatBytes(totalProcessedSize)}`)
  console.log(`✨ Space saved:       ${formatBytes(totalSaved)} (${savedPercent}%)`)
  console.log("\n✅ Asset optimization complete!\n")
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

main().catch((error) => {
  console.error("❌ Error:", error)
  process.exit(1)
})
