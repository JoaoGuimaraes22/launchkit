// WebGL Hero hooks — swaps Hero ↔ HeroFull in page.tsx
//
// Important: beforeDisable runs BEFORE standardDisable. This swaps HeroFull → Hero
// in page.tsx first, so standardDisable's removeLineContaining("import HeroFull")
// and removeLineContaining("<HeroFull") become no-ops (the lines no longer exist).

function afterEnable(ctx) {
  const { pageFile, lib } = ctx;

  // Swap Hero import → HeroFull import
  lib.replaceInFile(pageFile, 'import Hero from "./components/Hero";', 'import HeroFull from "./components/HeroFull";');

  // Swap Hero JSX → HeroFull JSX
  lib.replaceInFile(pageFile, "<Hero hero={dict.hero} />", "<HeroFull hero={dict.hero} />");
}

function beforeDisable(ctx) {
  const { compDir, pageFile, lib } = ctx;

  // Restore Hero.tsx from template
  lib.copyFile("templates/portfolio/app/[locale]/components/Hero.tsx", `${compDir}/Hero.tsx`);

  // Swap HeroFull → Hero in page.tsx BEFORE standardDisable removes the lines
  lib.replaceInFile(pageFile, 'import HeroFull from "./components/HeroFull";', 'import Hero from "./components/Hero";');
  lib.replaceInFile(pageFile, "<HeroFull hero={dict.hero} />", "<Hero hero={dict.hero} />");
}

module.exports = { afterEnable, beforeDisable };
