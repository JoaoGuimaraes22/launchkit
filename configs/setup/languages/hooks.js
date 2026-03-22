// launchkit — languages setup config hook
// Configures i18n-config.ts and get-dictionary.ts based on the chosen language(s).
// Called by setup.js after tmpl.setup() has copied the template files.

const fs = require("fs");
const path = require("path");

const LOCALE_SETS = {
  "en":    { locales: ["en"],       defaultLocale: "en" },
  "pt":    { locales: ["pt"],       defaultLocale: "pt" },
  "en+pt": { locales: ["en", "pt"], defaultLocale: "en" },
};

async function apply(ctx) {
  const { value, lib } = ctx;
  const { locales, defaultLocale } = LOCALE_SETS[value] || LOCALE_SETS["en"];

  // 1. Write i18n-config.ts with the chosen locales
  const configContent =
    `export const i18n = {\n` +
    `  defaultLocale: "${defaultLocale}",\n` +
    `  locales: ${JSON.stringify(locales)},\n` +
    `} as const;\n\n` +
    `export type Locale = (typeof i18n)["locales"][number];\n`;
  fs.writeFileSync(path.join(lib.target(), "i18n-config.ts"), configContent, "utf8");

  // 2. Write get-dictionary.ts with only the selected locale imports
  const dictEntries = locales
    .map((l) => `  ${l}: () => import("./dictionaries/${l}.json").then((m) => m.default),`)
    .join("\n");
  const getDictContent =
    `import type { Locale } from "./i18n-config";\n\n` +
    `const dictionaries = {\n${dictEntries}\n};\n\n` +
    `export const getDictionary = async (locale: Locale) =>\n` +
    `  dictionaries[locale]?.() ?? dictionaries.${defaultLocale}();\n`;
  fs.writeFileSync(path.join(lib.target(), "get-dictionary.ts"), getDictContent, "utf8");

  // 3. Delete unused dictionary files
  const allLocales = ["en", "pt"];
  for (const unused of allLocales.filter((l) => !locales.includes(l))) {
    lib.deleteIfExists(`dictionaries/${unused}.json`);
  }

  console.log(`✓  Languages: ${locales.join(" + ")}`);
}

module.exports = { apply };
