import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import worker from "../src/worker.js";
import { getSidebarItemLabel } from "../src/lib/sidebar-menu.js";
import { readFileSync as readSource } from "node:fs";

const source = readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");

function readBootRecovery() {
  const startMarker = "const bootRecovery=";
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, "Worker must declare its startup recovery script");
  const valueStart = start + startMarker.length;
  let escaped = false;
  let end = -1;
  for (let i = valueStart + 1; i < source.length; i += 1) {
    const char = source[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      end = i + 1;
      break;
    }
  }
  assert.notEqual(end, -1, "Startup recovery string must be validly quoted");
  return JSON.parse(source.slice(valueStart, end));
}

function simulateBootRecovery({ landing = false, fallback = false, empty = false } = {}) {
  const originalHTML = landing
    ? '<main class="public-landing">Treseiscinco</main>'
    : fallback
      ? '<div class="app-boot-fallback">Preparando tu espacio…</div>'
      : "";
  const root = {
    innerHTML: originalHTML,
    children: { length: empty ? 0 : 1 },
    classesAdded: [],
    classList: { add(name) { root.classesAdded.push(name); } },
    querySelector(selector) {
      if (selector.includes(".public-landing") && landing) return { className: "public-landing" };
      if (selector.includes(".app-boot-fallback") && fallback) return { className: "app-boot-fallback" };
      return null;
    }
  };
  let delayed;
  const recovery = readBootRecovery();
  runInNewContext(recovery, {
    document: { getElementById: () => root },
    window: { addEventListener() {} },
    setTimeout(callback, ms) {
      if (ms === 12000) delayed = callback;
      return 1;
    }
  });
  assert.equal(typeof delayed, "function", "Recovery timer should be registered");
  delayed();
  return { root, originalHTML };
}

test("12-second recovery never replaces the real public landing page", () => {
  const { root, originalHTML } = simulateBootRecovery({ landing: true });
  assert.equal(root.innerHTML, originalHTML);
  assert.deepEqual(root.classesAdded, []);
});

test("12-second recovery still replaces an untouched bootstrap fallback", () => {
  const { root } = simulateBootRecovery({ fallback: true });
  assert.match(root.innerHTML, /No pudimos cargar la aplicación/);
  assert.deepEqual(root.classesAdded, ["app-crash-shell"]);
});

test("12-second recovery shows a message if the mount root is empty", () => {
  const { root } = simulateBootRecovery({ empty: true });
  assert.match(root.innerHTML, /No pudimos cargar la aplicación/);
});

test("ChatGPT source parameter redirects to the same clean URL", async () => {
  const response = await worker.fetch(
    new Request("https://treseiscinco.com/?utm_source=chatgpt.com&campaign=launch"),
    {}
  );
  assert.equal(response.status, 302);
  const destination = new URL(response.headers.get("location"));
  assert.equal(destination.origin, "https://treseiscinco.com");
  assert.equal(destination.pathname, "/");
  assert.equal(destination.searchParams.has("utm_source"), false);
  assert.equal(destination.searchParams.get("campaign"), "launch");
});

test("requests without ChatGPT source parameter are not redirected", async () => {
  const response = await worker.fetch(
    new Request("https://treseiscinco.com/?campaign=launch"),
    {}
  );
  assert.notEqual(response.status, 302);
});

test("Cuentas label always wins over stale or numeric saved labels", () => {
  assert.equal(getSidebarItemLabel({ id: "accounts", screen: "accounts", label: "2" }), "Cuentas");
  assert.equal(getSidebarItemLabel({ id: "accounts", screen: "accounts", label: "" }), "Cuentas");
  assert.equal(getSidebarItemLabel({ id: "another-id", screen: "accounts", label: "2" }), "Cuentas");
});

test("sidebar rendering uses the canonical Cuentas label and icon", () => {
  const appSource = readSource(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(appSource, /getSidebarItemLabel\(item\)/);
  assert.match(appSource, /accounts:\s*<>/);
});

test("service worker cache version is incremented to evict stale sidebar bundles", () => {
  const swSource = readSource(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(swSource, /treseiscinco-shell-v4/);
});

test("sidebar text label is not styled as an icon", () => {
  const cssSource = readSource(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(cssSource, /\.nav-item \.nav-label-text\{[^}]*width:auto/);
});

test("Proveedores is reachable from Personal and keeps its purchase-management view", () => {
  const appSource = readSource(new URL("../src/App.jsx", import.meta.url), "utf8");
  const sidebarSource = appSource.slice(appSource.indexOf("const defaultSidebarLayout"), appSource.indexOf("const normalizeSidebarLayout"));
  assert.match(sidebarSource, /id: "personal".*sidebarAreaItem\("suppliers"\)/s);
  assert.match(appSource, /screen: "suppliers"/);
  assert.match(appSource, /aria-label="Compras, gastos y proveedores"/);
  assert.match(appSource, /setPurchaseModuleTab\("suppliers"\)/);
  assert.match(appSource, /canViewSuppliers && <button type="button" role="tab"/);
});

test("public catalog removes default filler/count but keeps bottom WhatsApp and the cart", () => {
  const appSource = readSource(new URL("../src/App.jsx", import.meta.url), "utf8");
  const start = appSource.indexOf("function PublicCatalog({ businessId })");
  const end = appSource.indexOf("function PublicCatalogSlugRoute", start);
  const catalog = appSource.slice(start, end);
  assert.doesNotMatch(catalog, /Explora los productos disponibles en este catálogo/);
  assert.doesNotMatch(catalog, /producto publicado/);
  assert.doesNotMatch(catalog, /className="public-catalog-whatsapp"/);
  assert.match(catalog, /className="public-catalog-bottom-whatsapp"/);
  assert.match(catalog, /className="public-catalog-cart-trigger"/);
});

test("legacy numeric sidebar groups are rehomed instead of shown as section names", () => {
  const appSource = readSource(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(appSource, /const numericHeading = \/\^\[0-9\]\+\$\//);
  assert.match(appSource, /if \(numericHeading\) \{[\s\S]*groups\.splice\(index, 1\)/);
});

test("sidebar layout keeps overflow hidden and adapts rows to viewport height", () => {
  const cssSource = readSource(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(cssSource, /Permanent no-scroll sidebar/);
  assert.match(cssSource, /\.app-shell > \.sidebar > \.nav-list\s*\{[^}]*overflow: hidden !important/s);
  assert.match(cssSource, /min-height: clamp\(16px, calc\(\(100dvh - 270px\) \/ 15\), 33px\)/);
  assert.match(cssSource, /text-overflow: ellipsis/);
});

test("Worker no longer hides the integrated Proveedores tab", () => {
  const workerSource = readSource(new URL("../src/worker.js", import.meta.url), "utf8");
  assert.doesNotMatch(workerSource, /hideSuppliers/);
});
