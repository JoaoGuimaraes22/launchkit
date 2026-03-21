// WhatsApp hooks — marker-based JSX extraction for Contact + FloatingCTA
const fs = require("fs");
const path = require("path");

// Content-based detection: checks if Contact.tsx contains "wa.me/"
function detect(ctx) {
  const contactFile = path.join(ctx.projectDir, `${ctx.compDir}/Contact.tsx`);
  return fs.existsSync(contactFile) && fs.readFileSync(contactFile, "utf8").includes("wa.me/");
}

function afterEnable(ctx) {
  const { projectDir, compDir, lib } = ctx;

  // ── Contact.tsx: re-insert WhatsApp block from template ─────────────────
  const contactFile = `${compDir}/Contact.tsx`;
  const contactFull = path.join(projectDir, contactFile);
  const templateContact = path.join(lib.TOOL_ROOT, "templates/business/app/[locale]/components/Contact.tsx");
  if (fs.existsSync(contactFull) && fs.existsSync(templateContact)) {
    let live = fs.readFileSync(contactFull, "utf8");
    if (!live.includes("wa.me/")) {
      const tmpl = fs.readFileSync(templateContact, "utf8");
      const s = tmpl.indexOf("{/* WhatsApp */}");
      const e = tmpl.indexOf("{/* Email */}");
      if (s !== -1 && e !== -1) {
        live = live.replace("{/* Email */}", tmpl.slice(s, e) + "{/* Email */}");
        fs.writeFileSync(contactFull, live, "utf8");
        console.log("  [patched]", contactFile, "— added WhatsApp block");
      }
    }
  }

  // ── FloatingCTA.tsx: re-insert WhatsApp button from template ────────────
  const ctaFile = `${compDir}/FloatingCTA.tsx`;
  const ctaFull = path.join(projectDir, ctaFile);
  const templateCta = path.join(lib.TOOL_ROOT, "templates/business/app/[locale]/components/FloatingCTA.tsx");
  if (fs.existsSync(ctaFull) && fs.existsSync(templateCta)) {
    let live = fs.readFileSync(ctaFull, "utf8");
    if (!live.includes("wa.me/")) {
      lib.replaceInFile(ctaFile, "  book_label: string;", "  whatsapp_label: string;\n  whatsapp: string;\n  book_label: string;");
      const tmpl = fs.readFileSync(templateCta, "utf8");
      const waIdx = tmpl.indexOf("wa.me/");
      const sepIdx = tmpl.lastIndexOf("<div", waIdx);
      const endIdx = tmpl.indexOf("</a>", waIdx) + "</a>".length;
      const waBlock = tmpl.slice(sepIdx, endIdx);
      live = fs.readFileSync(ctaFull, "utf8");
      const lastSep = live.lastIndexOf('<div className="w-px bg-zinc-200" />');
      if (lastSep !== -1) {
        live = live.slice(0, lastSep) + waBlock + "\n\n      " + live.slice(lastSep);
        fs.writeFileSync(ctaFull, live, "utf8");
        console.log("  [patched]", ctaFile, "— added WhatsApp button");
      }
    }
  }

  // ── Dictionaries: restore whatsapp fields ───────────────────────────────
  for (const lang of lib.LOCALES) {
    const dictFile = `dictionaries/${lang}.json`;
    const dictFull = path.join(projectDir, dictFile);
    const tmplDictFull = path.join(lib.TOOL_ROOT, `templates/business/dictionaries/${lang}.json`);
    if (fs.existsSync(dictFull) && fs.existsSync(tmplDictFull)) {
      const dict = lib.safeJsonParse(fs.readFileSync(dictFull, "utf8"), dictFile);
      const tmpl = lib.safeJsonParse(fs.readFileSync(tmplDictFull, "utf8"), `templates/business/dictionaries/${lang}.json`);
      let changed = false;
      if (dict.contact && !dict.contact.whatsapp && tmpl.contact?.whatsapp) {
        dict.contact.whatsapp = tmpl.contact.whatsapp; changed = true;
      }
      if (dict.cta && !dict.cta.whatsapp && tmpl.cta?.whatsapp) {
        dict.cta.whatsapp = tmpl.cta.whatsapp;
        dict.cta.whatsapp_label = tmpl.cta.whatsapp_label;
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(dictFull, JSON.stringify(dict, null, 2) + "\n", "utf8");
        console.log("  [patched]", dictFile, "— restored whatsapp fields");
      }
    }
  }
}

function afterDisable(ctx) {
  const { projectDir, compDir, lib } = ctx;

  // ── Contact.tsx: remove WhatsApp block ──────────────────────────────────
  const contactFile = `${compDir}/Contact.tsx`;
  const contactFull = path.join(projectDir, contactFile);
  if (fs.existsSync(contactFull)) {
    let content = fs.readFileSync(contactFull, "utf8");
    const s = content.indexOf("{/* WhatsApp */}");
    const e = content.indexOf("{/* Email */}");
    if (s !== -1 && e !== -1 && s < e) {
      const trimFrom = content[s - 2] === "\n" ? s - 1 : s;
      content = content.slice(0, trimFrom) + content.slice(e);
      fs.writeFileSync(contactFull, content, "utf8");
      console.log("  [patched]", contactFile, "— removed WhatsApp block");
    }
  }

  // ── FloatingCTA.tsx: remove separator + WhatsApp button ─────────────────
  const ctaFile = `${compDir}/FloatingCTA.tsx`;
  const ctaFull = path.join(projectDir, ctaFile);
  if (fs.existsSync(ctaFull)) {
    let content = fs.readFileSync(ctaFull, "utf8");
    if (content.includes("wa.me/")) {
      const waIdx = content.indexOf("wa.me/");
      const sepIdx = content.lastIndexOf("<div", waIdx);
      const endIdx = content.indexOf("</a>", waIdx) + "</a>".length;
      content = content.slice(0, sepIdx) + content.slice(endIdx);
      fs.writeFileSync(ctaFull, content, "utf8");
      console.log("  [patched]", ctaFile, "— removed WhatsApp button");
      lib.removeLineContaining(ctaFile, "whatsapp_label: string;");
      lib.removeLineContaining(ctaFile, "  whatsapp: string;");
    }
  }

  // ── Dictionaries: remove whatsapp fields ────────────────────────────────
  for (const lang of lib.LOCALES) {
    const dictFile = `dictionaries/${lang}.json`;
    const dictFull = path.join(projectDir, dictFile);
    if (fs.existsSync(dictFull)) {
      const dict = lib.safeJsonParse(fs.readFileSync(dictFull, "utf8"), dictFile);
      let changed = false;
      if (dict.contact?.whatsapp !== undefined) { delete dict.contact.whatsapp; changed = true; }
      if (dict.cta?.whatsapp !== undefined) { delete dict.cta.whatsapp; changed = true; }
      if (dict.cta?.whatsapp_label !== undefined) { delete dict.cta.whatsapp_label; changed = true; }
      if (changed) {
        fs.writeFileSync(dictFull, JSON.stringify(dict, null, 2) + "\n", "utf8");
        console.log("  [patched]", dictFile, "— removed whatsapp fields");
      }
    }
  }
}

module.exports = { detect, afterEnable, afterDisable };
