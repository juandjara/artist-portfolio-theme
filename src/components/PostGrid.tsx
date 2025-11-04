import { useMemo, useState } from "preact/hooks"
import type { getPosts } from "../lib/directus"
import { actions } from "astro:actions"

type PostProps = Awaited<ReturnType<typeof getPosts>>

export default function PostGrid({
  posts,
  numProtected,
  category,
  language,
  postCategoryMap,
  labels,
}: PostProps & {
  category: string
  language: string
  postCategoryMap: Record<string, string[]>
  labels: {
    loading: string
    reveal: string
    hidden: string
  }
}) {
  const [_numProtected, setNumProtected] = useState(numProtected)
  const [_posts, setPosts] = useState(posts)
  const [status, setStatus] = useState("hidden")

  const differentCategories = useMemo(() => {
    const categories = _posts.map((p) => getCategories(p.id))
    const uniqueValues = [...new Set(categories)]
    return uniqueValues.length > 1
  }, [posts, category])

  function getCategories(id: string) {
    if (!postCategoryMap[id]) {
      return ""
    }
    return postCategoryMap[id].join(", ")
  }

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

  function beforeNavigation(ev: MouseEvent) {
    sessionStorage.setItem("artist_portfolio:from_feed", "true")
  }

  return (
    <>
      <div className="mt-3 flex items-center justify-between">
        {_numProtected ? (
          <>
            <p>
              <span className="text-lg font-medium">{posts.length}</span> posts
            </p>
            <p>
              <span className="text-lg font-medium">{_numProtected}</span>{" "}
              {labels.hidden}{" "}
              <button
                disabled={status === "loading"}
                onClick={revealHiddenPosts}
                className="text-link cursor-pointer"
              >
                {status === "loading" ? labels.loading : labels.reveal}
              </button>
            </p>
          </>
        ) : null}
      </div>
      <div
        className={`my-3 grid grid-cols-2 flex-wrap gap-3 sm:grid-cols-3 md:grid-cols-4`}
      >
        {_posts.map((p) => (
          <div>
            <a
              onClick={beforeNavigation}
              href={`/${language}/posts/${p.id}`}
              style={{
                "--tw-shadow": "3px 3px 1px 0px var(--link-light)",
                border: "1px solid var(--link-light)",
              }}
              className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md transition-shadow hover:shadow-md dark:shadow-rose-200"
            >
              <div className="absolute inset-0 z-10 transition-transform duration-300 ease-out transform-3d group-hover:scale-110">
                <img
                  className="h-full w-full rounded-md object-cover object-center"
                  src={`${p.image}?width=300&height=300`}
                  alt={p.title}
                  decoding="async"
                  loading="lazy"
                />
              </div>
            </a>
            {differentCategories ? (
              <p className="text-link pt-2 text-sm font-medium">
                {getCategories(p.id)}
              </p>
            ) : null}
            {p.title ? <p className="pt-1 pb-1">{p.title}</p> : null}
          </div>
        ))}
      </div>
    </>
  )
}
