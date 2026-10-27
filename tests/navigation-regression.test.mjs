import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("Proveedores stays independent and Compras only exposes purchases and expenses", () => {
  const sidebarLayoutStart = app.indexOf("const defaultSidebarLayout = () => [");
  const sidebarLayoutEnd = app.indexOf("const normalizeSidebarLayout", sidebarLayoutStart);
  const layout = app.slice(sidebarLayoutStart, sidebarLayoutEnd);
  assert.match(layout, /"purchases", "suppliers", "coupons"/);
  assert.doesNotMatch(layout, /"audit"|platform_admin/);
  assert.match(app, /screen: "suppliers"/);
  assert.doesNotMatch(app, /aria-label="Compras, gastos y proveedores"/);
  assert.doesNotMatch(app, /aria-selected=\{effectivePurchaseTab === "suppliers"\}/);
});

test("Auditorías is reachable from Estadísticas, not a separate sidebar item", () => {
  const sidebarLayoutStart = app.indexOf("const defaultSidebarLayout = () => [");
  const sidebarLayoutEnd = app.indexOf("const normalizeSidebarLayout", sidebarLayoutStart);
  const layout = app.slice(sidebarLayoutStart, sidebarLayoutEnd);
  assert.doesNotMatch(layout, /"audit"/);
  assert.match(app, /canAccessScreen\("audit"\) && <button[^>]*onClick=\{\(\) => navigate\("audit"\)\}/s);
});

test("Platform appears as an authorized Configuración tab and resets on identity changes", () => {
  assert.match(app, /\.\.\.\(isPlatformAdmin \? \[\["platform", "Plataforma"\]\] : \[\]\)/);
  assert.match(app, /settingsTab === "platform" && isPlatformAdmin && platformAdminPanel/);
  assert.match(app, /setIsPlatformAdmin\(false\);\s*setSettingsTab\("general"\);/);
  assert.match(app, /if \(next === "settings"\) return isBusinessOwner \|\| isPlatformAdmin;/);
});

test("Inicio exposes a button that prepares a shareable business-card PNG", () => {
  assert.match(app, /async function shareBusinessCard\(\)/);
  assert.match(app, /className="home-utility-action home-business-card-action" onClick=\{shareBusinessCard\}/);
  assert.match(app, /AppIcon name="business-card" size=\{16\}/);
  assert.match(app, /navigator\.share && navigator\.canShare\?\.\(\{ files: \[file\] \}\)/);
  assert.match(app, /La tarjeta se descargó como PNG/);
});

test("Desktop and tablet sidebar has no internal scroll and keeps logout in its footer", () => {
  assert.match(css, /@media \(min-width:601px\)[\s\S]*?\.sidebar\s*\{[^}]*height:100dvh;[^}]*overflow:hidden;/);
  assert.match(css, /\.sidebar > \.nav-list\s*\{[^}]*flex:1 1 auto;[^}]*overflow:hidden;/);
  assert.match(css, /\.sidebar-bottom\s*\{[^}]*flex:0 0 auto;[^}]*margin-top:auto;/);
});
