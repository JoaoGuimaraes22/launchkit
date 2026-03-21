// Chatbot hooks — layout injection, ChatNudge coupling, API route, dialogflow
const fs = require("fs");
const path = require("path");

// ── i18n collapse helpers ────────────────────────────────────────────────────

function collapseChatWidgetTsx(compDir, lib) {
  lib.removeLineContaining(`${compDir}/ChatWidget.tsx`, "import { type Locale }");
  lib.replaceInFile(
    `${compDir}/ChatWidget.tsx`,
    "const strings = {\n  en: {\n    title: \"Chat with me\",\n    subtitle: \"Typically replies instantly\",\n    placeholder: \"Type a message...\",\n    greeting: \"Hi! I'm YOUR_NAME's assistant. Ask me anything about their work, services, or availability.\",\n    ariaLabel: \"Open chat\",\n    bubble: \"Ask me anything\",\n    chips: [\"What services do you offer?\", \"What's your pricing?\", \"Are you available?\", \"Show me your work\"],\n  },\n  pt: {\n    title: \"Fala comigo\",\n    subtitle: \"Responde quase instantaneamente\",\n    placeholder: \"Escreve uma mensagem...\",\n    greeting: \"Olá! Sou o assistente de YOUR_NAME. Pergunta-me sobre o seu trabalho, serviços ou disponibilidade.\",\n    ariaLabel: \"Abrir chat\",\n    bubble: \"Pergunta-me algo\",\n    chips: [\"Que serviços ofereces?\", \"Qual é o teu preço?\", \"Estás disponível?\", \"Mostra o teu trabalho\"],\n  },\n};\n\nexport default function ChatWidget({ locale }: { locale: Locale }) {",
    "const s = {\n  title: \"Chat with me\",\n  subtitle: \"Typically replies instantly\",\n  placeholder: \"Type a message...\",\n  greeting: \"Hi! I'm YOUR_NAME's assistant. Ask me anything about their work, services, or availability.\",\n  ariaLabel: \"Open chat\",\n  bubble: \"Ask me anything\",\n  chips: [\"What services do you offer?\", \"What's your pricing?\", \"Are you available?\", \"Show me your work\"],\n};\n\nexport default function ChatWidget() {"
  );
  lib.removeLineContaining(`${compDir}/ChatWidget.tsx`, "const s = strings[locale]");
  lib.replaceInFile(`${compDir}/ChatWidget.tsx`, "message: text, sessionId, locale", 'message: text, sessionId, locale: "en"');
  lib.replaceInFile(
    `${compDir}/ChatWidget.tsx`,
    'locale === "pt" ? "Erro de ligação. Tenta novamente." : "Connection error. Please try again."',
    '"Connection error. Please try again."'
  );
}

function collapseChatNudgeTsx(compDir, lib) {
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

// ── Hooks ────────────────────────────────────────────────────────────────────

function afterEnable(ctx) {
  const { projectDir, compDir, layoutFile, i18nActive, lib } = ctx;

  // Copy API route + dialogflow agent
  lib.copyDir("templates/portfolio/app/api/chat", "app/api/chat");
  lib.copyDir("templates/portfolio/dialogflow", "dialogflow");

  // Collapse ChatWidget if i18n disabled
  if (!i18nActive) collapseChatWidgetTsx(compDir, lib);

  // Inject ChatWidget into layout
  const chatWidgetJSX = i18nActive ? "      <ChatWidget locale={locale} />" : "      <ChatWidget />";
  lib.replaceInFile(layoutFile, 'import Navbar from "./components/Navbar";', 'import ChatWidget from "./components/ChatWidget";\nimport Navbar from "./components/Navbar";');
  lib.replaceInFile(layoutFile, "      {children}", `      {children}\n${chatWidgetJSX}`);

  // If sidebar exists, add ChatNudge
  const sidebarAbsPath = path.join(projectDir, compDir, "ProfileSidebar.tsx");
  if (fs.existsSync(sidebarAbsPath)) {
    lib.copyFile("templates/portfolio/app/[locale]/components/ChatNudge.tsx", `${compDir}/ChatNudge.tsx`);
    if (!i18nActive) collapseChatNudgeTsx(compDir, lib);

    const sidebarContent = fs.readFileSync(sidebarAbsPath, "utf8");
    if (!sidebarContent.includes("ChatNudge")) {
      lib.replaceInFile(`${compDir}/ProfileSidebar.tsx`, "import { useRef }", 'import ChatNudge from "./ChatNudge";\nimport { useRef }');
      const ctaRef = i18nActive ? "<CtaButton locale={locale} />" : "<CtaButton />";
      const nudgeJSX = i18nActive ? "<ChatNudge locale={locale} />" : "<ChatNudge />";
      lib.replaceInFile(
        `${compDir}/ProfileSidebar.tsx`,
        `${ctaRef}\n        </motion.div>\n        <motion.div {...fadeUp(inView, 0.45)}`,
        `${ctaRef}\n        </motion.div>\n        <motion.div {...fadeUp(inView, 0.4)}>${nudgeJSX}</motion.div>\n        <motion.div {...fadeUp(inView, 0.45)}`
      );
      lib.replaceInFile(
        `${compDir}/ProfileSidebar.tsx`,
        `${ctaRef}</motion.div>\n      <motion.div className="flex gap-5"`,
        `${ctaRef}</motion.div>\n      <motion.div {...fadeUp(inView, 0.44)}>${nudgeJSX}</motion.div>\n\n      <motion.div className="flex gap-5"`
      );
    }
  }
}

function afterDisable(ctx) {
  const { projectDir, compDir, layoutFile, lib } = ctx;

  // Remove API route + dialogflow
  lib.deleteIfExists("app/api/chat");
  lib.deleteIfExists("dialogflow");

  // Remove ChatWidget from layout
  lib.removeLineContaining(layoutFile, 'import ChatWidget from "./components/ChatWidget"');
  lib.removeLineContaining(layoutFile, "<ChatWidget");

  // Remove ChatNudge if sidebar exists
  const sidebarAbsPath = path.join(projectDir, compDir, "ProfileSidebar.tsx");
  if (fs.existsSync(sidebarAbsPath)) {
    lib.deleteIfExists(`${compDir}/ChatNudge.tsx`);
    lib.removeLineContaining(`${compDir}/ProfileSidebar.tsx`, 'import ChatNudge from "./ChatNudge"');
    lib.removeLineContaining(`${compDir}/ProfileSidebar.tsx`, "<ChatNudge");
  }
}

module.exports = { afterEnable, afterDisable };
