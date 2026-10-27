/**
 * Canonical labels for sidebar modules.
 * Keep critical navigation names independent from persisted/custom labels.
 */
export function getSidebarItemLabel(item) {
  if (item?.id === "accounts" || item?.screen === "accounts") return "Cuentas";
  const label = String(item?.label ?? "").trim();
  return label || "Módulo";
}
