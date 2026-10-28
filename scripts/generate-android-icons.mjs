import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const fullIconPath = path.join(root, "public", "icon-treseiscinco-512.svg");
const resRoot = path.join(root, "android", "app", "src", "main", "res");
const fullIconSvg = await readFile(fullIconPath);

const densities = [
  { name: "mdpi", scale: 1, legacy: 48, adaptive: 108 },
  { name: "hdpi", scale: 1.5, legacy: 72, adaptive: 162 },
  { name: "xhdpi", scale: 2, legacy: 96, adaptive: 216 },
  { name: "xxhdpi", scale: 3, legacy: 144, adaptive: 324 },
  { name: "xxxhdpi", scale: 4, legacy: 192, adaptive: 432 },
];

const background = { r: 250, g: 252, b: 251, alpha: 1 };
async function renderFullBrandIcon(side) {
  // Both Android launcher variants use the official treseiscinco 365 app icon.
  // Never derive an icon from a numeric placeholder or a generic Capacitor asset.
  return sharp(fullIconSvg).resize(side, side, { fit: "contain" }).png().toBuffer();
}

async function savePng(filePath, buffer) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
}

function circleMask(side) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" viewBox="0 0 ${side} ${side}"><circle cx="${side / 2}" cy="${side / 2}" r="${side / 2}" fill="#fff"/></svg>`
  );
}

for (const density of densities) {
  const legacySize = density.legacy;
  const legacySquare = await renderFullBrandIcon(legacySize);

  const mipmapDir = path.join(resRoot, `mipmap-${density.name}`);
  await savePng(path.join(mipmapDir, "ic_launcher.png"), legacySquare);
  await savePng(
    path.join(mipmapDir, "ic_launcher_round.png"),
    await sharp(legacySquare).composite([{ input: circleMask(legacySize), blend: "dest-in" }]).png().toBuffer()
  );

  // Android adaptive icons use the full official app artwork as the foreground.
  // This preserves the branded gradient and 365 mark on launchers that prefer adaptive icons.
  const adaptiveSize = density.adaptive;
  const foreground = await renderFullBrandIcon(adaptiveSize);

  await savePng(path.join(mipmapDir, "ic_launcher_foreground.png"), foreground);
}

const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/treseiscinco_icon_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;
await mkdir(path.join(resRoot, "mipmap-anydpi-v26"), { recursive: true });
await writeFile(path.join(resRoot, "mipmap-anydpi-v26", "ic_launcher.xml"), adaptiveXml);
await writeFile(path.join(resRoot, "mipmap-anydpi-v26", "ic_launcher_round.xml"), adaptiveXml);

const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="treseiscinco_icon_background">#FAFCFB</color>
</resources>
`;
await mkdir(path.join(resRoot, "values"), { recursive: true });
await writeFile(path.join(resRoot, "values", "treseiscinco_icon_colors.xml"), colorsXml);

console.log("Android legacy and adaptive launcher icons generated from public/icon-treseiscinco-512.svg (official treseiscinco 365 artwork).");
