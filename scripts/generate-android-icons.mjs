import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourcePath = path.join(root, "public", "symbol-treseiscinco.svg");
const resRoot = path.join(root, "android", "app", "src", "main", "res");
const logoSvg = await readFile(sourcePath);

const densities = [
  { name: "mdpi", scale: 1, legacy: 48, adaptive: 108 },
  { name: "hdpi", scale: 1.5, legacy: 72, adaptive: 162 },
  { name: "xhdpi", scale: 2, legacy: 96, adaptive: 216 },
  { name: "xxhdpi", scale: 3, legacy: 144, adaptive: 324 },
  { name: "xxxhdpi", scale: 4, legacy: 192, adaptive: 432 },
];

const background = { r: 250, g: 252, b: 251, alpha: 1 };
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

async function renderLogo(side) {
  return sharp(logoSvg).resize(side, side, { fit: "contain" }).png().toBuffer();
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
  const legacyLogoSide = Math.round(legacySize * 0.86);
  const legacyLogo = await renderLogo(legacyLogoSide);
  const legacySquare = await sharp({
    create: { width: legacySize, height: legacySize, channels: 4, background }
  }).composite([{
    input: legacyLogo,
    left: Math.round((legacySize - legacyLogoSide) / 2),
    top: Math.round((legacySize - legacyLogoSide) / 2)
  }]).png().toBuffer();

  const mipmapDir = path.join(resRoot, `mipmap-${density.name}`);
  await savePng(path.join(mipmapDir, "ic_launcher.png"), legacySquare);
  await savePng(
    path.join(mipmapDir, "ic_launcher_round.png"),
    await sharp(legacySquare).composite([{ input: circleMask(legacySize), blend: "dest-in" }]).png().toBuffer()
  );

  // Android adaptive icons have a 108dp canvas; keep the artwork inside the central safe zone.
  const adaptiveSize = density.adaptive;
  const adaptiveLogoSide = Math.round(adaptiveSize * 0.78);
  const adaptiveLogo = await renderLogo(adaptiveLogoSide);
  const foreground = await sharp({
    create: { width: adaptiveSize, height: adaptiveSize, channels: 4, background: transparent }
  }).composite([{
    input: adaptiveLogo,
    left: Math.round((adaptiveSize - adaptiveLogoSide) / 2),
    top: Math.round((adaptiveSize - adaptiveLogoSide) / 2)
  }]).png().toBuffer();

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

console.log("Android icons generated from public/symbol-treseiscinco.svg for all densities.");
