import { useState } from "preact/hooks"
import type { getPosts } from "../lib/directus"
import { actions } from "astro:actions"

type PostProps = Awaited<ReturnType<typeof getPosts>>

export default function PostGrid({
  posts,
  numProtected,
  category,
  language,
}: PostProps & { category: string; language: string }) {
  const [_numProtected, setNumProtected] = useState(numProtected)
  const [_posts, setPosts] = useState(posts)
  const [status, setStatus] = useState("hidden")

  async function revealHiddenPosts() {
    const password = window.prompt("Enter password")
    if (password) {
      setStatus("loading")
      try {
        const { data, error } = await actions.password_check({
          language,
          categoryLink: category,
          password,
        })
        if (error) {
          setStatus("hidden")
          window.alert(error.message)
        } else {
          if (data) {
            setPosts(data)
            setNumProtected(0)
            setStatus("complete")
          } else {
            window.alert("No hidden posts found for this category")
          }
        }
      } catch (err) {
        console.error(err)
        setStatus("hidden")
      }
    }
  }

  return (
    <>
      <div class="mt-3 flex items-center justify-between">
        <p>
          <span class="text-lg font-medium">{posts.length}</span> posts
        </p>
        {_numProtected ? (
          <p>
            <span class="text-lg font-medium">{_numProtected}</span> hidden
            posts{" "}
            <button
              disabled={status === "loading"}
              onClick={revealHiddenPosts}
              class="text-link cursor-pointer"
            >
              {status === "loading" ? "Loading..." : "Reveal"}
            </button>
          </p>
        ) : null}
      </div>
      <div
        class={`my-3 grid grid-cols-2 flex-wrap gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`}
      >
        {_posts.map((p) => (
          <div>
            <a
              href={`/${language}/posts/${p.slug}`}
              class="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md shadow-xs shadow-rose-900 transition-shadow hover:shadow-md dark:shadow-rose-200"
            >
              <div class="absolute inset-0 z-10 transition-transform duration-300 ease-out transform-3d group-hover:scale-110">
                <img
                  class="h-full w-full rounded-md object-cover object-center"
                  src={p.image}
                  alt={p.title}
                />
              </div>
            </a>
            {p.title ? <p class="py-1">{p.title}</p> : null}
          </div>
        ))}
      </div>
    </>
  )
}
