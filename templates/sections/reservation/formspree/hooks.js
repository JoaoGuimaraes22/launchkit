// Reservation hooks — full-screen modal injected at end of page fragment

function afterEnable(ctx) {
  const { pageFile, meta, lib } = ctx;

  // Add import before Footer import
  lib.replaceInFile(
    pageFile,
    'import Footer from "./components/Footer";',
    'import Reservation from "./components/Reservation";\nimport Footer from "./components/Footer";'
  );

  // Inject before closing fragment (supports both <></> and <main></main> layouts)
  const propsKey = ctx.i18nActive ? "i18n" : "collapsed";
  const jsxProps = meta.props[propsKey];

  // Business template uses <></> fragment
  lib.replaceInFile(
    pageFile,
    "      <Footer footer={dict.footer} logo={dict.navbar.logo} />\n    </>",
    `      <Footer footer={dict.footer} logo={dict.navbar.logo} />\n      <Reservation ${jsxProps} />\n    </>`
  );
}

module.exports = { afterEnable };
