import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const iconGenerator = await readFile(new URL("../scripts/generate-android-icons.mjs", import.meta.url), "utf8");
const androidWorkflow = await readFile(new URL("../.github/workflows/build.yml", import.meta.url), "utf8");

test("el acceso no ofrece ni ejecuta inicio de sesión por SMS", () => {
  assert.doesNotMatch(app, /setMode\(["']phone["']\)|mode\s*===\s*["']phone["']/);
  assert.doesNotMatch(app, /signInWithOtp\(|verifyOtp\(\{\s*phone:/);
  assert.doesNotMatch(app, /Entrar con celular|Enviar código SMS|Código SMS|requestAccountPhoneCode|verifyAccountPhoneCode/);
  assert.match(app, /supabase\.auth\.signInWithPassword/);
});

test("Mi empresa conserva su identidad y las preferencias del catálogo viven en su propia pestaña", () => {
  const companyStart = app.indexOf('hidden={settingsTab !== "company"} className="settings-tab-panel company-profile-panel"');
  const catalogStart = app.indexOf('hidden={settingsTab !== "catalog"} className="settings-tab-panel catalog-settings-panel"');
  assert.ok(companyStart >= 0 && catalogStart > companyStart);
  const companyPanel = app.slice(companyStart, catalogStart);
  const catalogPanel = app.slice(catalogStart);
  assert.doesNotMatch(companyPanel, /settings-catalog-link-panel|catalog-color-customizer|settings-hours-editor|settings-channel-choices/);
  assert.match(catalogPanel, /settings-catalog-link-panel/);
  assert.match(catalogPanel, /catalog-color-customizer/);
  assert.match(catalogPanel, /settings-hours-editor/);
  assert.match(catalogPanel, /settings-channel-choices/);
});

test("las herramientas de importar y exportar inventario están en un control compacto del encabezado", () => {
  const heading = app.indexOf('className="inventory-page-heading"');
  const popover = app.indexOf('className="inventory-import-disclosure inventory-import-popover"');
  const metrics = app.indexOf('className="inventory-metric-grid"', heading);
  assert.ok(heading >= 0 && popover > heading && metrics > popover);
  assert.match(app.slice(heading, metrics), /Importar \/ exportar/);
  assert.match(app, /downloadInventoryTemplateExcel/);
  assert.match(app, /downloadInventoryReportExcel/);
  assert.match(app, /printInventoryReportPdf/);
  assert.match(css, /\.inventory-import-popover \.inventory-data-actions\s*\{\s*position:\s*absolute/);
});

test("el catálogo muestra opciones de entrega y conserva la identidad propia de treseiscinco", () => {
  assert.match(app, /public-catalog-delivery-methods/);
  assert.match(app, /Recogida en el negocio/);
  assert.match(app, /Entrega a domicilio/);
  assert.match(css, /\.public-catalog-brand\s*\{[^}]*width:\s*132px/s);
  assert.match(css, /\.public-catalog-image\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*3/s);
  assert.match(css, /\.sidebar-nav-row \.nav-item\.active/);
  assert.match(css, /\.sidebar-contact-action/);
});

test("la impresión incrusta el SVG completo para conservar fondo y colores de texto", () => {
  assert.match(app, /<div class="card-svg" aria-label="Tarjeta comercial con colores personalizados">' \+ svg \+ '<\/div>/);
  assert.match(app, /forced-color-adjust:none!important/);
  assert.match(app, /fill="' \+ textColor \+ '"/);
  assert.match(css, /\.business-card-preview-logo\s*\{[^}]*width:\s*35%/s);
});

test("el APK usa el símbolo 365 transparente en el icono adaptativo y verifica el arte empaquetado", () => {
  assert.match(iconGenerator, /public", "symbol-treseiscinco\.svg"/);
  assert.match(iconGenerator, /renderAdaptiveForeground/);
  const sync = androidWorkflow.indexOf("npx cap sync android");
  const icons = androidWorkflow.indexOf("npm run android:icons", sync);
  assert.ok(sync >= 0 && icons > sync, "los iconos deben generarse después de Capacitor sync");
  assert.match(androidWorkflow, /android:icon="@mipmap\/ic_launcher"/);
  assert.match(androidWorkflow, /actual branded launcher (?:image|artwork) verified/);
});
