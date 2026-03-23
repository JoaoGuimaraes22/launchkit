// contact/map — replaces Contact.tsx with a combined info+map version (gutsy style)
// Hooks inject/remove the contactMap prop from the Contact JSX in page.tsx.

function afterEnable({ compDir, pageFile, lib }) {
  // Overwrite Contact.tsx with the combined contact info + map component
  lib.copyFile(
    "templates/sections/contact/map/component.tsx",
    `${compDir}/Contact.tsx`
  );
  // Add contactMap prop to the existing <Contact contact={dict.contact} … /> in page.tsx
  lib.replaceInFile(
    pageFile,
    "contact={dict.contact}",
    "contact={dict.contact} contactMap={dict.contactMap}"
  );
}

function beforeDisable({ compDir, pageFile, lib, state }) {
  const projectType = state?.type;

  if (projectType === "restaurant") {
    // contact/map is baked into the restaurant template — cannot remove
    console.warn("  ⚠  contact/map is part of the restaurant template and cannot be removed.");
    return;
  }

  // Restore the standard business Contact.tsx (form + info, single prop)
  lib.copyFile(
    "templates/presets/business/app/[locale]/components/Contact.tsx",
    `${compDir}/Contact.tsx`
  );
  // Remove contactMap prop before standardDisable cleans up the ContactMap lines
  lib.replaceInFile(
    pageFile,
    "contact={dict.contact} contactMap={dict.contactMap}",
    "contact={dict.contact}"
  );
}

function detect({ compDir, lib }) {
  const fs = require("fs");
  const path = require("path");
  const f = path.join(lib.target(), compDir, "Contact.tsx");
  if (!fs.existsSync(f)) return false;
  const c = fs.readFileSync(f, "utf8");
  // The combined contact/map version dispatches 'open-reservation' from Contact.tsx
  return c.includes("open-reservation");
}

module.exports = { afterEnable, beforeDisable, detect };
