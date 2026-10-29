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

test("el menú de importar/exportar abre con estado explícito y funciona fuera de contenedores que lo recortan", () => {
  const heading = app.indexOf('className="inventory-page-heading"');
  const trigger = app.indexOf('className={"inventory-import-trigger"');
  const metrics = app.indexOf('className="inventory-metric-grid"', heading);
  assert.ok(heading >= 0 && trigger > heading && metrics > trigger);
  assert.match(app.slice(heading, metrics), /Importar \/ exportar/);
  assert.match(app, /setInventoryDataMenuOpen\(\(open\) => !open\)/);
  assert.match(app, /aria-expanded=\{inventoryDataMenuOpen\}/);
  assert.match(app, /className="inventory-data-actions inventory-import-menu"/);
  assert.match(app, /createPortal\([\s\S]*?inventory-import-menu[\s\S]*?document\.body/);
  assert.match(app, /downloadInventoryTemplateExcel/);
  assert.match(app, /downloadInventoryReportExcel/);
  assert.match(app, /printInventoryReportPdf/);
  const finalUiFixes = css.slice(css.lastIndexOf("/* UX repair pass"));
  assert.match(finalUiFixes, /\.inventory-import-menu\s*\{[\s\S]*?box-shadow:[^;]+!important/);
  assert.match(finalUiFixes, /\.inventory-import-trigger:focus-visible/);
});

test("la ayuda contextual escapa el contenedor y se reposiciona sin quedar recortada", () => {
  assert.match(app, /import \{ createPortal \} from "react-dom"/);
  assert.match(app, /className="field-help-popover field-help-popover-portal"/);
  assert.match(app, /popoverRef\.current\?\.contains\(event\.target\)/);
  const finalUiFixes = css.slice(css.lastIndexOf("/* UX repair pass"));
  assert.match(finalUiFixes, /\.field-help-popover-portal/);
});

test("el catálogo muestra opciones de entrega y conserva la identidad propia de treseiscinco", () => {
  assert.match(app, /public-catalog-delivery-methods/);
  assert.doesNotMatch(app, /className="public-catalog-header-whatsapp"/);
  assert.match(css, /\.public-catalog-header-whatsapp/);
  assert.match(app, /Recogida en el negocio/);
  assert.match(app, /Entrega a domicilio/);
  assert.match(css, /\.public-catalog-brand\s*\{[^}]*width:\s*119px/s);
  assert.match(css, /\.public-catalog-image\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*3/s);
  assert.match(css, /\.public-catalog-grid\s*\{[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/s);
  const denseCatalogRules = css.slice(css.lastIndexOf("/* Dense desktop catalog"));
  assert.match(denseCatalogRules, /grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(denseCatalogRules, /@media \(max-width: 1180px\)[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.sidebar-nav-row \.nav-item\.active/);
  assert.match(css, /\.sidebar-contact-action/);
});

test("la vista previa de tarjeta reserva una columna real más grande para el logo", () => {
  assert.match(app, /<div class="card-svg" aria-label="Tarjeta comercial con colores personalizados">' \+ svg \+ '<\/div>/);
  assert.match(app, /forced-color-adjust:none!important/);
  assert.match(app, /fill="' \+ textColor \+ '"/);
  const finalUiFixes = css.slice(css.lastIndexOf("/* UX repair pass"));
  assert.match(finalUiFixes, /\.company-profile-panel \.business-card-preview\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1\.05fr\)\s+minmax\(0,\s*1fr\)\s*!important/);
  assert.match(finalUiFixes, /\.company-profile-panel \.business-card-preview-logo img\s*\{[\s\S]*?max-height:\s*220px\s*!important/);
});

test("la descripción pública del producto se puede editar desde su ficha", () => {
  assert.match(app, /Descripción para el catálogo/);
  assert.match(app, /value=\{productForm\.description\}/);
  assert.match(app, /setProductForm\(\{ \.\.\.productForm, description: e\.target\.value \}\)/);
  assert.match(app, /La descripción se muestra a tus clientes en el catálogo/);
  assert.match(app, /product\.description \|\|/);
});

test("Nequi y DaviPlata recuperan las tarjetas de color morado y rojo como los demás medios de pago", () => {
  assert.match(app, /\{mark\}<\/span><strong>\{method\}<\/strong>/);
  assert.doesNotMatch(app, /payment-method-brand-nequi|payment-method-brand-daviplata|Símbolo de Nequi|Símbolo de DaviPlata/);
  const requested = css.slice(css.lastIndexOf("/* Requested refinements: upload filled inventory sheets"));
  assert.match(requested, /\.payment-method-tile-nq\s*\{[\s\S]*?background:\s*#F4ECFF/s);
  assert.match(requested, /\.payment-method-tile-dv\s*\{[\s\S]*?background:\s*#FFF0EF/s);
  assert.match(requested, /\.payment-method-mark-nq\s*\{[\s\S]*?background:\s*#E4D3FF/s);
  assert.match(requested, /\.payment-method-mark-dv\s*\{[\s\S]*?background:\s*#FFD8D5/s);
});

test("el APK usa el símbolo 365 transparente en el icono adaptativo y verifica el arte empaquetado", () => {
  assert.match(iconGenerator, /public", "symbol-treseiscinco\.svg"/);
  assert.match(iconGenerator, /renderAdaptiveForeground/);
  const sync = androidWorkflow.indexOf("npx cap sync android");
  const icons = androidWorkflow.indexOf("npm run android:icons", sync);
  assert.ok(sync >= 0 && icons > sync, "los iconos deben generarse después de Capacitor sync");
  assert.match(androidWorkflow, /android:icon="@mipmap\/ic_launcher"/);
  assert.match(androidWorkflow, /actual (?:PNG payloads|branded launcher artwork) verified/);
});


test("el inventario usa espaciado compacto entre métricas, impuestos y búsqueda", () => {
  const compact = css.slice(css.lastIndexOf("/* Compact Inventory: reduce vertical gaps"));
  assert.ok(compact.length > 0);
  assert.match(compact, /\.products-page \.inventory-overview\s*\{[^}]*gap:\s*8px\s*!important/s);
  assert.match(compact, /\.products-page \.inventory-metric-grid \.inventory-metric-card\s*\{[^}]*padding:\s*9px 10px\s*!important/s);
  assert.match(compact, /\.products-page \.bulk-tax-content\s*\{[^}]*padding:\s*9px 10px\s*!important/s);
  assert.match(compact, /\.products-page \.inventory-controls\.panel\s*\{[^}]*margin-top:\s*5px\s*!important/s);
  assert.match(compact, /@media \(max-width: 760px\)/);
});


test("la plantilla Excel completada puede subirse en .xls, .xlsx o CSV", () => {
  assert.match(app, /Subir plantilla llena/);
  assert.match(app, /accept="\.xls,\.xlsx,\.csv/);
  assert.match(app, /parseHtmlExcelRows/);
  assert.match(app, /parseXlsxRows/);
  assert.match(app, /new DecompressionStream\("deflate-raw"\)/);
  assert.match(app, /La fila de ejemplo se omite/);
  assert.match(app, /rowName==="ej\. camiseta blanca"/);
});

test("el catálogo no muestra WhatsApp junto al carrito y mueve las opciones de entrega junto a COP", () => {
  assert.doesNotMatch(app, /className="public-catalog-header-whatsapp"/);
  const introStart = app.indexOf('<div className="public-catalog-intro">');
  const introEnd = app.indexOf("{returnedMessage", introStart);
  assert.ok(introStart >= 0 && introEnd > introStart);
  const intro = app.slice(introStart, introEnd);
  assert.ok(intro.indexOf("public-business-hours-status") >= 0);
  assert.ok(intro.indexOf("public-catalog-intro-actions") > intro.indexOf("public-business-hours-status"));
  assert.ok(intro.indexOf("public-catalog-delivery-methods") > intro.indexOf("public-business-hours-status"));
  assert.ok(intro.indexOf("public-catalog-currency") > intro.indexOf("public-catalog-delivery-methods"));
  const requested = css.slice(css.lastIndexOf("/* Requested refinements: upload filled inventory sheets"));
  assert.match(requested, /\.public-catalog-intro-actions\s*\{[\s\S]*?justify-content:\s*flex-end/s);
});

test("las retenciones se explican por separado y no se presentan como impuesto fijo del producto", () => {
  assert.match(app, /Retenciones: Retefuente, ReteIVA y ReteICA/);
  assert.match(app, /Este selector corresponde al IVA y al impuesto al consumo de los artículos/);
  assert.match(app, /no las calcula automáticamente/);
  assert.match(app, /confirma su aplicación con un contador o la DIAN/);
});

test("Inicio conserva el botón de compartir con su clase de estilo anterior", () => {
  assert.match(app, /className="home-utility-action home-share-card-button"/);
  assert.doesNotMatch(app, /className="home-utility-action home-share-business-card"/);
  assert.match(css, /\.home-share-card-button\s*\{/);
});


test("Ventas muestra iconos de ayuda reales en el bloque de caja visible al entrar", () => {
  const start = app.indexOf('<section className="cash-register-panel panel">');
  const end = app.indexOf('<div className="sales-date-toolbar panel">', start);
  assert.ok(start >= 0 && end > start, "debe localizarse el bloque de caja de Ventas");
  const cashPanel = app.slice(start, end);
  assert.match(cashPanel, /className="cash-register-title-row"[\s\S]*?<FieldHelp enabled=\{contextualHelpEnabled\}/);
  assert.match(cashPanel, /Efectivo inicial<FieldHelp enabled=\{contextualHelpEnabled\}/);
  assert.match(cashPanel, /Efectivo contado al cierre<FieldHelp enabled=\{contextualHelpEnabled\}/);
  assert.match(cashPanel, /Notas del turno<FieldHelp enabled=\{contextualHelpEnabled\}/);
  const visibleHelp = css.slice(css.lastIndexOf("/* Contextual help icons visibly present"));
  assert.match(visibleHelp, /\.app-shell \.field-help-wrap\s*\{[\s\S]*?display:\s*inline-flex\s*!important/);
  assert.match(visibleHelp, /\.app-shell \.field-help-trigger\s*\{[\s\S]*?display:\s*inline-grid\s*!important/);
  assert.match(visibleHelp, /background:\s*var\(--paper,\s*#FFFFFF\)\s*!important/);
});



test("las cotizaciones muestran filas alineadas y proveedores conserva su módulo propio", () => {
  assert.match(app, /title: "Proveedores"[\s\S]*?screen: "suppliers"/);
  assert.match(app, /sidebarAreaItem\("suppliers"\)/);
  const purchaseTabsStart = app.indexOf('className="purchase-module-tabs"');
  const purchaseTabsEnd = app.indexOf("</div>", purchaseTabsStart);
  const purchaseTabs = app.slice(purchaseTabsStart, purchaseTabsEnd);
  assert.match(purchaseTabs, /aria-label="Compras y gastos"/);
  assert.doesNotMatch(purchaseTabs, />Proveedores<\/button>/);
  assert.match(app, /if \(next === "suppliers"\) return isBusinessManager \|\| canViewSuppliers \|\| canViewPurchases/);
  assert.match(app, /if \(next === "purchases"\) return canViewPurchases \|\| canViewExpenses/);
  assert.match(app, /className="field-label-heading">Seleccionar cliente registrado<FieldHelp enabled=\{contextualHelpEnabled\}/);
  assert.match(app, /className="field-label-heading">Válida hasta<FieldHelp enabled=\{contextualHelpEnabled\}/);
  assert.match(app, /className="field-label-heading">Valor por hora \(COP\)<FieldHelp enabled=\{contextualHelpEnabled\}/);
  const alignedRows = css.slice(css.lastIndexOf("/* Cotizaciones: filas alineadas por bloques"));
  assert.match(alignedRows, /grid-template-areas:"meta customer totals toggle"/);
  assert.match(alignedRows, /grid-area:details/);
  assert.match(app, /className="quote-record-disclosure-bar"/);
  assert.match(app, /className="quote-record-details" hidden=\{expandedQuoteId !== quote.id\}/);
});
