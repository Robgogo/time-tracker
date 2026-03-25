const fs = require("fs");
const path = require("path");

const iconsDir = path.join(__dirname, "..", "public", "icons");

// Generate placeholder icons (valid PNGs)
const names = ["icon-192x192.png", "icon-512x512.png", "apple-touch-icon.png"];

// Minimal valid blue PNG
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==",
  "base64"
);

for (const name of names) {
  fs.writeFileSync(path.join(iconsDir, name), png);
  console.log(`Generated placeholder ${name}`);
}

console.log("\nFor production, replace with real icons at public/icons/");
