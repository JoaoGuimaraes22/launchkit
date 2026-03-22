#!/usr/bin/env node
// launchkit — Blank template module
// Owns: template file copy.
// Language setup is prompted and applied by setup.js via configs/setup/languages/.

const { copyTemplateFiles } = require("../lib");

const TYPE = "blank";

// ── Template file copy ────────────────────────────────────────────────────────

async function setup() {
  console.log(`\n─── Copying blank template ─────────────────────────────────────────\n`);
  copyTemplateFiles(TYPE);
  return { type: TYPE, sections: {} };
}

module.exports = { type: TYPE, setup };
