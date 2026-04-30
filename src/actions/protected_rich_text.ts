import { ActionError, defineAction } from "astro:actions"
import { z } from "astro:schema"
import directus, { transformMediaInHTML } from "../lib/directus"
import { readItem, verifyHash } from "@directus/sdk"
import type { BlockProtectedRichtextTranslations } from "../lib/directus.types"
import { getTranslations } from "../lib/translations"

export const protectedRichTextAction = defineAction({
  input: z.object({
    password: z.string(),
    block_id: z.number(),
    language: z.string(),
  }),
  handler: async ({ block_id, password, language }) => {
    // readItem will throw if the item is not found
    const block = await directus.request(
      readItem("block_protected_richtext", block_id, {
        fields: [
          "id",
          "password_hash",
          {
            translations: ["*"],
          },
        ],
      }),
    )

    if (!block.password_hash) {
      throw new ActionError({
        code: "FORBIDDEN",
        message: "Block is not configured with a password",
      })
    }

    const valid_password = await directus.request(
      verifyHash(password, block.password_hash),
    )
    if (!valid_password) {
      throw new ActionError({
        code: "UNAUTHORIZED",
        message: "Invalid password",
      })
    }

    const translation = getTranslations(
      block.translations as BlockProtectedRichtextTranslations[],
      language,
    )
    const content = transformMediaInHTML(translation?.content ?? "")

    return { content }
  },
})
