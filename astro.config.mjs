// @ts-check
import { defineConfig } from "astro/config"
import preact from "@astrojs/preact"
import tailwindcss from "@tailwindcss/vite"
import { i18nConfig } from "./src/lib/i18n"
import netlify from "@astrojs/netlify"

// https://astro.build/config
export default defineConfig({
  site: "https://nesgarciaart.netlify.app",
  integrations: [preact({ devtools: true })],

  vite: {
    // @ts-ignore
    plugins: [tailwindcss()],
  },

  i18n: i18nConfig,
  // output: 'server',
  adapter: netlify({
    // edgeMiddleware: true
  }),
})
