// ReserveBar hooks — mobile sticky bottom bar injected after Footer

function afterEnable(ctx) {
  const { pageFile, meta, lib } = ctx;

  // Add import before Footer import
  lib.replaceInFile(
    pageFile,
    'import Footer from "./components/Footer";',
    'import ReserveBar from "./components/ReserveBar";\nimport Footer from "./components/Footer";'
  );

  // Add JSX after Footer JSX
  const propsKey = ctx.i18nActive ? "i18n" : "collapsed";
  const jsxProps = meta.props[propsKey];
  lib.replaceInFile(
    pageFile,
    "      <Footer footer={dict.footer} logo={dict.navbar.logo} />",
    `      <Footer footer={dict.footer} logo={dict.navbar.logo} />\n      <ReserveBar ${jsxProps} />`
  );
}

module.exports = { afterEnable };
