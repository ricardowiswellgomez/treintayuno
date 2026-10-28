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
  const itemId = String(item?.id ?? "");
  const screenId = String(item?.screen ?? "");
  if (canonicalLabels[itemId]) return canonicalLabels[itemId];
  if (canonicalLabels[screenId]) return canonicalLabels[screenId];
  const label = String(item?.label ?? "").trim();
  return label || "Módulo";
}
