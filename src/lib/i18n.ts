import type { AstroUserConfig } from "astro";

export const i18nConfig = {
  locales: ["es", "en", "ja"],
  defaultLocale: "es",
  routing: {
    prefixDefaultLocale: true,
    redirectToDefaultLocale: true,
  },
} satisfies AstroUserConfig["i18n"];
