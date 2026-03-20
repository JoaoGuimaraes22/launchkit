const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");

const zip = new AdmZip();
const base = __dirname;

// Add root files
zip.addLocalFile(path.join(base, "agent.json"));
zip.addLocalFile(path.join(base, "package.json"));

// Add all intent files with forward-slash paths
const intentsDir = path.join(base, "intents");
for (const file of fs.readdirSync(intentsDir)) {
  zip.addLocalFile(path.join(intentsDir, file), "intents");
}

zip.writeZip(path.join(base, "portfolio-agent.zip"));
console.log("Created portfolio-agent.zip");
