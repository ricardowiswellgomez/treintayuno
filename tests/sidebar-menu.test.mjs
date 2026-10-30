import test from "node:test";
import assert from "node:assert/strict";
import { getSidebarItemLabel } from "../src/lib/sidebar-menu.js";

test("Cupones no hereda etiquetas antiguas o numéricas guardadas", () => {
  assert.equal(getSidebarItemLabel({ id: "coupons", label: "4" }), "Cupones");
  assert.equal(getSidebarItemLabel({ id: "coupons", label: "CUPONES" }), "Cupones");
});

test("Proveedores mantiene su nombre canónico aunque el menú guardado esté desactualizado", () => {
  assert.equal(getSidebarItemLabel({ id: "suppliers", label: "4" }), "Proveedores");
  assert.equal(getSidebarItemLabel({ id: "suppliers", label: "Compras y proveedores" }), "Proveedores");
});

test("Otros nombres personalizados continúan respetándose", () => {
  assert.equal(getSidebarItemLabel({ id: "custom-module", label: "Mi sección" }), "Mi sección");
});

test("Bancos conserva una etiqueta canónica aunque exista una etiqueta antigua", () => {
  assert.equal(getSidebarItemLabel({ id: "banks", label: "4" }), "Bancos");
  assert.equal(getSidebarItemLabel({ screen: "banks", label: "Mis finanzas" }), "Bancos");
});
