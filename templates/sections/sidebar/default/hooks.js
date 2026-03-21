// Sidebar hooks — page import, ChatNudge coupling, TODO comment on disable
const fs = require("fs");
const path = require("path");

function afterEnable(ctx) {
  const { projectDir, compDir, pageFile, i18nActive, sections, lib } = ctx;

  // If chatbot is not active, strip ChatNudge references from the copied component
  const chatbotInstalled = sections && sections.chatbot;
  const chatApiExists = fs.existsSync(path.join(projectDir, "app/api/chat/route.ts"));
  if (!chatbotInstalled && !chatApiExists) {
    lib.removeLineContaining(`${compDir}/ProfileSidebar.tsx`, 'import ChatNudge from "./ChatNudge"');
    lib.removeLineContaining(`${compDir}/ProfileSidebar.tsx`, "<ChatNudge");
  } else {
    // Chatbot is active — copy ChatNudge too
    lib.copyFile("templates/portfolio/app/[locale]/components/ChatNudge.tsx", `${compDir}/ChatNudge.tsx`);
    if (!i18nActive) {
      lib.replaceInFile(
        `${compDir}/ChatNudge.tsx`,
        'import { type Locale } from "../../../i18n-config";\n\nconst nudgeText: Record<Locale, string> = {\n  en: "Have questions? Chat with me",\n  pt: "Tens dúvidas? Fala comigo",\n};\n\nexport default function ChatNudge({ locale }: { locale: Locale }) {',
        "export default function ChatNudge() {"
      );
      lib.replaceInFile(
        `${compDir}/ChatNudge.tsx`,
        "{nudgeText[locale] ?? nudgeText.en}",
        '"Have questions? Chat with me"'
      );
    }
  }

  // Add import to page.tsx (before hero import)
  const pageContent = fs.readFileSync(path.join(projectDir, pageFile), "utf8");
  const heroAnchor = pageContent.includes("HeroFull")
    ? 'import HeroFull from "./components/HeroFull";'
    : 'import Hero from "./components/Hero";';
  lib.replaceInFile(pageFile, heroAnchor, `import ProfileSidebar from "./components/ProfileSidebar";\n${heroAnchor}`);

  // Remove TODO comment if present from a previous disable
  lib.removeLineContaining(pageFile, "TODO: TEMPLATE — ProfileSidebar removed");
}

function afterDisable(ctx) {
  const { projectDir, compDir, pageFile, lib } = ctx;

  // Delete ChatNudge if it exists
  lib.deleteIfExists(`${compDir}/ChatNudge.tsx`);

  // Remove import from page
  lib.removeLineContaining(pageFile, 'import ProfileSidebar from "./components/ProfileSidebar"');

  // Add TODO comment for Claude to restructure layout
  const pagePath = path.join(projectDir, pageFile);
  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, "utf8");
    if (!content.includes("TODO: TEMPLATE")) {
      fs.writeFileSync(
        pagePath,
        "// TODO: TEMPLATE — ProfileSidebar removed. Replace the md:flex sidebar layout with a single-column <main> wrapper. Remove <aside> block and any ProfileSidebar JSX.\n" + content,
        "utf8"
      );
      console.log("  [patched]", pageFile, "— added TODO comment for Claude");
    }
  }
}

module.exports = { afterEnable, afterDisable };
