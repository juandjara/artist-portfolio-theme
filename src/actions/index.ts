import { passwordCheckAction } from "./password_check"
import { protectedRichTextAction } from "./protected_rich_text"

export const server = {
  password_check: passwordCheckAction,
  protected_rich_text: protectedRichTextAction,
}
