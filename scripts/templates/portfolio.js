#!/usr/bin/env node
// launchkit — Portfolio template module
// Owns: template file copy.
// Language setup is prompted and applied by setup.js via configs/setup/languages/.
// Optional sections (chatbot, sidebar, work, testimonials, webgl-hero, contact-form)
// are managed via sections.js / presets — not bundled here.

const { copyTemplateFiles } = require("../lib");

const TYPE = "portfolio";

// ── Template file copy ────────────────────────────────────────────────────────

async function setup() {
  console.log("\n─── Copying portfolio template ─────────────────────────────────\n");
  copyTemplateFiles(TYPE);
  return { type: TYPE, sections: {} };
}

module.exports = { type: TYPE, setup };
