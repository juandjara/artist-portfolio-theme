import type { AstroUserConfig } from "astro";

export const i18nConfig = {
  locales: ["es-ES", "en-US"],
  defaultLocale: "es-ES",
  routing: {
    prefixDefaultLocale: true,
    redirectToDefaultLocale: true,
  },
} satisfies AstroUserConfig["i18n"];
