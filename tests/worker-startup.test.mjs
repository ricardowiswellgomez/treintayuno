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

test("Proveedores remains a standalone module while Auditorías and platform administration are nested", () => {
  const appSource = readSource(new URL("../src/App.jsx", import.meta.url), "utf8");
  const sidebarSource = appSource.slice(appSource.indexOf("const defaultSidebarLayout"), appSource.indexOf("const normalizeSidebarLayout"));
  assert.ok(sidebarSource.includes('id: "suppliers", screen: "suppliers", label: "Proveedores"'));
  assert.ok(!sidebarSource.includes('screen: "audit"'));
  assert.ok(!sidebarSource.includes('screen: "platform_admin"'));
  assert.ok(appSource.includes('...(isPlatformAdmin ? [["platform", "Plataforma"]] : [])'));
  assert.ok(appSource.includes('settingsTab === "platform" && platformAdminPanel'));
  assert.ok(appSource.includes('onClick={() => navigate("audit")}>Historial de cambios'));
  assert.ok(!appSource.includes('screen==="platform_admin"?" active"'));
});

test("sidebar layout keeps overflow hidden and adapts rows to viewport height", () => {
  const cssSource = readSource(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.ok(cssSource.includes("Permanent no-scroll sidebar"));
  assert.ok(/\.app-shell > \.sidebar > \.nav-list\s*\{[^}]*overflow: hidden !important/s.test(cssSource));
  assert.ok(cssSource.includes("min-height: clamp(16px, calc((100dvh - 270px) / 15), 33px)"));
  assert.ok(cssSource.includes("text-overflow: ellipsis"));
});

test("Worker does not override supplier module visibility", () => {
  const workerSource = readSource(new URL("../src/worker.js", import.meta.url), "utf8");
  assert.ok(!workerSource.includes("hideSuppliers"));
});
