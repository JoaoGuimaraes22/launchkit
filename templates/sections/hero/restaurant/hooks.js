// hero/restaurant — overwrites Hero.tsx with the dark parallax restaurant version.
// On disable, restore the default business Hero.tsx so the page doesn't break.

function beforeDisable({ compDir, lib }) {
  lib.copyFile(
    "templates/sections/hero/default/component.tsx",
    `${compDir}/Hero.tsx`
  );
}

module.exports = { beforeDisable };
