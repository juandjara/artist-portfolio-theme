// @ts-check
import { defineConfig } from "astro/config";

import preact from "@astrojs/preact";

import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";
import { i18nConfig } from "./src/lib/i18n";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  integrations: [preact({ devtools: true }), icon()],
  vite: {
    // @ts-ignore
    plugins: [tailwindcss()],
  },
  i18n: i18nConfig,
});
