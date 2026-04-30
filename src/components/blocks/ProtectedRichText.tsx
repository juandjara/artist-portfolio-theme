import { useState } from "preact/hooks"
import type { BlockProtectedRichText } from "../../lib/directus.types"
import { actions } from "astro:actions"

type PasswordRichText = {
  language: string
  block: Partial<BlockProtectedRichText>
}

export default function ProtectedRichText({
  language,
  block,
}: PasswordRichText) {
  const [hidden, setHidden] = useState(true)
  const [content, setContent] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  async function onSubmit(ev: SubmitEvent) {
    ev.preventDefault()
    if (!block.id) {
      throw new Error(`invalid block id: ${block.id}`)
    }
    const input = document.getElementById("password-input") as HTMLInputElement
    const { data, error } = await actions.protected_rich_text({
      block_id: block.id,
      password: input.value,
      language,
    })
    if (error) {
      setErrorMsg(
        error.code === "UNAUTHORIZED"
          ? "Contraseña incorrecta"
          : "Ha ocurrido un error, inténtelo de nuevo",
      )
      console.error(error)
    } else {
      setHidden(false)
      setContent(data.content)
    }
  }

  if (hidden) {
    return (
      <div>
        <p>Esta sección está protegida por contraseña</p>
        <form onSubmit={onSubmit}>
          <input
            id="password-input"
            type="password"
            name="password"
            placeholder="Introduzca la contraseña"
            onInput={() => errorMsg && setErrorMsg("")}
          />
          <button>Enviar</button>
        </form>
        {errorMsg && <p role="alert">{errorMsg}</p>}
      </div>
    )
  }

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: content }}></div>
    </div>
  )
}
