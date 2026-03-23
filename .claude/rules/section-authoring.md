# Section Authoring Reference

> Read when: adding or modifying sections, components, templates, presets, configs, or niche profiles.

## Adding Extensions

**Template:** `scripts/templates/foo.js` exporting `{ type, setup }` + `templates/presets/foo/`. Auto-discovered. `setup(rl)` returns `{ type, features, sections: {} }`.

**Preset:** `scripts/presets/foo.js` exporting `{ name, description, base, sections: [{ name, variant }] }`. Auto-discovered. `base` must match a template type. Applied by `setup.js` with `--yes --no-install` per section, then one `npm install`.

**Section:** `templates/sections/[name]/[variant]/` with `meta.json` + any of `component.tsx`, `en.json`, `pt.json`, `hooks.js`. Only `meta.json` required. Auto-discovered — no registration needed.

**Component (UI atom):** `templates/components/[name]/[variant]/` with `component.tsx` + `meta.json`. No page injection, no dict keys, no nav links. `meta.json` needs `componentName`, `description`, optional `accentColorToken`, `dependencies`. Installs to `compDir/ui/[ComponentName].tsx`.

**Setup config:** `configs/setup/[key]/meta.json` with `key`, `label`, `description`, `type` (`"boolean"` or `"select"`), `default`, `prompt`, `templates` (null = all). For `select`: add `options` + `labels`. `hooks.js` exports `async apply(ctx)` with `{ enabled, value, projectType, tmpl, lib }`.

**Live config (palette-style):** `configs/[category]/[name]/meta.json`. Add `load[Category]()` to `lib.js`. Wire into `config.js` menu.

**Niche profile:** `configs/niche-profiles/[niche].json` with business keys + optional `_content_hints`. `_*` keys ignored by `personalize.js`.

## meta.json Schema

```jsonc
{
  "componentName": "Skills",           // PascalCase, matches default export. null = no component
  "dictKey": "skills",                 // top-level key in en/pt.json. null = no dict merge
  "navLink": { "id": "skills", "label": { "en": "Skills", "pt": "Competências" } },
  "templates": ["portfolio", "business"], // advisory — shown as [!] on non-native templates
  "defaultAfter": "services",          // preselected insertion position
  "pageSection": true,                 // false = skip position prompt + import/JSX injection
  "detectFile": null,                  // override component-based detection
  "props": { "i18n": "skills={dict.skills}", "collapsed": "skills={dict.skills}" },
  "collapsePatches": [],               // legacy — never applied (i18n always active)
  "accentColorToken": "indigo",        // color token swapped to project accent
  "dependencies": [],                  // [["package", "^version"]]
  "extraFiles": []                     // [{ src, dest, destCollapsed?, cleanupDir? }]
}
```

## hooks.js Context

```js
{
  projectDir,   // absolute path to generated project
  compDir,      // "app/[locale]/components"
  pageFile,     // "app/[locale]/page.tsx"
  layoutFile,   // "app/[locale]/layout.tsx"
  i18nActive,   // boolean — always true
  accentColor,  // current accent color string
  state,        // full .launchkit state
  sections,     // state.sections object
  features,     // state.features object
  meta,         // this section's meta.json
  variantDir,   // absolute path to variant directory
  lib,          // scripts/lib.js — replaceInFile, removeLineContaining, extractBetweenMarkers,
                // removeMarkerBlock, addDependency, removeDependency, addNavLink, removeNavLink,
                // copyDir, copyFile, deleteIfExists, safeJsonParse, TOOL_ROOT, LOCALES,
                // LOCALES_TS_LITERAL, DICT_FILES, ...
}
```

Hook execution order: `afterEnable` → after `standardEnable`; `beforeDisable` → before `standardDisable`; `afterDisable` → after.

## Section Detection

`detectInstalledSections(compDir, launchkitSections, templateType)` cross-references `discoverSections()` with component files. Uses `meta.detectFile` if set, else checks `{compDir}/{componentName}.tsx`, falls back to `hooks.detect(ctx)` (e.g. whatsapp checks for `wa.me/` in Contact.tsx). Uses `.launchkit` recorded variant to disambiguate shared `componentName`. `parseSectionsFromPage(pageFile)` extracts `<ComponentName` lines, excluding structural components (`Hero`, `HeroFull`, `ProfileSidebar`, `Footer`, `FloatingCTA`).

## Dictionary Shapes

**Portfolio base:**
```json
{
  "navbar": { "logo", "cta", "links": [{ "id", "label" }] },
  "hero": { "name", "card_bio", "title_line1", "title_line2", "tagline", "cta", "cta_secondary", "stats": [{ "value", "label" }] },
  "services": { "title_line1", "title_line2", "stack_label", "items": [{ "icon", "title", "description", "details": [] }] },
  "process": { "title_line1", "title_line2", "steps": [{ "number", "title", "description" }] },
  "about": { "title_line1", "title_line2", "bio", "bio_callout", "bio_cta", "fun_facts": [{ "emoji", "title", "text" }] },
  "contact": { "title_line1", "title_line2", "body", "form_*", "email", "github", "linkedin" }
}
```
Section-owned keys: `work`, `reviews`, `skills`.

**Business base:** `navbar`, `hero`, `about`, `services`, `reviews` (with `rating`), `faq`, `contact` (with `phone`, `address`, `whatsapp`, `map_link`), `footer`

Section-owned keys: `cta` (floating-cta), `skills`, `pricing`, `schedule`, `statsCounters`, `contactMap`, `team`.
