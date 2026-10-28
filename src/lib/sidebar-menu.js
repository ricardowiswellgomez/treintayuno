/**
 * Canonical labels for sidebar modules.
 * Critical destinations stay readable even if a saved layout contains stale labels
 * (for example, a numeric value left by an older navigation configuration).
 */
export function getSidebarItemLabel(item) {
  const canonicalLabels = {
    accounts: "Cuentas",
    coupons: "Cupones",
    suppliers: "Proveedores"
  };
  const key = item?.id || item?.screen;
  if (key && canonicalLabels[key]) return canonicalLabels[key];
  const label = String(item?.label ?? "").trim();
  return label || "Módulo";
}
