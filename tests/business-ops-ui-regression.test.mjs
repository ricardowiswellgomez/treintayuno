import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const iconGenerator = await readFile(new URL("../scripts/generate-android-icons.mjs", import.meta.url), "utf8");
const worker = await readFile(new URL("../src/worker.js", import.meta.url), "utf8");
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



test("Cotizaciones es independiente de Ventas y Proveedores conserva su módulo propio", () => {
  assert.match(app, /title: "Proveedores"[\s\S]*?screen: "suppliers"/);
  const defaultMenuStart = app.indexOf("const defaultSidebarLayout = () => [");
  const defaultMenuEnd = app.indexOf("const normalizeSidebarLayout", defaultMenuStart);
  const defaultMenu = app.slice(defaultMenuStart, defaultMenuEnd);
  assert.match(defaultMenu, /items: \["products", "sales", "quotes", "customers", "suppliers", "catalog"\]/);
  assert.doesNotMatch(app, /SalesModuleCards/);
  assert.match(app, /quotes: "comercial"/);
  assert.match(app, /screen === "quotes" \? "PROPUESTAS COMERCIALES"/);
  assert.match(app, /suppliers: "comercial"/);
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
  const alignedRows = css.slice(css.lastIndexOf("/* Cotizaciones: mismas dimensiones y ritmo visual que las filas de Ventas. */"));
  assert.match(alignedRows, /grid-template-areas:"meta customer totals toggle"/);
  assert.match(alignedRows, /\.app-shell \.quotes-page \.quote-record\s*\{[\s\S]*?grid-template-columns:minmax\(155px,.95fr\) minmax\(160px,1fr\) minmax\(270px,1.65fr\) minmax\(230px,1.25fr\)!important;[\s\S]*?min-height:136px!important;[\s\S]*?padding:18px 22px!important;[\s\S]*?border-radius:16px!important/);
  assert.match(alignedRows, /grid-area:details/);
  assert.match(alignedRows, /@media \(max-width:680px\)[\s\S]*?min-height:0!important/);
  assert.match(alignedRows, /\.app-shell \.quotes-page \.quote-record-bottom>div:first-child \{border-left:0!important\}/);
  assert.match(app, /className="quote-record-disclosure-bar"/);
  const quoteDisclosureStart = app.indexOf('className="quote-record-disclosure-bar"');
  const quoteDetailsStart = app.indexOf('className="quote-record-details"', quoteDisclosureStart);
  const quoteDisclosure = app.slice(quoteDisclosureStart, quoteDetailsStart);
  assert.match(quoteDisclosure, /className="quote-record-inline-actions"/);
  assert.match(quoteDisclosure, /Ver detalles \(\$\{quote\.items\.length\}\)/);
  assert.match(quoteDisclosure, /onClick=\{\(\) => shareQuoteImage\(quote\)\}>Compartir imagen<\/button>/);
  assert.match(css, /\.app-shell \.quotes-page \.quote-share-inline/);
  assert.match(app, /className="quote-record-details" hidden=\{expandedQuoteId !== quote.id\}/);
});

test("la ruta heredada de administración no monta su panel hasta confirmar autorización", () => {
  const route = app.indexOf('screen === "platform_admin" ?');
  assert.ok(route >= 0);
  const guardedRoute = app.slice(route, route + 280);
  assert.match(guardedRoute, /isPlatformAdminReady && isPlatformAdmin \? renderPlatformAdminPanel\(\)/);
  assert.match(app, /screen !== "platform_admin" \|\| !isPlatformAdminReady/);
});

test("Bancos se ofrece a propietarios y administradores y no a perfiles de empleado", () => {
  assert.match(app, /if \(next === "banks"\) return isBusinessManager/);
  assert.match(app, /screen === "banks" \? \(/);
  assert.match(app, /bankDashboardBusinessId === activeBusiness\?\.id/);
  assert.match(app, /requestId !== bankDashboardRequestRef\.current/);
  assert.match(app, /const visibleBankAccountOptions = isBusinessManager && activeBusiness\?\.id/);
  assert.match(app, /!isBusinessManager[\s\S]*?Acceso restringido/);
  assert.match(app, /bankDashboard\.summary\?\.balance_minor/);
  assert.match(app, /rpc\("create_bank_transfer"/);
  assert.match(app, /bank_account_id: expenseDraft\.payment_method === "Efectivo" \? null/);
});

test("los subtítulos de categorías del menú solo aparecen al personalizar la navegación", () => {
  const navStart = app.indexOf('<nav className={"nav-list"');
  const navEnd = app.indexOf("</nav>", navStart);
  assert.ok(navStart >= 0 && navEnd > navStart, "debe localizarse la navegación lateral");
  const sidebarNav = app.slice(navStart, navEnd);
  assert.match(
    sidebarNav,
    /\{sidebarEditing && !group\.items\.some\(\(navItem\) => navItem\.id === "home"\) && <div className="sidebar-group-heading">/
  );
  assert.doesNotMatch(
    sidebarNav,
    /\{!group\.items\.some\(\(navItem\) => navItem\.id === "home"\) && <div className="sidebar-group-heading">/
  );
});

test("Bancos registra sus cuentas y movimientos en Auditorías", () => {
  assert.match(app, /bank_accounts:"cuenta bancaria"/);
  assert.match(app, /bank_movements:"movimiento bancario"/);
  assert.match(app, /bank_name:"Entidad bancaria"/);
  assert.match(app, /account_last4:"Últimos cuatro dígitos"/);
});

 
test("el sidebar deja de dibujar contenedores alrededor de las categorías y amplía el logo del negocio", () => {
  const sidebarRefinements = css.slice(css.lastIndexOf("/* Sidebar cleanup: category groups stay structurally sortable but have no visible container. */"));
  assert.match(sidebarRefinements, /\.sidebar-nav-group,[\s\S]*?border:\s*0!important;[\s\S]*?background:\s*transparent!important/);
  assert.match(sidebarRefinements, /\.nav-list-editing \.sidebar-nav-group[\s\S]*?box-shadow:\s*none!important/);
  assert.match(sidebarRefinements, /\.business-logo-stage\s*\{[\s\S]*?height:\s*115px!important;[\s\S]*?margin:\s*12px 0 8px!important/);
  assert.match(sidebarRefinements, /@media\(max-width:760px\)[\s\S]*?height:\s*99px!important;[\s\S]*?margin:\s*10px 0 7px!important/);
});

 
test("el menú predeterminado coloca Cotizaciones después de Ventas, Clientes y Proveedores después de Cotizaciones y Bancos antes de Cupones para todos los perfiles", () => {
  const defaultStart = app.indexOf("const defaultSidebarLayout = () => [");
  const normalizeEnd = app.indexOf("const currencyDigits", defaultStart);
  assert.ok(defaultStart >= 0 && normalizeEnd > defaultStart);
  const sidebarLogic = app.slice(defaultStart, normalizeEnd);
  assert.match(sidebarLogic, /items: \["products", "sales", "quotes", "customers", "suppliers", "catalog"\]/);
  assert.match(sidebarLogic, /items: \["stats", "profitability", "accounts", "purchases", "banks", "coupons", "payments"\]/);
  assert.match(sidebarLogic, /customers: "comercial"/);
  assert.match(sidebarLogic, /suppliers: "comercial"/);
  assert.match(sidebarLogic, /repositionItem\("comercial", "quotes", "sales", "after"\)/);
  assert.match(sidebarLogic, /repositionItem\("comercial", "customers", "quotes", "after"\)/);
  assert.match(sidebarLogic, /repositionItem\("comercial", "suppliers", "customers", "after"\)/);
  assert.match(sidebarLogic, /repositionItem\("finanzas", "banks", "coupons", "before"\)/);
});

test("el sidebar baja y amplía el logo 365, redondea el logo del negocio y aumenta el espacio antes del menú", () => {
  const navigationSpacing = css.slice(css.lastIndexOf("/* Sidebar final polish: circular business logo"));
  assert.match(navigationSpacing, /padding:\s*14px 4px 0!important/);
  assert.match(navigationSpacing, /width:min\(100%,189px\)!important;[\s\S]*?max-height:69px!important/);
  assert.match(navigationSpacing, /margin-bottom:24px!important/);
  assert.match(navigationSpacing, /width:132px!important;[\s\S]*?height:132px!important;[\s\S]*?border-radius:50%!important/);
  assert.match(navigationSpacing, /margin:18px 0 24px!important/);
  assert.match(navigationSpacing, /margin-bottom:34px!important/);
  assert.match(navigationSpacing, /@media\(max-width:760px\)[\s\S]*?width:min\(100%,147px\)!important;[\s\S]*?height:112px!important/);
});;



test("Celeste usa Aura-2 español con el speaker oficial y devuelve MP3 real", () => {
  assert.ok(worker.includes("@cf/deepgram/aura-2-es"));
  assert.ok(worker.includes('speaker:"celeste"'));
  assert.ok(worker.includes('encoding:"mp3"'));
  assert.ok(worker.includes("returnRawResponse:true"));
  assert.ok(worker.includes('"Content-Type":"audio/mpeg"'));
  assert.ok(worker.includes('"X-TTS-Speaker":"celeste"'));
  assert.ok(app.includes('fetch("/api/ai/speech"'));
  assert.ok(app.includes("Escuchar con Celeste"));
  assert.ok(!app.includes("speechSynthesis") && !app.includes("SpeechSynthesisUtterance"));
});
test("la IA recibe el contexto de la pantalla abierta y sus gráficos accesibles", () => {
  assert.ok(app.includes("captureAiScreenContext"));
  assert.ok(app.includes("screenContext: captureAiScreenContext()"));
  assert.ok(app.includes("GRÁFICOS VISIBLES"));
  assert.ok(worker.includes("CONTEXTO DE LA PANTALLA QUE EL USUARIO TIENE ABIERTA"));
});
test("las ayudas contextuales conservan reglas y cálculos y retiran ayudas obvias o duplicadas", () => {
  const helpCount = app.split("<FieldHelp").length - 1;
  assert.ok(helpCount < 143);
  assert.ok(helpCount >= 55);
  assert.ok(!app.includes("Escribe el nombre que se mostrará en tu cuenta"));
  assert.ok(!app.includes("Nombre de la persona de contacto. Si registras una empresa"));
  assert.ok(app.includes("Si el producto ya está en tu inventario"));
  assert.ok(app.includes("Cada combinación, por ejemplo Rojo / Talla S"));
});

test("los gráficos de líneas y barras exponen etiquetas y cifras para que la IA pueda interpretarlos", () => {
  assert.ok(app.includes('seriesList.map((item)=>item.label+": "+rows.slice(0,18)'));
  assert.ok(app.includes('(data||[]).slice(0,24).map((item)=>(item.label||item.key||"Dato")+": "'));
  assert.ok(app.includes("GRÁFICOS VISIBLES"));
});

test("la IA reconoce su nombre configurable y el nombre visible del perfil del usuario", () => {
  assert.ok(app.includes('const [settingsAssistantName, setSettingsAssistantName] = useState("Angie")'));
  assert.ok(app.includes('assistant_name: normalizedAssistantName'));
  assert.ok(app.includes('assistantName: assistantDisplayName'));
  assert.ok(worker.includes('profiles",{select:"display_name"'));
  assert.ok(worker.includes('Te llamas "+assistantName'));
});
test("la IA aprende solo preferencias y objetivos expresamente solicitados y permite borrarlos", () => {
  assert.ok(worker.includes("detectAssistantMemory"));
  assert.ok(worker.includes("assistant_memories"));
  assert.ok(worker.includes("resolution=merge-duplicates"));
  assert.ok(worker.includes("MEMORIA GUARDADA CORRECTAMENTE"));
  assert.ok(worker.includes("SOLICITUD DE RECUERDO RECHAZADA"));
  assert.ok(app.includes("Borrar mis recuerdos de este negocio"));
});

test("el nombre del asistente se limita a caracteres seguros y la memoria conserva RLS por usuario y negocio", async () => {
  const migration = await readFile(new URL("../supabase/migrations/20261030071434_assistant_memories.sql", import.meta.url), "utf8");
  assert.ok(worker.includes('replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ._-]/g,"")'));
  assert.ok(migration.includes("enable row level security"));
  assert.ok(migration.includes("assistant_memories_delete_own_business"));
  assert.ok(migration.includes("unique (user_id,business_id,memory_key)"));
});
