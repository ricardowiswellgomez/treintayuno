import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase, supabasePublishableKey } from "./lib/supabase.js";
import { applyAppLanguage } from "./i18n.js";

function AppIcon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, focusable: "false" };
  const glyphs = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
    products: <><path d="m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3Z" /><path d="m3.4 7.6 8.6 4.7 8.6-4.7M12 12.3V21" /></>,
    sales: <><path d="M4 4.5h16v15H4z" /><path d="M8 9h8M8 13h4M8 16h8" /></>,
    stats: <><path d="M4 20V11h4v9M10 20V4h4v16M16 20v-7h4v7" /></>,
    quotes: <><path d="M7 3h8l4 4v14H7z" /><path d="M15 3v5h4M10 12h6M10 16h6" /></>,
    customers: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-1.5a5.5 5.5 0 0 1 11 0V20M16 5.5a3 3 0 0 1 0 5.8M18 14a4 4 0 0 1 2.5 3.7V20" /></>,
    profitability: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 5-6" /><path d="M16 7h3v3" /></>,
    purchases: <><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 9H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>,
    catalog: <><path d="M3 10h18l-2-6H5l-2 6Z" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    list: <><path d="M9 6h12M9 12h12M9 18h12" /><path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth="3" /></>,
    audit: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    team: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.5a3 3 0 0 1 0 5.8M18 14a4 4 0 0 1 3 4v2" /></>,
    suppliers: <><path d="M3 6h11v12H3zM14 10h4l3 3v5h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>,
    payments: <><path d="M4 6h16v12H4z" /><path d="M4 10h16M8 15h3" /></>,
    receivables: <><path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h5M14 16l2 2 3-4" /></>,
    payables: <><path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h5M14 16l2-2 3 4" /></>,
    coupons: <><path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V6Z" /><path d="m9 9 6 6M15 9h.01M9 15h.01" /></>,
    edit: <><path d="m4 16.5-.8 4.3 4.3-.8L20 7.5 16.5 4 4 16.5Z" /><path d="m14.8 5.7 3.5 3.5" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 2.9-.2-.1a1.7 1.7 0 0 0-1.9.1l-.2.1-3.3-.9-.1-.2a1.7 1.7 0 0 0-1.3-1.2h-.2l-1.1-3.2.1-.2a1.7 1.7 0 0 0-.4-1.8l-.1-.2.9-3.2.2-.1a1.7 1.7 0 0 0 1.2-1.3v-.2l3.2-1.1.2.1a1.7 1.7 0 0 0 1.8-.4l.2-.1 3.2.9.1.2a1.7 1.7 0 0 0 1.3 1.2h.2l1.1 3.2-.1.2a1.7 1.7 0 0 0 .4 1.8l.1.2-.9 3.2-.2.1" transform="translate(-2 -2) scale(1.08)" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.6 2.6 0 1 1 4.5 1.8c-1.1 1-2 1.3-2 3M12 17h.01" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    "chevron-down": <><path d="m6 9 6 6 6-6" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
    expenses: <><path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h5M8 16h3M16 15v3" /></>
  };
  return <svg {...common}>{glyphs[name] || <circle cx="12" cy="12" r="8" />}</svg>;
}

function SimpleBars({ title, description, data, formatValue }) {
  const maxValue = Math.max(1,...(data||[]).map((item)=>Math.abs(Number(item.value)||0)));
  return <section className="simple-chart panel">
    <div className="simple-chart-heading"><div><h3>{title}</h3><p>{description}</p></div><span className="simple-chart-badge">7 días</span></div>
    {data?.length ? <div className="simple-chart-bars" role="img" aria-label={title}>
      {data.map((item,index)=><div className="simple-chart-column" key={item.key||item.label||index}>
        <div className="simple-chart-value">{formatValue ? formatValue(item.value) : item.value}</div>
        <div className="simple-chart-track"><div className={"simple-chart-bar"+(Number(item.value)<0?" negative":"")} style={{height:Math.max(3,Math.abs(Number(item.value)||0)/maxValue*100)+"%"}} /></div>
        <span className="simple-chart-label">{item.label}</span>
      </div>)}
    </div> : <p className="simple-chart-empty">Aún no hay datos suficientes para formar el gráfico.</p>}
    <div className="simple-chart-footnote">Valores calculados a partir de movimientos registrados, no de estimaciones.</div>
  </section>;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const areas = [
  { icon: "▦", title: "Productos", description: "Artículos, existencias, costos y precios.", screen: "products" },
  { icon: "↗", title: "Ventas", description: "Registra ventas, abonos y saldos.", screen: "sales" },
  { icon: "↗", title: "Cuentas por cobrar", description: "Controla las ventas pendientes y registra abonos de tus clientes.", screen: "receivables" },
  { icon: "↙", title: "Cuentas por pagar", description: "Controla las compras pendientes y registra pagos a proveedores.", screen: "payables" },
  { icon: "▥", title: "Estadísticas", description: "Ventas, cobros, gastos y balance del negocio.", screen: "stats" },
  { icon: "▧", title: "Cotizaciones", description: "Prepara propuestas comerciales y consulta su estado.", screen: "quotes" },
  { icon: "◎", title: "Clientes", description: "Personas y empresas relacionadas con tus ventas.", screen: "customers" },
  { icon: "◷", title: "Rentabilidad", description: "Costos, margen y utilidad de tu negocio.", screen: "profitability" },
  { icon: "▤", title: "Compras y gastos", description: "Compras, proveedores y gastos.", screen: "purchases" },
  { icon: "◉", title: "Catálogo", description: "Un catálogo público para tus clientes.", screen: "catalog" },
  { icon: "%", title: "Cupones de descuento", description: "Crea promociones y controla sus usos.", screen: "coupons" },
  { icon: "₱", title: "Pagos verificados", description: "Conecta la cuenta de cobro de este negocio.", screen: "payments" },
  { icon: "⌘", title: "Equipo y permisos", description: "Accesos para empleados según su función.", screen: "team" },
  { icon: "◷", title: "Auditorías", description: "Consulta quién hizo cada cambio y cuándo.", screen: "audit" }
];

const sidebarAreaItem = (screen, label = null) => {
  const area = areas.find((candidate) => candidate.screen === screen);
  return area ? { id: area.screen, screen: area.screen, label: label || area.title, icon: area.icon } : null;
};
const defaultSidebarLayout = () => [
  { id: "inicio", type: "group", title: "", items: [{ id: "home", screen: "home", label: "Inicio", icon: "⌂" }] },
  { id: "comercial", type: "group", title: "COMERCIAL", items: ["products", "sales", "quotes", "catalog"].map(sidebarAreaItem).filter(Boolean) },
  { id: "finanzas", type: "group", title: "FINANZAS", items: ["stats", "profitability", "receivables", "payables", "purchases", "coupons", "payments"].map(sidebarAreaItem).filter(Boolean) },
  { id: "personal", type: "group", title: "PERSONAL", items: [sidebarAreaItem("customers"), { id: "suppliers", screen: "suppliers", label: "Proveedores", icon: "♧" }, sidebarAreaItem("team", "Personal")].filter(Boolean) },
  { id: "administracion", type: "group", title: "ADMINISTRACIÓN", items: [...["audit"].map(sidebarAreaItem).filter(Boolean), { id: "settings", screen: "settings", label: "Configuración", icon: "⚙" }, { id: "platform_admin", screen: "platform_admin", label: "Administración de plataforma", icon: "◇" }] }
];
const normalizeSidebarLayout = (layout) => {
  const fallback = defaultSidebarLayout();
  const orderedItems = fallback.flatMap((group) => group.items);
  const known = new Map(orderedItems.map((item) => [item.id, item]));
  const normalizeItem = (item) => ({
    ...known.get(item.id),
    label: ({ home: "Inicio", products: "Productos", profitability: "Rentabilidad", catalog: "Catálogo", team: "Personal", receivables: "Cuentas por cobrar", payables: "Cuentas por pagar", platform_admin: "Administración de plataforma" })[item.id] || String(item.label || known.get(item.id).label).slice(0, 60),
    icon: String(item.icon || known.get(item.id).icon).slice(0, 4)
  });
  if (!Array.isArray(layout) || !layout.length) return fallback;
  const groups = layout.filter((group) => group && group.type === "group" && typeof group.id === "string")
    .map((group) => ({
      id: group.id,
      type: "group",
      title: group.id === "inicio" || (Array.isArray(group.items) && group.items.some((item) => item?.id === "home")) ? "" : String(group.title || "Sección").slice(0, 60),
      items: Array.isArray(group.items) ? group.items.filter((item) => item && known.has(item.id)).map(normalizeItem) : []
    }));
  if (!groups.length) return fallback;

  // Convert the original one-section menu to the current categories, preserving labels/icons edited by the owner.
  if (groups.length === 1 && (groups[0].id === "business" || groups[0].title.toUpperCase() === "TU NEGOCIO")) {
    const savedItems = new Map(groups[0].items.map((item) => [item.id, item]));
    return fallback.map((group) => ({
      ...group,
      items: group.items.map((item) => savedItems.get(item.id) ? normalizeItem(savedItems.get(item.id)) : item)
    })).filter((group) => group.items.length > 0);
  }

  // Reconcile prior layouts with the agreed categories without discarding item labels/icons.
  const requiredDestinations = {
    products: "comercial",
    receivables: "finanzas",
    payables: "finanzas",
    purchases: "finanzas",
    coupons: "finanzas",
    customers: "personal",
    suppliers: "personal",
    team: "personal"
  };
  const movedItems = new Map();
  for (const group of groups) {
    group.items = group.items.filter((item) => {
      const destination = requiredDestinations[item.id];
      if (!destination || group.id === destination) return true;
      if (!movedItems.has(item.id)) movedItems.set(item.id, item);
      return false;
    });
  }
  for (const [itemId, destinationId] of Object.entries(requiredDestinations)) {
    const targetTemplate = fallback.find((group) => group.id === destinationId);
    let target = groups.find((group) => group.id === destinationId);
    if (!target && targetTemplate) {
      target = { ...targetTemplate, items: [] };
      groups.push(target);
    }
    if (!target) continue;
    const existing = target.items.find((item) => item.id === itemId);
    const item = movedItems.get(itemId);
    if (item && !existing) target.items.push(item);
  }

  const placed = new Set(groups.flatMap((group) => group.items.map((item) => item.id)));
  const missing = orderedItems.filter((item) => !placed.has(item.id));
  for (const item of missing) {
    const defaultGroup = fallback.find((group) => group.items.some((candidate) => candidate.id === item.id));
    const target = groups.find((group) => group.id === defaultGroup?.id) || groups[0];
    target.items.push(item);
    placed.add(item.id);
  }
  return groups;
};

const currencyDigits = (code = "COP") => {
  try { return new Intl.NumberFormat("es-CO", { style: "currency", currency: code }).resolvedOptions().maximumFractionDigits; }
  catch { return 0; }
};
const money = (minorUnits, code = "COP") => {
  const digits = currencyDigits(code);
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: code, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(minorUnits || 0) / (10 ** digits));
};
const toMinorUnits = (amount, code = "COP") => Math.round(Number(amount || 0) * (10 ** currencyDigits(code)));
const currencyOptions = [
  ["AED", "Dírham de Emiratos Árabes Unidos"],
  ["AFN", "AFN"],
  ["ALL", "ALL"],
  ["AMD", "AMD"],
  ["ANG", "ANG"],
  ["AOA", "AOA"],
  ["ARS", "Peso argentino"],
  ["AUD", "Dólar australiano"],
  ["AWG", "AWG"],
  ["AZN", "AZN"],
  ["BAM", "BAM"],
  ["BBD", "BBD"],
  ["BDT", "Taka bangladesí"],
  ["BGN", "BGN"],
  ["BHD", "Dinar bareiní"],
  ["BIF", "BIF"],
  ["BMD", "BMD"],
  ["BND", "BND"],
  ["BOB", "Boliviano"],
  ["BRL", "Real brasileño"],
  ["BSD", "BSD"],
  ["BTN", "BTN"],
  ["BWP", "BWP"],
  ["BYN", "BYN"],
  ["BZD", "BZD"],
  ["CAD", "Dólar canadiense"],
  ["CDF", "CDF"],
  ["CHF", "Franco suizo"],
  ["CLP", "Peso chileno"],
  ["CNY", "Yuan chino"],
  ["COP", "Peso colombiano"],
  ["CRC", "Colón costarricense"],
  ["CUP", "CUP"],
  ["CVE", "CVE"],
  ["CZK", "Corona checa"],
  ["DJF", "DJF"],
  ["DKK", "Corona danesa"],
  ["DOP", "Peso dominicano"],
  ["DZD", "DZD"],
  ["EGP", "Libra egipcia"],
  ["ERN", "ERN"],
  ["ETB", "ETB"],
  ["EUR", "Euro"],
  ["FJD", "FJD"],
  ["FKP", "FKP"],
  ["GBP", "Libra esterlina"],
  ["GEL", "GEL"],
  ["GHS", "GHS"],
  ["GIP", "GIP"],
  ["GMD", "GMD"],
  ["GNF", "GNF"],
  ["GTQ", "Quetzal guatemalteco"],
  ["GYD", "GYD"],
  ["HKD", "Dólar de Hong Kong"],
  ["HNL", "HNL"],
  ["HTG", "HTG"],
  ["HUF", "Forinto húngaro"],
  ["IDR", "Rupia indonesia"],
  ["ILS", "Nuevo séquel israelí"],
  ["INR", "Rupia india"],
  ["IQD", "Dinar iraquí"],
  ["IRR", "IRR"],
  ["ISK", "Corona islandesa"],
  ["JMD", "Dólar jamaiquino"],
  ["JOD", "Dinar jordano"],
  ["JPY", "Yen japonés"],
  ["KES", "Chelín keniano"],
  ["KGS", "KGS"],
  ["KHR", "KHR"],
  ["KMF", "KMF"],
  ["KPW", "KPW"],
  ["KRW", "Won surcoreano"],
  ["KWD", "Dinar kuwaití"],
  ["KYD", "KYD"],
  ["KZT", "KZT"],
  ["LAK", "LAK"],
  ["LBP", "LBP"],
  ["LKR", "LKR"],
  ["LRD", "LRD"],
  ["LSL", "LSL"],
  ["LYD", "LYD"],
  ["MAD", "MAD"],
  ["MDL", "MDL"],
  ["MGA", "MGA"],
  ["MKD", "MKD"],
  ["MMK", "MMK"],
  ["MNT", "MNT"],
  ["MOP", "MOP"],
  ["MRU", "MRU"],
  ["MUR", "MUR"],
  ["MVR", "MVR"],
  ["MWK", "MWK"],
  ["MXN", "Peso mexicano"],
  ["MYR", "Ringgit malasio"],
  ["MZN", "MZN"],
  ["NAD", "NAD"],
  ["NGN", "Naira nigeriana"],
  ["NIO", "NIO"],
  ["NOK", "Corona noruega"],
  ["NPR", "NPR"],
  ["NZD", "Dólar neozelandés"],
  ["OMR", "Rial omaní"],
  ["PAB", "PAB"],
  ["PEN", "Sol peruano"],
  ["PGK", "PGK"],
  ["PHP", "Peso filipino"],
  ["PKR", "Rupia pakistaní"],
  ["PLN", "Zloty polaco"],
  ["PYG", "Guaraní paraguayo"],
  ["QAR", "Riyal catarí"],
  ["RON", "RON"],
  ["RSD", "RSD"],
  ["RUB", "RUB"],
  ["RWF", "RWF"],
  ["SAR", "Riyal saudí"],
  ["SBD", "SBD"],
  ["SCR", "SCR"],
  ["SDG", "SDG"],
  ["SEK", "Corona sueca"],
  ["SGD", "Dólar de Singapur"],
  ["SHP", "SHP"],
  ["SLE", "SLE"],
  ["SLL", "SLL"],
  ["SOS", "SOS"],
  ["SRD", "SRD"],
  ["SSP", "SSP"],
  ["STN", "STN"],
  ["SVC", "SVC"],
  ["SYP", "SYP"],
  ["SZL", "SZL"],
  ["THB", "Baht tailandés"],
  ["TJS", "TJS"],
  ["TMT", "TMT"],
  ["TND", "TND"],
  ["TOP", "TOP"],
  ["TRY", "Lira turca"],
  ["TTD", "Dólar de Trinidad y Tobago"],
  ["TWD", "TWD"],
  ["TZS", "TZS"],
  ["UAH", "Grivna ucraniana"],
  ["UGX", "UGX"],
  ["USD", "Dólar estadounidense"],
  ["UYU", "Peso uruguayo"],
  ["UZS", "UZS"],
  ["VES", "VES"],
  ["VND", "Dong vietnamita"],
  ["VUV", "VUV"],
  ["WST", "WST"],
  ["XAF", "Franco CFA de África Central"],
  ["XCD", "Dólar del Caribe Oriental"],
  ["XOF", "Franco CFA de África Occidental"],
  ["XPF", "Franco CFP"],
  ["YER", "YER"],
  ["ZAR", "Rand sudafricano"],
  ["ZMW", "ZMW"],
  ["ZWG", "ZWG"]
];
async function businessHasFinancialData(businessId) {
  const results = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("sales").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("purchases").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("expenses").select("id", { count: "exact", head: true }).eq("business_id", businessId)
  ]);
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
  return results.some((result) => Number(result.count || 0) > 0);
}
const friendlyError = (error) => {
  const message = error?.message || "Ocurrió un error. Inténtalo de nuevo.";
  if (/invalid login credentials/i.test(message)) return "El correo o la contraseña no coinciden.";
  if (/email not confirmed/i.test(message)) return "Confirma tu correo antes de iniciar sesión.";
  if (/user already registered/i.test(message)) return "Ese correo ya tiene una cuenta. Inicia sesión.";
  if (/password should be at least/i.test(message)) return "Usa una contraseña de al menos 6 caracteres.";
  if (/foreign key constraint|violates foreign key/i.test(message)) return "No puedes eliminar esta categoría porque todavía tiene productos. Cambia esos productos a otra categoría y vuelve a intentarlo.";
  if (/no puedes cambiar la moneda|convertir los importes/i.test(message)) return message;
  if (/duplicate key|already exists/i.test(message)) return "Ya existe un registro con ese nombre o código.";
  if (/failed to fetch|network/i.test(message)) return "No pudimos conectar con el servicio. Revisa tu conexión e inténtalo otra vez.";
  return message;
};

const unitOptions = [
  ["unidad", "Unidad"], ["pieza", "Pieza"], ["par", "Par"], ["docena", "Docena"],
  ["hoja", "Hoja"], ["lámina", "Lámina"], ["rollo", "Rollo"], ["caja", "Caja"], ["paquete", "Paquete"],
  ["kit", "Kit"], ["set", "Set o juego"], ["gramo", "Gramo (g)"], ["kilogramo", "Kilogramo (kg)"],
  ["mililitro", "Mililitro (ml)"], ["litro", "Litro (l)"], ["centímetro", "Centímetro (cm)"],
  ["metro", "Metro (m)"], ["metro cuadrado", "Metro cuadrado (m²)"], ["hora", "Hora"],
  ["sesión", "Sesión"], ["servicio", "Servicio"], ["personalizada", "Otra unidad…"]
];
const blankProduct = { name: "", sku: "", category_id: "", description: "", commercial_presentation: "", product_type: "physical", unit_name: "unidad", unit_custom: "", sale_price: "", cost_price: "", stock: "0", low_stock: "" };
const blankVariantDraft = { variant_name: "", variant_value: "", sku: "", sale_price: "", stock_on_hand: "" };
const todayInBogota = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const blankSupplier = { name: "", email: "", phone: "", tax_id: "", address: "", notes: "" };
const blankExpense = { category: "Operativo", description: "", amount: "", expense_date: todayInBogota(), payment_method: "Transferencia", supplier_id: "", notes: "" };
const teamPermissionGroups = [
  { label: "Productos e inventario", view: "products_view", manage: "products_manage" },
  { label: "Ventas", view: "sales_view", manage: "sales_manage" },
  { label: "Clientes", view: "customers_view", manage: "customers_manage" },
  { label: "Compras", view: "purchases_view", manage: "purchases_manage" },
  { label: "Gastos", view: "expenses_view", manage: "expenses_manage" }
];
const blankTeamPermissions = {
  products_view: false, products_manage: false, sales_view: false, sales_manage: false,
  customers_view: false, customers_manage: false, purchases_view: false, purchases_manage: false,
  suppliers_view: false, suppliers_manage: false, expenses_view: false, expenses_manage: false
};
const employeePermissionProfiles = {
  vendedor: {
    label: "Vendedor",
    description: "Ventas, consulta de productos y gestión de clientes; sin inventario, compras, gastos ni administración.",
    permissions: { products_view: true, sales_view: true, sales_manage: true, customers_view: true, customers_manage: true }
  },
  atencion: {
    label: "Atención al cliente",
    description: "Consulta productos y administra clientes, sin registrar ventas ni acceder a finanzas.",
    permissions: { products_view: true, customers_view: true, customers_manage: true }
  },
  inventario: {
    label: "Inventario",
    description: "Consulta y administra productos y existencias, sin acceso a ventas, compras ni finanzas.",
    permissions: { products_view: true, products_manage: true }
  },
  compras: {
    label: "Compras y proveedores",
    description: "Gestiona compras y proveedores; requiere administrar productos para registrar entradas de inventario.",
    permissions: { products_view: true, products_manage: true, purchases_view: true, purchases_manage: true, suppliers_view: true, suppliers_manage: true }
  },
  personalizado: {
    label: "Personalizado",
    description: "Elige cada permiso manualmente.",
    permissions: {}
  }
};
const blankCustomer = { first_name: "", last_name: "", company_name: "", document_type: "", document_number: "", email: "", phone: "", whatsapp: "", city: "", address: "", notes: "" };

const defaultBusinessTheme = Object.freeze({ primary: "#475569", background: "#F6F7F9", surface: "#FFFFFF", text: "#1F2937", sidebarBackground: "#FFFFFF", sidebarText: "#1F2937", buttonHover: "#334155", buttonHoverText: "#FFFFFF" });
const treseiscincoTheme = Object.freeze({ primary: "#159F92", background: "#F5F7FC", surface: "#FFFFFF", text: "#19243A", sidebarBackground: "#FFFFFF", sidebarText: "#19243A", buttonHover: "#0D7E75", buttonHoverText: "#FFFFFF" });

function hexRgb(value) {
  const match = String(value || "").trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  let hex = match[1];
  if (hex.length === 3) hex = hex.split("").map((x) => x + x).join("");
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminance(rgb) {
  const channel = (v) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}
function contrastRatio(a, b) {
  const ca = hexRgb(a), cb = hexRgb(b);
  if (!ca || !cb) return 0;
  const la = luminance(ca), lb = luminance(cb);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
function readableText(background, preferred) {
  if (!hexRgb(background)) return preferred || "#19243A";
  if (preferred && contrastRatio(background, preferred) >= 4.5) return preferred;
  const black = "#111827", white = "#FFFFFF";
  return contrastRatio(background, black) >= contrastRatio(background, white) ? black : white;
}
function readableAccent(accent, background) {
  if (!hexRgb(accent) || !hexRgb(background)) return accent || defaultBusinessTheme.primary;
  return contrastRatio(accent, background) >= 4.5 ? accent : readableText(background, accent);
}

const compareInventoryProducts = (a, b, sort) => {
  const nameCompare = String(a.name || "").localeCompare(String(b.name || ""), "es", { numeric: true, sensitivity: "base" });
  const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  let result = 0;
  const desc = sort.endsWith("_desc");
  if (sort === "name" || sort === "name_desc") result = nameCompare;
  else if (sort === "code" || sort === "code_desc") result = String(a.sku || "").localeCompare(String(b.sku || ""), "es", { numeric: true, sensitivity: "base" });
  else if (sort === "price" || sort === "price_desc") result = number(a.sale_price_minor) - number(b.sale_price_minor);
  else if (sort === "cost" || sort === "cost_desc") result = number(a.cost_price_minor) - number(b.cost_price_minor);
  else if (sort === "stock" || sort === "stock_desc") result = number(a.stock_on_hand) - number(b.stock_on_hand);
  else if (sort === "profit" || sort === "profit_asc") result = (number(a.sale_price_minor) - number(a.cost_price_minor)) - (number(b.sale_price_minor) - number(b.cost_price_minor));
  else if (sort === "margin" || sort === "margin_asc") {
    const marginA = number(a.sale_price_minor) > 0 ? ((number(a.sale_price_minor) - number(a.cost_price_minor)) / number(a.sale_price_minor)) : -Infinity;
    const marginB = number(b.sale_price_minor) > 0 ? ((number(b.sale_price_minor) - number(b.cost_price_minor)) / number(b.sale_price_minor)) : -Infinity;
    result = marginA - marginB;
  } else result = nameCompare;
  if (sort === "profit" || sort === "margin" || sort === "price_desc" || sort === "cost_desc" || sort === "stock_desc" || sort === "name_desc" || sort === "code_desc") result *= -1;
  return result || nameCompare;
};

const normalizeBusinessTheme = (theme) => {
  const valid = (value, fallback) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  // Cambia solo los temas predeterminados de versiones anteriores; los colores elegidos por cada negocio se respetan.
  const legacyDefault = { primary: "#2d5947", background: "#f7f6f1", surface: "#fffefa", text: "#20251f", sidebarBackground: "#fffefa", sidebarText: "#20251f", buttonHover: "#234635", buttonHoverText: "#ffffff" };
  const previousBrandDefault = { primary: "#174580", background: "#F5F7FC", surface: "#FFFFFF", text: "#19243A", sidebarBackground: "#FFFFFF", sidebarText: "#19243A", buttonHover: "#102F60", buttonHoverText: "#FFFFFF" };
  const previousTealDefault = { primary: "#159F92", background: "#F5F7FC", surface: "#FFFFFF", text: "#19243A", sidebarBackground: "#FFFFFF", sidebarText: "#19243A", buttonHover: "#0D7E75", buttonHoverText: "#FFFFFF" };
  const matchesDefault = (candidate) => Boolean(theme) && Object.entries(candidate).every(([key, value]) => !theme[key] || String(theme[key]).toLowerCase() === value.toLowerCase());
  const source = matchesDefault(legacyDefault) || matchesDefault(previousBrandDefault) || matchesDefault(previousTealDefault) ? null : theme;
  return { primary: valid(source?.primary, defaultBusinessTheme.primary), background: valid(source?.background, defaultBusinessTheme.background), surface: valid(source?.surface, defaultBusinessTheme.surface), text: valid(source?.text, defaultBusinessTheme.text), sidebarBackground: valid(source?.sidebarBackground, defaultBusinessTheme.sidebarBackground), sidebarText: valid(source?.sidebarText, defaultBusinessTheme.sidebarText), buttonHover: valid(source?.buttonHover, defaultBusinessTheme.buttonHover), buttonHoverText: valid(source?.buttonHoverText, defaultBusinessTheme.buttonHoverText) };
};
const DEFAULT_TAX_PROFILE = Object.freeze({
  vatStatus: "unsure",
  defaultRate: 19,
  defaultRateMode: "standard",
  customRate: 19,
  pricesIncludeVat: false,
  showVatBreakdown: false
});
const normalizeTaxProfile = (profile) => {
  const allowed = new Set(["responsible", "not_responsible", "not_applicable", "unsure"]);
  const numberOr = (value, fallback) => {
    if (String(value ?? "").trim() === "") return fallback;
    const number = Number(String(value ?? "").replace(",", "."));
    return Number.isFinite(number) && number >= 0 && number <= 100 ? number : fallback;
  };
  return {
    vatStatus: allowed.has(profile?.vatStatus) ? profile.vatStatus : "unsure",
    defaultRate: numberOr(profile?.defaultRate, 19),
    defaultRateMode: profile?.defaultRateMode === "custom" ? "custom" : "standard",
    customRate: numberOr(profile?.customRate, 19),
    pricesIncludeVat: Boolean(profile?.pricesIncludeVat),
    showVatBreakdown: Boolean(profile?.showVatBreakdown)
  };
};
const getBusinessLogoUrl = (path) => {
  if (!path) return "";
  try { return supabase.storage.from("business-logos").getPublicUrl(path)?.data?.publicUrl || ""; } catch { return ""; }
};
function FieldHelp({ text, enabled = true }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    const onOtherHelpOpen = (event) => {
      if (event.detail?.source !== rootRef.current) setOpen(false);
    };
    document.addEventListener("treseiscinco:field-help-open", onOtherHelpOpen);
    return () => document.removeEventListener("treseiscinco:field-help-open", onOtherHelpOpen);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onOutsidePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onOutsidePointer, true);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onOutsidePointer, true);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);
  if (!enabled || !text) return null;
  const toggleHelp = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    document.dispatchEvent(new CustomEvent("treseiscinco:field-help-open", { detail: { source: rootRef.current } }));
    setOpen(true);
  };
  return (
    <span className="field-help-wrap" ref={rootRef}>
      <button type="button" className="field-help-trigger" title="¿Para qué sirve?" aria-label="¿Para qué sirve?" aria-expanded={open} onClick={toggleHelp}>?</button>
      {open && <span className="field-help-popover" role="tooltip">
        <strong>¿Para qué sirve?</strong>
        <span>{text}</span>
        <button type="button" className="field-help-close" aria-label="Cerrar esta ayuda" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpen(false); }}>×</button>
      </span>}
    </span>
  );
}

const contextualHelpContent = {
  home: { title: "Inicio", intro: "Este es el punto de partida de treseiscinco. Cada módulo trabaja con la información real de tu negocio.", steps: ["En Productos registra lo que vendes y confirma su precio y existencias.", "En Ventas registra cada operación: el sistema calcula el total y descuenta inventario cuando corresponde.", "En Compras y gastos registra entradas y egresos para consultar la rentabilidad."], tip: "Mantén los productos y las existencias al día: las demás secciones dependen de esos datos." },
  products: { title: "Productos", intro: "Aquí defines el catálogo interno que se usa en ventas, compras y rentabilidad.", steps: ["Crea o edita un producto con nombre, unidad, precio y costo.", "Activa «Se puede vender» para que aparezca en el formulario de ventas.", "Indica si controla inventario y registra las entradas o ajustes de existencias."], tip: "Antes de vender, revisa el precio, el estado de venta y las existencias." },
  productForm: { title: "Crear o editar producto", intro: "Guarda la información comercial con la que se calcularán las ventas.", steps: ["Usa un nombre fácil de reconocer; el código es un identificador.", "Define precio de venta, costo, unidad y control de inventario.", "Revisa los campos y pulsa Guardar. Las fotos se optimizan antes de almacenarse."], tip: "Para servicios o productos digitales, desactiva el control de inventario si no corresponde." },
  sales: { title: "Ventas", intro: "Registra ventas reales, consulta su estado de pago y registra abonos posteriores.", steps: ["Pulsa «Nueva venta». El cliente es opcional.", "Elige un producto, revisa cantidad y pulsa «+ Agregar» para incluirlo.", "Revisa el total, indica el abono si recibiste dinero y guarda."], tip: "Guardar requiere al menos un artículo agregado. Venta y salida de inventario se registran juntas." },
  saleForm: { title: "Registrar una venta", intro: "El formulario solo vende productos activos. El inventario se descuenta al confirmar el registro.", steps: ["Elige un producto en la lista desplegable.", "Escribe la cantidad y pulsa «+ Agregar». Repite para otros productos.", "Revisa el carrito y el total; puedes dejar el cliente vacío.", "Registra el abono inicial, selecciona su forma de pago y pulsa Guardar venta."], tip: "Si el producto no aparece, revisa que esté activo para la venta. Si no hay existencias suficientes, el sistema explica el motivo." },
  salePaymentForm: { title: "Registrar un abono", intro: "Añade un pago recibido a una venta existente y actualiza su saldo pendiente.", steps: ["Comprueba el número y el saldo de la venta.", "Escribe el importe recibido, la fecha y la forma de pago.", "Agrega una referencia si la necesitas y pulsa Guardar abono."], tip: "El abono debe ser mayor que cero y no superar el saldo pendiente." },
  customers: { title: "Clientes", intro: "Guarda los datos de contacto para relacionarlos con las ventas cuando sea necesario.", steps: ["Pulsa «Nuevo cliente» y registra el nombre o empresa.", "Completa solo los datos de contacto que tengas.", "Guarda y luego podrás elegirlo en una venta."], tip: "También puedes registrar una venta sin cliente." },
  customerForm: { title: "Guardar un cliente", intro: "Registra datos útiles para identificar o contactar a tu cliente.", steps: ["Escribe el nombre o la empresa.", "Añade teléfono, correo, ciudad u otros datos disponibles.", "Pulsa Guardar cliente y verifica el mensaje de confirmación."], tip: "No necesitas llenar los campos opcionales para guardar el cliente." },
  purchases: { title: "Compras", intro: "Registra compras de mercancía o materiales y conserva su historial.", steps: ["Pulsa «Nueva compra».", "Añade descripción, cantidad y costo unitario de cada artículo.", "Vincula un producto cuando la compra deba aumentar sus existencias.", "Guarda la compra y registra el pago inicial si corresponde."], tip: "Solo los artículos vinculados a un producto modifican el inventario." },
  purchaseForm: { title: "Registrar una compra", intro: "Esta entrada conserva los artículos, sus costos y los cambios reales de inventario.", steps: ["Selecciona proveedor y fecha si los conoces.", "Añade cada artículo con su cantidad y costo.", "Verifica total e importe pagado antes de guardar."], tip: "No vincules un material a un producto vendible si no debe aumentar las unidades de ese producto." },
  purchasePaymentForm: { title: "Registrar un pago de compra", intro: "Registra el dinero que entregas a un proveedor para una compra existente.", steps: ["Comprueba la compra y su saldo pendiente.", "Escribe el importe, fecha y método de pago.", "Añade una referencia opcional y guarda el pago."], tip: "El pago no puede superar el saldo de la compra." },
  suppliers: { title: "Proveedores", intro: "Centraliza quién te suministra productos, materiales o servicios.", steps: ["Pulsa «Nuevo proveedor».", "Registra el nombre y agrega NIT, correo, teléfono o dirección si los tienes.", "Guarda y selecciona ese proveedor en futuras compras o gastos."], tip: "El nombre del proveedor es imprescindible; el resto puede añadirse más adelante." },
  supplierForm: { title: "Guardar un proveedor", intro: "Este registro ayuda a mantener las compras y gastos relacionados con su origen.", steps: ["Escribe el nombre del proveedor.", "Agrega los datos disponibles y cualquier nota útil.", "Pulsa Guardar proveedor."], tip: "Si cambia un dato, actualiza su ficha en lugar de duplicarla." },
  expenses: { title: "Gastos", intro: "Registra salidas de dinero que no forman parte de la entrada de mercancía de una compra.", steps: ["Pulsa «Nuevo gasto».", "Describe el gasto, categoría, fecha e importe.", "Añade proveedor, método de pago o nota si aplica.", "Guarda y revisa el registro."], tip: "Registra cada gasto una sola vez. Los artículos de inventario corresponden a Compras." },
  expenseForm: { title: "Registrar un gasto", intro: "Un gasto afecta los resultados de rentabilidad del período.", steps: ["Escribe una descripción concreta y un importe mayor que cero.", "Confirma la fecha y la categoría.", "Guarda cuando la información esté correcta."], tip: "Incluye la referencia o el soporte en Notas para facilitar una revisión posterior." },
  profitability: { title: "Rentabilidad", intro: "Este módulo resume valores a partir de ventas, costos registrados y gastos.", steps: ["Elige el período que quieres revisar.", "Compara ventas con el costo de los productos vendidos.", "Revisa los gastos asociados antes de interpretar la utilidad."], tip: "Los resultados dependen de que hayas registrado los costos y gastos de forma completa." },
  catalog: { title: "Catálogo", intro: "Controla qué productos activos quieres mostrar a tus clientes en el catálogo público.", steps: ["Revisa nombre, precio, fotos y descripción en Productos.", "Publica solo los artículos que quieres mostrar.", "Abre el enlace público para comprobar lo que verá un cliente."], tip: "El catálogo muestra productos publicados y disponibles para vender; no sustituye el registro interno." },
  team: { title: "Equipo y permisos", intro: "Permite que cada colaborador vea o gestione solo los módulos que necesita.", steps: ["La persona debe tener primero una cuenta de treseiscinco.", "Escribe el mismo correo que usa para iniciar sesión.", "Marca los permisos necesarios y guarda los cambios."], tip: "Otorga solo los accesos que la persona necesita para trabajar." },
  teamForm: { title: "Configurar acceso de un colaborador", intro: "Los permisos definen qué módulos puede consultar o administrar otra cuenta.", steps: ["Escribe el correo exacto de la cuenta de treseiscinco.", "Activa solo los permisos necesarios.", "Revisa la selección y guarda el acceso."], tip: "El colaborador debe haber creado su cuenta antes de poder ser vinculado al negocio." },
  settings: { title: "Configuración y personalización", intro: "Los ajustes se conservan en el negocio y se aplican cuando vuelvas a entrar.", steps: ["Actualiza nombre y moneda si el negocio aún no tiene importes que impidan cambiarla.", "Carga un logo y elige colores para personalizar las pantallas.", "Activa o desactiva el panel en «Ayudas contextuales».", "Pulsa Guardar configuración al terminar."], tip: "Los cambios visuales no alteran las operaciones. La moneda se protege cuando ya existen datos financieros." }
};

const MAX_PRODUCT_IMAGE_BYTES = 1_500_000;

async function prepareProductImage(file) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) throw new Error("Elige una imagen JPG, PNG o WebP.");
  if (file.size > 5_000_000) throw new Error("Cada foto original debe pesar máximo 5 MB antes de optimizarla.");
  let bitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error("No pudimos abrir esa imagen. Prueba con otro archivo JPG, PNG o WebP."); }
  try {
    const originalLongest = Math.max(bitmap.width, bitmap.height);
    for (const dimension of [1200, 1000, 850, 700, 550]) {
      const scale = Math.min(1, dimension / originalLongest);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Este navegador no permite preparar la foto.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const toBlob = (quality) => new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42, 0.34]) {
        const blob = await toBlob(quality);
        if (!blob || blob.type !== "image/webp") throw new Error("Este navegador no pudo convertir la imagen a WebP.");
        if (blob.size <= MAX_PRODUCT_IMAGE_BYTES) {
          const baseName = (file.name || "foto").replace(/\.[^.]+$/, "").slice(0, 80) || "foto";
          canvas.width = 0; canvas.height = 0;
          return new File([blob], baseName + ".webp", { type: "image/webp", lastModified: Date.now() });
        }
      }
      canvas.width = 0; canvas.height = 0;
    }
    throw new Error("La foto no pudo reducirse a 1,5 MB en WebP. Prueba con otra imagen más pequeña.");
  } finally { bitmap.close?.(); }
}

async function fileToBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

async function uploadProductImage(productId, file, businessId) {
  if (!businessId) throw new Error("No pudimos identificar el negocio de este producto.");
  if (file.type !== "image/webp" || file.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error("La foto debe estar optimizada en WebP y pesar 1,5 MB o menos.");
  }
  const imageData = await fileToBase64(file);
  const { data, error } = await supabase.rpc("add_product_image_db", {
    p_business_id: businessId,
    p_product_id: productId,
    p_image_data: imageData,
    p_image_size_bytes: file.size
  });
  if (error) throw error;
  return data;
}

async function deleteProductImageRequest(productId, imageKey, businessId) {
  const { data, error } = await supabase.rpc("remove_product_image_db", {
    p_business_id: businessId,
    p_product_id: productId,
    p_image_key: imageKey
  });
  if (error) throw error;
  if (!data) throw new Error("No se pudo quitar la foto.");
  return data;
}

function PublicCatalogImage({ businessId, product }) {
  const imageKey = (product.image_paths || [])[0];
  const [element, setElement] = useState(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [source, setSource] = useState("");

  useEffect(() => {
    if (!element || !imageKey) return;
    if (typeof IntersectionObserver === "undefined") { setShouldLoad(true); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setShouldLoad(true);
        observer.disconnect();
      }
    }, { rootMargin: "180px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, imageKey]);

  useEffect(() => {
    if (!shouldLoad || !imageKey) return;
    let active = true;
    (async () => {
      try {
        const { data, error: imageError } = await supabase.rpc("get_public_catalog_image", {
          p_business_id: businessId, p_product_id: product.id, p_image_key: imageKey
        });
        if (imageError) throw imageError;
        const row = Array.isArray(data) ? data[0] : data;
        if (active && row?.image_data) setSource("data:" + (row.content_type || "image/webp") + ";base64," + row.image_data);
      } catch { /* El catálogo sigue visible aunque falte una imagen. */ }
    })();
    return () => { active = false; };
  }, [businessId, product.id, imageKey, shouldLoad]);

  return <div className="public-catalog-image" ref={setElement}>
    {source ? <img src={source} alt={product.name} loading="lazy" /> : <span aria-hidden="true">▦</span>}
  </div>;
}

function CatalogAdminImage({ businessId, product }) {
  const imageKey = Array.isArray(product.image_paths) ? product.image_paths[0] : "";
  const [element, setElement] = useState(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [source, setSource] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!element || !imageKey) return;
    if (typeof IntersectionObserver === "undefined") { setShouldLoad(true); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setShouldLoad(true);
        observer.disconnect();
      }
    }, { rootMargin: "180px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, imageKey]);

  useEffect(() => {
    if (!shouldLoad || !imageKey || !businessId || !product.id) return;
    let active = true;
    (async () => {
      try {
        const { data, error: imageError } = await supabase.from("product_images")
          .select("content_type,image_data")
          .eq("business_id", businessId)
          .eq("product_id", product.id)
          .eq("image_key", imageKey)
          .maybeSingle();
        if (imageError) throw imageError;
        if (active && data?.image_data) setSource("data:" + (data.content_type || "image/webp") + ";base64," + data.image_data);
      } catch {
        if (active) setFailed(true);
      }
    })();
    return () => { active = false; };
  }, [businessId, product.id, imageKey, shouldLoad]);

  return <span className="catalog-admin-symbol" ref={setElement} title={product.name}>
    {source && !failed ? <img src={source} alt="" loading="lazy" onError={() => setFailed(true)} /> : "▦"}
  </span>;
}

function PaymentsAdmin({ business }) {
  const [status, setStatus] = useState({ enabled: false, configured: false, environment: null });
  const [environment, setEnvironment] = useState("sandbox");
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [integritySecret, setIntegritySecret] = useState("");
  const [eventsSecret, setEventsSecret] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = async () => {
    if (!business?.id) { setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const { data, error: statusError } = await supabase.functions.invoke("public-checkout", { body: { action: "status", business_id: business.id } });
      if (statusError) throw statusError;
      const next = { enabled: Boolean(data?.enabled), configured: Boolean(data?.configured), environment: data?.environment || "sandbox" };
      setStatus(next); setEnabled(next.enabled); setEnvironment(next.environment);
    } catch (e) { setError(e?.message || "No se pudo consultar la configuración de pagos."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [business?.id]);
  const save = async (event) => {
    event.preventDefault();
    if (!business?.id || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const { data, error: saveError } = await supabase.functions.invoke("public-checkout", {
        body: {
          action: "configure", business_id: business.id, environment, enabled,
          public_key: publicKey.trim(), private_key: privateKey.trim(),
          integrity_secret: integritySecret.trim(), events_secret: eventsSecret.trim()
        }
      });
      if (saveError || !data?.saved) throw new Error(data?.error || saveError?.message || "No se pudo guardar la configuración.");
      setPublicKey(""); setPrivateKey(""); setIntegritySecret(""); setEventsSecret("");
      setNotice(enabled ? "Credenciales guardadas. Los cobros verificados están activados para este negocio." : "La configuración se guardó y los cobros quedaron desactivados.");
      await load();
    } catch (e) { setError(e?.message || "No se pudo guardar la configuración."); }
    finally { setSaving(false); }
  };
  const canManage = ["owner", "admin"].includes(business?.role);
  if (!canManage) return <section className="payments-page"><div className="panel"><h2>Acceso restringido</h2><p>Solo el propietario o un administrador puede configurar los cobros de este negocio.</p></div></section>;
  return <section className="payments-page">
    <div className="products-intro"><div><h2>Recibe pagos verificados</h2><p>Conecta las credenciales de Wompi de este negocio. Cada negocio guarda sus propias credenciales y recibe los pagos en su propia cuenta.</p></div><button type="button" className="secondary-button" onClick={load} disabled={loading}>Actualizar estado</button></div>
    <div className={"panel payment-status-panel " + (status.enabled ? "is-enabled" : "")}>
      <span className={"coupon-status " + (status.enabled ? "active" : "inactive")}>{loading ? "Consultando…" : status.enabled ? "Cobros activos" : status.configured ? "Cobros desactivados" : "Sin configurar"}</span>
      <h3>{status.enabled ? "Tu catálogo puede recibir pagos en línea" : "Configura los cobros de tu negocio"}</h3>
      <p>{status.enabled ? "Wompi redirige al cliente a su checkout seguro. treseiscinco confirma el pedido solo después de verificar el evento y consultar la transacción con Wompi." : "Mientras no estén configuradas las credenciales, el catálogo no permitirá iniciar un cobro ni mostrará una falsa confirmación."}</p>
      {status.configured && <small>Entorno actual: {status.environment === "production" ? "Producción" : "Pruebas (sandbox)"}</small>}
    </div>
    <form className="panel payment-config-form" onSubmit={save}>
      <h3>Credenciales de Wompi</h3>
      <p className="helper-text">Las credenciales se envían directamente al servidor y no se vuelven a mostrar. Déjalas en blanco para conservar las ya guardadas; al configurar por primera vez, completa los cuatro campos.</p>
      <label><span>Entorno</span><select value={environment} onChange={e => setEnvironment(e.target.value)}><option value="sandbox">Pruebas (sandbox)</option><option value="production">Producción</option></select></label>
      <label><span>Llave pública</span><input autoComplete="off" value={publicKey} onChange={e => setPublicKey(e.target.value)} placeholder={status.configured ? "Guardada · escribe solo si deseas cambiarla" : "pub_test_… o pub_prod_…"} /></label>
      <label><span>Llave privada</span><input type="password" autoComplete="new-password" value={privateKey} onChange={e => setPrivateKey(e.target.value)} placeholder={status.configured ? "Guardada · no se muestra por seguridad" : "prv_test_… o prv_prod_…"} /></label>
      <label><span>Secreto de integridad</span><input type="password" autoComplete="new-password" value={integritySecret} onChange={e => setIntegritySecret(e.target.value)} placeholder={status.configured ? "Guardado · no se muestra por seguridad" : "Secreto de integridad de Wompi"} /></label>
      <label><span>Secreto de eventos (webhook)</span><input type="password" autoComplete="new-password" value={eventsSecret} onChange={e => setEventsSecret(e.target.value)} placeholder={status.configured ? "Guardado · no se muestra por seguridad" : "Secreto de eventos de Wompi"} /></label>
      <label className="coupon-active-toggle"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} /> Activar cobros verificados para este negocio</label>
      {error && <p className="message error" role="alert">{error}</p>}
      {notice && <p className="message success" role="status">{notice}</p>}
      <div className="coupon-editor-actions"><button className="primary-button" type="submit" disabled={saving || loading}>{saving ? "Guardando credenciales…" : "Guardar configuración"}</button></div>
      <p className="helper-text">Antes de cobrar en producción, registra en el panel de Wompi la URL del webhook de esta función y prueba una transacción aprobada, rechazada y cancelada. No compartas las llaves privadas.</p>
    </form>
  </section>;
}

function CouponsAdmin({ business }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState(null);
  const blank = { code: "", description: "", discount_type: "percentage", discount_value: "10", minimum_subtotal: "0", maximum_discount: "", usage_limit: "", starts_at: "", ends_at: "", is_active: true };
  const [form, setForm] = useState(blank);
  const canManage = ["owner", "admin"].includes(business?.role) || Boolean(business?.permissions?.sales_manage);
  const currency = business?.currency_code || "COP";
  const load = async () => {
    if (!business?.id || !canManage) { setLoading(false); return; }
    setLoading(true); setError("");
    const { data, error: queryError } = await supabase.from("business_coupons")
      .select("id,business_id,code,description,discount_type,discount_value,minimum_subtotal_minor,maximum_discount_minor,usage_limit,usage_count,starts_at,ends_at,is_active,created_at")
      .eq("business_id", business.id).order("created_at", { ascending: false });
    if (queryError) setError(friendlyError(queryError)); else setCoupons(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [business?.id, business?.role]);
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const reset = () => { setEditingId(null); setForm(blank); setError(""); setNotice(""); };
  const edit = (coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code || "", description: coupon.description || "",
      discount_type: coupon.discount_type, discount_value: String(coupon.discount_value),
      minimum_subtotal: String(Number(coupon.minimum_subtotal_minor || 0) / (10 ** currencyDigits(currency))),
      maximum_discount: coupon.maximum_discount_minor == null ? "" : String(Number(coupon.maximum_discount_minor) / (10 ** currencyDigits(currency))),
      usage_limit: coupon.usage_limit == null ? "" : String(coupon.usage_limit),
      starts_at: coupon.starts_at ? new Date(coupon.starts_at).toISOString().slice(0,16) : "",
      ends_at: coupon.ends_at ? new Date(coupon.ends_at).toISOString().slice(0,16) : "",
      is_active: coupon.is_active
    });
    setError(""); setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!canManage || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const code = form.code.trim().toUpperCase().replace(/\s+/g, "");
      const value = Number(form.discount_value);
      const minimum = toMinorUnits(Number(form.minimum_subtotal || 0), currency);
      const maxDiscount = form.maximum_discount.trim() === "" ? null : toMinorUnits(Number(form.maximum_discount), currency);
      const limit = form.usage_limit.trim() === "" ? null : Number(form.usage_limit);
      if (!/^[A-Z0-9_-]{3,32}$/.test(code)) throw new Error("El código debe tener entre 3 y 32 caracteres: letras, números, guion o guion bajo.");
      if (!Number.isFinite(value) || value <= 0 || (form.discount_type === "percentage" && (!Number.isInteger(value) || value > 100)) || (form.discount_type === "fixed" && !Number.isInteger(value * (10 ** currencyDigits(currency))))) throw new Error(form.discount_type === "percentage" ? "El porcentaje debe ser un número entero entre 1 y 100." : "Ingresa un valor fijo válido.");
      if (!Number.isFinite(minimum) || minimum < 0 || (maxDiscount != null && (!Number.isFinite(maxDiscount) || maxDiscount <= 0))) throw new Error("Revisa el mínimo de compra y el descuento máximo.");
      if (limit != null && (!Number.isInteger(limit) || limit < 1)) throw new Error("El límite de usos debe ser un entero positivo.");
      if (form.starts_at && form.ends_at && new Date(form.ends_at) <= new Date(form.starts_at)) throw new Error("La fecha final debe ser posterior a la inicial.");
      const row = {
        business_id: business.id, code, description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: form.discount_type === "percentage" ? Math.round(value) : Math.round(value * 100),
        minimum_subtotal_minor: minimum, maximum_discount_minor: maxDiscount,
        usage_limit: limit, starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        is_active: Boolean(form.is_active), updated_at: new Date().toISOString()
      };
      const result = editingId
        ? await supabase.from("business_coupons").update(row).eq("id", editingId).eq("business_id", business.id)
        : await supabase.from("business_coupons").insert(row);
      if (result.error) throw result.error;
      setNotice(editingId ? "Cupón actualizado." : "Cupón creado.");
      setEditingId(null); setForm(blank);
      await load();
    } catch (e) { setError(e?.message || friendlyError(e)); }
    finally { setSaving(false); }
  };
  const toggleActive = async (coupon) => {
    setError(""); setNotice("");
    const { error: updateError } = await supabase.from("business_coupons").update({ is_active: !coupon.is_active, updated_at: new Date().toISOString() }).eq("id", coupon.id).eq("business_id", business.id);
    if (updateError) setError(friendlyError(updateError)); else { setNotice(coupon.is_active ? "Cupón desactivado." : "Cupón activado."); await load(); }
  };
  const remove = async (coupon) => {
    if (!window.confirm("¿Eliminar el cupón " + coupon.code + "? Los pedidos históricos conservarán el código registrado.")) return;
    const { error: deleteError } = await supabase.from("business_coupons").delete().eq("id", coupon.id).eq("business_id", business.id);
    if (deleteError) setError(friendlyError(deleteError)); else { setNotice("Cupón eliminado."); if (editingId === coupon.id) reset(); await load(); }
  };
  const moneyInput = (value) => value === "" || value == null ? "—" : money(Number(value), currency);
  if (!canManage) return <section className="coupons-page"><div className="panel"><h2>Acceso restringido</h2><p>Solo el propietario o administradores autorizados pueden gestionar cupones.</p></div></section>;
  return <section className="coupons-page">
    <div className="products-intro"><div><h2>Promociones para tu catálogo</h2><p>Crea códigos de descuento que tus clientes podrán aplicar al comprar. El descuento se valida en el servidor y solo cuenta como usado cuando el pago queda verificado.</p></div><button type="button" className="secondary-button" onClick={load} disabled={loading}>Actualizar</button></div>
    <form className="panel coupon-editor" onSubmit={submit}>
      <div className="coupon-editor-heading"><div><h3>{editingId ? "Editar cupón" : "Crear cupón"}</h3><p>Los códigos no distinguen entre mayúsculas y minúsculas.</p></div>{editingId && <button type="button" className="secondary-button" onClick={reset}>Cancelar edición</button>}</div>
      <div className="coupon-form-grid">
        <label><span>Código *</span><input required maxLength={32} value={form.code} onChange={e => change("code",e.target.value.toUpperCase().replace(/\s+/g,""))} placeholder="BIENVENIDA10" /></label>
        <label><span>Tipo de descuento *</span><select value={form.discount_type} onChange={e => change("discount_type",e.target.value)}><option value="percentage">Porcentaje (%)</option><option value="fixed">Valor fijo ({currency})</option></select></label>
        <label><span>{form.discount_type === "percentage" ? "Porcentaje de descuento *" : "Descuento en " + currency + " *"}</span><input required type="number" min="1" max={form.discount_type === "percentage" ? "100" : undefined} step={form.discount_type === "percentage" ? "1" : String(1 / (10 ** currencyDigits(currency)))} value={form.discount_value} onChange={e => change("discount_value",e.target.value)} /></label>
        <label><span>Mínimo de compra ({currency})</span><input type="number" min="0" step={String(1 / (10 ** currencyDigits(currency)))} value={form.minimum_subtotal} onChange={e => change("minimum_subtotal",e.target.value)} /></label>
        <label><span>Descuento máximo ({currency}, opcional)</span><input type="number" min={String(1 / (10 ** currencyDigits(currency)))} step={String(1 / (10 ** currencyDigits(currency)))} value={form.maximum_discount} onChange={e => change("maximum_discount",e.target.value)} placeholder="Sin límite" /></label>
        <label><span>Límite total de usos</span><input type="number" min="1" step="1" value={form.usage_limit} onChange={e => change("usage_limit",e.target.value)} placeholder="Ilimitado" /></label>
        <label><span>Válido desde</span><input type="datetime-local" value={form.starts_at} onChange={e => change("starts_at",e.target.value)} /></label>
        <label><span>Válido hasta</span><input type="datetime-local" value={form.ends_at} onChange={e => change("ends_at",e.target.value)} /></label>
        <label className="coupon-description-field"><span>Descripción interna (opcional)</span><input maxLength={180} value={form.description} onChange={e => change("description",e.target.value)} placeholder="Ej. Campaña de lanzamiento" /></label>
      </div>
      <label className="coupon-active-toggle"><input type="checkbox" checked={form.is_active} onChange={e => change("is_active",e.target.checked)} /> Cupón activo y disponible en el catálogo</label>
      <div className="coupon-editor-actions"><button className="primary-button" type="submit" disabled={saving}>{saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear cupón"}</button>{!editingId && <button type="button" className="secondary-button" onClick={reset}>Limpiar</button>}</div>
    </form>
    {error && <p className="message error" role="alert">{error}</p>}
    {notice && <p className="message success" role="status">{notice}</p>}
    <div className="coupon-list-heading"><h3>Cupones de este negocio</h3><span>{coupons.length} en total</span></div>
    {loading ? <div className="panel">Cargando cupones…</div> : coupons.length === 0 ? <div className="panel coupon-empty"><h3>Aún no hay cupones</h3><p>Crea el primero para ofrecer descuentos en tu catálogo público.</p></div> :
      <div className="coupon-list">{coupons.map(coupon => <article className="panel coupon-card" key={coupon.id}>
        <div className="coupon-card-top"><div><span className={"coupon-status " + (coupon.is_active ? "active" : "inactive")}>{coupon.is_active ? "Activo" : "Inactivo"}</span><h4>{coupon.code}</h4>{coupon.description && <p>{coupon.description}</p>}</div><strong>{coupon.discount_type === "percentage" ? coupon.discount_value + "%" : moneyInput(coupon.discount_value)}</strong></div>
        <div className="coupon-meta"><span>Mínimo: {moneyInput(coupon.minimum_subtotal_minor)}</span><span>Usos: {coupon.usage_count}{coupon.usage_limit == null ? " / ∞" : " / " + coupon.usage_limit}</span>{coupon.maximum_discount_minor != null && <span>Tope: {moneyInput(coupon.maximum_discount_minor)}</span>}{coupon.ends_at && <span>Hasta: {new Date(coupon.ends_at).toLocaleString("es-CO",{dateStyle:"medium",timeStyle:"short"})}</span>}</div>
        <div className="coupon-card-actions"><button type="button" className="icon-action-button" title="Editar cupón" aria-label="Editar cupón" onClick={() => edit(coupon)}><AppIcon name="edit" size={15}/></button><button type="button" className="secondary-button" onClick={() => toggleActive(coupon)}>{coupon.is_active ? "Desactivar" : "Activar"}</button><button type="button" className="icon-action-button icon-action-danger" title="Eliminar cupón" aria-label="Eliminar cupón" onClick={() => remove(coupon)}><AppIcon name="trash" size={15}/></button></div>
      </article>)}</div>}
  </section>;
}

function PublicCatalog({ businessId }) {
  const [page, setPage] = useState(0);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [businessInfoOpen, setBusinessInfoOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [paymentStatusLoading, setPaymentStatusLoading] = useState(true);
  const [returnedOrder, setReturnedOrder] = useState(null);
  const [orderStatusLoading, setOrderStatusLoading] = useState(false);
  const pageSize = 12;
  const returnOrderReference = new URLSearchParams(window.location.search).get("order") || "";

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    (async () => {
      try {
        const { data, error: catalogError } = await supabase.rpc("get_public_catalog", {
          p_business_id: businessId, p_limit: pageSize, p_offset: page * pageSize
        });
        if (catalogError) throw catalogError;
        if (active) setPayload(data || null);
      } catch (e) {
        if (active) setError(friendlyError(e));
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [businessId, page, retryKey]);

  useEffect(() => {
    let active = true;
    setPaymentStatusLoading(true);
    supabase.functions.invoke("public-checkout", { body: { action: "status", business_id: businessId } })
      .then(({ data, error: statusError }) => {
        if (active) setPaymentEnabled(!statusError && data?.enabled === true);
      })
      .catch(() => { if (active) setPaymentEnabled(false); })
      .finally(() => { if (active) setPaymentStatusLoading(false); });
    return () => { active = false; };
  }, []);

  const refreshReturnedOrder = async () => {
    if (!returnOrderReference) return;
    setOrderStatusLoading(true);
    try {
      let checkoutToken = "";
      try { checkoutToken = sessionStorage.getItem("t31-checkout:" + returnOrderReference) || ""; } catch {}
      if (!checkoutToken) {
        setReturnedOrder({ payment_status: "unknown", order_reference: returnOrderReference });
        return;
      }
      const { data, error: statusError } = await supabase.rpc("get_public_store_order_status", {
        p_order_reference: returnOrderReference,
        p_checkout_token: checkoutToken
      });
      if (statusError) throw statusError;
      setReturnedOrder(data || { payment_status: "unknown", order_reference: returnOrderReference });
    } catch {
      setReturnedOrder({ payment_status: "unknown", order_reference: returnOrderReference });
    } finally { setOrderStatusLoading(false); }
  };

  useEffect(() => {
    if (returnOrderReference && businessId) refreshReturnedOrder();
  }, [returnOrderReference, businessId]);

  const business = payload?.business;
  const catalogTheme = normalizeBusinessTheme(business?.theme);
  const openingInfo = (() => {
    const schedule=business?.commercial_profile?.hoursSchedule;
    if (!schedule || typeof schedule!=="object") return null;
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Bogota",weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
    const values=Object.fromEntries(parts.map((part)=>[part.type,part.value]));
    const dayKey=({Mon:"mon",Tue:"tue",Wed:"wed",Thu:"thu",Fri:"fri",Sat:"sat",Sun:"sun"})[values.weekday];
    const dayLabel=({mon:"Lunes",tue:"Martes",wed:"Miércoles",thu:"Jueves",fri:"Viernes",sat:"Sábado",sun:"Domingo"})[dayKey]||"Hoy";
    const day=schedule[dayKey];
    const periods=(Array.isArray(day?.periods)?day.periods:[]).filter((p)=>p&&/^([01]\d|2[0-3]):[0-5]\d$/.test(p.open||"")&&/^([01]\d|2[0-3]):[0-5]\d$/.test(p.close||""));
    const fmt=(time)=>{const [hour,minute]=time.split(":").map(Number);const h=hour%12||12;const suffix=hour<12?"a. m.":"p. m.";return h+":"+String(minute).padStart(2,"0")+" "+suffix;};
    const nowMinute=Number(values.hour)*60+Number(values.minute);
    const isOpen=Boolean(day?.enabled)&&periods.some((p)=>{const [sh,sm]=p.open.split(":").map(Number);const [eh,em]=p.close.split(":").map(Number);const from=sh*60+sm,to=eh*60+em;return from<=to?(nowMinute>=from&&nowMinute<to):(nowMinute>=from||nowMinute<to);});
    const hours=day?.enabled&&periods.length?periods.map((p)=>fmt(p.open)+"–"+fmt(p.close)).join(" · "):"Sin atención programada";
    return {dayKey,dayLabel,isOpen,hours,configured:Boolean(day?.enabled&&periods.length)};
  })();
  const catalogLogoUrl = getBusinessLogoUrl(business?.logo_path);
  const catalogPrimary=readableText(catalogTheme.surface,catalogTheme.primary);
  const catalogSurfaceText=readableText(catalogTheme.surface,catalogTheme.text);
  const catalogThemeStyle = {
    "--green": catalogPrimary, "--paper": catalogTheme.surface, "--ink": catalogSurfaceText, "--muted": readableText(catalogTheme.surface,"#69758A"), "--primary-button-text": readableText(catalogPrimary,"#FFFFFF"), "--button-hover": catalogTheme.buttonHover, "--button-hover-text": readableText(catalogTheme.buttonHover,catalogTheme.buttonHoverText),
    "--app-background": catalogTheme.background, "--soft-green": "color-mix(in srgb," + catalogPrimary + " 12%,white)",
    background: catalogTheme.background, color: readableText(catalogTheme.background,catalogTheme.text)
  };
  const items = payload?.products || [];
  const total = Number(payload?.total || 0);
  const cartCount = cart.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  const cartTotal = cart.reduce((sum, line) => sum + Number(line.product.sale_price_minor || 0) * Number(line.quantity || 0), 0);
  const checkoutTotal = Math.max(0, cartTotal - Number(couponApplied?.discount_minor || 0));
  const addToCart = (product) => {
    setCart((current) => {
      const found = current.find((line) => line.product.id === product.id);
      if (found) return current.map((line) => line.product.id === product.id ? { ...line, quantity: Math.min(1000, Number(line.quantity) + 1) } : line);
      return [...current, { product, quantity: 1 }];
    });
    setCheckoutError("");
    setCouponApplied(null); setCouponMessage("");
    setCartOpen(true);
  };
  const updateCartQuantity = (productId, quantity) => {
    const next = Number(quantity);
    setCouponApplied(null); setCouponMessage("");
    if (!Number.isFinite(next) || next <= 0) {
      setCart((current) => current.filter((line) => line.product.id !== productId));
      return;
    }
    setCart((current) => current.map((line) => line.product.id === productId ? { ...line, quantity: Math.min(1000, Math.round(next * 1000) / 1000) } : line));
    setCouponApplied(null); setCouponMessage("");
  };
  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code || !cart.length || couponChecking) return;
    setCouponChecking(true); setCouponMessage(""); setCouponApplied(null); setCheckoutError("");
    try {
      const { data, error: validationError } = await supabase.rpc("get_public_coupon_quote", {
        p_business_id: businessId, p_coupon_code: code, p_subtotal_minor: cartTotal
      });
      if (validationError) throw validationError;
      if (!data?.valid) throw new Error(data?.message || "No se pudo validar el cupón.");
      setCouponApplied(data);
      setCouponCode(data.code || code);
      setCouponMessage(data.message || "Cupón aplicado.");
    } catch (e) {
      setCouponMessage(e?.message || friendlyError(e));
    } finally { setCouponChecking(false); }
  };
  const submitCheckout = async (event) => {
    event.preventDefault();
    if (!cart.length || checkoutBusy) return;
    if (business?.commercial_profile?.orderChannel === "whatsapp") {
      let rawPhone = String(business?.commercial_profile?.phone || "").replace(/\D/g, "");
      if (rawPhone.length === 10 && rawPhone.startsWith("3")) rawPhone = "57" + rawPhone;
      if (rawPhone.length < 8) { setCheckoutError("Este negocio debe configurar un número de WhatsApp válido antes de recibir pedidos."); return; }
      setCheckoutBusy(true); setCheckoutError("");
      const lines = cart.map((line) => "• " + line.product.name + " × " + line.quantity + " = " + money(Number(line.product.sale_price_minor || 0) * Number(line.quantity), business?.currency_code || "COP"));
      const discountLine = couponApplied ? "\nDescuento (" + couponApplied.code + "): -" + money(couponApplied.discount_minor, business?.currency_code || "COP") : "";
      const message = ["Hola, quiero hacer este pedido a " + (business?.commercial_profile?.tradeName || business?.name || "su negocio") + ":", "", ...lines, "", "Subtotal: " + money(cartTotal, business?.currency_code || "COP") + discountLine, "Total estimado: " + money(checkoutTotal, business?.currency_code || "COP"), "", "Nombre: " + checkoutForm.name.trim(), "Celular: " + checkoutForm.phone.trim(), checkoutForm.email.trim() ? "Correo: " + checkoutForm.email.trim() : "", checkoutForm.address.trim() ? "Dirección: " + checkoutForm.address.trim() : "", checkoutForm.notes.trim() ? "Notas: " + checkoutForm.notes.trim() : ""].filter(Boolean).join("\n");
      window.location.assign("https://wa.me/" + rawPhone + "?text=" + encodeURIComponent(message));
      return;
    }
    if (business?.currency_code !== "COP") {
      setCheckoutError("Wompi solo admite pagos en pesos colombianos (COP). Este negocio debe elegir pedidos por WhatsApp o configurar su moneda en COP.");
      return;
    }
    if (!paymentEnabled) {
      setCheckoutError("Los pagos en línea aún no están habilitados. No se ha creado ningún pedido ni se ha cobrado nada.");
      return;
    }
    setCheckoutBusy(true);
    setCheckoutError("");
    try {
      const { data: order, error: orderError } = await supabase.functions.invoke("public-checkout", {
        body: {
          action: "order",
          business_id: businessId,
          customer_name: checkoutForm.name.trim(),
          customer_phone: checkoutForm.phone.trim(),
          customer_email: checkoutForm.email.trim() || null,
          customer_address: checkoutForm.address.trim() || null,
          customer_notes: checkoutForm.notes.trim() || null,
          items: cart.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
          coupon_code: couponApplied?.code || null
        }
      });
      if (orderError) throw new Error(orderError.message || "No se pudo crear el pedido de forma segura.");
      if (!order?.order_id || !order?.checkout_token || !order?.order_reference) throw new Error("No se pudo preparar el pedido para el pago.");
      try { sessionStorage.setItem("t31-checkout:" + order.order_reference, order.checkout_token); } catch {}
      const { data: checkout, error: checkoutErrorResult } = await supabase.functions.invoke("public-checkout", {
        body: { action: "create", order_id: order.order_id, checkout_token: order.checkout_token }
      });
      if (checkoutErrorResult || !checkout?.checkout_url) {
        throw new Error(checkout?.error || checkoutErrorResult?.message || "No se pudo iniciar el pago seguro. Inténtalo de nuevo.");
      }
      window.location.assign(checkout.checkout_url);
    } catch (e) {
      setCheckoutError(e?.message || friendlyError(e));
    } finally {
      setCheckoutBusy(false);
    }
  };
  const orderChannel = business?.commercial_profile?.orderChannel === "whatsapp" ? "whatsapp" : "wompi";
  const returnedStatus = returnedOrder?.payment_status;
  const returnedMessage = returnedStatus === "approved"
    ? "Pago verificado. Tu pedido quedó confirmado."
    : returnedStatus === "pending"
      ? "Estamos esperando la confirmación del proveedor de pagos. Si ya pagaste, actualiza el estado en unos segundos."
      : returnedStatus === "declined"
        ? "El pago fue rechazado. Puedes volver al catálogo e intentarlo de nuevo."
        : returnedStatus === "voided"
          ? "El pago fue cancelado."
          : returnedStatus === "review"
            ? "Recibimos la notificación de pago, pero el pedido requiere revisión del negocio. No vuelvas a pagar; contacta al comercio."
            : returnedStatus === "unknown"
              ? "No pudimos consultar el estado del pago en este momento."
              : "";

  async function sharePublicProduct(product) {
    const url = window.location.origin + "/?catalog=" + encodeURIComponent(businessId) + "#producto-" + encodeURIComponent(product.id);
    const text = [product.name, product.description || "", "Precio: " + money(product.sale_price_minor, business?.currency_code || "COP"), url].filter(Boolean).join("\n");
    try { if (navigator.share) await navigator.share({ title: product.name, text, url }); else await navigator.clipboard.writeText(text); }
    catch (e) { if (e?.name !== "AbortError") { try { await navigator.clipboard.writeText(text); } catch {} } }
  }

  return <main className="public-catalog-shell" style={catalogThemeStyle}>
    <header className="public-catalog-header">
      <a href={window.location.origin} className="public-catalog-brand" aria-label={business?.name || "treseiscinco"}>{catalogLogoUrl ? <img src={catalogLogoUrl} alt={business?.name || "Logo del negocio"} /> : <img className="catalog-brand-symbol" src="/symbol-treseiscinco.svg" alt="treseiscinco" />}</a>
      <div><span>CATÁLOGO DE PRODUCTOS</span><h1>{business?.commercial_profile?.tradeName || business?.name || "Catálogo"}</h1></div>
      <button type="button" className="public-catalog-cart-trigger" onClick={() => setCartOpen(true)} aria-label={`Abrir carrito, ${cartCount} artículos`}>
        <span aria-hidden="true">🛒</span><span>Carrito</span><b>{cartCount}</b>
      </button>
    </header>
    {loading ? <div className="public-catalog-message"><span className="loading-dots">31</span><p>Cargando el catálogo…</p></div>
      : error ? <div className="public-catalog-message"><h2>No se pudo abrir el catálogo</h2><p>{error}</p><button type="button" className="secondary-button" onClick={() => setRetryKey((key) => key + 1)}>Reintentar</button></div>
      : !business ? <div className="public-catalog-message"><h2>Este catálogo no está disponible</h2><p>Revisa que el enlace sea correcto.</p></div>
      : <section className="public-catalog-content">
        <div className="public-catalog-intro"><div><p>{business.commercial_profile?.publicDescription || `Una selección de productos de ${business.commercial_profile?.tradeName || business.name}.`}</p><span>{total} {total === 1 ? "producto publicado" : "productos publicados"}</span>{openingInfo&&<div className={"public-business-hours-status "+(openingInfo.isOpen?"is-open":"is-closed")}><span className="public-business-hours-dot" aria-hidden="true"/><strong>{openingInfo.isOpen?"Abierto":"Cerrado"}</strong><span>{openingInfo.dayLabel}: {openingInfo.hours}</span><small>Hora de Colombia</small></div>}</div><span className="public-catalog-currency">{business.currency_code}</span></div>
        {returnedMessage && <div className={`public-catalog-payment-result ${returnedStatus === "approved" ? "is-success" : returnedStatus === "review" ? "is-warning" : ""}`} role="status">
          <div><strong>{returnedStatus === "approved" ? "¡Compra confirmada!" : returnedStatus === "pending" ? "Pago en proceso" : returnedStatus === "review" ? "Pedido en revisión" : "Estado del pedido"}</strong><p>{returnedMessage}</p>
          {returnedOrder?.sale_number && <span>Venta {returnedOrder.sale_number}</span>}
          </div>
          <button type="button" className="secondary-button" onClick={refreshReturnedOrder} disabled={orderStatusLoading}>{orderStatusLoading ? "Consultando…" : "Actualizar estado"}</button>
        </div>}
        {items.length ? <div className="public-catalog-grid">{items.map((product) => <article className="public-catalog-card" key={product.id} id={"producto-" + product.id}>
          <PublicCatalogImage businessId={businessId} product={product} />
          <div className="public-catalog-card-copy">
            <span className="public-catalog-category">{product.category_name || "Producto"}</span>
            <div className="public-catalog-product-heading"><h2>{product.name}</h2><button type="button" className="public-product-share" title={"Compartir "+product.name} aria-label={"Compartir "+product.name} onClick={()=>sharePublicProduct(product)}>↗</button></div>
            {product.description && <p>{product.description}</p>}
            {product.commercial_presentation && <span className="public-catalog-presentation">{product.commercial_presentation}</span>}
            <div className="public-catalog-price"><strong>{money(product.sale_price_minor, business.currency_code || "COP")}</strong><span>por {product.unit_name || "unidad"}</span></div>
            <button type="button" className="public-catalog-add-button" onClick={() => addToCart(product)}><span aria-hidden="true">＋</span> Añadir al carrito</button>
          </div>
        </article>)}</div>
          : <div className="public-catalog-message"><h2>Pronto habrá productos aquí</h2><p>Este negocio aún no ha publicado productos para compartir.</p></div>}
        {total > pageSize && <nav className="public-catalog-pagination" aria-label="Páginas del catálogo">
          <button type="button" className="secondary-button" disabled={page <= 0} onClick={() => { setPage((current) => Math.max(0, current - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Anterior</button>
          <span>Página {page + 1} de {Math.ceil(total / pageSize)}</span>
          <button type="button" className="secondary-button" disabled={(page + 1) * pageSize >= total} onClick={() => { setPage((current) => current + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Siguiente</button>
        </nav>}
      </section>}
    <nav className="public-catalog-bottom-bar" aria-label="Navegación del catálogo">
      <button type="button" className={"public-catalog-bottom-tab"+(!businessInfoOpen&&!cartOpen?" is-active":"")} aria-current={!businessInfoOpen&&!cartOpen?"page":undefined} onClick={() => { setBusinessInfoOpen(false); setCartOpen(false); document.querySelector(".public-catalog-header")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><span aria-hidden="true">▦</span><strong>Catálogo</strong></button>
      <button type="button" className={"public-catalog-bottom-tab"+(businessInfoOpen?" is-active":"")} onClick={() => { setCartOpen(false); setBusinessInfoOpen(true); }} aria-haspopup="dialog" aria-expanded={businessInfoOpen}><span aria-hidden="true">ⓘ</span><strong>Información</strong></button>
      <button type="button" className={"public-catalog-bottom-tab"+(cartOpen?" is-active":"")} onClick={() => { setBusinessInfoOpen(false); setCartOpen(true); }} aria-expanded={cartOpen}><span aria-hidden="true">🛒</span><strong>Carrito</strong>{cartCount > 0 && <b>{cartCount}</b>}</button>
    </nav>
    {businessInfoOpen && business && <div className="public-business-info-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setBusinessInfoOpen(false); }}>
      <section className="public-business-info-sheet" role="dialog" aria-modal="true" aria-labelledby="public-business-info-title">
        <div className="public-business-info-sheet-heading"><div><span>CONOCE EL NEGOCIO</span><h2 id="public-business-info-title">{business.commercial_profile?.tradeName || business.name}</h2></div><button type="button" onClick={() => setBusinessInfoOpen(false)} aria-label="Cerrar información">×</button></div>
        {business.commercial_profile?.publicDescription && <p className="public-business-info-description">{business.commercial_profile.publicDescription}</p>}
        <div className="public-business-info-list">
          {business.commercial_profile?.phone && <a href={"tel:"+business.commercial_profile.phone}><span aria-hidden="true">☎</span><span><strong>Teléfono / WhatsApp</strong><small>{business.commercial_profile.phone}</small></span><b>›</b></a>}
          {business.commercial_profile?.email && <a href={"mailto:"+business.commercial_profile.email}><span aria-hidden="true">✉</span><span><strong>Correo electrónico</strong><small>{business.commercial_profile.email}</small></span><b>›</b></a>}
          {(business.commercial_profile?.address || business.commercial_profile?.city) && <a href={"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent([business.commercial_profile.address,business.commercial_profile.city].filter(Boolean).join(", "))} target="_blank" rel="noreferrer"><span aria-hidden="true">⌖</span><span><strong>Dirección</strong><small>{[business.commercial_profile.address,business.commercial_profile.city].filter(Boolean).join(", ")}</small></span><b>↗</b></a>}
          {business.commercial_profile?.website && <a href={/^https?:\/\//i.test(business.commercial_profile.website)?business.commercial_profile.website:"https://"+business.commercial_profile.website} target="_blank" rel="noreferrer"><span aria-hidden="true">◎</span><span><strong>Sitio web</strong><small>{business.commercial_profile.website}</small></span><b>↗</b></a>}
          {business.commercial_profile?.hours && <div className="public-business-info-hours"><span aria-hidden="true">◷</span><span><strong>Horario de atención</strong><small className="public-business-hours">{business.commercial_profile.hours}</small></span></div>}
        </div>
        <button type="button" className="public-business-info-done" onClick={() => setBusinessInfoOpen(false)}>Volver al catálogo</button>
      </section>
    </div>}
    <footer className="public-catalog-footer">Catálogo compartido con treseiscinco</footer>

    {cartOpen && <div className="public-cart-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
      <section className="public-cart-panel" role="dialog" aria-modal="true" aria-labelledby="public-cart-title">
        <header className="public-cart-header"><div><span>COMPRA SEGURA</span><h2 id="public-cart-title">Tu carrito <small>({cartCount})</small></h2></div><button type="button" className="public-cart-close" onClick={() => setCartOpen(false)} aria-label="Cerrar carrito">×</button></header>
        {cart.length === 0 ? <div className="public-cart-empty"><span aria-hidden="true">🛍️</span><h3>Tu carrito está vacío</h3><p>Explora el catálogo y añade los productos que te interesen.</p><button type="button" className="public-catalog-add-button" onClick={() => setCartOpen(false)}>Seguir explorando</button></div>
          : <>
            <div className="public-cart-lines">{cart.map((line) => <article className="public-cart-line" key={line.product.id}>
              <div className="public-cart-line-copy"><strong>{line.product.name}</strong><span>{money(line.product.sale_price_minor, business?.currency_code || "COP")} por {line.product.unit_name || "unidad"}</span><b>{money(Number(line.product.sale_price_minor || 0) * Number(line.quantity), business?.currency_code || "COP")}</b></div>
              <div className="public-cart-quantity"><button type="button" onClick={() => updateCartQuantity(line.product.id, Number(line.quantity) - 1)} aria-label={`Quitar una unidad de ${line.product.name}`}>−</button><span>{line.quantity}</span><button type="button" onClick={() => updateCartQuantity(line.product.id, Number(line.quantity) + 1)} aria-label={`Añadir una unidad de ${line.product.name}`}>＋</button><button type="button" className="public-cart-remove" onClick={() => updateCartQuantity(line.product.id, 0)}>Eliminar</button></div>
            </article>)}</div>
            {couponApplied && <div className="public-cart-discount"><span>Cupón {couponApplied.code}</span><strong>−{money(couponApplied.discount_minor, business?.currency_code || "COP")}</strong></div>}
            <div className="public-cart-total"><span>Total del pedido</span><strong>{money(checkoutTotal, business?.currency_code || "COP")}</strong></div>
            <form className="public-checkout-form" onSubmit={submitCheckout}>
              <div className="public-coupon-entry">
                <label><span>Código de descuento</span><input maxLength={32} value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase().replace(/\s+/g,"")); setCouponApplied(null); setCouponMessage(""); }} placeholder="¿Tienes un cupón?" /></label>
                <button type="button" className="secondary-button" onClick={applyCoupon} disabled={couponChecking || !couponCode.trim() || !cart.length}>{couponChecking ? "Validando…" : couponApplied ? "Aplicado" : "Aplicar"}</button>
                {couponMessage && <p className={couponApplied ? "coupon-feedback success" : "coupon-feedback"} role="status">{couponMessage}</p>}
              </div>
              <h3>Datos para el pedido</h3>
              <label><span>Nombre completo *</span><input required minLength={2} maxLength={160} autoComplete="name" value={checkoutForm.name} onChange={(e) => setCheckoutForm((current) => ({ ...current, name: e.target.value }))} placeholder="¿A nombre de quién?" /></label>
              <label><span>Celular / WhatsApp *</span><input required minLength={5} maxLength={40} autoComplete="tel" inputMode="tel" value={checkoutForm.phone} onChange={(e) => setCheckoutForm((current) => ({ ...current, phone: e.target.value }))} placeholder="Tu número de contacto" /></label>
              <label><span>Correo electrónico (opcional)</span><input type="email" maxLength={254} autoComplete="email" value={checkoutForm.email} onChange={(e) => setCheckoutForm((current) => ({ ...current, email: e.target.value }))} placeholder="tucorreo@ejemplo.com" /></label>
              <label><span>Dirección de entrega (opcional)</span><input maxLength={250} autoComplete="street-address" value={checkoutForm.address} onChange={(e) => setCheckoutForm((current) => ({ ...current, address: e.target.value }))} placeholder="Dirección, barrio y ciudad" /></label>
              <label><span>Notas del pedido (opcional)</span><textarea maxLength={1000} rows={2} value={checkoutForm.notes} onChange={(e) => setCheckoutForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Indicaciones para el negocio" /></label>
              {checkoutError && <p className="public-checkout-error" role="alert">{checkoutError}</p>}
              {orderChannel === "wompi" && !paymentStatusLoading && business?.currency_code !== "COP" && <p className="public-checkout-unavailable">Wompi solo admite COP. El propietario debe cambiar la moneda del negocio a COP o elegir pedidos por WhatsApp.</p>}
              {orderChannel === "wompi" && !paymentStatusLoading && business?.currency_code === "COP" && !paymentEnabled && <p className="public-checkout-unavailable">El pago en línea aún no está configurado para este comercio. El propietario puede activar WhatsApp como alternativa.</p>}
              <button type="submit" className="public-checkout-pay-button" disabled={checkoutBusy || (orderChannel === "wompi" && (paymentStatusLoading || !paymentEnabled || business?.currency_code !== "COP"))}>{checkoutBusy ? (orderChannel === "whatsapp" ? "Abriendo WhatsApp…" : "Preparando pago seguro…") : orderChannel === "whatsapp" ? "Enviar pedido por WhatsApp" : paymentStatusLoading ? "Comprobando pagos…" : "Continuar al pago seguro"}</button>
              <p className="public-checkout-security">{orderChannel === "whatsapp" ? "El pedido se enviará al negocio por WhatsApp. El pago y la confirmación se acuerdan directamente con el comercio." : <><span aria-hidden="true">🔒</span> El pago se procesa en la plataforma segura de Wompi. El pedido solo se confirma cuando el proveedor verifica el pago.</>}</p>
            </form>
          </>}
      </section>
    </div>}
  </main>;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [screen, setScreen] = useState("home");
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [platformAdminData, setPlatformAdminData] = useState(null);
  const [platformAdminLoading, setPlatformAdminLoading] = useState(false);
  const [platformAdminSaving, setPlatformAdminSaving] = useState(false);
  const [platformAdminSearch, setPlatformAdminSearch] = useState("");
  const [platformPaymentBusiness, setPlatformPaymentBusiness] = useState("");
  const [platformPaymentDraft, setPlatformPaymentDraft] = useState({ interval: "month", amount: "", method: "Nequi", reference: "", notes: "" });
  const [platformAdminNote, setPlatformAdminNote] = useState("");
  const [platformAdminStatusDrafts, setPlatformAdminStatusDrafts] = useState({});
  const [platformAdminPeriodDrafts, setPlatformAdminPeriodDrafts] = useState({});
  const [businessSubscription, setBusinessSubscription] = useState(null);
  const [receivableRows, setReceivableRows] = useState([]);
  const [payableRows, setPayableRows] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsSearch, setAccountsSearch] = useState("");
  const [accountsStatusFilter, setAccountsStatusFilter] = useState("pending");
  const [accountsSort, setAccountsSort] = useState("newest");
  const [backupBusy, setBackupBusy] = useState(false);
  const [inventoryImportBusy, setInventoryImportBusy] = useState(false);
  const [inventoryImportProgress, setInventoryImportProgress] = useState("");
  const [installPrompt, setInstallPrompt] = useState(null);
  const [appInstalled, setAppInstalled] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [homeCreateMenuOpen, setHomeCreateMenuOpen] = useState(false);
  const homeCreateMenuRef = useRef(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => {
    if (!homeCreateMenuOpen) return;
    const closeOnOutside = (event) => {
      if (!homeCreateMenuRef.current?.contains(event.target)) setHomeCreateMenuOpen(false);
    };
    const closeOnEscape = (event) => { if (event.key === "Escape") setHomeCreateMenuOpen(false); };
    document.addEventListener("pointerdown", closeOnOutside, true);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside, true);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [homeCreateMenuOpen]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkInstalled = () => Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true);
    setAppInstalled(checkInstalled());
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onAppInstalled = () => {
      setAppInstalled(true);
      setInstallPrompt(null);
      setShowInstallGuide(false);
      if (session?.user?.id) {
        const userAgent = window.navigator.userAgent || "";
        const platform = /android/i.test(userAgent) ? "android" : /iphone|ipad|ipod/i.test(userAgent) ? "ios" : /windows/i.test(userAgent) ? "windows" : /macintosh|mac os/i.test(userAgent) ? "macos" : "web";
        supabase.rpc("record_platform_activity", { p_event: "pwa_installed", p_is_standalone: true, p_platform: platform }).then(({ error: activityError }) => { if (activityError) console.warn("No se pudo registrar la instalación PWA.", activityError); });
      }
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [session?.user?.id]);

  async function requestPwaInstall() {
    if (!installPrompt) {
      setShowInstallGuide((open) => !open);
      if (session?.user?.id) {
        const standalone = Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true);
        const userAgent = window.navigator.userAgent || "";
        const platform = /android/i.test(userAgent) ? "android" : /iphone|ipad|ipod/i.test(userAgent) ? "ios" : /windows/i.test(userAgent) ? "windows" : /macintosh|mac os/i.test(userAgent) ? "macos" : "web";
        supabase.rpc("record_platform_activity", { p_event: "install_help_opened", p_is_standalone: standalone, p_platform: platform }).then(({ error: activityError }) => { if (activityError) console.warn("No se pudo registrar la ayuda de instalación.", activityError); });
      }
      return;
    }
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice?.outcome === "accepted") {
        setAppInstalled(true);
        setShowInstallGuide(false);
      } else {
        setShowInstallGuide(true);
      }
    } catch {
      setShowInstallGuide(true);
    } finally {
      setInstallPrompt(null);
    }
  }

  const [sidebarEditing, setSidebarEditing] = useState(false);
  const [sidebarSaving, setSidebarSaving] = useState(false);
  const [sidebarConfirmSave, setSidebarConfirmSave] = useState(false);
  const [sidebarLayout, setSidebarLayout] = useState(defaultSidebarLayout);
  const [draggedSidebarItem, setDraggedSidebarItem] = useState(null);
  const [sidebarTouchDragging, setSidebarTouchDragging] = useState(false);
  const sidebarPreDragRef = useRef(null);
  const sidebarTouchRef = useRef(null);
  const sidebarLongPressTimerRef = useRef(null);
  const sidebarSuppressClickRef = useRef(false);
  const sidebarTouchHandlersRef = useRef({ move: null, end: null });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsCount, setProductsCount] = useState(0);
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(12);
  const [showArchivedProducts, setShowArchivedProducts] = useState(false);
  const [productStockFilter, setProductStockFilter] = useState("all");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [inventoryOverview, setInventoryOverview] = useState({ productCount: 0, trackedUnits: 0, costMinor: 0, retailMinor: 0, outOfStockCount: 0, lowStockCount: 0 });
  const [inventoryOverviewLoading, setInventoryOverviewLoading] = useState(false);
  const [inventoryOverviewRefresh, setInventoryOverviewRefresh] = useState(0);
  const [homeSummary, setHomeSummary] = useState({ loading: false, todaySalesCount: 0, todaySalesMinor: 0, openQuotesCount: 0, error: "" });
  const [viewMode, setViewMode] = useState("cards");
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkProductRows, setBulkProductRows] = useState([]);
  const [bulkProductsLoading, setBulkProductsLoading] = useState(false);
  const [bulkProductsSaving, setBulkProductsSaving] = useState(false);
  const [bulkHistoryProduct, setBulkHistoryProduct] = useState(null);
  const [bulkHistoryRows, setBulkHistoryRows] = useState([]);
  const [bulkHistoryLoading, setBulkHistoryLoading] = useState(false);
  const [bulkHistoryCount, setBulkHistoryCount] = useState(0);
  const [bulkHistoryPage, setBulkHistoryPage] = useState(1);
  const [productSort, setProductSort] = useState("name");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState(blankProduct);
  const [stagedImages, setStagedImages] = useState([]);
  const [productImageUrls, setProductImageUrls] = useState({});
  const [variantsByProduct, setVariantsByProduct] = useState({});
  const [viewingVariantsFor, setViewingVariantsFor] = useState(null);
  const [variantDraft, setVariantDraft] = useState(blankVariantDraft);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [variantBusy, setVariantBusy] = useState(false);
  const [openProductGalleries, setOpenProductGalleries] = useState({});
  const [galleryLoadingFor, setGalleryLoadingFor] = useState(null);
  const [uploadingImagesFor, setUploadingImagesFor] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [showQuickCategoryForm, setShowQuickCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [purchaseModuleTab, setPurchaseModuleTab] = useState("purchases");
  const [purchaseRows, setPurchaseRows] = useState([]);
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [purchasesPageSize, setPurchasesPageSize] = useState(20);
  const [purchasesCount, setPurchasesCount] = useState(0);
  const [expensesPage, setExpensesPage] = useState(1);
  const [expensesPageSize, setExpensesPageSize] = useState(20);
  const [expensesCount, setExpensesCount] = useState(0);
  const [purchaseItemsByPurchase, setPurchaseItemsByPurchase] = useState({});
  const [purchaseProducts, setPurchaseProducts] = useState([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showQuickPurchaseSupplierForm, setShowQuickPurchaseSupplierForm] = useState(false);
  const [showQuickExpenseSupplierForm, setShowQuickExpenseSupplierForm] = useState(false);
  const [supplierDraft, setSupplierDraft] = useState(blankSupplier);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchasePeriod, setPurchasePeriod] = useState("day");
  const [purchaseDateFrom, setPurchaseDateFrom] = useState(() => todayInBogota());
  const [purchaseDateTo, setPurchaseDateTo] = useState(() => todayInBogota());
  const [purchaseSupplierId, setPurchaseSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(todayInBogota());
  const [purchaseProductChoice, setPurchaseProductChoice] = useState("");
  const [purchaseItemName, setPurchaseItemName] = useState("");
  const [purchaseQuantity, setPurchaseQuantity] = useState("1");
  const [purchaseUnitCost, setPurchaseUnitCost] = useState("");
  const [purchaseCart, setPurchaseCart] = useState([]);
  const [purchaseTax, setPurchaseTax] = useState("0");
  const [purchasePayment, setPurchasePayment] = useState("0");
  const [purchaseInitialPaymentMethod, setPurchaseInitialPaymentMethod] = useState("Efectivo");
  const [purchasePaymentFormFor, setPurchasePaymentFormFor] = useState(null);
  const [purchasePaymentAmount, setPurchasePaymentAmount] = useState("");
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState("Efectivo");
  const [purchasePaymentDate, setPurchasePaymentDate] = useState(todayInBogota());
  const [purchasePaymentNotes, setPurchasePaymentNotes] = useState("");
  const [purchasePaymentSaving, setPurchasePaymentSaving] = useState(false);
  const [purchaseNotes, setPurchaseNotes] = useState("");
  const [expenseRows, setExpenseRows] = useState([]);
  const [profitabilityLoading, setProfitabilityLoading] = useState(false);
  const [profitabilitySales, setProfitabilitySales] = useState([]);
  const [profitabilitySaleItems, setProfitabilitySaleItems] = useState([]);
  const [profitabilityExpenses, setProfitabilityExpenses] = useState([]);
  const [profitabilityPeriod, setProfitabilityPeriod] = useState("month");
  const [profitabilityDateFrom, setProfitabilityDateFrom] = useState(() => todayInBogota().slice(0,7) + "-01");
  const [profitabilityDateTo, setProfitabilityDateTo] = useState(() => todayInBogota());
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseDraft, setExpenseDraft] = useState(blankExpense);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogViewMode, setCatalogViewMode] = useState("cards");
  const [catalogSort, setCatalogSort] = useState("name");
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize, setCatalogPageSize] = useState(12);
  const [catalogPublishingId, setCatalogPublishingId] = useState(null);
  const [teamRows, setTeamRows] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [teamEmail, setTeamEmail] = useState("");
  const [teamPermissionDraft, setTeamPermissionDraft] = useState(blankTeamPermissions);
  const [teamPermissionProfile, setTeamPermissionProfile] = useState("vendedor");
  const [teamEditingUserId, setTeamEditingUserId] = useState(null);
  const [teamSaving, setTeamSaving] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState("day");
  const [salesDateFrom, setSalesDateFrom] = useState(() => todayInBogota());
  const [salesDateTo, setSalesDateTo] = useState(() => todayInBogota());
  const [salesSelectedDate, setSalesSelectedDate] = useState(() => todayInBogota());
  const [auditRows, setAuditRows] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPeriod, setAuditPeriod] = useState("day");
  const [auditDateFrom, setAuditDateFrom] = useState(() => todayInBogota());
  const [auditDateTo, setAuditDateTo] = useState(() => todayInBogota());
  const [auditOffset, setAuditOffset] = useState(0);
  const [auditHasMore, setAuditHasMore] = useState(false);
  const [allocationSettings, setAllocationSettings] = useState({ diezmo: { enabled: false, percent: 0 }, ahorro: { enabled: false, percent: 0 }, otra: { enabled: false, name: "Otra asignación", percent: 0 } });
  const [targetProfitPercent, setTargetProfitPercent] = useState("15");
  const [simulateAllocations, setSimulateAllocations] = useState(false);
  const [statsSales, setStatsSales] = useState([]);
  const [statsPayments, setStatsPayments] = useState([]);
  const [statsExpenses, setStatsExpenses] = useState([]);
  const [statsPurchases, setStatsPurchases] = useState([]);
  const [statsPurchasePayments, setStatsPurchasePayments] = useState([]);
  const [balanceTrendRows, setBalanceTrendRows] = useState({payments:[],expenses:[],purchasePayments:[]});
  const [balanceTrendLoading, setBalanceTrendLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState("day");
  const [statsDateFrom, setStatsDateFrom] = useState(() => todayInBogota().slice(0, 7) + "-01");
  const [statsDateTo, setStatsDateTo] = useState(() => todayInBogota());
  const [quotesRows, setQuotesRows] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesPage, setQuotesPage] = useState(1);
  const [quotesPageSize, setQuotesPageSize] = useState(20);
  const [quotesCount, setQuotesCount] = useState(0);
  const [quotesSearch, setQuotesSearch] = useState("");
  const [quotesStatusFilter, setQuotesStatusFilter] = useState("all");
  const [quoteProducts, setQuoteProducts] = useState([]);
  const [quoteCustomers, setQuoteCustomers] = useState([]);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [editingQuoteOriginalItems, setEditingQuoteOriginalItems] = useState([]);
  const [quoteCustomerId, setQuoteCustomerId] = useState("");
  const [quoteCustomerName, setQuoteCustomerName] = useState("");
  const [quoteCustomerEmail, setQuoteCustomerEmail] = useState("");
  const [quoteCustomerPhone, setQuoteCustomerPhone] = useState("");
  const [showQuickQuoteCustomerForm, setShowQuickQuoteCustomerForm] = useState(false);
  const [quickQuoteCustomerName, setQuickQuoteCustomerName] = useState("");
  const [quickQuoteCustomerPhone, setQuickQuoteCustomerPhone] = useState("");
  const [quickQuoteCustomerEmail, setQuickQuoteCustomerEmail] = useState("");
  const [quickQuoteCustomerCompany, setQuickQuoteCustomerCompany] = useState("");
  const [quickQuoteCustomerWhatsapp, setQuickQuoteCustomerWhatsapp] = useState("");
  const [quickQuoteCustomerDocumentType, setQuickQuoteCustomerDocumentType] = useState("");
  const [quickQuoteCustomerDocumentNumber, setQuickQuoteCustomerDocumentNumber] = useState("");
  const [quickQuoteCustomerCity, setQuickQuoteCustomerCity] = useState("");
  const [quickQuoteCustomerAddress, setQuickQuoteCustomerAddress] = useState("");
  const [quickQuoteCustomerSaving, setQuickQuoteCustomerSaving] = useState(false);
  const [quoteValidUntil, setQuoteValidUntil] = useState(() => {
    const date = new Date(todayInBogota() + "T12:00:00-05:00");
    date.setDate(date.getDate() + 15);
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  });
  const [quoteNotes, setQuoteNotes] = useState("");
  const [quoteProductChoice, setQuoteProductChoice] = useState("");
  const [quoteItemName, setQuoteItemName] = useState("");
  const [quoteQuantity, setQuoteQuantity] = useState("1");
  const [quoteUnitPrice, setQuoteUnitPrice] = useState("");
  const [quoteItems, setQuoteItems] = useState([]);
  const [quoteSaving, setQuoteSaving] = useState(false);
  const [salesPage, setSalesPage] = useState(1);
  const [salesPageSize, setSalesPageSize] = useState(20);
  const [salesCount, setSalesCount] = useState(0);
  const [customersPage, setCustomersPage] = useState(1);
  const [customersPageSize, setCustomersPageSize] = useState(20);
  const [customersCount, setCustomersCount] = useState(0);
  const [saleProducts, setSaleProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerDraft, setCustomerDraft] = useState(blankCustomer);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleCustomerId, setSaleCustomerId] = useState("");
  const [showQuickCustomerForm, setShowQuickCustomerForm] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState("");
  const [quickCustomerPhone, setQuickCustomerPhone] = useState("");
  const [quickCustomerEmail, setQuickCustomerEmail] = useState("");
  const [quickCustomerCompany, setQuickCustomerCompany] = useState("");
  const [quickCustomerWhatsapp, setQuickCustomerWhatsapp] = useState("");
  const [quickCustomerDocumentType, setQuickCustomerDocumentType] = useState("");
  const [quickCustomerDocumentNumber, setQuickCustomerDocumentNumber] = useState("");
  const [quickCustomerCity, setQuickCustomerCity] = useState("");
  const [quickCustomerAddress, setQuickCustomerAddress] = useState("");
  const [quickCustomerSaving, setQuickCustomerSaving] = useState(false);
  const [saleProductChoice, setSaleProductChoice] = useState("");
  const [showQuickSaleProductForm, setShowQuickSaleProductForm] = useState(false);
  const [quickSaleProductName, setQuickSaleProductName] = useState("");
  const [quickSaleProductCategoryId, setQuickSaleProductCategoryId] = useState("");
  const [showQuickSaleCategoryForm, setShowQuickSaleCategoryForm] = useState(false);
  const [quickSaleCategoryName, setQuickSaleCategoryName] = useState("");
  const [quickSaleCategorySaving, setQuickSaleCategorySaving] = useState(false);
  const [quickSaleProductType, setQuickSaleProductType] = useState("physical");
  const [quickSaleProductPrice, setQuickSaleProductPrice] = useState("");
  const [quickSaleProductCost, setQuickSaleProductCost] = useState("");
  const [quickSaleProductStock, setQuickSaleProductStock] = useState("1");
  const [quickSaleProductSaving, setQuickSaleProductSaving] = useState(false);
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [saleItems, setSaleItems] = useState([]);
  const [saleSaving, setSaleSaving] = useState(false);
  const [salePayment, setSalePayment] = useState("");
  const [saleInitialPaymentMethod, setSaleInitialPaymentMethod] = useState("Efectivo");
  const [salePaymentFormFor, setSalePaymentFormFor] = useState(null);
  const [salePaymentAmount, setSalePaymentAmount] = useState("");
  const [salePaymentMethod, setSalePaymentMethod] = useState("Efectivo");
  const [salePaymentDate, setSalePaymentDate] = useState(todayInBogota());
  const [salePaymentNotes, setSalePaymentNotes] = useState("");
  const [salePaymentSaving, setSalePaymentSaving] = useState(false);
  const [saleNotes, setSaleNotes] = useState("");
  const [settingsCurrency, setSettingsCurrency] = useState("COP");
  const [settingsBusinessName, setSettingsBusinessName] = useState("");
  const [settingsTab, setSettingsTab] = useState("general");
  const [uiLanguage, setUiLanguage] = useState(() => {
    try { return typeof window !== "undefined" && window.localStorage.getItem("treseiscinco-language") === "en" ? "en" : "es"; }
    catch { return "es"; }
  });
  const [settingsCommercialProfile, setSettingsCommercialProfile] = useState({ tradeName: "", documentNumber: "", email: "", phone: "", address: "", city: "", website: "", publicDescription: "", hours: "", orderChannel: "wompi", hoursSchedule: {} });
  const [aiVoiceListening, setAiVoiceListening] = useState(false);
  const aiRecognitionRef = useRef(null);
  useEffect(() => applyAppLanguage(uiLanguage), [uiLanguage]);
  useEffect(() => () => { try { aiRecognitionRef.current?.stop?.(); } catch {} }, []);
  const [settingsChecking, setSettingsChecking] = useState(false);
  const [settingsHasData, setSettingsHasData] = useState(false);
  const [settingsConversionRate, setSettingsConversionRate] = useState("");
  const [settingsTheme, setSettingsTheme] = useState(defaultBusinessTheme);
  const [settingsHelpEnabled, setSettingsHelpEnabled] = useState(true);
  const [settingsTaxProfile, setSettingsTaxProfile] = useState(DEFAULT_TAX_PROFILE);
  const [settingsLogoFile, setSettingsLogoFile] = useState(null);
  const [settingsLogoPreview, setSettingsLogoPreview] = useState("");
  const [settingsRemoveLogo, setSettingsRemoveLogo] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  useEffect(() => {
    const closeGlobalHelpWhenFieldHelpOpens = () => setHelpOpen(false);
    document.addEventListener("treseiscinco:field-help-open", closeGlobalHelpWhenFieldHelpOpens);
    return () => document.removeEventListener("treseiscinco:field-help-open", closeGlobalHelpWhenFieldHelpOpens);
  }, []);
  useEffect(() => {
    if (!helpOpen) return;
    const closeOnOutsidePointer = (event) => {
      const panel = document.getElementById("contextual-help-panel");
      if (panel?.contains(event.target) || event.target?.closest?.(".context-help-trigger")) return;
      setHelpOpen(false);
    };
    const closeOnEscape = (event) => { if (event.key === "Escape") setHelpOpen(false); };
    document.addEventListener("pointerdown", closeOnOutsidePointer, true);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer, true);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [helpOpen]);
  const [aiMessage, setAiMessage] = useState("");
  const [aiHistory, setAiHistory] = useState([]);
  const aiMessagesRef = useRef(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [search, setSearch] = useState("");
  useEffect(() => {
    setAiHistory([]);
    setAiMessage("");
  }, [activeBusiness?.id]);
  useEffect(() => {
    if (!aiOpen || !aiMessagesRef.current) return;
    const container = aiMessagesRef.current;
    let frame = requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
      container.lastElementChild?.scrollIntoView({ block: "end", behavior: "auto" });
    });
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
        container.lastElementChild?.scrollIntoView({ block: "end", behavior: "auto" });
      });
    });
    observer.observe(container, { childList: true, subtree: true, characterData: true });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [aiHistory, aiBusy, aiOpen]);
  function toggleAiVoice() {
    if (aiVoiceListening) { aiRecognitionRef.current?.stop?.(); setAiVoiceListening(false); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setError("Este navegador no ofrece dictado por voz. Prueba Chrome actualizado en Android o usa el teclado con micrófono."); return; }
    try {
      const recognition = new SpeechRecognition(); aiRecognitionRef.current = recognition; recognition.lang = "es-CO"; recognition.interimResults = true; recognition.continuous = false;
      recognition.onstart = () => setAiVoiceListening(true);
      recognition.onresult = (event) => { const transcript = Array.from(event.results).map((result) => result[0]?.transcript || "").join(" ").trim(); if (transcript) setAiMessage((current) => (current ? current.trim() + " " : "") + transcript); };
      recognition.onerror = () => { setAiVoiceListening(false); setError("No pude escuchar con claridad. Revisa el permiso del micrófono e inténtalo de nuevo."); };
      recognition.onend = () => setAiVoiceListening(false); recognition.start();
    } catch { setAiVoiceListening(false); setError("No se pudo iniciar el micrófono. Revisa los permisos del navegador."); }
  }
  async function sendAiMessage(event) {
    event.preventDefault();
    const message = aiMessage.trim();
    if (!message || aiBusy) return;
    setAiMessage("");
    const nextHistory = [...aiHistory, { role: "user", content: message }];
    setAiHistory(nextHistory);
    setAiBusy(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Inicia sesión para usar el asistente.");
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token, apikey: supabasePublishableKey },
        body: JSON.stringify({
          message,
          history: nextHistory.slice(0, -1).slice(-6),
          businessId: activeBusiness?.id
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No pudimos consultar la IA.");
      setAiHistory((current) => [...current, { role: "assistant", content: payload.answer, elapsedMs: payload.elapsedMs, dataBacked: payload.dataBacked }]);
    } catch (error) {
      const messageText = String(error?.message || "");
      const friendlyMessage = /failed to fetch|networkerror|load failed/i.test(messageText)
        ? "No logré consultar la información del negocio en este momento. Inténtalo de nuevo en unos segundos."
        : /sesión|inicia sesión/i.test(messageText)
          ? "Tu sesión terminó. Vuelve a entrar y seguimos."
          : messageText || "No logré responder en este momento. Inténtalo de nuevo.";
      setAiHistory((current) => [...current, { role: "assistant", content: friendlyMessage }]);
    } finally { setAiBusy(false); }
  }

  const [adjustingId, setAdjustingId] = useState(null);
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [stockMovementRows, setStockMovementRows] = useState([]);
  const [stockMovementsLoading, setStockMovementsLoading] = useState(false);
  const [stockMovementsCount, setStockMovementsCount] = useState(0);
  const [stockMovementPage, setStockMovementPage] = useState(1);
  const [stockMovementRefresh, setStockMovementRefresh] = useState(0);
  const currencyCode = activeBusiness?.currency_code || "COP";
  useEffect(() => {
    if (screen !== "sales" || !showQuickSaleProductForm || !activeBusiness?.id) return;
    let active = true;
    supabase.from("product_categories").select("id,name,description,sort_order")
      .eq("business_id", activeBusiness.id).order("name")
      .then(({ data, error: categoryError }) => {
        if (!active) return;
        if (categoryError) throw categoryError;
        setCategories(data || []);
      })
      .catch((e) => { if (active) setError(friendlyError(e)); });
    return () => { active = false; };
  }, [screen, showQuickSaleProductForm, activeBusiness?.id]);

  const bulkEditHasChanges = bulkProductRows.some((row) =>
    String(row._draftName ?? "").trim() !== String(row.name ?? "").trim() ||
    String(row._draftSku ?? "").trim() !== String(row.sku ?? "").trim() ||
    Number(row._draftSalePrice || 0) !== Number(row.sale_price_minor || 0) / (10 ** currencyDigits(currencyCode)) ||
    Number(row._draftCostPrice || 0) !== Number(row.cost_price_minor || 0) / (10 ** currencyDigits(currencyCode)) ||
    (row.track_inventory && Number(row._draftStock || 0) !== Number(row.stock_on_hand || 0))
  );

  useEffect(() => {
    if (!activeBusiness?.id || !editingProductId) {
      setStockMovementRows([]);
      setStockMovementsCount(0);
      setStockMovementsLoading(false);
      return;
    }
    let active = true;
    setStockMovementsLoading(true);
    const from = (stockMovementPage - 1) * 10;
    supabase.from("stock_movements")
      .select("id,product_id,movement_type,quantity_delta,reference_type,notes,created_at", { count: "exact" })
      .eq("business_id", activeBusiness.id)
      .eq("product_id", editingProductId)
      .order("created_at", { ascending: false })
      .range(from, from + 9)
      .then(({ data, error: movementError, count }) => {
        if (!active) return;
        if (movementError) throw movementError;
        setStockMovementRows(data || []);
        setStockMovementsCount(count || 0);
      })
      .catch((e) => {
        if (!active) return;
        setStockMovementRows([]);
        setStockMovementsCount(0);
        setError(friendlyError(e));
      })
      .finally(() => { if (active) setStockMovementsLoading(false); });
    return () => { active = false; };
  }, [activeBusiness?.id, editingProductId, stockMovementPage, stockMovementRefresh]);

  const loadBusinesses = useCallback(async (userId) => {
    const { data, error: queryError } = await supabase
      .from("business_members")
      .select("business_id, role, permissions, businesses(id, name, logo_path, theme, currency_code, settings, created_at)")
      .eq("user_id", userId);
    if (queryError) throw queryError;
    // En una sesión nueva, prioriza el negocio propio; los negocios donde la persona trabaja siguen disponibles en el selector.
    const list = (data || []).map((row) => ({ ...row.businesses, role: row.role, permissions: row.permissions || {} }))
      .filter((b) => b?.id)
      .sort((left, right) => {
        const rolePriority = (role) => role === "owner" ? 0 : role === "admin" ? 1 : 2;
        const roleDifference = rolePriority(left.role) - rolePriority(right.role);
        if (roleDifference) return roleDifference;
        const leftCreated = Date.parse(left.created_at || "");
        const rightCreated = Date.parse(right.created_at || "");
        const leftTime = Number.isFinite(leftCreated) ? leftCreated : Number.MAX_SAFE_INTEGER;
        const rightTime = Number.isFinite(rightCreated) ? rightCreated : Number.MAX_SAFE_INTEGER;
        return leftTime - rightTime || String(left.name || "").localeCompare(String(right.name || ""), "es");
      });
    setBusinesses(list);
    setActiveBusiness((current) => list.find((b) => b.id === current?.id) || list[0] || null);
    setScreen((current) => list.length ? (current === "setup" ? "home" : current) : "setup");
    return list;
  }, []);

  const loadProducts = useCallback(async () => {
    if (!activeBusiness?.id) return;
    setProductsLoading(true); setError("");
    const columns = "id,business_id,category_id,sku,slug,name,description,commercial_presentation,product_type,unit_name,sale_price_minor,cost_price_minor,stock_on_hand,low_stock_threshold,track_inventory,is_sellable,is_published,image_paths,archived_at,created_at";
    const safeTerm = search.trim().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").slice(0, 100);
    const sortColumn = ({ name: "name", name_desc: "name", code: "sku", code_desc: "sku", price: "sale_price_minor", price_desc: "sale_price_minor", cost: "cost_price_minor", cost_desc: "cost_price_minor", stock: "stock_on_hand", stock_desc: "stock_on_hand" })[productSort] || "name";
    const descending = productSort.endsWith("_desc");
    const needsClientRanking = productStockFilter === "low_stock" || ["profit", "profit_asc", "margin", "margin_asc"].includes(productSort);
    try {
      const makeBaseQuery = () => {
        let query = supabase.from("products").select(columns, { count: "exact" }).eq("business_id", activeBusiness.id);
        query = showArchivedProducts ? query.not("archived_at", "is", null) : query.is("archived_at", null);
        if (safeTerm) {
          const term = safeTerm.replace(/"/g, '\\"');
          query = query.or("name.ilike.%" + term + "%,sku.ilike.%" + term + "%,description.ilike.%" + term + "%");
        }
        if (productCategoryFilter !== "all") query = query.eq("category_id", productCategoryFilter);
        if (productTypeFilter !== "all") query = query.eq("product_type", productTypeFilter);
        if (productStockFilter === "out_of_stock") query = query.eq("track_inventory", true).lte("stock_on_hand", 0);
        if (productStockFilter === "in_stock") query = query.eq("track_inventory", true).gt("stock_on_hand", 0);
        return query;
      };
      const [categoryResult, productResult] = await Promise.all([
        supabase.from("product_categories").select("id,name,description,sort_order").eq("business_id", activeBusiness.id).order("name"),
        (async () => {
          if (!needsClientRanking) {
            let query = makeBaseQuery().order(sortColumn, { ascending: !descending, nullsFirst: false });
            if (sortColumn !== "name") query = query.order("name", { ascending: true });
            return query.range((productPage - 1) * productPageSize, productPage * productPageSize - 1);
          }
          const all = [];
          const chunkSize = 500;
          for (let offset = 0; offset < 50000; offset += chunkSize) {
            const { data, error: chunkError } = await makeBaseQuery().order("name").range(offset, offset + chunkSize - 1);
            if (chunkError) throw chunkError;
            const batch = data || [];
            all.push(...batch);
            if (batch.length < chunkSize) break;
            if (offset + chunkSize >= 50000) throw new Error("Este inventario supera los 50.000 artículos. Usa la búsqueda para limitar los resultados.");
          }
          const filtered = productStockFilter === "low_stock"
            ? all.filter((product) => product.track_inventory && Number(product.stock_on_hand || 0) > 0 && product.low_stock_threshold != null && Number(product.stock_on_hand || 0) <= Number(product.low_stock_threshold))
            : all;
          filtered.sort((a, b) => compareInventoryProducts(a, b, productSort));
          return { data: filtered.slice((productPage - 1) * productPageSize, productPage * productPageSize), count: filtered.length, error: null };
        })()
      ]);
      if (productResult.error) throw productResult.error;
      if (categoryResult.error) throw categoryResult.error;
      const pageProducts = productResult.data || [];
      const productIds = pageProducts.map((product) => product.id);
      let variantRows = [];
      if (productIds.length) {
        const variantsResult = await supabase.from("product_variants")
          .select("id,business_id,product_id,variant_name,variant_value,sku,sale_price_minor,stock_on_hand,is_active,created_at")
          .eq("business_id", activeBusiness.id).in("product_id", productIds)
          .order("variant_name").order("variant_value").limit(1000);
        if (variantsResult.error) throw variantsResult.error;
        variantRows = variantsResult.data || [];
      }
      const variantsMap = {};
      for (const variant of variantRows) {
        if (!variantsMap[variant.product_id]) variantsMap[variant.product_id] = [];
        variantsMap[variant.product_id].push(variant);
      }
      setProducts(pageProducts);
      setVariantsByProduct(variantsMap);
      setProductsCount(productResult.count || 0);
      setCategories(categoryResult.data || []);
    } catch (e) { setError(friendlyError(e)); }
    finally { setProductsLoading(false); }
  }, [activeBusiness?.id, productPage, productPageSize, search, showArchivedProducts, productSort, productStockFilter, productCategoryFilter, productTypeFilter]);

  const loadInventoryOverview = useCallback(async () => {
    if (!activeBusiness?.id || !canAccessScreen("products")) return;
    setInventoryOverviewLoading(true);
    try {
      const all = [];
      const chunkSize = 500;
      for (let offset = 0; offset < 50000; offset += chunkSize) {
        const { data, error: queryError } = await supabase.from("products")
          .select("id,cost_price_minor,sale_price_minor,stock_on_hand,track_inventory,low_stock_threshold")
          .eq("business_id", activeBusiness.id).is("archived_at", null)
          .order("name").range(offset, offset + chunkSize - 1);
        if (queryError) throw queryError;
        const batch = data || [];
        all.push(...batch);
        if (batch.length < chunkSize) break;
        if (offset + chunkSize >= 50000) throw new Error("Este inventario supera los 50.000 artículos y no se pudo resumir completo.");
      }
      const summary = all.reduce((totals, product) => {
        if (!product.track_inventory) return totals;
        const stock = Math.max(0, Number(product.stock_on_hand || 0));
        totals.trackedUnits += stock;
        totals.costMinor += stock * Number(product.cost_price_minor || 0);
        totals.retailMinor += stock * Number(product.sale_price_minor || 0);
        if (stock <= 0) totals.outOfStockCount += 1;
        else if (product.low_stock_threshold != null && stock <= Number(product.low_stock_threshold)) totals.lowStockCount += 1;
        return totals;
      }, { trackedUnits: 0, costMinor: 0, retailMinor: 0, outOfStockCount: 0, lowStockCount: 0 });
      setInventoryOverview({ productCount: all.length, ...summary });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setInventoryOverviewLoading(false);
    }
  }, [activeBusiness?.id]);

  useEffect(() => {
    if ((screen === "products" || screen === "home") && activeBusiness?.id && canAccessScreen("products")) loadInventoryOverview();
  }, [screen, activeBusiness?.id, inventoryOverviewRefresh, loadInventoryOverview]);

  const loadHomeSummary = useCallback(async () => {
    if (!activeBusiness?.id || screen !== "home") return;
    setHomeSummary((current) => ({ ...current, loading: true, error: "" }));
    try {
      const today = todayInBogota();
      const tomorrowDate = new Date(today + "T12:00:00Z");
      tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
      const tomorrow = tomorrowDate.toISOString().slice(0, 10);
      const requests = [];
      if (canAccessScreen("sales")) {
        requests.push((async () => {
          const rows = [];
          for (let offset = 0; offset < 5000; offset += 500) {
            const { data, error: salesError } = await supabase.from("sales")
              .select("id,total_minor,status,sold_at").eq("business_id", activeBusiness.id)
              .gte("sold_at", today + "T00:00:00-05:00").lt("sold_at", tomorrow + "T00:00:00-05:00")
              .order("sold_at", { ascending: false }).range(offset, offset + 499);
            if (salesError) throw salesError;
            const batch = data || [];
            rows.push(...batch);
            if (batch.length < 500) break;
          }
          return { key: "sales", rows };
        })());
      }
      if (canAccessScreen("quotes")) {
        requests.push((async () => {
          const { count, error: quotesError } = await supabase.from("quotes")
            .select("id", { count: "exact", head: true }).eq("business_id", activeBusiness.id).in("status", ["draft", "sent"]);
          if (quotesError) throw quotesError;
          return { key: "quotes", count: Number(count || 0) };
        })());
      }
      const results = await Promise.all(requests);
      const salesResult = results.find((item) => item.key === "sales");
      const quoteResult = results.find((item) => item.key === "quotes");
      const realSales = (salesResult?.rows || []).filter((sale) => !["cancelled", "canceled", "refunded"].includes(sale.status));
      setHomeSummary({
        loading: false,
        todaySalesCount: realSales.length,
        todaySalesMinor: realSales.reduce((total, sale) => total + Number(sale.total_minor || 0), 0),
        openQuotesCount: quoteResult?.count || 0,
        error: ""
      });
    } catch (e) {
      setHomeSummary((current) => ({ ...current, loading: false, error: friendlyError(e) }));
    }
  }, [activeBusiness?.id, screen]);

  useEffect(() => {
    if (screen === "home" && activeBusiness?.id) loadHomeSummary();
  }, [screen, activeBusiness?.id, loadHomeSummary]);


  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!alive) return;
      setSession(currentSession);
      if (currentSession?.user) {
        try { await loadBusinesses(currentSession.user.id); }
        catch (e) { if (alive) setError(friendlyError(e)); }
      }
      if (alive) setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("update-password");
        setPassword("");
        setError("");
        setNotice("Ya casi está: elige una contraseña nueva.");
      }
      setSession(currentSession);
      if (!currentSession) {
        setBusinesses([]); setActiveBusiness(null); setProducts([]); setCategories([]); setScreen("home");
      } else if (event !== "PASSWORD_RECOVERY") {
        queueMicrotask(() => loadBusinesses(currentSession.user.id).catch((e) => setError(friendlyError(e))));
      }
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [loadBusinesses]);


  async function loadOutstandingAccounts() {
    if (!activeBusiness?.id || !["receivables","payables"].includes(screen)) return;
    setAccountsLoading(true);
    try {
      async function fetchAll(table, columns, orderColumn) {
        const all = [];
        for (let offset = 0; offset < 50000; offset += 500) {
          const { data, error: queryError } = await supabase.from(table).select(columns)
            .eq("business_id", activeBusiness.id).order(orderColumn, { ascending: false, nullsFirst: false })
            .range(offset, offset + 499);
          if (queryError) throw queryError;
          const rows = data || []; all.push(...rows);
          if (rows.length < 500) break;
          if (offset + 500 >= 50000) throw new Error("Hay demasiados movimientos para mostrar de una sola vez. Usa los filtros del módulo correspondiente.");
        }
        return all;
      }
      if (screen === "receivables") {
        const [sales, customers] = await Promise.all([
          fetchAll("sales","id,sale_number,customer_id,status,total_minor,amount_paid_minor,currency_code,sold_at,created_at,notes","sold_at"),
          supabase.from("customers").select("id,full_name,company_name,phone,whatsapp,email").eq("business_id",activeBusiness.id).then((r)=>{if(r.error)throw r.error;return r.data||[];})
        ]);
        const byId = new Map(customers.map((x)=>[x.id,x]));
        setReceivableRows(sales.filter((x)=>!["draft","canceled","cancelled","refunded"].includes(x.status))
          .map((x)=>({...x,customer:byId.get(x.customer_id)||null,balance_minor:Math.max(0,Number(x.total_minor||0)-Number(x.amount_paid_minor||0))})));
      } else {
        const [purchases, suppliers] = await Promise.all([
          fetchAll("purchases","id,purchase_number,supplier_id,status,total_minor,amount_paid_minor,currency_code,purchased_at,created_at,notes","purchased_at"),
          supabase.from("suppliers").select("id,name,phone,email,tax_id").eq("business_id",activeBusiness.id).then((r)=>{if(r.error)throw r.error;return r.data||[];})
        ]);
        const byId = new Map(suppliers.map((x)=>[x.id,x]));
        setPayableRows(purchases.filter((x)=>!["draft","canceled","cancelled","refunded"].includes(x.status))
          .map((x)=>({...x,supplier:byId.get(x.supplier_id)||null,balance_minor:Math.max(0,Number(x.total_minor||0)-Number(x.amount_paid_minor||0))})));
      }
    } catch (e) {
      setError(friendlyError(e));
    } finally { setAccountsLoading(false); }
  }

  async function loadPlatformAdminDashboard() {
    if (!isPlatformAdmin) return;
    setPlatformAdminLoading(true);
    try {
      const { error: expiryError } = await supabase.rpc("platform_admin_expire_trials");
      if (expiryError) throw expiryError;
      const { data, error: rpcError } = await supabase.rpc("platform_admin_dashboard");
      if (rpcError) throw rpcError;
      setPlatformAdminData(data || null);
      setPlatformAdminStatusDrafts((current)=> {
        const next={...current};
        for (const row of data?.subscriptions || []) if (!(row.subscription_id in next)) next[row.subscription_id]=row.status;
        return next;
      });
      setPlatformAdminPeriodDrafts((current)=> {
        const next={...current};
        for (const row of data?.subscriptions || []) if (!(row.subscription_id in next)) next[row.subscription_id]=row.current_period_end ? new Date(row.current_period_end).toISOString().slice(0,16) : "";
        return next;
      });
    } catch (e) {
      setError(friendlyError(e));
    } finally { setPlatformAdminLoading(false); }
  }

  async function updatePlatformSubscription(row, statusOverride = null, daysToAdd = 0) {
    if (!isPlatformAdmin || !row?.business_id || platformAdminSaving) return;
    const chosenStatus = statusOverride ?? platformAdminStatusDrafts[row.subscription_id] ?? row.status;
    const draftEnd = platformAdminPeriodDrafts[row.subscription_id];
    let periodEnd = draftEnd ? new Date(draftEnd).toISOString() : row.current_period_end;
    if (daysToAdd) {
      const base = new Date(row.current_period_end || Date.now());
      base.setDate(base.getDate() + daysToAdd);
      periodEnd = base.toISOString();
    }
    const note = platformAdminNote.trim();
    setPlatformAdminSaving(true); setError(""); setNotice("");
    try {
      const { error: rpcError } = await supabase.rpc("platform_admin_update_subscription", {
        p_business_id: row.business_id,
        p_new_status: chosenStatus,
        p_period_end: periodEnd,
        p_note: note || null
      });
      if (rpcError) throw rpcError;
      setPlatformAdminNote("");
      setNotice("Estado y periodo de la suscripción guardados en el historial.");
      await loadPlatformAdminDashboard();
    } catch (e) { setError(friendlyError(e)); }
    finally { setPlatformAdminSaving(false); }
  }

  async function submitPlatformPayment(event, row) {
    event.preventDefault();
    if (!isPlatformAdmin || !row?.business_id || platformAdminSaving) return;
    const amountMinor = toMinorUnits(platformPaymentDraft.amount, "COP");
    if (!Number.isFinite(amountMinor) || amountMinor <= 0) { setError("Escribe un valor de pago mayor que cero."); return; }
    if (["Nequi","Transferencia bancaria","Wompi manual","Tarjeta manual"].includes(platformPaymentDraft.method) && !platformPaymentDraft.reference.trim()) { setError("Escribe la referencia de la transacción para poder conciliar este pago."); return; }
    setPlatformAdminSaving(true); setError(""); setNotice("");
    try {
      const { error: rpcError } = await supabase.rpc("platform_admin_record_payment", {
        p_business_id: row.business_id,
        p_billing_interval: platformPaymentDraft.interval,
        p_amount_minor: amountMinor,
        p_currency_code: "COP",
        p_payment_method: platformPaymentDraft.method,
        p_external_reference: platformPaymentDraft.reference.trim() || null,
        p_notes: platformPaymentDraft.notes.trim() || null,
        p_received_at: new Date().toISOString()
      });
      if (rpcError) throw rpcError;
      setPlatformPaymentBusiness("");
      setPlatformPaymentDraft({ interval:"month",amount:"",method:"Nequi",reference:"",notes:"" });
      setNotice("Pago confirmado manualmente; el periodo quedó extendido y el registro no se puede alterar desde la aplicación.");
      await loadPlatformAdminDashboard();
    } catch (e) { setError(friendlyError(e)); }
    finally { setPlatformAdminSaving(false); }
  }

  function downloadBlobFile(filename, content, type = "application/octet-stream") {
    const blob = new Blob([content], {type});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = filename; anchor.style.display = "none";
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 15000);
  }

  function downloadInventoryTemplate() {
    const rows = [["Nombre","Código","Categoría","Tipo","Unidad","Precio","Costo","Cantidad","Controla inventario","Stock mínimo","Descripción","Presentación"]];
    const csv = "\uFEFF" + rows.map((row)=>row.map((cell)=>"\"" + String(cell).replace(/"/g,'""') + "\"").join(",")).join("\r\n");
    downloadBlobFile("plantilla-inventario-treseiscinco.csv",csv,"text/csv;charset=utf-8");
    setNotice("Plantilla descargada. Puedes abrirla y editarla en Excel; guarda el resultado como CSV UTF-8 para importarlo.");
  }

  async function importInventoryFile(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file || !activeBusiness?.id || !canManageProducts || inventoryImportBusy) return;
    if (file.size > 10 * 1024 * 1024) { setError("El archivo no puede superar 10 MB."); return; }
    if (!/\.csv$/i.test(file.name)) { setError("Para la carga inicial usa la plantilla CSV compatible con Excel."); return; }
    setInventoryImportBusy(true); setInventoryImportProgress("Leyendo archivo…"); setError(""); setNotice("");
    const failures = [];
    let imported = 0, skipped = 0;
    try {
      const source = (await file.text()).replace(/^\uFEFF/,"");
      const firstLine = source.split(/\r?\n/,1)[0] || "";
      const delimiter = (firstLine.match(/;/g)||[]).length > (firstLine.match(/,/g)||[]).length ? ";" : ",";
      const parsed = [];
      let row=[], cell="", quoted=false;
      for (let i=0;i<source.length;i++) {
        const ch=source[i];
        if (ch === '"' && quoted && source[i+1] === '"') { cell+='"'; i++; }
        else if (ch === '"') quoted=!quoted;
        else if (ch === delimiter && !quoted) { row.push(cell); cell=""; }
        else if ((ch === "\n" || ch === "\r") && !quoted) {
          if (ch === "\r" && source[i+1] === "\n") i++;
          row.push(cell); if (row.some((x)=>String(x).trim())) parsed.push(row);
          row=[]; cell="";
        } else cell+=ch;
      }
      if (cell.length || row.length) { row.push(cell); if (row.some((x)=>String(x).trim())) parsed.push(row); }
      if (parsed.length < 2) throw new Error("La plantilla no contiene filas de artículos.");
      const normalizeHeader=(value)=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/\s+/g,"_");
      const headers=parsed[0].map(normalizeHeader);
      const col=(row,...names)=>{const index=headers.findIndex((h)=>names.includes(h));return index<0?"":String(row[index]??"").trim();};
      if (!headers.some((h)=>["nombre","producto","name","product"].includes(h))) throw new Error("Falta la columna «Nombre» en la primera fila.");
      const dataRows=parsed.slice(1);
      if (dataRows.length>500) throw new Error("La carga inicial admite hasta 500 artículos por archivo. Divide la plantilla en varios CSV para conservar el control de errores.");
      const {data:currentProducts,error:currentError}=await supabase.from("products").select("sku,name").eq("business_id",activeBusiness.id).is("archived_at",null);
      if (currentError) throw currentError;
      const existingCodes=new Set((currentProducts||[]).map((x)=>String(x.sku||"").trim().toLocaleLowerCase()).filter(Boolean));
      const fileCodes=new Set();
      const categoryMap=new Map(categories.map((x)=>[String(x.name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),x.id]));
      const toBool=(v)=>/^(si|sí|s|true|1|yes|y)$/i.test(String(v||"").trim());
      const parseNumber=(v, fallback=0)=>{
        let raw=String(v??"").trim().replace(/\\s/g,"");
        if (!raw) return fallback;
        raw=raw.replace(/[^0-9,.-]/g,"");
        if (!raw || raw==="-" || raw==="." || raw===",") return NaN;
        const lastDot=raw.lastIndexOf("."), lastComma=raw.lastIndexOf(",");
        if (lastDot>=0 && lastComma>=0) {
          raw=lastDot>lastComma ? raw.replace(/,/g,"") : raw.replace(/\\./g,"").replace(",",".");
        } else if (lastComma>=0) {
          const decimals=raw.length-lastComma-1;
          raw=decimals===3 ? raw.replace(/,/g,"") : raw.replace(",",".");
        } else if (lastDot>=0) {
          const decimals=raw.length-lastDot-1;
          raw=decimals===3 ? raw.replace(/\\./g,"") : raw;
        }
        const number=Number(raw);
        return Number.isFinite(number) ? number : NaN;
      };
      for (let index=0; index<dataRows.length; index++) {
        const csvRow=dataRows[index], rowNo=index+2;
        const name=col(csvRow,"nombre","producto","articulo","name","product");
        if (!name) { skipped++; failures.push("Fila "+rowNo+": falta el nombre."); continue; }
        const sku=col(csvRow,"codigo","referencia","sku","code").slice(0,100) || null;
        if (sku && (existingCodes.has(sku.toLocaleLowerCase()) || fileCodes.has(sku.toLocaleLowerCase()))) {
          skipped++; failures.push("Fila "+rowNo+" ("+name+"): el código «"+sku+"» ya existe; se omitió para no duplicar referencias."); continue;
        }
        const rawType=normalizeHeader(col(csvRow,"tipo","type")) || "physical";
        const type=({fisico:"physical",fisica:"physical",physical:"physical",servicio:"service",service:"service",digital:"digital","digital_": "digital"})[rawType] || "physical";
        const price=parseNumber(col(csvRow,"precio","precio_venta","valor_venta","price")), cost=parseNumber(col(csvRow,"costo","costo_unitario","cost"));
        const stock=parseNumber(col(csvRow,"cantidad","cantidad_disponible","existencias","stock","quantity"),0);
        const thresholdText=col(csvRow,"stock_minimo","stock_bajo","low_stock_threshold");
        const threshold=thresholdText ? parseNumber(thresholdText) : null;
        if (![price,cost,stock].every(Number.isFinite) || price<0 || cost<0 || stock<0 || (threshold!==null&&(!Number.isFinite(threshold)||threshold<0))) {
          skipped++; failures.push("Fila "+rowNo+" ("+name+"): precio, costo, cantidad o mínimo inválido; no se importó."); continue;
        }
        let categoryId=null;
        const categoryName=col(csvRow,"categoria","categoria_nombre","category");
        if (categoryName) {
          const key=categoryName.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
          categoryId=categoryMap.get(key)||null;
          if (!categoryId) {
            const {data:newCategory,error:categoryError}=await supabase.from("product_categories").insert({business_id:activeBusiness.id,name:categoryName.slice(0,80)}).select("id,name").single();
            if (categoryError) {
              const {data:matches}=await supabase.from("product_categories").select("id,name").eq("business_id",activeBusiness.id).ilike("name",categoryName.slice(0,80)).limit(1);
              if (!matches?.length) { skipped++; failures.push("Fila "+rowNo+" ("+name+"): no se pudo crear la categoría «"+categoryName+"»."); continue; }
              categoryId=matches[0].id;
            } else { categoryId=newCategory.id; categoryMap.set(key,categoryId); setCategories((current)=>[...current,newCategory].sort((a,b)=>a.name.localeCompare(b.name,"es"))); }
          }
        }
        setInventoryImportProgress("Importando "+(index+1)+" de "+dataRows.length+" artículos…");
        try {
          const {error:insertError}=await supabase.rpc("create_product_with_opening_stock",{
            p_business_id:activeBusiness.id,p_name:name.slice(0,160),p_category_id:categoryId,p_sku:sku,
            p_description:col(csvRow,"descripcion","description").slice(0,5000)||null,
            p_product_type:type,p_unit_name:col(csvRow,"unidad","unit").slice(0,40)||"unidad",
            p_sale_price_minor:toMinorUnits(price,currencyCode),p_cost_price_minor:toMinorUnits(cost,currencyCode),
            p_opening_stock:type==="physical"&&toBool(col(csvRow,"controla_inventario","controla_stock","track_inventory")||"si")?stock:0,
            p_low_stock_threshold:type==="physical"&&threshold!==null?threshold:null,
            p_commercial_presentation:col(csvRow,"presentacion","presentation").slice(0,200)||null
          });
          if (insertError) throw insertError;
          imported++; if (sku) fileCodes.add(sku.toLocaleLowerCase());
        } catch (e) { skipped++; failures.push("Fila "+rowNo+" ("+name+"): "+friendlyError(e)); }
      }
      setInventoryOverviewRefresh((n)=>n+1);
      await loadProducts();
      const firstErrors=failures.slice(0,8);
      setNotice("Carga completada: "+imported+" artículos importados; "+skipped+" filas omitidas. El stock inicial quedó en el historial."+ (failures.length>8?" Hay "+(failures.length-8)+" errores adicionales.":""));
      if (firstErrors.length) setError(firstErrors.join("\n"));
    } catch (e) { setError(friendlyError(e)); }
    finally { setInventoryImportBusy(false); setInventoryImportProgress(""); }
  }

  function printBusinessCard() {
    if (!activeBusiness) return;
    const profile=settingsCommercialProfile||{};
    const name=profile.tradeName||settingsBusinessName||activeBusiness.name||"Mi negocio";
    const logoUrl=getBusinessLogoUrl(activeBusiness.logo_path)||"";
    const website=String(profile.website||"").trim();
    const safeWebsite=/^https?:\/\//i.test(website)?website:(website?"https://"+website:"");
    const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tarjeta de presentación · ${escapeHtml(name)}</title><style>*{box-sizing:border-box}body{margin:0;padding:32px;font-family:Arial,sans-serif;background:#eef1f4;color:#17202a;display:flex;justify-content:center;align-items:flex-start}.card{width:90mm;height:50mm;max-width:100%;padding:6mm;display:flex;gap:5mm;align-items:center;background:#fff;border:1px solid #d9dee5;border-radius:3mm;box-shadow:0 4mm 12mm #17202a18;overflow:hidden}.identity{width:25mm;flex:0 0 25mm;height:25mm;display:grid;place-items:center}.identity img{max-width:100%;max-height:100%;object-fit:contain}.initial{font-size:28pt;font-weight:800;color:#174580}.details{min-width:0;flex:1}.details h1{font-size:16pt;line-height:1.1;margin:0 0 2mm;overflow-wrap:anywhere}.details .tag{font-size:7pt;letter-spacing:1.2px;text-transform:uppercase;color:#667085;margin-bottom:2mm}.details p{margin:1mm 0;font-size:7.5pt;line-height:1.25;overflow-wrap:anywhere}.details .site{font-weight:700;margin-top:2mm}@media print{@page{size:90mm 50mm;margin:0}body{padding:0;background:#fff}.card{box-shadow:none;border:0;border-radius:0;max-width:none;page-break-inside:avoid}}.print-hint{font-size:13px;color:#555;margin:18px auto;max-width:90mm}@media print{.print-hint{display:none}}</style></head><body><div><article class="card"><div class="identity">${logoUrl?'<img src="'+escapeHtml(logoUrl)+'" alt="">':'<span class="initial">'+escapeHtml(name.slice(0,1).toUpperCase())+'</span>'}</div><div class="details"><div class="tag">Información comercial</div><h1>${escapeHtml(name)}</h1>${profile.publicDescription?'<p>'+escapeHtml(profile.publicDescription)+'</p>':""}${profile.documentNumber?'<p>'+escapeHtml(profile.documentNumber)+'</p>':""}${profile.phone?'<p>'+escapeHtml(profile.phone)+'</p>':""}${profile.email?'<p>'+escapeHtml(profile.email)+'</p>':""}${[profile.address,profile.city].filter(Boolean).length?'<p>'+escapeHtml([profile.address,profile.city].filter(Boolean).join(", "))+'</p>':""}${safeWebsite?'<p class="site">'+escapeHtml(website)+'</p>':""}</div></article><p class="print-hint">En el diálogo de impresión, elige «Guardar como PDF» para conservar tu tarjeta en formato 9 × 5 cm.</p></div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));</script></body></html>`;
    const printWindow=window.open("","_blank");
    if (!printWindow) { setError("Tu navegador bloqueó la ventana de impresión. Permite ventanas emergentes para generar la tarjeta."); return; }
    printWindow.document.open();printWindow.document.write(html);printWindow.document.close();
  }

  async function downloadBusinessBackup() {
    if (!activeBusiness?.id || backupBusy) return;
    setBackupBusy(true); setError(""); setNotice("");
    try {
      const tableNames=[
        "product_categories","products","product_images","product_variants","customers","suppliers",
        "sales","sale_items","sale_payments","purchases","purchase_items","purchase_payments",
        "expenses","stock_movements","audit_logs","quotes","quote_items","business_coupons"
      ];
      const backup={format:"treseiscinco-business-backup-v1",generated_at:new Date().toISOString(),
        business:{id:activeBusiness.id,name:activeBusiness.name,currency_code:activeBusiness.currency_code,
          country_code:activeBusiness.country_code,timezone:activeBusiness.timezone,theme:activeBusiness.theme,settings:activeBusiness.settings},
        tables:{},not_exported:[]};
      for (const table of tableNames) {
        try {
          const tableRows=[];
          for (let offset=0;offset<50000;offset+=500) {
            const {data,error:queryError}=await supabase.from(table).select("*").eq("business_id",activeBusiness.id).range(offset,offset+499);
            if (queryError) throw queryError;
            const batch=data||[]; tableRows.push(...batch);
            if (batch.length<500) break;
            if (offset+500>=50000) throw new Error("Tabla supera 50.000 filas");
          }
          backup.tables[table]=tableRows;
        } catch (e) { backup.not_exported.push({table,reason:String(e?.message||e).slice(0,180)}); }
      }
      downloadBlobFile("treseiscinco-copia-"+String(activeBusiness.name||"negocio").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_-]+/gi,"-").toLowerCase()+"-"+todayInBogota()+".json",JSON.stringify(backup,null,2),"application/json;charset=utf-8");
      const complete=backup.not_exported.length===0;
      setNotice(complete?"Copia de seguridad descargada. Guárdala en un lugar seguro; este archivo no sustituye las copias internas del servicio.":"Copia descargada con "+backup.not_exported.length+" tablas no exportadas por permisos o límites. Revisa el detalle antes de considerarla completa.");
      if (!complete) setError("Tablas no exportadas: "+backup.not_exported.map((x)=>x.table).join(", ")+". Por seguridad no se incluyeron credenciales privadas de pasarelas.");
    } catch (e) { setError(friendlyError(e)); }
    finally { setBackupBusy(false); }
  }


  useEffect(() => {
    let alive=true;
    if (!session?.user?.id) {
      setIsPlatformAdmin(false); setPlatformAdminData(null); setBusinessSubscription(null);
      return () => { alive=false; };
    }
    supabase.rpc("is_platform_admin").then(({data,error:rpcError})=>{
      if (!alive) return;
      if (rpcError) { setIsPlatformAdmin(false); return; }
      setIsPlatformAdmin(Boolean(data));
    }).catch(()=>{if(alive)setIsPlatformAdmin(false);});
    return () => { alive=false; };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const standalone = Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true);
    const ua = navigator.userAgent || "";
    const platform = /iphone|ipad|ipod/i.test(ua) ? "iOS" : /android/i.test(ua) ? "Android" : /windows/i.test(ua) ? "Windows" : /macintosh|mac os/i.test(ua) ? "macOS" : "Other";
    supabase.rpc("record_platform_activity", {
      p_event: standalone ? "pwa_installed" : "app_open",
      p_is_standalone: standalone,
      p_platform: platform
    }).then(({error:activityError})=>{
      if(activityError) console.warn("No se pudo registrar la actividad de plataforma.");
    }).catch(()=>{});
  }, [session?.user?.id, screen]);

  useEffect(() => {
    if (!activeBusiness?.id || !["owner","admin"].includes(activeBusiness.role)) {
      setBusinessSubscription(null);
      return;
    }
    let alive=true;
    supabase.from("business_subscriptions").select("id,status,current_period_start,current_period_end,created_at")
      .eq("business_id",activeBusiness.id).maybeSingle()
      .then(({data,error:subscriptionError})=>{if(alive)setBusinessSubscription(subscriptionError?null:data||null);})
      .catch(()=>{if(alive)setBusinessSubscription(null);});
    return ()=>{alive=false;};
  }, [activeBusiness?.id,activeBusiness?.role]);

  useEffect(() => {
    if ((screen==="receivables" || screen==="payables") && activeBusiness?.id) loadOutstandingAccounts();
  }, [screen,activeBusiness?.id]);

  useEffect(() => {
    if (screen==="platform_admin" && isPlatformAdmin) loadPlatformAdminDashboard();
  }, [screen,isPlatformAdmin]);

  async function loadBulkProducts() {
    if (!activeBusiness?.id) return;
    setBulkProductsLoading(true); setError(""); setNotice("");
    try {
      const allRows = [];
      const chunkSize = 500;
      for (let offset = 0; offset < 50000; offset += chunkSize) {
        let query = supabase.from("products")
          .select("id,business_id,category_id,sku,slug,name,description,commercial_presentation,product_type,unit_name,sale_price_minor,cost_price_minor,stock_on_hand,low_stock_threshold,track_inventory,is_sellable,is_published,image_paths,archived_at,created_at")
          .eq("business_id", activeBusiness.id).order("name").range(offset, offset + chunkSize - 1);
        query = showArchivedProducts ? query.not("archived_at", "is", null) : query.is("archived_at", null);
        const { data, error: queryError } = await query;
        if (queryError) throw queryError;
        const batch = data || [];
        allRows.push(...batch);
        if (batch.length < chunkSize) break;
        if (offset + chunkSize >= 50000) throw new Error("El inventario supera los 50.000 artículos. Filtra por nombre para editar un grupo de artículos.");
      }
      const digits = currencyDigits(currencyCode);
      setBulkProductRows(allRows.map((product) => ({
        ...product,
        _draftName: product.name || "",
        _draftSku: product.sku || "",
        _draftSalePrice: String(Number(product.sale_price_minor || 0) / (10 ** digits)),
        _draftCostPrice: String(Number(product.cost_price_minor || 0) / (10 ** digits)),
        _draftStock: String(product.stock_on_hand ?? 0)
      })));
      setBulkEditMode(true);
      setShowProductForm(false);
      setEditingProductId(null);
      setSelectedRecordDetail(null);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBulkProductsLoading(false);
    }
  }

  async function saveBulkProductChanges() {
    if (!activeBusiness?.id || bulkProductsSaving) return;
    const digits = currencyDigits(currencyCode);
    const changedRows = bulkProductRows.filter((row) =>
      String(row._draftName ?? "").trim() !== String(row.name ?? "").trim() ||
      String(row._draftSku ?? "").trim() !== String(row.sku ?? "").trim() ||
      toMinorUnits(row._draftSalePrice || 0, currencyCode) !== Number(row.sale_price_minor || 0) ||
      toMinorUnits(row._draftCostPrice || 0, currencyCode) !== Number(row.cost_price_minor || 0) ||
      (row.track_inventory && Number(row._draftStock || 0) !== Number(row.stock_on_hand || 0))
    );
    if (!changedRows.length) { setNotice("No hay cambios pendientes por guardar."); return; }
    const invalid = changedRows.find((row) =>
      !String(row._draftName ?? "").trim() ||
      !Number.isFinite(Number(row._draftSalePrice)) || Number(row._draftSalePrice) < 0 ||
      !Number.isFinite(Number(row._draftCostPrice)) || Number(row._draftCostPrice) < 0 ||
      (row.track_inventory && (!Number.isFinite(Number(row._draftStock)) || Number(row._draftStock) < 0))
    );
    if (invalid) { setError("Revisa el nombre, los precios, el costo y las existencias de «" + (invalid.name || "este artículo") + "». No se admiten valores negativos ni nombres vacíos."); return; }

    setBulkProductsSaving(true); setError(""); setNotice("");
    let savedCount = 0;
    try {
      for (const row of changedRows) {
        const nextName = String(row._draftName).trim();
        const nextSku = String(row._draftSku || "").trim() || null;
        const nextSale = toMinorUnits(row._draftSalePrice, currencyCode);
        const nextCost = toMinorUnits(row._draftCostPrice, currencyCode);
        const nextStock = Number(row._draftStock || 0);
        const productChanges = {};
        if (nextName !== String(row.name || "")) productChanges.name = nextName;
        if (nextSku !== (row.sku || null)) productChanges.sku = nextSku;
        if (nextSale !== Number(row.sale_price_minor || 0)) productChanges.sale_price_minor = nextSale;
        if (nextCost !== Number(row.cost_price_minor || 0)) productChanges.cost_price_minor = nextCost;

        if (Object.keys(productChanges).length) {
          const { data: updated, error: updateError } = await supabase.from("products")
            .update(productChanges).eq("business_id", activeBusiness.id).eq("id", row.id)
            .select("id").maybeSingle();
          if (updateError) throw updateError;
          if (!updated) throw new Error("No se pudieron guardar los datos de «" + row.name + "». Comprueba tus permisos.");
        }
        if (row.track_inventory && Math.abs(nextStock - Number(row.stock_on_hand || 0)) > 0.000001) {
          const delta = nextStock - Number(row.stock_on_hand || 0);
          const { error: stockError } = await supabase.rpc("adjust_product_stock", {
            p_business_id: activeBusiness.id,
            p_product_id: row.id,
            p_quantity_delta: delta,
            p_notes: "Ajuste desde la edición masiva del inventario"
          });
          if (stockError) throw stockError;
        }
        setBulkProductRows((current) => current.map((item) => item.id !== row.id ? item : ({
          ...item,
          name: nextName,
          sku: nextSku,
          sale_price_minor: nextSale,
          cost_price_minor: nextCost,
          stock_on_hand: row.track_inventory ? nextStock : item.stock_on_hand,
          _draftName: nextName,
          _draftSku: nextSku || "",
          _draftSalePrice: String(nextSale / (10 ** digits)),
          _draftCostPrice: String(nextCost / (10 ** digits)),
          _draftStock: String(row.track_inventory ? nextStock : item.stock_on_hand)
        })));
        savedCount += 1;
      }
      await loadProducts();
      setInventoryOverviewRefresh((current) => current + 1);
      setNotice(savedCount + (savedCount === 1 ? " artículo actualizado. El historial de existencias se conserva." : " artículos actualizados. El historial de existencias se conserva."));
    } catch (e) {
      setInventoryOverviewRefresh((current) => current + 1);
      await loadProducts();
      setError("Se guardaron " + savedCount + " de " + changedRows.length + " artículos antes de encontrar un error. Revisa el inventario y los cambios pendientes. " + friendlyError(e));
    } finally {
      setBulkProductsSaving(false);
    }
  }

  function updateBulkDraft(productId, field, value) {
    setBulkProductRows((current) => current.map((product) => product.id === productId ? { ...product, [field]: value } : product));
  }

  function openBulkHistory(product) {
    setBulkHistoryProduct(product);
    setBulkHistoryPage(1);
  }

  useEffect(() => {
    if (screen !== "products" || !activeBusiness?.id || !bulkHistoryProduct?.id) {
      setBulkHistoryRows([]);
      setBulkHistoryCount(0);
      setBulkHistoryLoading(false);
      return;
    }
    let active = true;
    setBulkHistoryLoading(true);
    const from = (bulkHistoryPage - 1) * 10;
    supabase.from("stock_movements")
      .select("id,product_id,movement_type,quantity_delta,reference_type,notes,created_at", { count: "exact" })
      .eq("business_id", activeBusiness.id).eq("product_id", bulkHistoryProduct.id)
      .order("created_at", { ascending: false }).range(from, from + 9)
      .then(({ data, error: movementError, count }) => {
        if (!active) return;
        if (movementError) throw movementError;
        setBulkHistoryRows(data || []);
        setBulkHistoryCount(count || 0);
      })
      .catch((e) => { if (active) { setBulkHistoryRows([]); setBulkHistoryCount(0); setError(friendlyError(e)); } })
      .finally(() => { if (active) setBulkHistoryLoading(false); });
    return () => { active = false; };
  }, [screen, activeBusiness?.id, bulkHistoryProduct?.id, bulkHistoryPage]);

  useEffect(() => { if (screen === "products" && activeBusiness?.id) loadProducts(); }, [screen, activeBusiness?.id, loadProducts]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(productsCount / productPageSize));
    if (productPage > maxPage) setProductPage(maxPage);
  }, [productsCount, productPageSize, productPage]);

  useEffect(() => {
    let cancelled = false;
    setProductImageUrls({});
    async function loadVisibleImages() {
      if (screen !== "products" || !activeBusiness?.id || !products.length) {
        setGalleryLoadingFor(null);
        return;
      }
      const imageKeys = products.flatMap((product) => {
        const paths = product.image_paths || [];
        return openProductGalleries[product.id] ? paths : paths.slice(0, 1);
      }).filter(Boolean);
      const openProduct = products.find((product) => openProductGalleries[product.id]);
      setGalleryLoadingFor(openProduct?.id || null);
      if (!imageKeys.length) { setGalleryLoadingFor(null); return; }
      try {
        const { data, error: imageError } = await supabase.from("product_images")
          .select("product_id,image_key,image_data")
          .eq("business_id", activeBusiness.id).in("image_key", imageKeys);
        if (imageError) throw imageError;
        if (cancelled) return;
        const imageMap = {};
        const foundKeys = new Set();
        for (const image of data || []) {
          foundKeys.add(image.image_key);
          imageMap[image.product_id + "|" + image.image_key] = "data:image/webp;base64," + image.image_data;
        }
        setProductImageUrls(imageMap);
        const missingKeys = imageKeys.filter((key) => !foundKeys.has(key));
        if (missingKeys.length) {
          setError("Hay fotos registradas que no se pudieron leer. Entra en Editar para revisarlas y volver a cargarlas.");
        }
      } catch (e) {
        if (!cancelled) setError(friendlyError(e));
      } finally {
        if (!cancelled) setGalleryLoadingFor(null);
      }
    }
    loadVisibleImages();
    return () => { cancelled = true; };
  }, [products, screen, activeBusiness?.id, openProductGalleries]);

  async function chooseNewProductImages(event) {
    const picked = Array.from(event.target.files || []);
    event.target.value = "";
    if (!picked.length) return;
    const room = Math.max(0, 3 - stagedImages.length);
    if (!room) { setError("Cada producto puede tener como máximo tres fotos."); return; }
    setBusy(true); setError("");
    const next = [];
    try {
      for (const file of picked.slice(0, room)) {
        const converted = await prepareProductImage(file);
        next.push({ file: converted, preview: URL.createObjectURL(converted), name: converted.name });
      }
      setStagedImages((current) => [...current, ...next].slice(0, 3));
      if (picked.length > room) setError("Solo puedes adjuntar tres fotos por producto. Se añadieron las primeras disponibles.");
    } catch (e) {
      next.forEach((image) => URL.revokeObjectURL(image.preview));
      setError(friendlyError(e));
    } finally { setBusy(false); }
  }

  async function chooseExistingProductImages(product, event) {
    const picked = Array.from(event.target.files || []);
    event.target.value = "";
    if (!picked.length) return;
    const currentCount = (product.image_paths || []).length;
    const room = Math.max(0, 3 - currentCount);
    if (!room) { setError("Este producto ya tiene tres fotos."); return; }
    setUploadingImagesFor(product.id); setError(""); setNotice("");
    let uploaded = 0;
    try {
      for (const file of picked.slice(0, room)) {
        const converted = await prepareProductImage(file);
        try { await uploadProductImage(product.id, converted, activeBusiness?.id); uploaded += 1; }
        finally { /* El navegador libera el archivo temporal al salir de este bloque. */ }
      }
      setNotice(uploaded ? (uploaded === 1 ? "Foto agregada al producto." : uploaded + " fotos agregadas al producto.") : "No se subió ninguna foto.");
      if (picked.length > room) setError("El producto solo admite tres fotos en total; se procesaron las primeras disponibles.");
      await loadProducts();
    } catch (e) { setError("La foto no se pudo subir. " + friendlyError(e)); await loadProducts(); }
    finally { setUploadingImagesFor(null); }
  }

  async function removeExistingProductImage(productId, imageKey) {
    setUploadingImagesFor(productId); setError(""); setNotice("");
    try {
      await deleteProductImageRequest(productId, imageKey, activeBusiness?.id);
      setProductImageUrls((current) => { const next = { ...current }; delete next[productId + "|" + imageKey]; return next; });
      setNotice("Foto eliminada."); await loadProducts();
    } catch (e) { setError(friendlyError(e)); }
    finally { setUploadingImagesFor(null); }
  }

  function handleProductImageError(productId, imageKey) {
    setProductImageUrls((current) => {
      const key = productId + "|" + imageKey;
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setError("Una foto registrada no se pudo mostrar. Entra en Editar para revisarla y volver a cargarla.");
  }

  function toggleProductGallery(product) {
    setOpenProductGalleries((current) => ({ ...current, [product.id]: !current[product.id] }));
  }

  async function shareProduct(product) {
    const url = window.location.origin + "/?catalog=" + encodeURIComponent(activeBusiness?.id || "") + "#producto-" + encodeURIComponent(product.id);
    const message = [product.name, product.sku ? "Código: " + product.sku : "", "Precio: " + money(product.sale_price_minor, currencyCode), product.description || "", url].filter(Boolean).join("\n");
    try { if (navigator.share) await navigator.share({ title: product.name, text: message, url }); else { await navigator.clipboard.writeText(message); setNotice("Enlace y datos de " + product.name + " copiados para compartir."); } }
    catch (e) { if (e?.name !== "AbortError") { try { await navigator.clipboard.writeText(message); setNotice("Datos de " + product.name + " copiados para compartir."); } catch { setError("No se pudo abrir la opción para compartir. Copia el enlace del catálogo."); } } }
  }

  function openProductDetail(product) {
    const variants = variantsByProduct[product.id] || [];
    setSelectedRecordDetail({
      type: "Producto",
      title: product.name,
      fields: [
        { label: "Categoría", value: categories.find((cat) => cat.id === product.category_id)?.name || "Sin categoría" },
        { label: "Tipo", value: product.product_type === "physical" ? "Producto físico" : product.product_type === "service" ? "Servicio" : "Digital" },
        { label: "Código", value: product.sku || "—" },
        { label: "Unidad", value: product.unit_name || "unidad" },
        { label: "Precio de venta", value: money(product.sale_price_minor, currencyCode) },
        { label: "Costo", value: money(product.cost_price_minor, currencyCode) },
        { label: "Existencias", value: product.track_inventory ? Number(product.stock_on_hand).toLocaleString("es-CO") + " " + (product.unit_name || "unidades") : "No aplica" },
        { label: "Alerta de stock", value: product.track_inventory && product.low_stock_threshold != null ? Number(product.low_stock_threshold).toLocaleString("es-CO") : "No configurada" },
        { label: "Estado", value: product.archived_at ? "Archivado" : product.is_sellable ? "Activo" : "Inactivo" },
        { label: "Catálogo", value: product.is_published ? "Publicado" : "No publicado" },
        { label: "Presentación", value: product.commercial_presentation || "" },
        { label: "Variantes", value: variants.length ? variants.map((variant) => [variant.variant_name, variant.variant_value].filter(Boolean).join(": ") || variant.sku || "Variante").join("\\n") : "Sin variantes" },
        { label: "Descripción", value: product.description || "" }
      ],
      notes: product.notes || ""
    });
  }

  useEffect(() => {
    if (screen !== "settings" || !activeBusiness?.id) return;
    let alive = true;
    setSettingsCurrency(activeBusiness.currency_code || "COP");
    setSettingsBusinessName(activeBusiness.name || "");
    const savedCommercial = activeBusiness.settings?.commercial_profile || {};
    setSettingsCommercialProfile({ tradeName: savedCommercial.tradeName || "", documentNumber: savedCommercial.documentNumber || "", email: savedCommercial.email || "", phone: savedCommercial.phone || "", address: savedCommercial.address || "", city: savedCommercial.city || "", website: savedCommercial.website || "", publicDescription: savedCommercial.publicDescription || "", hours: savedCommercial.hours || "", orderChannel: savedCommercial.orderChannel === "whatsapp" ? "whatsapp" : "wompi", hoursSchedule: savedCommercial.hoursSchedule || {} });
    setSettingsTab("general");
    setSettingsTheme(normalizeBusinessTheme(activeBusiness.theme));
    setSettingsHelpEnabled(activeBusiness.settings?.contextual_help_enabled !== false);
    setSettingsTaxProfile(normalizeTaxProfile(activeBusiness.settings?.tax_profile));
    setSettingsLogoFile(null);
    setSettingsLogoPreview("");
    setSettingsRemoveLogo(false);
    setSettingsChecking(true);
    setError("");
    businessHasFinancialData(activeBusiness.id)
      .then((hasData) => { if (alive) setSettingsHasData(hasData); })
      .catch((e) => { if (alive) setError(friendlyError(e)); })
      .finally(() => { if (alive) setSettingsChecking(false); });
    return () => { alive = false; };
  }, [screen, activeBusiness?.id, activeBusiness?.currency_code]);

  useEffect(() => () => {
    if (settingsLogoPreview?.startsWith("blob:")) URL.revokeObjectURL(settingsLogoPreview);
  }, [settingsLogoPreview]);

  useEffect(() => {
    if (activeBusiness?.settings?.contextual_help_enabled === false) setHelpOpen(false);
  }, [activeBusiness?.settings?.contextual_help_enabled]);

  function chooseBusinessLogo(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("El logo debe ser una imagen JPG, PNG o WebP.");
      return;
    }
    if (file.size > 5000000) {
      setError("El logo original debe pesar máximo 5 MB.");
      return;
    }
    setSettingsLogoFile(file);
    setSettingsLogoPreview(URL.createObjectURL(file));
    setSettingsRemoveLogo(false);
    setError("");
    setNotice("");
  }

  function clearBusinessLogo() {
    setSettingsLogoFile(null);
    setSettingsLogoPreview("");
    setSettingsRemoveLogo(Boolean(activeBusiness?.logo_path));
    setError("");
    setNotice("");
  }

  async function submitAuth(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin
        });
        if (authError) throw authError;
        setNotice("Si ese correo tiene una cuenta, te enviaremos un enlace para recuperar el acceso. Revisa tu bandeja de entrada y spam.");
      } else if (mode === "update-password") {
        if (!session?.user) throw new Error("Abre el enlace de recuperación que recibiste por correo e inténtalo de nuevo.");
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        await supabase.auth.signOut();
        setSession(null);
        setMode("login");
        setPassword("");
        setNotice("Tu contraseña se actualizó. Ya puedes iniciar sesión.");
      } else if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { display_name: fullName.trim() }, emailRedirectTo: window.location.origin }
        });
        if (authError) throw authError;
        if (!data.session) setNotice("¡Cuenta creada! Revisa tu correo y confirma la dirección antes de entrar.");
        else { setSession(data.session); setNotice("Cuenta creada. Ahora registra tu negocio."); }
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        setSession(data.session); await loadBusinesses(data.user.id);
      }
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  async function createBusiness(event) {
    event.preventDefault(); if (!session?.user) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { error: insertError } = await supabase.from("businesses").insert({
        id: crypto.randomUUID(), owner_user_id: session.user.id, name: businessName.trim(),
        country_code: "CO", currency_code: "COP", timezone: "America/Bogota",
        theme: { ...defaultBusinessTheme }
      });
      if (insertError) throw insertError;
      const list = await loadBusinesses(session.user.id);
      if (!list.length) throw new Error("El negocio se guardó, pero no pudimos confirmar tus permisos. Actualiza la página antes de volver a intentarlo.");
      setBusinessName(""); setNotice("Tu espacio de trabajo está listo.");
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true); setError("");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(friendlyError(signOutError));
    setBusy(false);
  }

  async function addCategory(event) {
    event?.preventDefault();
    if (!activeBusiness?.id || !categoryName.trim() || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { data: created, error: insertError } = await supabase.from("product_categories")
        .insert({ business_id: activeBusiness.id, name: categoryName.trim() })
        .select("id,name,description,sort_order").single();
      if (insertError) throw insertError;
      setCategories((current) => [...current.filter((item) => item.id !== created.id), created].sort((a, b) => a.name.localeCompare(b.name, "es")));
      setProductForm((current) => ({ ...current, category_id: created.id }));
      setCategoryName("");
      setShowQuickCategoryForm(false);
      setNotice("Categoría creada y seleccionada.");
      await loadProducts();
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  async function updateCategory(event) {
    event.preventDefault();
    if (!activeBusiness?.id || !editingCategoryId || !editingCategoryName.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { data, error: updateError } = await supabase.from("product_categories")
        .update({ name: editingCategoryName.trim() })
        .eq("business_id", activeBusiness.id).eq("id", editingCategoryId)
        .select("id").maybeSingle();
      if (updateError) throw updateError;
      if (!data) throw new Error("No tienes permiso para editar esta categoría.");
      setEditingCategoryId(null); setEditingCategoryName("");
      setNotice("Categoría actualizada."); await loadProducts();
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  async function deleteCategory(categoryId) {
    if (!activeBusiness?.id || !categoryId) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { data, error: deleteError } = await supabase.from("product_categories")
        .delete().eq("business_id", activeBusiness.id).eq("id", categoryId)
        .select("id").maybeSingle();
      if (deleteError) throw deleteError;
      if (!data) throw new Error("No tienes permiso para eliminar esta categoría.");
      setConfirmDeleteCategoryId(null);
      if (productForm.category_id === categoryId) setProductForm((current) => ({ ...current, category_id: "" }));
      setNotice("Categoría eliminada."); await loadProducts();
    } catch (e) { setError(friendlyError(e)); setConfirmDeleteCategoryId(null); }
    finally { setBusy(false); }
  }

  async function saveSettings(event) {
    event.preventDefault();
    if (!activeBusiness?.id) return;
    if (activeBusiness.role !== "owner") { setError("Solo el propietario puede cambiar la configuración del negocio."); return; }
    const businessName = settingsBusinessName.trim();
    if (!businessName) { setError("Escribe el nombre del negocio."); return; }
    const nextTheme = normalizeBusinessTheme(settingsTheme);
    const nextTaxProfile = normalizeTaxProfile(settingsTaxProfile);
    const rawTaxRate = nextTaxProfile.defaultRateMode === "custom" ? String(settingsTaxProfile.customRate ?? "").trim() : String(nextTaxProfile.defaultRate);
    const effectiveTaxRate = Number(String(rawTaxRate).replace(",", "."));
    if (nextTaxProfile.vatStatus === "responsible" && (!rawTaxRate || !Number.isFinite(effectiveTaxRate) || effectiveTaxRate < 0 || effectiveTaxRate > 100)) {
      setError("Indica una tarifa de IVA válida entre 0 y 100.");
      return;
    }
    const normalizeCommercialProfile = (profile) => ({
      tradeName: String(profile?.tradeName || "").trim(),
      documentNumber: String(profile?.documentNumber || "").trim(),
      email: String(profile?.email || "").trim(),
      phone: String(profile?.phone || "").trim(),
      address: String(profile?.address || "").trim(),
      city: String(profile?.city || "").trim(),
      website: String(profile?.website || "").trim(),
      publicDescription: String(profile?.publicDescription || "").trim(),
      hours: String(profile?.hours || "").trim(),
      hoursSchedule: profile?.hoursSchedule && typeof profile.hoursSchedule === "object" ? profile.hoursSchedule : {},
      orderChannel: profile?.orderChannel === "whatsapp" ? "whatsapp" : "wompi",
    });
    const days = [{key:"mon",label:"Lunes"},{key:"tue",label:"Martes"},{key:"wed",label:"Miércoles"},{key:"thu",label:"Jueves"},{key:"fri",label:"Viernes"},{key:"sat",label:"Sábado"},{key:"sun",label:"Domingo"}];
    const schedule = Object.fromEntries(days.map((day) => { const saved = settingsCommercialProfile.hoursSchedule?.[day.key] || {}; const periods = Array.isArray(saved.periods) ? saved.periods.slice(0,2).map((p) => ({open: String(p.open || ""), close: String(p.close || "")})) : [{open:"09:00",close:"18:00"}]; return [day.key, {enabled:Boolean(saved.enabled), periods: periods.length ? periods : [{open:"09:00",close:"18:00"}]}]; }));
    for (const day of days.filter((item) => schedule[item.key].enabled)) {
      const periods = schedule[day.key].periods;
      if (!periods.length || periods.some((period) => !period.open || !period.close || period.open >= period.close) || periods.some((period,index) => index > 0 && period.open < periods[index-1].close)) { setError("Revisa el horario de " + day.label + ": cada turno debe tener apertura y cierre válidos y los turnos no pueden superponerse."); return; }
    }
    const hasConfiguredSchedule = Object.keys(settingsCommercialProfile.hoursSchedule || {}).length > 0;
    const hoursText = hasConfiguredSchedule ? days.filter((day) => schedule[day.key].enabled).map((day) => day.label + ": " + schedule[day.key].periods.filter((p) => p.open && p.close).map((p) => p.open + "–" + p.close).join(" y ")).filter((line) => !line.endsWith(": ")).join("\n") : String(settingsCommercialProfile.hours || "").trim();
    const commercialProfile = normalizeCommercialProfile({...settingsCommercialProfile, hoursSchedule:hasConfiguredSchedule ? schedule : (settingsCommercialProfile.hoursSchedule || {}), hours:hoursText});
    if (commercialProfile.orderChannel === "whatsapp" && String(commercialProfile.phone).replace(/\D/g, "").length < 8) { setError("Para recibir pedidos por WhatsApp, primero configura un número válido en Teléfono / WhatsApp."); return; }
    if (commercialProfile.orderChannel === "wompi" && settingsCurrency !== "COP") { setError("Wompi solo admite COP. Elige pedidos por WhatsApp o cambia la moneda del negocio a COP."); return; }
    const savedCommercialProfile = normalizeCommercialProfile(activeBusiness.settings?.commercial_profile);
    const commercialProfileChanged = JSON.stringify(commercialProfile) !== JSON.stringify(savedCommercialProfile);
    const nextSettings = { ...(activeBusiness.settings || {}), contextual_help_enabled: settingsHelpEnabled, commercial_profile: commercialProfile, tax_profile: nextTaxProfile };
    const nameChanged = businessName !== activeBusiness.name;
    const currencyChanged = settingsCurrency !== currencyCode;
    const conversionRate = Number(String(settingsConversionRate).replace(",", "."));
    if (currencyChanged && settingsHasData && (!Number.isFinite(conversionRate) || conversionRate <= 0)) { setError("Indica una tasa válida: cuántas unidades de la nueva moneda equivalen a 1 unidad de la moneda actual."); return; }
    const themeChanged = JSON.stringify(nextTheme) !== JSON.stringify(normalizeBusinessTheme(activeBusiness.theme));
    const helpChanged = settingsHelpEnabled !== (activeBusiness.settings?.contextual_help_enabled !== false);
    const taxProfileChanged = JSON.stringify(nextTaxProfile) !== JSON.stringify(normalizeTaxProfile(activeBusiness.settings?.tax_profile));
    const logoChanged = Boolean(settingsLogoFile) || (settingsRemoveLogo && Boolean(activeBusiness.logo_path));
    if (!nameChanged && !currencyChanged && !themeChanged && !helpChanged && !logoChanged && !commercialProfileChanged && !taxProfileChanged) {
      setNotice("No hay cambios pendientes.");
      return;
    }
    setBusy(true); setError(""); setNotice("");
    let uploadedLogoPath = null;
    let businessUpdated = false;
    try {
      const hasData = await businessHasFinancialData(activeBusiness.id);
      setSettingsHasData(hasData);
      if (hasData && currencyChanged && (!Number.isFinite(conversionRate) || conversionRate <= 0)) {
        throw new Error("Indica una tasa de conversión válida antes de cambiar la moneda.");
      }
      let nextLogoPath = settingsRemoveLogo ? null : activeBusiness.logo_path || null;
      if (settingsLogoFile) {
        const converted = await prepareProductImage(settingsLogoFile);
        uploadedLogoPath = activeBusiness.id + "/" + crypto.randomUUID() + ".webp";
        const { error: uploadError } = await supabase.storage.from("business-logos").upload(
          uploadedLogoPath, converted, { contentType: "image/webp", cacheControl: "3600", upsert: false }
        );
        if (uploadError) throw uploadError;
        nextLogoPath = uploadedLogoPath;
      }
      if (currencyChanged && hasData) {
        const { error: conversionError } = await supabase.rpc("convert_business_catalog_currency", {
          p_business_id: activeBusiness.id,
          p_target_currency: settingsCurrency,
          p_rate: conversionRate
        });
        if (conversionError) throw conversionError;
      }
      const { data, error: updateError } = await supabase.from("businesses")
        .update({ name: businessName, currency_code: settingsCurrency, theme: nextTheme, logo_path: nextLogoPath, settings: nextSettings })
        .eq("id", activeBusiness.id)
        .select("id,name,currency_code,theme,logo_path,settings")
        .maybeSingle();
      if (updateError) throw updateError;
      if (!data) throw new Error("No se pudo guardar la personalización. Comprueba que hayas iniciado sesión como propietario.");
      businessUpdated = true;
      setActiveBusiness((current) => current ? { ...current, name: data.name, currency_code: data.currency_code, theme: normalizeBusinessTheme(data.theme), logo_path: data.logo_path, settings: data.settings || nextSettings } : current);
      setBusinesses((current) => current.map((business) => business.id === data.id ? { ...business, name: data.name, currency_code: data.currency_code, theme: normalizeBusinessTheme(data.theme), logo_path: data.logo_path, settings: data.settings || nextSettings } : business));
      setSettingsBusinessName(data.name);
      setSettingsCurrency(data.currency_code);
      setSettingsConversionRate("");
      setSettingsTheme(normalizeBusinessTheme(data.theme));
      setSettingsHelpEnabled(data.settings?.contextual_help_enabled !== false);
      setSettingsTaxProfile(normalizeTaxProfile(data.settings?.tax_profile || nextTaxProfile));
      setSettingsCommercialProfile(commercialProfile);
      setSettingsLogoFile(null);
      setSettingsLogoPreview("");
      setSettingsRemoveLogo(false);
      setNotice(currencyChanged && hasData ? "Configuración guardada. Convertimos los precios del catálogo con la tasa indicada y conservamos las operaciones históricas en su moneda original." : "Configuración guardada. Conservamos los datos de tu empresa, el logo y la apariencia.");
      const previousLogoPath = activeBusiness.logo_path;
      if (previousLogoPath && previousLogoPath !== data.logo_path) {
        try { await supabase.storage.from("business-logos").remove([previousLogoPath]); }
        catch { /* Un archivo antiguo huérfano no afecta al logo activo. */ }
      }
    } catch (e) {
      if (uploadedLogoPath && !businessUpdated) {
        try { await supabase.storage.from("business-logos").remove([uploadedLogoPath]); } catch { /* Limpieza opcional tras un fallo de guardado. */ }
      }
      setError(friendlyError(e));
    } finally { setBusy(false); }
  }

  function cancelProductForm() {
    stagedImages.forEach((image) => URL.revokeObjectURL(image.preview));
    setStagedImages([]);
    setProductForm(blankProduct);
    if (editingProductId) setOpenProductGalleries((current) => ({ ...current, [editingProductId]: false }));
    setEditingProductId(null);
    setAdjustDelta(""); setAdjustNote("");
    setStockMovementRows([]); setStockMovementsCount(0); setStockMovementPage(1);
    setShowProductForm(false);
    setError("");
  }

  function startEditProduct(product) {
    stagedImages.forEach((image) => URL.revokeObjectURL(image.preview));
    const knownUnit = unitOptions.some(([value]) => value === product.unit_name);
    const digits = currencyDigits(currencyCode);
    setStagedImages([]);
    setEditingProductId(product.id);
    setStockMovementPage(1);
    setAdjustDelta(""); setAdjustNote("");
    setOpenProductGalleries((current) => ({ ...current, [product.id]: true }));
    setShowProductForm(true);
    setProductForm({
      name: product.name || "",
      sku: product.sku || "",
      category_id: product.category_id || "",
      description: product.description || "",
      commercial_presentation: product.commercial_presentation || "",
      product_type: product.product_type || "physical",
      unit_name: knownUnit ? product.unit_name : "personalizada",
      unit_custom: knownUnit ? "" : (product.unit_name || ""),
      sale_price: String(Number(product.sale_price_minor || 0) / (10 ** digits)),
      cost_price: String(Number(product.cost_price_minor || 0) / (10 ** digits)),
      stock: String(product.stock_on_hand ?? 0),
      low_stock: product.low_stock_threshold == null ? "" : String(product.low_stock_threshold)
    });
    setError("");
    setNotice("");
  }

  async function loadProductVariants(productId) {
    if (!activeBusiness?.id || !productId) return;
    const { data, error: variantsError } = await supabase.from("product_variants")
      .select("id,business_id,product_id,variant_name,variant_value,sku,sale_price_minor,stock_on_hand,is_active,created_at")
      .eq("business_id", activeBusiness.id).eq("product_id", productId)
      .order("variant_name").order("variant_value").limit(500);
    if (variantsError) throw variantsError;
    setVariantsByProduct((current) => ({ ...current, [productId]: data || [] }));
  }

  function openProductVariants(product) {
    setViewingVariantsFor(product.id);
    setVariantDraft(blankVariantDraft);
    setEditingVariantId(null);
    setError("");
    loadProductVariants(product.id).catch((e) => setError(friendlyError(e)));
  }

  function editProductVariant(variant) {
    const digits = currencyDigits(currencyCode);
    setVariantDraft({
      variant_name: variant.variant_name || "",
      variant_value: variant.variant_value || "",
      sku: variant.sku || "",
      sale_price: variant.sale_price_minor == null ? "" : String(Number(variant.sale_price_minor) / (10 ** digits)),
      stock_on_hand: variant.stock_on_hand == null ? "" : String(variant.stock_on_hand)
    });
    setEditingVariantId(variant.id);
    setError("");
  }

  function resetVariantDraft() {
    setVariantDraft(blankVariantDraft);
    setEditingVariantId(null);
  }

  async function saveProductVariant(event) {
    event.preventDefault();
    if (!activeBusiness?.id || !viewingVariantsFor) return;
    if (!variantDraft.variant_name.trim() || !variantDraft.variant_value.trim()) {
      setError("Completa el nombre y el valor de la variante.");
      return;
    }
    setVariantBusy(true); setError(""); setNotice("");
    try {
      const payload = {
        business_id: activeBusiness.id,
        product_id: viewingVariantsFor,
        variant_name: variantDraft.variant_name.trim(),
        variant_value: variantDraft.variant_value.trim(),
        sku: variantDraft.sku.trim() || null,
        sale_price_minor: variantDraft.sale_price.trim() === "" ? null : toMinorUnits(variantDraft.sale_price, currencyCode),
        stock_on_hand: variantDraft.stock_on_hand.trim() === "" ? null : Number(variantDraft.stock_on_hand),
        is_active: true
      };
      let mutation = supabase.from("product_variants");
      if (editingVariantId) {
        mutation = mutation.update({
          variant_name: payload.variant_name,
          variant_value: payload.variant_value,
          sku: payload.sku,
          sale_price_minor: payload.sale_price_minor,
          stock_on_hand: payload.stock_on_hand,
          is_active: payload.is_active,
          updated_at: new Date().toISOString()
        })
          .eq("id", editingVariantId).eq("business_id", activeBusiness.id).eq("product_id", viewingVariantsFor);
      } else {
        mutation = mutation.insert(payload);
      }
      const { error: saveError } = await mutation;
      if (saveError) throw saveError;
      await loadProductVariants(viewingVariantsFor);
      resetVariantDraft();
      setNotice(editingVariantId ? "Variante actualizada." : "Variante agregada.");
    } catch (e) {
      setError(friendlyError(e));
    } finally { setVariantBusy(false); }
  }

  async function removeProductVariant(variant) {
    if (!activeBusiness?.id || !viewingVariantsFor) return;
    if (!window.confirm("¿Quitar la variante " + variant.variant_name + " · " + variant.variant_value + "?")) return;
    setVariantBusy(true); setError(""); setNotice("");
    try {
      const { error: deleteError } = await supabase.from("product_variants").delete()
        .eq("id", variant.id).eq("business_id", activeBusiness.id).eq("product_id", viewingVariantsFor);
      if (deleteError) throw deleteError;
      await loadProductVariants(viewingVariantsFor);
      if (editingVariantId === variant.id) resetVariantDraft();
      setNotice("Variante eliminada.");
    } catch (e) { setError(friendlyError(e)); }
    finally { setVariantBusy(false); }
  }

  async function archiveProduct(product) {
    if (!activeBusiness?.id) return;
    const restoring = Boolean(product.archived_at);
    const confirmation = restoring
      ? "¿Restaurar " + product.name + " para que vuelva a la lista de productos?"
      : "¿Archivar " + product.name + "? No se borrará ni se alterará su historial.";
    if (!window.confirm(confirmation)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { data, error: archiveError } = await supabase.from("products")
        .update({ archived_at: restoring ? null : new Date().toISOString() })
        .eq("business_id", activeBusiness.id).eq("id", product.id).select("id").maybeSingle();
      if (archiveError) throw archiveError;
      if (!data) throw new Error("No se pudo actualizar el producto. Comprueba tus permisos.");
      setNotice(restoring ? "Producto restaurado." : "Producto archivado. Puedes encontrarlo en «Archivados».");
      if (viewingVariantsFor === product.id) setViewingVariantsFor(null);
      setInventoryOverviewRefresh((current) => current + 1);
      await loadProducts();
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  async function addProduct(event) {
    event.preventDefault();
    if (!activeBusiness?.id) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const pendingImages = [...stagedImages];
      if (editingProductId) {
        const { data: updated, error: updateError } = await supabase.from("products")
          .update({
            name: productForm.name.trim(),
            sku: productForm.sku.trim() || null,
            category_id: productForm.category_id || null,
            description: productForm.description.trim() || null,
            commercial_presentation: productForm.commercial_presentation.trim() || null,
            unit_name: (productForm.unit_name === "personalizada" ? productForm.unit_custom.trim() : productForm.unit_name.trim()) || "unidad",
            sale_price_minor: toMinorUnits(productForm.sale_price, currencyCode),
            cost_price_minor: toMinorUnits(productForm.cost_price, currencyCode),
            low_stock_threshold: productForm.product_type === "physical" && productForm.low_stock !== "" ? Number(productForm.low_stock) : null
          })
          .eq("business_id", activeBusiness.id).eq("id", editingProductId)
          .select("id").maybeSingle();
        if (updateError) throw updateError;
        if (!updated) throw new Error("No se pudo actualizar el producto. Comprueba tus permisos.");
        setProductForm(blankProduct); setShowProductForm(false);
        setOpenProductGalleries((current) => ({ ...current, [editingProductId]: false }));
        setEditingProductId(null);
        setStagedImages([]);
        pendingImages.forEach((image) => URL.revokeObjectURL(image.preview));
        setInventoryOverviewRefresh((current) => current + 1);
        await loadProducts();
        setNotice("Producto actualizado. El historial de existencias se conservó.");
        return;
      }
      const { data: newProductId, error: rpcError } = await supabase.rpc("create_product_with_opening_stock", {
        p_business_id: activeBusiness.id,
        p_name: productForm.name.trim(),
        p_category_id: productForm.category_id || null,
        p_sku: productForm.sku.trim() || null,
        p_description: productForm.description.trim() || null,
        p_product_type: productForm.product_type,
        p_unit_name: (productForm.unit_name === "personalizada" ? productForm.unit_custom.trim() : productForm.unit_name.trim()) || "unidad",
        p_sale_price_minor: toMinorUnits(productForm.sale_price, currencyCode),
        p_cost_price_minor: toMinorUnits(productForm.cost_price, currencyCode),
        p_opening_stock: Number(productForm.stock || 0),
        p_low_stock_threshold: productForm.low_stock === "" ? null : Number(productForm.low_stock),
        p_commercial_presentation: productForm.commercial_presentation.trim() || null
      });
      if (rpcError) throw rpcError;
      setProductForm(blankProduct); setShowProductForm(false);
      setStagedImages([]);
      pendingImages.forEach((image) => URL.revokeObjectURL(image.preview));
      let uploaded = 0;
      let imageFailures = 0;
      for (const image of pendingImages) {
        try { await uploadProductImage(newProductId, image.file, activeBusiness.id); uploaded += 1; }
        catch { imageFailures += 1; }
      }
      setInventoryOverviewRefresh((current) => current + 1);
      setNotice("Producto guardado. Las existencias iniciales quedaron registradas en el historial." + (uploaded ? " " + uploaded + (uploaded === 1 ? " foto guardada." : " fotos guardadas.") : ""));
      if (imageFailures) setError("El producto sí se guardó, pero " + imageFailures + (imageFailures === 1 ? " foto no pudo subirse." : " fotos no pudieron subirse.") + " Puedes reintentarlo desde la ficha del producto.");
      setSearch(""); setProductPage(1);
      await loadProducts();
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  async function saveInlineStock(productId) {
    if (!productId || !activeBusiness?.id) return;
    const delta = Number(adjustDelta);
    if (!Number.isFinite(delta) || delta === 0) { setError("Escribe una cantidad distinta de cero."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const { error: rpcError } = await supabase.rpc("adjust_product_stock", {
        p_business_id: activeBusiness.id, p_product_id: productId,
        p_quantity_delta: delta, p_notes: adjustNote.trim() || null
      });
      if (rpcError) throw rpcError;
      const { data: fresh, error: refreshError } = await supabase.from("products").select("stock_on_hand").eq("business_id", activeBusiness.id).eq("id", productId).single();
      if (refreshError) throw refreshError;
      setProductForm((current) => ({ ...current, stock: String(fresh.stock_on_hand) }));
      setAdjustDelta(""); setAdjustNote("");
      setNotice("Existencias actualizadas. El movimiento quedó guardado en el historial.");
      setStockMovementPage(1); setStockMovementRefresh((value) => value + 1);
      setInventoryOverviewRefresh((current) => current + 1);
      await loadProducts();
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  function renderStockAdjustment(product) {
    if (!editingProductId || editingProductId !== product.id || !product.track_inventory) return null;
    const movementName = (type) => ({
      opening: "Existencias iniciales",
      sale: "Venta",
      purchase: "Compra",
      adjustment_in: "Ajuste de entrada",
      adjustment_out: "Ajuste de salida",
      return: "Devolución",
      return_in: "Devolución",
      damage: "Daño o pérdida"
    })[type] || (type ? type.replaceAll("_", " ") : "Movimiento");
    return <section className="edit-subpanel">
      <div className="edit-subpanel-heading"><strong>Existencias</strong><span>Actuales: {Number(product.stock_on_hand).toLocaleString("es-CO")} {product.unit_name || "unidades"}</span></div>
      <div className="stock-adjust-form">
        <div>
          <label><span className="field-label-heading">Cambio (+ entra, − sale)<FieldHelp enabled={contextualHelpEnabled} text="Registra el ajuste de inventario: un número positivo suma unidades y uno negativo las resta." /></span><input type="number" step="0.001" value={adjustDelta} onChange={(e) => setAdjustDelta(e.target.value)} placeholder="Ej. 5 o -2" /></label>
          <label><span className="field-label-heading">Motivo<FieldHelp enabled={contextualHelpEnabled} text="Explica por qué corriges el inventario, por ejemplo una compra, un daño o una diferencia de conteo." /></span><input value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} maxLength={500} placeholder="Compra, daño, conteo…" /></label>
        </div>
        <button type="button" className="primary-button" disabled={busy || !adjustDelta || Number(adjustDelta) === 0} onClick={() => saveInlineStock(product.id)}>{busy ? "Guardando…" : "Guardar ajuste"}</button>
      </div>
      <div className="stock-history">
        <div className="stock-history-heading">
          <div><strong>Historial de movimientos</strong><span>{stockMovementsCount} {stockMovementsCount === 1 ? "movimiento" : "movimientos"}</span></div>
          {stockMovementsCount > 10 && <span className="stock-history-page-label">Página {stockMovementPage} de {Math.ceil(stockMovementsCount / 10)}</span>}
        </div>
        {stockMovementsLoading ? <p className="stock-history-empty">Cargando historial…</p>
          : stockMovementRows.length ? <div className="stock-history-list">{stockMovementRows.map((movement) => {
            const quantity = Number(movement.quantity_delta || 0);
            return <article className="stock-history-row" key={movement.id}>
              <span className={"stock-history-sign" + (quantity > 0 ? " stock-in" : quantity < 0 ? " stock-out" : "")}>{quantity > 0 ? "+" : ""}{quantity.toLocaleString("es-CO")}</span>
              <div className="stock-history-main">
                <strong>{movementName(movement.movement_type)}</strong>
                <span>{new Date(movement.created_at).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium", timeStyle: "short" })}</span>
                {movement.notes && <small>{movement.notes}</small>}
              </div>
            </article>;
          })}</div>
          : <p className="stock-history-empty">Todavía no hay movimientos registrados.</p>}
        {stockMovementsCount > 10 && <div className="stock-history-pagination">
          <button type="button" className="secondary-button" disabled={stockMovementPage <= 1 || stockMovementsLoading} onClick={() => setStockMovementPage((page) => Math.max(1, page - 1))}>Anterior</button>
          <span>{stockMovementPage} / {Math.ceil(stockMovementsCount / 10)}</span>
          <button type="button" className="secondary-button" disabled={stockMovementPage >= Math.ceil(stockMovementsCount / 10) || stockMovementsLoading} onClick={() => setStockMovementPage((page) => page + 1)}>Siguiente</button>
        </div>}
      </div>
    </section>;
  }

  function renderPhotoManager(product) {
    if (!editingProductId || editingProductId !== product.id || !openProductGalleries[product.id]) return null;
    return <div className="product-gallery-content">
      {(product.image_paths || []).length ? <div className="product-gallery-list">{product.image_paths.map((imageKey) => <figure className="product-gallery-item" key={imageKey}>
        {productImageUrls[product.id + "|" + imageKey]
          ? <img src={productImageUrls[product.id + "|" + imageKey]} alt={"Foto de " + product.name} onError={() => handleProductImageError(product.id, imageKey)} />
          : <div className="image-placeholder">{galleryLoadingFor === product.id ? "Cargando…" : "Imagen no disponible"}</div>}
        <button type="button" className="text-button danger-text" disabled={uploadingImagesFor === product.id} onClick={() => removeExistingProductImage(product.id, imageKey)}>Quitar</button>
      </figure>)}</div> : <p className="no-product-photos">Este producto aún no tiene fotos.</p>}
      {(product.image_paths || []).length < 3 && <label className="image-upload-label"><span className="field-label-heading">+ Añadir foto
        <FieldHelp enabled={contextualHelpEnabled} text="Agrega fotografías al producto para reconocerlo más fácilmente en el inventario." /></span><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploadingImagesFor === product.id || busy} onChange={(event) => chooseExistingProductImages(product, event)} />
      </label>}
      {uploadingImagesFor === product.id && <span className="helper-text">Optimizando y guardando fotos…</span>}
    </div>;
  }

  const customerFields = "id,full_name,first_name,last_name,company_name,document_type,document_number,email,phone,whatsapp,city,address,notes,created_at";

  async function loadSalesModuleData() {
    if (!activeBusiness?.id || (screen !== "sales" && screen !== "customers")) return;
    setSalesLoading(true);
    setError("");
    try {
      if (screen === "customers") {
        let query = supabase.from("customers")
          .select(customerFields, { count: "exact" })
          .eq("business_id", activeBusiness.id).order("full_name");
        const safeTerm = customerSearch.trim().replace(/[^\p{L}\p{N}@.+\-_\s]/gu, " ").replace(/\s+/g, " ").slice(0, 100);
        if (safeTerm) {
          const filter = ["full_name", "company_name", "email", "phone", "whatsapp", "document_number", "city"]
            .map((field) => field + ".ilike.%" + safeTerm + "%").join(",");
          query = query.or(filter);
        }
        const customerFrom = (customersPage - 1) * customersPageSize;
        const result = await query.range(customerFrom, customerFrom + customersPageSize - 1);
        if (result.error) throw result.error;
        setCustomers(result.data || []);
        setCustomersCount(result.count || 0);
      } else {
        let salesQuery = supabase.from("sales").select("id,business_id,customer_id,sale_number,status,currency_code,total_minor,amount_paid_minor,notes,sold_at,created_at", { count: "exact" }).eq("business_id", activeBusiness.id);
        const salesToday = todayInBogota();
        const shiftSalesDate = (key, offset) => { const date = new Date(key + "T12:00:00Z"); date.setUTCDate(date.getUTCDate() + offset); return date.toISOString().slice(0,10); };
        const salesWeekStart = shiftSalesDate(salesToday, -((new Date(salesToday + "T12:00:00Z").getUTCDay() + 6) % 7));
        const salesFrom = salesPeriod === "day" ? salesToday : salesPeriod === "date" ? salesSelectedDate : salesPeriod === "week" ? salesWeekStart : salesPeriod === "month" ? salesToday.slice(0,7) + "-01" : salesPeriod === "year" ? salesToday.slice(0,4) + "-01-01" : salesPeriod === "custom" ? (salesDateFrom || salesToday) : null;
        const salesTo = salesPeriod === "date" ? salesSelectedDate : salesPeriod === "custom" ? (salesDateTo || salesToday) : salesPeriod === "all" ? null : salesToday;
        if (salesFrom) salesQuery = salesQuery.gte("sold_at", salesFrom + "T00:00:00-05:00");
        if (salesTo) salesQuery = salesQuery.lt("sold_at", shiftSalesDate(salesTo, 1) + "T00:00:00-05:00");
        const [salesResult, productsResult, customersResult] = await Promise.all([
          salesQuery.order("sold_at", { ascending: false }).order("created_at", { ascending: false })
            .range((salesPage - 1) * salesPageSize, (salesPage - 1) * salesPageSize + salesPageSize - 1),
          supabase.from("products").select("id,name,sale_price_minor,cost_price_minor,unit_name,stock_on_hand,track_inventory,is_sellable,archived_at")
            .eq("business_id", activeBusiness.id).eq("is_sellable", true).is("archived_at", null).order("name").limit(500),
          supabase.from("customers").select("id,full_name,company_name,email,phone,whatsapp")
            .eq("business_id", activeBusiness.id).order("full_name").limit(500)
        ]);
        if (salesResult.error) throw salesResult.error;
        if (productsResult.error) throw productsResult.error;
        if (customersResult.error) throw customersResult.error;
        setSaleProducts(productsResult.data || []);
        const salesRows = salesResult.data || [];
        setSalesCount(salesResult.count || 0);
        const customersById = Object.fromEntries((customersResult.data || []).map((customer) => [customer.id, customer]));
        const itemsBySale = {};
        const paymentsBySale = {};
        if (salesRows.length) {
          const saleIds = salesRows.map((sale) => sale.id);
          const [itemsResult, paymentsResult] = await Promise.all([
            supabase.from("sale_items").select("id,sale_id,item_name,quantity,unit_price_minor,line_total_minor")
              .eq("business_id", activeBusiness.id).in("sale_id", saleIds).order("created_at"),
            supabase.from("sale_payments").select("id,sale_id,amount_minor,payment_method,paid_at,notes")
              .eq("business_id", activeBusiness.id).in("sale_id", saleIds).order("paid_at", { ascending: true })
          ]);
          if (itemsResult.error) throw itemsResult.error;
          if (paymentsResult.error) throw paymentsResult.error;
          for (const item of itemsResult.data || []) {
            if (!itemsBySale[item.sale_id]) itemsBySale[item.sale_id] = [];
            itemsBySale[item.sale_id].push(item);
          }
          for (const paymentRow of paymentsResult.data || []) {
            if (!paymentsBySale[paymentRow.sale_id]) paymentsBySale[paymentRow.sale_id] = [];
            paymentsBySale[paymentRow.sale_id].push(paymentRow);
          }
        }
        setCustomers(customersResult.data || []);
        setSalesData(salesRows.map((sale) => ({ ...sale,
          customer_name: customersById[sale.customer_id]?.full_name || customersById[sale.customer_id]?.company_name || (sale.customer_id ? "Cliente registrado" : "Venta sin cliente"),
          items: itemsBySale[sale.id] || [],
          payments: paymentsBySale[sale.id] || []
        })));
      }
    } catch (e) {
      setError(friendlyError(e));
      if (screen === "customers") { setCustomers([]); setCustomersCount(0); }
      else { setSalesData([]); setSalesCount(0); setSaleProducts([]); }
    } finally { setSalesLoading(false); }
  }

  useEffect(() => {
    if ((screen === "sales" || screen === "customers") && activeBusiness?.id) loadSalesModuleData();
  }, [screen, activeBusiness?.id, customerSearch, salesPage, salesPageSize, customersPage, customersPageSize, salesPeriod, salesDateFrom, salesDateTo, salesSelectedDate]);

  async function loadAuditEntries(reset = true) {
    if (!activeBusiness?.id || screen !== "audit") return;
    setAuditLoading(true); setError("");
    const offset = reset ? 0 : auditOffset;
    try {
      const today = todayInBogota();
      const shift = (key, amount) => { const date = new Date(key + "T12:00:00Z"); date.setUTCDate(date.getUTCDate() + amount); return date.toISOString().slice(0,10); };
      const weekStart = shift(today, -((new Date(today + "T12:00:00Z").getUTCDay() + 6) % 7));
      const from = auditPeriod === "day" ? today : auditPeriod === "week" ? weekStart : auditPeriod === "month" ? today.slice(0,7) + "-01" : auditPeriod === "year" ? today.slice(0,4) + "-01-01" : auditPeriod === "custom" ? (auditDateFrom || today) : null;
      const to = auditPeriod === "all" ? null : auditPeriod === "custom" ? (auditDateTo || today) : today;
      const { data, error: auditError } = await supabase.rpc("get_business_audit_entries", { p_business_id: activeBusiness.id, p_from: from, p_to: to, p_limit: 200, p_offset: offset });
      if (auditError) throw auditError;
      const rows = data || [];
      setAuditRows((current) => reset ? rows : [...current, ...rows]);
      setAuditOffset(offset + rows.length);
      setAuditHasMore(rows.length === 200);
    } catch (e) { setError(friendlyError(e)); if (reset) setAuditRows([]); }
    finally { setAuditLoading(false); }
  }
  useEffect(() => { if (screen === "audit" && activeBusiness?.id) { setAuditOffset(0); loadAuditEntries(true); } }, [screen, activeBusiness?.id, auditPeriod, auditDateFrom, auditDateTo]);

  async function loadPurchasesModuleData() {
    if (!activeBusiness?.id || (screen !== "purchases" && screen !== "suppliers")) return;
    setPurchaseLoading(true); setError("");
    try {
      const privileged = ["owner", "admin"].includes(activeBusiness.role);
      const permissions = activeBusiness.permissions || {};
      const suppliersOnly = screen === "suppliers";
      const mayReadPurchases = !suppliersOnly && (privileged || Boolean(permissions.purchases_view));
      const mayReadExpenses = !suppliersOnly && (privileged || Boolean(permissions.expenses_view));
      const mayReadSuppliers = privileged || Boolean(permissions.suppliers_view) || Boolean(permissions.purchases_view);
      const mayManagePurchases = !suppliersOnly && (privileged || Boolean(permissions.purchases_manage));
      const none = Promise.resolve({ data: [], error: null });
      const periodToday = todayInBogota();
      const shiftPeriodDate = (key, amount) => { const date = new Date(key + "T12:00:00Z"); date.setUTCDate(date.getUTCDate() + amount); return date.toISOString().slice(0,10); };
      const weekStart = shiftPeriodDate(periodToday, -((new Date(periodToday + "T12:00:00Z").getUTCDay() + 6) % 7));
      const periodFrom = purchasePeriod === "day" ? periodToday : purchasePeriod === "week" ? weekStart : purchasePeriod === "month" ? periodToday.slice(0,7) + "-01" : purchasePeriod === "year" ? periodToday.slice(0,4) + "-01-01" : purchasePeriod === "custom" ? (purchaseDateFrom || periodToday) : null;
      const periodTo = purchasePeriod === "all" ? null : purchasePeriod === "custom" ? (purchaseDateTo || periodToday) : periodToday;
      let purchaseQuery = supabase.from("purchases").select("id,business_id,supplier_id,purchase_number,status,currency_code,subtotal_minor,tax_minor,total_minor,amount_paid_minor,notes,purchased_at,created_at", { count: "exact" }).eq("business_id", activeBusiness.id);
      let expenseQuery = supabase.from("expenses").select("id,business_id,category,description,amount_minor,currency_code,expense_date,payment_method,supplier_id,notes,created_at", { count: "exact" }).eq("business_id", activeBusiness.id);
      if (periodFrom) { purchaseQuery = purchaseQuery.gte("purchased_at", periodFrom + "T00:00:00-05:00"); expenseQuery = expenseQuery.gte("expense_date", periodFrom); }
      if (periodTo) { purchaseQuery = purchaseQuery.lt("purchased_at", shiftPeriodDate(periodTo, 1) + "T00:00:00-05:00"); expenseQuery = expenseQuery.lte("expense_date", periodTo); }
      const [purchaseResult, expenseResult, supplierResult, productResult] = await Promise.all([
        mayReadPurchases ? purchaseQuery.order("purchased_at", { ascending: false })
          .range((purchasesPage - 1) * purchasesPageSize, (purchasesPage - 1) * purchasesPageSize + purchasesPageSize - 1) : none,
        mayReadExpenses ? expenseQuery.order("expense_date", { ascending: false })
          .range((expensesPage - 1) * expensesPageSize, (expensesPage - 1) * expensesPageSize + expensesPageSize - 1) : none,
        mayReadSuppliers ? supabase.from("suppliers").select("id,business_id,name,email,phone,tax_id,address,notes")
          .eq("business_id", activeBusiness.id).order("name").limit(500) : none,
        mayManagePurchases ? supabase.from("products").select("id,name,sku,cost_price_minor,unit_name,stock_on_hand,track_inventory,archived_at")
          .eq("business_id", activeBusiness.id).is("archived_at", null).order("name").limit(1000) : none
      ]);
      if (purchaseResult.error) throw purchaseResult.error;
      if (expenseResult.error) throw expenseResult.error;
      if (supplierResult.error) throw supplierResult.error;
      if (productResult.error) throw productResult.error;
      const purchaseList = purchaseResult.data || [];
      const itemMap = {};
      const paymentMap = {};
      if (purchaseList.length) {
        const purchaseIds = purchaseList.map((purchase) => purchase.id);
        const [itemsResult, paymentsResult] = await Promise.all([
          supabase.from("purchase_items")
            .select("id,purchase_id,product_id,item_name,quantity,unit_cost_minor,line_total_minor")
            .eq("business_id", activeBusiness.id).in("purchase_id", purchaseIds).order("created_at"),
          supabase.from("purchase_payments")
            .select("id,purchase_id,amount_minor,payment_method,paid_at,notes")
            .eq("business_id", activeBusiness.id).in("purchase_id", purchaseIds).order("paid_at", { ascending: true })
        ]);
        if (itemsResult.error) throw itemsResult.error;
        if (paymentsResult.error) throw paymentsResult.error;
        for (const item of itemsResult.data || []) {
          if (!itemMap[item.purchase_id]) itemMap[item.purchase_id] = [];
          itemMap[item.purchase_id].push(item);
        }
        for (const payment of paymentsResult.data || []) {
          if (!paymentMap[payment.purchase_id]) paymentMap[payment.purchase_id] = [];
          paymentMap[payment.purchase_id].push(payment);
        }
      }
      setPurchaseRows(purchaseList.map((purchase) => ({ ...purchase, payments: paymentMap[purchase.id] || [] })));
      setPurchasesCount(purchaseResult.count || 0);
      setPurchaseItemsByPurchase(itemMap);
      setExpenseRows(expenseResult.data || []);
      setExpensesCount(expenseResult.count || 0);
      setSuppliers(supplierResult.data || []);
      setPurchaseProducts(productResult.data || []);
    } catch (e) {
      setError(friendlyError(e));
      setPurchaseRows([]); setPurchasesCount(0); setPurchaseItemsByPurchase({});
      setExpenseRows([]); setExpensesCount(0); setSuppliers([]); setPurchaseProducts([]);
    } finally { setPurchaseLoading(false); }
  }

  useEffect(() => {
    if ((screen === "purchases" || screen === "suppliers") && activeBusiness?.id) loadPurchasesModuleData();
  }, [screen, activeBusiness?.id, purchaseModuleTab, purchasesPage, purchasesPageSize, expensesPage, expensesPageSize, purchasePeriod, purchaseDateFrom, purchaseDateTo]);

  async function loadCatalogAdminData() {
    if (!activeBusiness?.id || screen !== "catalog") return;
    setCatalogLoading(true); setError("");
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        supabase.from("products").select("id,business_id,name,sku,category_id,description,commercial_presentation,unit_name,sale_price_minor,is_published,is_sellable,image_paths,archived_at")
          .eq("business_id", activeBusiness.id).is("archived_at", null).order("name").limit(1000),
        supabase.from("product_categories").select("id,name").eq("business_id", activeBusiness.id).order("name")
      ]);
      if (productsResult.error) throw productsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      setCatalogProducts(productsResult.data || []);
      setCatalogCategories(categoriesResult.data || []);
    } catch (e) {
      setError(friendlyError(e)); setCatalogProducts([]); setCatalogCategories([]);
    } finally { setCatalogLoading(false); }
  }

  useEffect(() => {
    if (screen === "catalog" && activeBusiness?.id) loadCatalogAdminData();
  }, [screen, activeBusiness?.id]);

  async function loadStatsData() {
    if (!activeBusiness?.id || screen !== "stats") return;
    setStatsLoading(true);
    setError("");
    try {
      const [sales, payments, expenses, purchases, purchasePayments] = await Promise.all([
        fetchAllProfitabilityRows(
          () => supabase.from("sales")
            .select("id,business_id,sale_number,status,total_minor,amount_paid_minor,sold_at,created_at")
            .eq("business_id", activeBusiness.id)
            .order("sold_at", { ascending: false }).order("id", { ascending: true }),
          "ventas para las estadísticas"
        ),
        fetchAllProfitabilityRows(
          () => supabase.from("sale_payments")
            .select("id,business_id,sale_id,amount_minor,paid_at")
            .eq("business_id", activeBusiness.id)
            .order("paid_at", { ascending: false }).order("id", { ascending: true }),
          "abonos para las estadísticas"
        ),
        fetchAllProfitabilityRows(
          () => supabase.from("expenses")
            .select("id,business_id,amount_minor,expense_date,description,category")
            .eq("business_id", activeBusiness.id)
            .order("expense_date", { ascending: false }).order("id", { ascending: true }),
          "gastos para las estadísticas"
        ),
        fetchAllProfitabilityRows(
          () => supabase.from("purchases")
            .select("id,business_id,purchase_number,status,total_minor,amount_paid_minor,purchased_at,created_at")
            .eq("business_id", activeBusiness.id)
            .order("purchased_at", { ascending: false }).order("id", { ascending: true }),
          "compras para las estadísticas"
        ),
        fetchAllProfitabilityRows(
          () => supabase.from("purchase_payments")
            .select("id,business_id,purchase_id,amount_minor,paid_at")
            .eq("business_id", activeBusiness.id)
            .order("paid_at", { ascending: false }).order("id", { ascending: true }),
          "pagos de compras para las estadísticas"
        )
      ]);
      setStatsSales(sales);
      setStatsPayments(payments);
      setStatsExpenses(expenses);
      setStatsPurchases(purchases);
      setStatsPurchasePayments(purchasePayments);
    } catch (e) {
      setError(friendlyError(e));
      setStatsSales([]);
      setStatsPayments([]);
      setStatsExpenses([]);
      setStatsPurchases([]);
      setStatsPurchasePayments([]);
    } finally { setStatsLoading(false); }
  }

  useEffect(() => {
    if (screen === "stats" && activeBusiness?.id) loadStatsData();
  }, [screen, activeBusiness?.id]);

  async function loadQuotesModuleData() {
    if (!activeBusiness?.id || screen !== "quotes") return;
    setQuotesLoading(true);
    setError("");
    try {
      let query = supabase.from("quotes")
        .select("id,business_id,quote_number,customer_id,customer_name,customer_email,customer_phone,status,currency_code,subtotal_minor,total_minor,valid_until,notes,created_at,updated_at", { count: "exact" })
        .eq("business_id", activeBusiness.id)
        .order("created_at", { ascending: false });
      if (quotesStatusFilter !== "all") query = query.eq("status", quotesStatusFilter);
      const safeTerm = quotesSearch.trim().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").slice(0, 100);
      if (safeTerm) query = query.or("quote_number.ilike.%" + safeTerm + "%,customer_name.ilike.%" + safeTerm + "%");
      const from = (quotesPage - 1) * quotesPageSize;
      const [quotesResult, productResult, customerResult] = await Promise.all([
        query.range(from, from + quotesPageSize - 1),
        canPermission("products_view")
          ? supabase.from("products").select("id,name,sku,sale_price_minor,unit_name")
            .eq("business_id", activeBusiness.id).eq("is_sellable", true).is("archived_at", null).order("name").limit(1000)
          : Promise.resolve({ data: [], error: null }),
        canPermission("customers_view")
          ? supabase.from("customers").select("id,full_name,company_name,email,phone,whatsapp")
            .eq("business_id", activeBusiness.id).order("full_name").limit(1000)
          : Promise.resolve({ data: [], error: null })
      ]);
      if (quotesResult.error) throw quotesResult.error;
      if (productResult.error) throw productResult.error;
      if (customerResult.error) throw customerResult.error;
      const quoteRows = quotesResult.data || [];
      const quoteIds = quoteRows.map((quote) => quote.id);
      let items = [];
      if (quoteIds.length) {
        const itemsResult = await supabase.from("quote_items")
          .select("id,business_id,quote_id,item_name,quantity,unit_price_minor,line_total_minor,created_at")
          .eq("business_id", activeBusiness.id).in("quote_id", quoteIds).order("created_at");
        if (itemsResult.error) throw itemsResult.error;
        items = itemsResult.data || [];
      }
      const itemsByQuote = {};
      for (const item of items) {
        if (!itemsByQuote[item.quote_id]) itemsByQuote[item.quote_id] = [];
        itemsByQuote[item.quote_id].push(item);
      }
      setQuotesRows(quoteRows.map((quote) => ({ ...quote, items: itemsByQuote[quote.id] || [] })));
      setQuotesCount(quotesResult.count || 0);
      setQuoteProducts(productResult.data || []);
      setQuoteCustomers(customerResult.data || []);
    } catch (e) {
      setError(friendlyError(e));
      setQuotesRows([]);
      setQuotesCount(0);
      setQuoteProducts([]);
      setQuoteCustomers([]);
    } finally { setQuotesLoading(false); }
  }

  useEffect(() => {
    if (screen === "quotes" && activeBusiness?.id) loadQuotesModuleData();
  }, [screen, activeBusiness?.id, quotesPage, quotesPageSize, quotesSearch, quotesStatusFilter]);

  useEffect(() => {
    if (quotesPage > Math.max(1, Math.ceil(quotesCount / quotesPageSize))) {
      setQuotesPage(Math.max(1, Math.ceil(quotesCount / quotesPageSize)));
    }
  }, [quotesPage, quotesCount, quotesPageSize]);

  async function toggleCatalogPublication(product) {
    if (!activeBusiness?.id) return;
    const publish = !product.is_published;
    if (publish && !product.is_sellable) {
      setError("Activa el producto antes de publicarlo en el catálogo.");
      return;
    }
    setCatalogPublishingId(product.id); setError(""); setNotice("");
    try {
      const { data, error: updateError } = await supabase.from("products")
        .update({ is_published: publish })
        .eq("business_id", activeBusiness.id).eq("id", product.id)
        .select("id,is_published").maybeSingle();
      if (updateError) throw updateError;
      if (!data) throw new Error("No se pudo cambiar la publicación. Comprueba tus permisos.");
      setCatalogProducts((current) => current.map((item) => item.id === product.id ? { ...item, is_published: data.is_published } : item));
      setNotice(data.is_published ? product.name + " ya aparece en tu catálogo." : product.name + " dejó de aparecer en el catálogo.");
    } catch (e) { setError(friendlyError(e)); }
    finally { setCatalogPublishingId(null); }
  }

  async function copyPublicCatalogLink() {
    if (!activeBusiness?.id) return;
    const link = window.location.origin + "/?catalog=" + encodeURIComponent(activeBusiness.id);
    try {
      await navigator.clipboard.writeText(link);
      setNotice("Enlace del catálogo copiado. Ya puedes compartirlo.");
    } catch {
      window.prompt("Copia este enlace para compartir tu catálogo:", link);
    }
  }

  async function loadTeamModuleData() {
    if (!activeBusiness?.id || screen !== "team" || !["owner", "admin"].includes(activeBusiness.role)) return;
    setTeamLoading(true); setError("");
    try {
      const { data, error: teamError } = await supabase.rpc("list_business_team", { p_business_id: activeBusiness.id });
      if (teamError) throw teamError;
      setTeamRows(data || []);
    } catch (e) {
      setError(friendlyError(e)); setTeamRows([]);
    } finally { setTeamLoading(false); }
  }

  useEffect(() => {
    if (screen === "team" && activeBusiness?.id) loadTeamModuleData();
  }, [screen, activeBusiness?.id, activeBusiness?.role]);

  function clearTeamForm() {
    setTeamFormOpen(false);
    setTeamEmail("");
    setTeamPermissionDraft(blankTeamPermissions);
    setTeamPermissionProfile("vendedor");
    setTeamEditingUserId(null);
  }

  function startEditTeamMember(member) {
    const role = member.role;
    if (role !== "employee") return;
    const requested = (member.permissions || {})._modules_requested || member.permissions || {};
    const draft = { ...blankTeamPermissions };
    for (const group of teamPermissionGroups) {
      draft[group.view] = Boolean(requested[group.view]);
      draft[group.manage] = Boolean(requested[group.manage]);
    }
    setTeamEmail(member.email || "");
    setTeamPermissionDraft(draft);
    setTeamPermissionProfile("personalizado");
    setTeamEditingUserId(member.user_id);
    setTeamFormOpen(true);
    setError(""); setNotice("");
  }

  function changeTeamPermission(key, checked) {
    setTeamPermissionDraft((current) => {
      const next = { ...current, [key]: checked };
      const moduleGroup = teamPermissionGroups.find((group) => group.view === key || group.manage === key);
      if (moduleGroup) {
        if (key === moduleGroup.manage && checked) next[moduleGroup.view] = true;
        if (key === moduleGroup.view && !checked) next[moduleGroup.manage] = false;
      }
      return next;
    });
  }

  async function saveTeamMember(event) {
    event.preventDefault();
    if (!activeBusiness?.id) return;
    if (!teamEmail.trim()) { setError("Escribe el correo de la persona."); return; }
    setTeamSaving(true); setError(""); setNotice("");
    try {
      const { error: saveError } = await supabase.rpc("upsert_business_employee", {
        p_business_id: activeBusiness.id,
        p_email: teamEmail.trim(),
        p_permissions: teamPermissionDraft
      });
      if (saveError) throw saveError;
      setNotice(teamEditingUserId ? "Permisos actualizados." : "Colaborador agregado al equipo.");
      clearTeamForm();
      await loadTeamModuleData();
    } catch (e) { setError(friendlyError(e)); }
    finally { setTeamSaving(false); }
  }

  async function removeTeamMember(member) {
    if (!activeBusiness?.id || member.role !== "employee") return;
    if (!window.confirm("¿Quitar a " + (member.display_name || member.email) + " del equipo? Ya no podrá abrir este negocio.")) return;
    setTeamSaving(true); setError(""); setNotice("");
    try {
      const { data, error: removeError } = await supabase.rpc("remove_business_employee", {
        p_business_id: activeBusiness.id, p_user_id: member.user_id
      });
      if (removeError) throw removeError;
      if (!data) throw new Error("No se encontró ese colaborador en el equipo.");
      setTeamRows((current) => current.filter((row) => row.user_id !== member.user_id));
      setNotice("Acceso retirado.");
    } catch (e) { setError(friendlyError(e)); }
    finally { setTeamSaving(false); }
  }

  async function fetchAllProfitabilityRows(makeQuery, description, maxRows = 50000) {
    const pageSize = 500;
    const allRows = [];
    for (let offset = 0; offset <= maxRows; offset += pageSize) {
      const { data, error: queryError } = await makeQuery().range(offset, Math.min(offset + pageSize - 1, maxRows));
      if (queryError) throw queryError;
      const batch = data || [];
      allRows.push(...batch);
      if (batch.length < pageSize) return allRows;
      if (allRows.length >= maxRows) {
        const { data: extraRows, error: extraError } = await makeQuery().range(maxRows, maxRows);
        if (extraError) throw extraError;
        if ((extraRows || []).length) {
          throw new Error("El informe supera " + maxRows.toLocaleString("es-CO") + " registros de " + description + ". No mostraremos un total parcial; filtra un periodo más corto o divide la revisión.");
        }
        return allRows;
      }
    }
    throw new Error("No fue posible completar la lectura de " + description + ".");
  }

  async function loadProfitabilityData() {
    if (!activeBusiness?.id || screen !== "profitability") return;
    setProfitabilityLoading(true); setError("");
    try {
      const [sales, expenses] = await Promise.all([
        fetchAllProfitabilityRows(
          () => supabase.from("sales").select("id,business_id,status,currency_code,total_minor,amount_paid_minor,sold_at,created_at")
            .eq("business_id", activeBusiness.id).order("sold_at", { ascending: false }).order("id", { ascending: true }),
          "ventas"
        ),
        fetchAllProfitabilityRows(
          () => supabase.from("expenses").select("id,business_id,category,description,amount_minor,currency_code,expense_date")
            .eq("business_id", activeBusiness.id).order("expense_date", { ascending: false }).order("id", { ascending: true }),
          "gastos"
        )
      ]);
      let items = [];
      if (sales.length) {
        const batchSize = 100;
        for (let index = 0; index < sales.length; index += batchSize) {
          const ids = sales.slice(index, index + batchSize).map((sale) => sale.id);
          const rows = await fetchAllProfitabilityRows(
            () => supabase.from("sale_items")
              .select("id,sale_id,product_id,item_name,quantity,unit_cost_minor,line_total_minor")
              .eq("business_id", activeBusiness.id).in("sale_id", ids).order("created_at").order("id", { ascending: true }),
            "líneas de venta"
          );
          items.push(...rows);
        }
      }
      setProfitabilitySales(sales);
      setProfitabilitySaleItems(items);
      setProfitabilityExpenses(expenses);
    } catch (e) {
      setError(friendlyError(e));
      setProfitabilitySales([]); setProfitabilitySaleItems([]); setProfitabilityExpenses([]);
    } finally { setProfitabilityLoading(false); }
  }

  useEffect(() => {
    if (screen === "profitability" && activeBusiness?.id) loadProfitabilityData();
  }, [screen, activeBusiness?.id]);

  useEffect(() => {
    const saved = activeBusiness?.settings?.profit_allocations || {};
    setAllocationSettings({
      diezmo: { enabled: Boolean(saved.diezmo?.enabled), percent: Number(saved.diezmo?.percent || 0) },
      ahorro: { enabled: Boolean(saved.ahorro?.enabled), percent: Number(saved.ahorro?.percent || 0) },
      otra: { enabled: Boolean(saved.otra?.enabled), name: String(saved.otra?.name || "Otra asignación"), percent: Number(saved.otra?.percent || 0) }
    });
  }, [activeBusiness?.id]);

  async function saveAllocationSettings() {
    if (!activeBusiness?.id || !isBusinessOwner) return;
    const activePercentTotal = Object.values(allocationSettings).filter((item) => item.enabled).reduce((sum, item) => sum + Math.max(0, Number(item.percent || 0)), 0);
    if (activePercentTotal > 100) { setError("Los porcentajes activos no pueden sumar más de 100%."); return; }
    const nextSettings = { ...(activeBusiness.settings || {}), profit_allocations: allocationSettings };
    setBusy(true); setError(""); setNotice("");
    try {
      const { data, error: saveError } = await supabase.from("businesses").update({ settings: nextSettings }).eq("id", activeBusiness.id).select("id,settings").maybeSingle();
      if (saveError) throw saveError;
      if (!data) throw new Error("No se pudieron guardar los porcentajes. Comprueba tus permisos.");
      setActiveBusiness((current) => current ? { ...current, settings: data.settings || nextSettings } : current);
      setBusinesses((current) => current.map((business) => business.id === data.id ? { ...business, settings: data.settings || nextSettings } : business));
      setNotice("Porcentajes guardados. Solo se usan como distribución orientativa, no como gasto contable.");
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  function addQuoteItem() {
    const product = quoteProducts.find((item) => item.id === quoteProductChoice);
    const name = String(product?.name || quoteItemName).trim();
    const quantity = Number(quoteQuantity);
    const unitPrice = Number(quoteUnitPrice);
    if (!name) { setError("Escribe el nombre del artículo de la cotización."); return; }
    if (!Number.isFinite(quantity) || quantity <= 0) { setError("La cantidad debe ser mayor que cero."); return; }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) { setError("Escribe un precio unitario válido."); return; }
    const unitPriceMinor = toMinorUnits(unitPrice, currencyCode);
    setQuoteItems((current) => [...current, {
      id: crypto.randomUUID(),
      name,
      quantity,
      unit_price_minor: unitPriceMinor,
      line_total_minor: Math.round(unitPriceMinor * quantity)
    }]);
    setQuoteItemName("");
    setQuoteProductChoice("");
    setQuoteQuantity("1");
    setQuoteUnitPrice("");
    setError("");
  }

  function clearQuoteDraft() {
    setShowQuoteForm(false);
    setEditingQuoteId(null);
    setEditingQuoteOriginalItems([]);
    setQuoteCustomerId("");
    setQuoteCustomerName("");
    setQuoteCustomerEmail("");
    setQuoteCustomerPhone("");
    setQuoteNotes("");
    setQuoteProductChoice("");
    setQuoteItemName("");
    setQuoteQuantity("1");
    setQuoteUnitPrice("");
    setQuoteItems([]);
    const date = new Date(todayInBogota() + "T12:00:00-05:00");
    date.setDate(date.getDate() + 15);
    setQuoteValidUntil(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(date));
  }

  function editQuote(quote) {
    if (!quote || !canManageSales) return;
    setEditingQuoteId(quote.id);
    setEditingQuoteOriginalItems((quote.items || []).map((item) => item.id));
    setQuoteCustomerId(quote.customer_id || "");
    setQuoteCustomerName(quote.customer_name || "");
    setQuoteCustomerEmail(quote.customer_email || "");
    setQuoteCustomerPhone(quote.customer_phone || "");
    setQuoteValidUntil(quote.valid_until || "");
    setQuoteNotes(quote.notes || "");
    setQuoteProductChoice("");
    setQuoteItemName("");
    setQuoteQuantity("1");
    setQuoteUnitPrice("");
    setQuoteItems((quote.items || []).map((item) => ({
      id: item.id || crypto.randomUUID(),
      name: item.item_name || item.name || "",
      quantity: Number(item.quantity || 0),
      unit_price_minor: Number(item.unit_price_minor || 0),
      line_total_minor: Number(item.line_total_minor ?? Math.round(Number(item.unit_price_minor || 0) * Number(item.quantity || 0)))
    })));
    setShowQuoteForm(true);
    setError("");
    setNotice("Ajusta los artículos, las cantidades o los precios. Al guardar, la propuesta quedará como borrador para revisarla con el cliente.");
  }

  async function addQuickQuoteCustomer() {
    if (!activeBusiness?.id || !canManageCustomers || quickQuoteCustomerSaving) return;
    const name = quickQuoteCustomerName.trim();
    if (!name) { setError("Escribe el nombre del cliente."); return; }
    setQuickQuoteCustomerSaving(true); setError(""); setNotice("");
    try {
      const { data, error: insertError } = await supabase.from("customers").insert({
        business_id: activeBusiness.id, full_name: name, first_name: name,
        company_name: quickQuoteCustomerCompany.trim() || null,
        email: quickQuoteCustomerEmail.trim() || null, phone: quickQuoteCustomerPhone.trim() || null,
        whatsapp: quickQuoteCustomerWhatsapp.trim() || null,
        document_type: quickQuoteCustomerDocumentType || null,
        document_number: quickQuoteCustomerDocumentNumber.trim() || null,
        city: quickQuoteCustomerCity.trim() || null,
        address: quickQuoteCustomerAddress.trim() || null
      }).select("id,full_name,company_name,email,phone,whatsapp,document_type,document_number,city,address").single();
      if (insertError) throw insertError;
      setCustomers((current) => [data, ...current.filter((item) => item.id !== data.id)]);
      setQuoteCustomers((current) => [data, ...current.filter((item) => item.id !== data.id)]);
      setQuoteCustomerId(data.id);
      setQuoteCustomerName(data.company_name || data.full_name || name);
      setQuoteCustomerEmail(data.email || "");
      setQuoteCustomerPhone(data.phone || data.whatsapp || "");
      setQuickQuoteCustomerName(""); setQuickQuoteCustomerPhone(""); setQuickQuoteCustomerEmail(""); setQuickQuoteCustomerCompany(""); setQuickQuoteCustomerWhatsapp(""); setQuickQuoteCustomerDocumentType(""); setQuickQuoteCustomerDocumentNumber(""); setQuickQuoteCustomerCity(""); setQuickQuoteCustomerAddress("");
      setShowQuickQuoteCustomerForm(false);
      setNotice("Cliente creado y seleccionado para esta cotización.");
    } catch (e) { setError(friendlyError(e)); }
    finally { setQuickQuoteCustomerSaving(false); }
  }

  async function createQuote(event) {
    event.preventDefault();
    if (!activeBusiness?.id || !canManageSales || quoteSaving) return;
    if (!quoteCustomerName.trim()) { setError("Escribe el nombre del cliente o de la empresa."); return; }
    if (!quoteItems.length) { setError("Agrega al menos un artículo a la cotización."); return; }
    if (quoteItems.some((item) => !String(item.name || "").trim() || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0 || !Number.isFinite(Number(item.unit_price_minor)) || Number(item.unit_price_minor) < 0)) {
      setError("Revisa los artículos, las cantidades y los precios antes de guardar.");
      return;
    }
    setQuoteSaving(true);
    setError("");
    setNotice("");
    try {
      const subtotal = quoteItems.reduce((sum, item) => sum + Math.round(Number(item.unit_price_minor || 0) * Number(item.quantity || 0)), 0);
      if (editingQuoteId) {
        const { data: updatedQuote, error: quoteError } = await supabase.from("quotes").update({
          customer_id: quoteCustomerId || null,
          customer_name: quoteCustomerName.trim(),
          customer_email: quoteCustomerEmail.trim() || null,
          customer_phone: quoteCustomerPhone.trim() || null,
          status: "draft",
          currency_code: currencyCode,
          subtotal_minor: subtotal,
          discount_minor: 0,
          tax_minor: 0,
          total_minor: subtotal,
          valid_until: quoteValidUntil || null,
          notes: quoteNotes.trim() || null,
          updated_at: new Date().toISOString()
        }).eq("id", editingQuoteId).eq("business_id", activeBusiness.id).select("id,quote_number").maybeSingle();
        if (quoteError) throw quoteError;
        if (!updatedQuote) throw new Error("No se pudo actualizar la cotización. Comprueba tus permisos e inténtalo de nuevo.");

        const oldIds = new Set(editingQuoteOriginalItems);
        const currentIds = new Set(quoteItems.map((item) => item.id));
        const existingItems = quoteItems.filter((item) => oldIds.has(item.id));
        for (const item of existingItems) {
          const { data, error: itemError } = await supabase.from("quote_items").update({
            item_name: String(item.name).trim(),
            quantity: Number(item.quantity),
            unit_price_minor: Number(item.unit_price_minor),
            line_total_minor: Math.round(Number(item.unit_price_minor) * Number(item.quantity))
          }).eq("id", item.id).eq("quote_id", editingQuoteId).eq("business_id", activeBusiness.id).select("id").maybeSingle();
          if (itemError) throw itemError;
          if (!data) throw new Error("No se pudo actualizar uno de los artículos de la cotización. Revisa el registro antes de volver a intentarlo.");
        }
        const addedItems = quoteItems.filter((item) => !oldIds.has(item.id)).map((item) => ({
          business_id: activeBusiness.id,
          quote_id: editingQuoteId,
          item_name: String(item.name).trim(),
          quantity: Number(item.quantity),
          unit_price_minor: Number(item.unit_price_minor),
          line_total_minor: Math.round(Number(item.unit_price_minor) * Number(item.quantity))
        }));
        if (addedItems.length) {
          const { error: insertItemsError } = await supabase.from("quote_items").insert(addedItems);
          if (insertItemsError) throw insertItemsError;
        }
        const removedIds = editingQuoteOriginalItems.filter((id) => !currentIds.has(id));
        if (removedIds.length) {
          const { error: deleteItemsError } = await supabase.from("quote_items").delete().eq("business_id", activeBusiness.id).eq("quote_id", editingQuoteId).in("id", removedIds);
          if (deleteItemsError) throw deleteItemsError;
        }
        setNotice("Cotización " + updatedQuote.quote_number + " actualizada. Ya puedes compartir la propuesta revisada con tu cliente.");
      } else {
        const quoteNumber = "COT-" + todayInBogota().replace(/-/g, "") + "-" + crypto.randomUUID().slice(0, 6).toUpperCase();
        const { data: quote, error: quoteError } = await supabase.from("quotes").insert({
          business_id: activeBusiness.id,
          quote_number: quoteNumber,
          customer_id: quoteCustomerId || null,
          customer_name: quoteCustomerName.trim(),
          customer_email: quoteCustomerEmail.trim() || null,
          customer_phone: quoteCustomerPhone.trim() || null,
          status: "draft",
          currency_code: currencyCode,
          subtotal_minor: subtotal,
          discount_minor: 0,
          tax_minor: 0,
          total_minor: subtotal,
          valid_until: quoteValidUntil || null,
          notes: quoteNotes.trim() || null,
          created_by: session?.user?.id || null
        }).select("id").single();
        if (quoteError) throw quoteError;
        const itemRows = quoteItems.map((item) => ({
          business_id: activeBusiness.id,
          quote_id: quote.id,
          item_name: String(item.name).trim(),
          quantity: Number(item.quantity),
          unit_price_minor: Number(item.unit_price_minor),
          line_total_minor: Math.round(Number(item.unit_price_minor) * Number(item.quantity))
        }));
        const { error: itemsError } = await supabase.from("quote_items").insert(itemRows);
        if (itemsError) {
          const cleanup = await supabase.from("quotes").delete().eq("id", quote.id).eq("business_id", activeBusiness.id);
          if (cleanup.error) throw new Error("La cotización quedó creada, pero no se guardaron sus artículos. Abre Cotizaciones y comprueba el registro antes de volver a intentarlo.");
          throw itemsError;
        }
        setNotice("Cotización " + quoteNumber + " guardada.");
      }
      clearQuoteDraft();
      setQuotesPage(1);
      await loadQuotesModuleData();
    } catch (e) {
      setError(friendlyError(e));
    } finally { setQuoteSaving(false); }
  }

  function printQuoteDocument(quote) {
    if (!quote) return;
    const profile = activeBusiness?.settings?.commercial_profile || {};
    const brand = profile.tradeName || activeBusiness?.name || "Mi empresa";
    const logoUrl = getBusinessLogoUrl(activeBusiness?.logo_path);
    const items = (quote.items || []).map((item) => "<tr><td>" + escapeHtml(item.item_name) + "</td><td class=\"num\">" + escapeHtml(Number(item.quantity).toLocaleString("es-CO")) + "</td><td class=\"num\">" + escapeHtml(money(item.unit_price_minor, quote.currency_code || currencyCode)) + "</td><td class=\"num\">" + escapeHtml(money(item.line_total_minor, quote.currency_code || currencyCode)) + "</td></tr>").join("");
    const companyLines = [profile.documentNumber ? "NIT / documento: " + profile.documentNumber : "", profile.email, profile.phone, [profile.address, profile.city].filter(Boolean).join(", "), profile.website].filter(Boolean);
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(quote.quote_number)} - ${escapeHtml(brand)}</title><style>
      body{font:14px/1.55 Arial,sans-serif;color:#202820;margin:38px auto;max-width:900px;padding:0 28px}header{display:flex;align-items:center;gap:18px;border-bottom:2px solid #174580;padding-bottom:18px}header img{max-width:110px;max-height:85px;object-fit:contain}h1{font-size:24px;margin:0 0 4px;color:#174580}h2{margin:25px 0 8px;font-size:22px}p{margin:4px 0}small{color:#69758A}.meta{display:flex;justify-content:space-between;gap:18px;margin:24px 0}.meta>div{min-width:0}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{text-align:left;border-bottom:1px solid #E1E7F0;padding:10px 8px}th{background:#f2f5ef}.num{text-align:right;white-space:nowrap}.total{text-align:right;font-size:20px;font-weight:700;margin-top:22px}.notes{margin-top:24px;padding:14px;background:#f6f7f3;border-radius:8px;white-space:pre-wrap}.footer{margin-top:42px;border-top:1px solid #E1E7F0;padding-top:12px;color:#69758A;font-size:12px}@media print{body{margin:0 auto;padding:0 12px}@page{size:A4;margin:14mm}}
    </style></head><body><header>${logoUrl ? "<img src=\"" + escapeHtml(logoUrl) + "\" alt=\"Logo\">" : ""}<div><h1>${escapeHtml(brand)}</h1>${companyLines.map((line) => "<p>" + escapeHtml(line) + "</p>").join("")}</div></header>
      <h2>Cotización ${escapeHtml(quote.quote_number)}</h2><small>Fecha: ${new Date(quote.created_at).toLocaleDateString("es-CO",{timeZone:"America/Bogota",dateStyle:"long"})}</small>
      <div class="meta"><div><strong>Cliente</strong><p>${escapeHtml(quote.customer_name)}</p><p>${escapeHtml(quote.customer_email || "")}</p><p>${escapeHtml(quote.customer_phone || "")}</p></div><div><strong>Válida hasta</strong><p>${quote.valid_until ? new Date(quote.valid_until + "T12:00:00-05:00").toLocaleDateString("es-CO",{timeZone:"America/Bogota",dateStyle:"long"}) : "Sin fecha límite"}</p><p>Estado: ${escapeHtml(quoteStatusLabel(quote.status))}</p></div></div>
      <table><thead><tr><th>Artículo / servicio</th><th class="num">Cantidad</th><th class="num">Precio unitario</th><th class="num">Total</th></tr></thead><tbody>${items}</tbody></table><div class="total">Total: ${escapeHtml(money(quote.total_minor, quote.currency_code || currencyCode))}</div>
      ${quote.notes ? "<div class=\"notes\"><strong>Notas y condiciones</strong><p>" + escapeHtml(quote.notes) + "</p></div>" : ""}<div class="footer">Documento comercial generado desde treseiscinco · ${escapeHtml(brand)}</div>
      <script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print()},350)})<\/script></body></html>`;
    const win = window.open(window.location.href, "_blank", "width=900,height=900");
    if (!win) { setError("Permite las ventanas emergentes para abrir la cotización e imprimirla o guardarla como PDF."); return; }
    try { win.opener = null; } catch { /* La impresión no depende de window.opener. */ }
    win.document.open(); win.document.write(html); win.document.close();
  }

  async function shareQuoteImage(quote) {
    if (!quote) return;
    const profile = activeBusiness?.settings?.commercial_profile || {};
    const brand = profile.tradeName || activeBusiness?.name || "Mi empresa";
    const logoUrl = getBusinessLogoUrl(activeBusiness?.logo_path);
    const width = 1200;
    const height = 620 + Math.max(1, (quote.items || []).length) * 74 + (quote.notes ? 120 : 0);
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setError("No se pudo preparar la imagen. Usa PDF / imprimir para compartir la cotización."); return; }
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0,0,width,height);
    ctx.strokeStyle = "#DCE6F3"; ctx.lineWidth = 2; ctx.strokeRect(26,26,width-52,height-52);
    ctx.fillStyle = "#174580"; ctx.fillRect(27,27,width-54,12);
    let y = 86;
    if (logoUrl) {
      try {
        const image = new Image(); image.crossOrigin = "anonymous"; image.src = logoUrl;
        await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
        ctx.drawImage(image, 60, 60, 128, 96);
      } catch { /* Se conserva el documento aunque el navegador no permita incrustar el logo. */ }
    }
    ctx.fillStyle = "#174580"; ctx.font = "bold 32px Arial"; ctx.fillText(brand, 220, y);
    ctx.fillStyle = "#19243A"; ctx.font = "18px Arial";
    const companyLines = [profile.documentNumber ? "NIT / documento: " + profile.documentNumber : "", profile.email, profile.phone, [profile.address, profile.city].filter(Boolean).join(", "), profile.website].filter(Boolean);
    companyLines.slice(0,5).forEach((line,index)=>ctx.fillText(String(line).slice(0,70),220,y+31+index*25));
    y = 260;
    ctx.strokeStyle = "#DCE6F3"; ctx.beginPath(); ctx.moveTo(60,y); ctx.lineTo(width-60,y); ctx.stroke();
    y += 54; ctx.fillStyle = "#202820"; ctx.font = "bold 30px Arial"; ctx.fillText("COTIZACIÓN " + quote.quote_number,60,y);
    y += 38; ctx.font = "19px Arial"; ctx.fillText("Cliente: " + String(quote.customer_name || "").slice(0,70),60,y);
    y += 32; ctx.fillText("Válida hasta: " + (quote.valid_until || "Sin fecha límite"),60,y);
    y += 42; ctx.fillStyle = "#f0f4ed"; ctx.fillRect(60,y,width-120,44);
    ctx.fillStyle = "#314236"; ctx.font = "bold 17px Arial"; ctx.fillText("ARTÍCULO / SERVICIO",72,y+28); ctx.fillText("CANT.",700,y+28); ctx.fillText("VALOR",830,y+28); ctx.fillText("TOTAL",1010,y+28);
    y += 54; ctx.font = "17px Arial";
    for (const item of (quote.items || [])) {
      const itemName = String(item.item_name || "").slice(0,54);
      ctx.fillStyle = "#202820"; ctx.fillText(itemName,72,y);
      ctx.fillText(Number(item.quantity).toLocaleString("es-CO"),700,y);
      ctx.fillText(money(item.unit_price_minor, quote.currency_code || currencyCode),830,y);
      ctx.fillText(money(item.line_total_minor, quote.currency_code || currencyCode),1010,y);
      y += 60; ctx.strokeStyle = "#E1E7F0"; ctx.beginPath(); ctx.moveTo(60,y-23); ctx.lineTo(width-60,y-23); ctx.stroke();
    }
    y += 12; ctx.fillStyle = "#174580"; ctx.font = "bold 30px Arial"; ctx.textAlign = "right"; ctx.fillText("TOTAL: " + money(quote.total_minor, quote.currency_code || currencyCode),width-60,y); ctx.textAlign = "left";
    if (quote.notes) { y += 48; ctx.fillStyle = "#19243A"; ctx.font = "17px Arial"; ctx.fillText("Notas: " + String(quote.notes).replace(/\s+/g," ").slice(0,130),60,y); }
    try {
      const blob = await new Promise((resolve, reject) => { try { canvas.toBlob((value) => value ? resolve(value) : reject(new Error("No se pudo crear la imagen.")), "image/png"); } catch (e) { reject(e); } });
      const filename = String(quote.quote_number || "cotizacion").replace(/[^a-z0-9_-]/gi,"-") + ".png";
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: "Cotización " + quote.quote_number, text: "Propuesta comercial de " + brand }); }
        catch (e) {
          if (e?.name === "AbortError") return;
          const url = URL.createObjectURL(blob); const downloadLink = document.createElement("a");
          downloadLink.href = url; downloadLink.download = filename; document.body.appendChild(downloadLink); downloadLink.click(); downloadLink.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 1200);
          setNotice("La imagen quedó descargada para compartirla por WhatsApp o correo.");
        }
      } else {
        const url = URL.createObjectURL(blob); const downloadLink = document.createElement("a");
        downloadLink.href = url; downloadLink.download = filename; document.body.appendChild(downloadLink); downloadLink.click(); downloadLink.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1200);
        setNotice("Imagen descargada. Ya puedes compartirla por WhatsApp o correo.");
      }
    } catch (e) { setError("No se pudo generar la imagen en este navegador. Usa PDF / imprimir para compartir la cotización."); }
  }

  function printSaleDocument(sale) {
    if (!sale) return;
    const profile = activeBusiness?.settings?.commercial_profile || {};
    const brand = profile.tradeName || activeBusiness?.name || "Mi empresa";
    const logoUrl = getBusinessLogoUrl(activeBusiness?.logo_path);
    const companyLines = [profile.documentNumber ? "NIT / documento: " + profile.documentNumber : "", profile.email, profile.phone, [profile.address, profile.city].filter(Boolean).join(", "), profile.website].filter(Boolean);
    const items = (sale.items || []).map((item) => "<tr><td>" + escapeHtml(item.item_name) + "</td><td class=\"num\">" + escapeHtml(Number(item.quantity).toLocaleString("es-CO")) + "</td><td class=\"num\">" + escapeHtml(money(item.unit_price_minor, sale.currency_code || currencyCode)) + "</td><td class=\"num\">" + escapeHtml(money(item.line_total_minor, sale.currency_code || currencyCode)) + "</td></tr>").join("");
    const paymentRows = (sale.payments || []).map((payment) => "<tr><td>" + escapeHtml(new Date(payment.paid_at).toLocaleDateString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium" })) + "</td><td>" + escapeHtml(payment.payment_method || "Pago") + "</td><td class=\"num\">" + escapeHtml(money(payment.amount_minor, sale.currency_code || currencyCode)) + "</td></tr>").join("");
    const total = Number(sale.total_minor || 0), paid = Number(sale.amount_paid_minor || 0), outstanding = Math.max(0,total-paid);
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Venta ${escapeHtml(sale.sale_number)} - ${escapeHtml(brand)}</title><style>
      body{font:14px/1.55 Arial,sans-serif;color:#202820;margin:38px auto;max-width:900px;padding:0 28px}header{display:flex;align-items:center;gap:18px;border-bottom:2px solid #174580;padding-bottom:18px}header img{max-width:110px;max-height:85px;object-fit:contain}h1{font-size:24px;margin:0 0 4px;color:#174580}h2{margin:25px 0 8px;font-size:22px}p{margin:4px 0}small{color:#69758A}.meta{display:flex;justify-content:space-between;gap:18px;margin:24px 0}.meta>div{min-width:0}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{text-align:left;border-bottom:1px solid #E1E7F0;padding:10px 8px}th{background:#f2f5ef}.num{text-align:right;white-space:nowrap}.total{text-align:right;font-size:20px;font-weight:700;margin-top:22px}.summary{margin:20px 0 0 auto;max-width:320px}.summary>div{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid #E1E7F0}.summary .balance{font-weight:700;color:#174580}.footer{margin-top:42px;border-top:1px solid #E1E7F0;padding-top:12px;color:#69758A;font-size:12px}@media print{body{margin:0 auto;padding:0 12px}@page{size:A4;margin:14mm}}
    </style></head><body><header>${logoUrl ? "<img src=\"" + escapeHtml(logoUrl) + "\" alt=\"Logo\">" : ""}<div><h1>${escapeHtml(brand)}</h1>${companyLines.map((line) => "<p>" + escapeHtml(line) + "</p>").join("")}</div></header>
      <h2>Factura / comprobante de venta</h2><strong>${escapeHtml(sale.sale_number || "")}</strong><p>Fecha: ${new Date(sale.sold_at || sale.created_at).toLocaleDateString("es-CO", { timeZone: "America/Bogota", dateStyle: "long" })}</p>
      <div class="meta"><div><strong>Cliente</strong><p>${escapeHtml(sale.customer_name || "Venta sin cliente")}</p></div><div><strong>Estado</strong><p>${escapeHtml(saleStatusLabel(sale.status))}</p></div></div>
      <table><thead><tr><th>Artículo / servicio</th><th class="num">Cantidad</th><th class="num">Precio unitario</th><th class="num">Total</th></tr></thead><tbody>${items}</tbody></table>
      <div class="summary"><div><span>Total</span><strong>${escapeHtml(money(total, sale.currency_code || currencyCode))}</strong></div><div><span>Pagado</span><strong>${escapeHtml(money(paid, sale.currency_code || currencyCode))}</strong></div><div class="balance"><span>Saldo pendiente</span><strong>${escapeHtml(money(outstanding, sale.currency_code || currencyCode))}</strong></div></div>
      ${paymentRows ? "<h3>Historial de pagos</h3><table><thead><tr><th>Fecha</th><th>Medio de pago</th><th class=\"num\">Importe</th></tr></thead><tbody>" + paymentRows + "</tbody></table>" : ""}
      ${sale.notes ? "<p style=\"margin-top:24px\"><strong>Notas:</strong> " + escapeHtml(sale.notes) + "</p>" : ""}<div class="footer">Documento comercial generado desde treseiscinco · ${escapeHtml(brand)}</div>
      <script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print()},350)})<\/script></body></html>`;
    const win = window.open(window.location.href, "_blank", "width=900,height=900");
    if (!win) { setError("Permite las ventanas emergentes para abrir el documento e imprimirlo o guardarlo como PDF."); return; }
    try { win.opener = null; } catch { /* La impresión no depende de window.opener. */ }
    win.document.open(); win.document.write(html); win.document.close();
  }

  async function shareSaleImage(sale) {
    if (!sale) return;
    const profile = activeBusiness?.settings?.commercial_profile || {};
    const brand = profile.tradeName || activeBusiness?.name || "Mi empresa";
    const logoUrl = getBusinessLogoUrl(activeBusiness?.logo_path);
    const rows = sale.items || [];
    const width = 1200, height = 650 + Math.max(1, rows.length) * 68;
    const canvas = document.createElement("canvas"); canvas.width=width; canvas.height=height;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setError("No se pudo preparar la imagen. Usa PDF / Imprimir para compartir la venta."); return; }
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,width,height); ctx.strokeStyle="#DCE6F3"; ctx.lineWidth=2; ctx.strokeRect(26,26,width-52,height-52); ctx.fillStyle="#174580"; ctx.fillRect(27,27,width-54,12);
    const companyLines = [profile.documentNumber ? "NIT / documento: " + profile.documentNumber : "", profile.email, profile.phone, [profile.address, profile.city].filter(Boolean).join(", "), profile.website].filter(Boolean);
    let y=86;
    if (logoUrl) { try { const image=new Image(); image.crossOrigin="anonymous"; image.src=logoUrl; await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject}); ctx.drawImage(image,60,60,128,96); } catch { /* El comprobante sigue visible si el logo no puede cargarse. */ } }
    ctx.fillStyle="#174580";ctx.font="bold 32px Arial";ctx.fillText(brand,220,y);ctx.fillStyle="#19243A";ctx.font="18px Arial";companyLines.slice(0,5).forEach((line,index)=>ctx.fillText(String(line).slice(0,70),220,y+31+index*25));
    y=260;ctx.strokeStyle="#DCE6F3";ctx.beginPath();ctx.moveTo(60,y);ctx.lineTo(width-60,y);ctx.stroke();y+=54;ctx.fillStyle="#202820";ctx.font="bold 30px Arial";ctx.fillText("FACTURA / VENTA "+String(sale.sale_number||""),60,y);
    y+=42;ctx.font="19px Arial";ctx.fillText("Cliente: "+String(sale.customer_name||"Venta sin cliente").slice(0,65),60,y);
    y+=32;ctx.fillText("Fecha: "+new Date(sale.sold_at||sale.created_at).toLocaleDateString("es-CO",{timeZone:"America/Bogota",dateStyle:"medium"}),60,y);
    y+=42;ctx.fillStyle="#f0f4ed";ctx.fillRect(60,y,width-120,44);ctx.fillStyle="#314236";ctx.font="bold 17px Arial";ctx.fillText("ARTÍCULO",72,y+28);ctx.fillText("CANT.",700,y+28);ctx.fillText("VALOR",830,y+28);ctx.fillText("TOTAL",1010,y+28);y+=54;ctx.font="17px Arial";
    for (const item of rows){ctx.fillStyle="#202820";ctx.fillText(String(item.item_name||"").slice(0,52),72,y);ctx.fillText(Number(item.quantity).toLocaleString("es-CO"),700,y);ctx.fillText(money(item.unit_price_minor,sale.currency_code||currencyCode),830,y);ctx.fillText(money(item.line_total_minor,sale.currency_code||currencyCode),1010,y);y+=58;ctx.strokeStyle="#E1E7F0";ctx.beginPath();ctx.moveTo(60,y-22);ctx.lineTo(width-60,y-22);ctx.stroke();}
    y+=8;ctx.fillStyle="#174580";ctx.font="bold 28px Arial";ctx.textAlign="right";ctx.fillText("TOTAL: "+money(sale.total_minor,sale.currency_code||currencyCode),width-60,y);ctx.textAlign="left";y+=42;ctx.fillStyle="#202820";ctx.font="19px Arial";ctx.fillText("Pagado: "+money(sale.amount_paid_minor,sale.currency_code||currencyCode),60,y);ctx.fillText("Pendiente: "+money(Math.max(0,Number(sale.total_minor||0)-Number(sale.amount_paid_minor||0)),sale.currency_code||currencyCode),650,y);
    try {
      const blob = await new Promise((resolve,reject)=>{try{canvas.toBlob((value)=>value?resolve(value):reject(new Error("No se pudo crear la imagen.")),"image/png")}catch(e){reject(e)}});
      const filename=String(sale.sale_number||"venta").replace(/[^a-z0-9_-]/gi,"-")+".png";const file=new File([blob],filename,{type:"image/png"});
      if(navigator.share&&navigator.canShare?.({files:[file]})){
        try { await navigator.share({files:[file],title:"Venta "+sale.sale_number,text:"Comprobante de venta de "+brand}); return; }
        catch(e) { if(e?.name==="AbortError") return; }
      }
      const url=URL.createObjectURL(blob);const downloadLink=document.createElement("a");downloadLink.href=url;downloadLink.download=filename;document.body.appendChild(downloadLink);downloadLink.click();downloadLink.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1200);setNotice("Imagen del comprobante descargada para compartir.");
    } catch { setError("No se pudo generar la imagen. Usa PDF / Imprimir para compartir el comprobante."); }
  }

  async function updateQuoteStatus(quote, nextStatus) {
    if (!activeBusiness?.id || !canManageSales || quote.status === nextStatus) return;
    setError("");
    setNotice("");
    try {
      const { data, error: updateError } = await supabase.from("quotes")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", quote.id).eq("business_id", activeBusiness.id)
        .select("id").maybeSingle();
      if (updateError) throw updateError;
      if (!data) throw new Error("No se pudo actualizar esta cotización. Comprueba los permisos de tu cuenta.");
      setNotice("Estado de cotización actualizado.");
      await loadQuotesModuleData();
    } catch (e) { setError(friendlyError(e)); }
  }

  function quoteStatusLabel(status) {
    return ({ draft: "Borrador", sent: "Enviada", accepted: "Aceptada", rejected: "Rechazada", expired: "Vencida", converted: "Convertida en venta", cancelled: "Cancelada" })[status] || status || "—";
  }

  function addPurchaseLine() {
    const product = purchaseProducts.find((item) => item.id === purchaseProductChoice);
    const quantity = Number(purchaseQuantity);
    const unitCost = Number(purchaseUnitCost);
    const name = product?.name || purchaseItemName.trim();
    if (!name) { setError("Escribe el nombre del artículo comprado o elige un producto registrado."); return; }
    if (!Number.isFinite(quantity) || quantity <= 0) { setError("La cantidad debe ser mayor que cero."); return; }
    if (!Number.isFinite(unitCost) || unitCost < 0) { setError("Escribe un costo por unidad válido."); return; }
    setPurchaseCart((current) => {
      const exists = product ? current.find((item) => item.product_id === product.id) : null;
      if (exists) return current.map((item) => item.product_id === product.id
        ? { ...item, quantity: Number((Number(item.quantity) + quantity).toFixed(3)), unit_cost: String(unitCost) }
        : item);
      return [...current, { line_id: crypto.randomUUID(), product_id: product?.id || null, name, quantity, unit_cost: String(unitCost), unit_name: product?.unit_name || "unidad" }];
    });
    setPurchaseProductChoice(""); setPurchaseItemName(""); setPurchaseQuantity("1"); setPurchaseUnitCost(""); setError("");
  }

  async function createPurchase(event) {
    event.preventDefault();
    if (!activeBusiness?.id) return;
    if (!purchaseCart.length) { setError("Añade al menos un artículo a la compra."); return; }
    const subtotal = purchaseCart.reduce((sum, item) => sum + Math.round(toMinorUnits(item.unit_cost, currencyCode) * Number(item.quantity)), 0);
    const tax = toMinorUnits(purchaseTax || 0, currencyCode);
    const payment = toMinorUnits(purchasePayment || 0, currencyCode);
    const total = subtotal + tax;
    if (tax < 0 || payment < 0 || payment > total) { setError("Revisa el impuesto y el abono: no pueden ser negativos y el abono no puede superar el total."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const { data, error: purchaseError } = await supabase.rpc("create_purchase", {
        p_business_id: activeBusiness.id,
        p_supplier_id: purchaseSupplierId || null,
        p_notes: purchaseNotes.trim() || null,
        p_purchased_at: new Date(purchaseDate + "T12:00:00-05:00").toISOString(),
        p_tax_minor: tax,
        p_amount_paid_minor: payment,
        p_initial_payment_method: purchaseInitialPaymentMethod,
        p_items: purchaseCart.map((item) => ({
          product_id: item.product_id, item_name: item.name, quantity: Number(item.quantity),
          unit_cost_minor: toMinorUnits(item.unit_cost, currencyCode)
        }))
      });
      if (purchaseError) throw purchaseError;
      setShowPurchaseForm(false); setPurchaseSupplierId(""); setPurchaseDate(todayInBogota()); setPurchasesPage(1);
      setPurchaseCart([]); setPurchaseTax("0"); setPurchasePayment("0"); setPurchaseInitialPaymentMethod("Efectivo"); setPurchaseNotes("");
      setNotice("Compra guardada. El ingreso a inventario y su historial se actualizaron juntos.");
      await loadPurchasesModuleData();
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  function openPurchasePaymentForm(purchase) {
    const outstanding = Math.max(0, Number(purchase.total_minor || 0) - Number(purchase.amount_paid_minor || 0));
    setPurchasePaymentFormFor(purchase.id);
    setPurchasePaymentAmount(String(outstanding / (10 ** currencyDigits(currencyCode))));
    setPurchasePaymentMethod("Efectivo");
    setPurchasePaymentDate(todayInBogota());
    setPurchasePaymentNotes("");
    setError(""); setNotice("");
  }

  async function recordPurchasePayment(event, purchase) {
    event.preventDefault();
    if (!activeBusiness?.id || !purchase || !canManagePurchases) return;
    const amount = toMinorUnits(purchasePaymentAmount, currencyCode);
    const outstanding = Math.max(0, Number(purchase.total_minor || 0) - Number(purchase.amount_paid_minor || 0));
    if (!Number.isFinite(amount) || amount <= 0) { setError("El pago debe ser mayor que cero."); return; }
    if (amount > outstanding) { setError("El pago no puede superar el saldo pendiente de la compra."); return; }
    setPurchasePaymentSaving(true); setError(""); setNotice("");
    try {
      const { data, error: paymentError } = await supabase.rpc("record_purchase_payment", {
        p_business_id: activeBusiness.id,
        p_purchase_id: purchase.id,
        p_amount_minor: amount,
        p_payment_method: purchasePaymentMethod,
        p_paid_at: new Date((purchasePaymentDate || todayInBogota()) + "T12:00:00-05:00").toISOString(),
        p_notes: purchasePaymentNotes.trim() || null
      });
      if (paymentError) throw paymentError;
      setPurchasePaymentFormFor(null);
      setPurchasePaymentAmount(""); setPurchasePaymentMethod("Efectivo");
      setPurchasePaymentDate(todayInBogota()); setPurchasePaymentNotes("");
      const result = Array.isArray(data) ? data[0] : data;
      setNotice("Pago registrado. Saldo por pagar: " + money(result?.balance_minor ?? Math.max(0, outstanding - amount), currencyCode) + ".");
      await loadPurchasesModuleData();
    } catch (e) { setError(friendlyError(e)); }
    finally { setPurchasePaymentSaving(false); }
  }

  async function addSupplier(event) {
    event?.preventDefault();
    if (!activeBusiness?.id) return;
    const name = supplierDraft.name.trim();
    if (!name) { setError("Escribe el nombre del proveedor."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const { data, error: supplierError } = await supabase.from("suppliers")
        .insert({
          business_id: activeBusiness.id, name,
          email: supplierDraft.email.trim() || null, phone: supplierDraft.phone.trim() || null,
          tax_id: supplierDraft.tax_id.trim() || null, address: supplierDraft.address.trim() || null,
          notes: supplierDraft.notes.trim() || null
        }).select("id,business_id,name,email,phone,tax_id,address,notes").single();
      if (supplierError) throw supplierError;
      setSuppliers((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name, "es")));
      if (showQuickExpenseSupplierForm) setExpenseDraft((current) => ({ ...current, supplier_id: data.id }));
      else setPurchaseSupplierId(data.id);
      setSupplierDraft(blankSupplier); setShowSupplierForm(false); setShowQuickPurchaseSupplierForm(false); setShowQuickExpenseSupplierForm(false);
      setNotice("Proveedor guardado y seleccionado para la compra: " + data.name + ".");
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  async function addExpense(event) {
    event.preventDefault();
    if (!activeBusiness?.id) return;
    if (!expenseDraft.description.trim()) { setError("Describe el gasto."); return; }
    const amountMinor = toMinorUnits(expenseDraft.amount, currencyCode);
    if (!Number.isFinite(amountMinor) || amountMinor <= 0) { setError("El importe debe ser mayor que cero."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const { error: expenseError } = await supabase.from("expenses").insert({
        business_id: activeBusiness.id, category: expenseDraft.category.trim() || "Otro",
        description: expenseDraft.description.trim(), amount_minor: amountMinor, currency_code: currencyCode,
        expense_date: expenseDraft.expense_date || todayInBogota(), payment_method: expenseDraft.payment_method || null,
        supplier_id: expenseDraft.supplier_id || null, notes: expenseDraft.notes.trim() || null
      });
      if (expenseError) throw expenseError;
      setExpenseDraft({ ...blankExpense, expense_date: todayInBogota() }); setExpensesPage(1);
      setShowExpenseForm(false); setNotice("Gasto guardado.");
      await loadPurchasesModuleData();
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  function purchaseStatusLabel(status) {
    return ({ paid: "Pagada", partially_paid: "Con abono", pending: "Por pagar", draft: "Borrador", canceled: "Anulada", refunded: "Devuelta" })[status] || status || "—";
  }

  function fullCustomerName(draft) {
    const person = [draft.first_name, draft.last_name].map((part) => (part || "").trim()).filter(Boolean).join(" ");
    return person || (draft.company_name || "").trim();
  }

  function resetCustomerForm() {
    setShowCustomerForm(false);
    setEditingCustomerId(null);
    setCustomerDraft(blankCustomer);
    setError("");
  }

  function startEditCustomer(customer) {
    setCustomerDraft({
      first_name: customer.first_name || "",
      last_name: customer.last_name || "",
      company_name: customer.company_name || "",
      document_type: customer.document_type || "",
      document_number: customer.document_number || "",
      email: customer.email || "",
      phone: customer.phone || "",
      whatsapp: customer.whatsapp || "",
      city: customer.city || "",
      address: customer.address || "",
      notes: customer.notes || ""
    });
    setEditingCustomerId(customer.id);
    setShowCustomerForm(true);
    setError("");
    setNotice("");
  }

  async function addCustomer(event) {
    event.preventDefault();
    if (!activeBusiness?.id) return;
    const displayName = fullCustomerName(customerDraft);
    if (!displayName) { setError("Escribe un nombre o una empresa."); return; }
    setBusy(true); setError(""); setNotice("");
    const payload = {
      business_id: activeBusiness.id,
      full_name: displayName,
      first_name: customerDraft.first_name.trim() || null,
      last_name: customerDraft.last_name.trim() || null,
      company_name: customerDraft.company_name.trim() || null,
      document_type: customerDraft.document_type || null,
      document_number: customerDraft.document_number.trim() || null,
      email: customerDraft.email.trim() || null,
      phone: customerDraft.phone.trim() || null,
      whatsapp: customerDraft.whatsapp.trim() || null,
      city: customerDraft.city.trim() || null,
      address: customerDraft.address.trim() || null,
      notes: customerDraft.notes.trim() || null
    };
    try {
      let result;
      if (editingCustomerId) {
        const updatePayload = { ...payload };
        delete updatePayload.business_id;
        result = await supabase.from("customers").update(updatePayload)
          .eq("business_id", activeBusiness.id).eq("id", editingCustomerId)
          .select(customerFields).single();
      } else {
        result = await supabase.from("customers").insert(payload).select(customerFields).single();
      }
      if (result.error) throw result.error;
      setCustomerDraft(blankCustomer);
      setShowCustomerForm(false);
      setNotice(editingCustomerId ? "Cliente actualizado: " + result.data.full_name + "." : "Cliente guardado: " + result.data.full_name + ".");
      setEditingCustomerId(null);
      await loadSalesModuleData();
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  async function addQuickCustomer() {
    if (!activeBusiness?.id || !canManageCustomers) return;
    const name = quickCustomerName.trim();
    if (!name) { setError("Escribe el nombre del cliente."); return; }
    setQuickCustomerSaving(true); setError(""); setNotice("");
    try {
      const { data, error: insertError } = await supabase.from("customers").insert({
        business_id: activeBusiness.id,
        full_name: name,
        first_name: name,
        company_name: quickCustomerCompany.trim() || null,
        email: quickCustomerEmail.trim() || null,
        phone: quickCustomerPhone.trim() || null,
        whatsapp: quickCustomerWhatsapp.trim() || null,
        document_type: quickCustomerDocumentType || null,
        document_number: quickCustomerDocumentNumber.trim() || null,
        city: quickCustomerCity.trim() || null,
        address: quickCustomerAddress.trim() || null
      }).select("id,full_name,company_name,email,phone,whatsapp,document_type,document_number,city,address").single();
      if (insertError) throw insertError;
      setCustomers((current) => [data, ...current.filter((item) => item.id !== data.id)]);
      setSaleCustomerId(data.id);
      setQuickCustomerName(""); setQuickCustomerPhone(""); setQuickCustomerEmail(""); setQuickCustomerCompany(""); setQuickCustomerWhatsapp(""); setQuickCustomerDocumentType(""); setQuickCustomerDocumentNumber(""); setQuickCustomerCity(""); setQuickCustomerAddress("");
      setShowQuickCustomerForm(false);
      setNotice("Cliente creado y seleccionado para esta venta.");
    } catch (e) { setError(friendlyError(e)); }
    finally { setQuickCustomerSaving(false); }
  }

  async function addQuickSaleCategory() {
    if (!activeBusiness?.id || !quickSaleCategoryName.trim() || quickSaleCategorySaving) return;
    setQuickSaleCategorySaving(true); setError(""); setNotice("");
    try {
      const { data, error: createError } = await supabase.from("product_categories")
        .insert({ business_id: activeBusiness.id, name: quickSaleCategoryName.trim() })
        .select("id,name,description,sort_order").single();
      if (createError) throw createError;
      setCategories((current) => [...current.filter((item) => item.id !== data.id), data].sort((a, b) => a.name.localeCompare(b.name, "es")));
      setQuickSaleProductCategoryId(data.id);
      setQuickSaleCategoryName(""); setShowQuickSaleCategoryForm(false);
      setNotice("Categoría creada y seleccionada.");
    } catch (e) { setError(friendlyError(e)); }
    finally { setQuickSaleCategorySaving(false); }
  }

  async function addQuickSaleProduct() {
    if (!activeBusiness?.id || !canManageProducts || quickSaleProductSaving) return;
    const name = quickSaleProductName.trim();
    const salePrice = Number(quickSaleProductPrice);
    const costPrice = Number(quickSaleProductCost);
    const openingStock = quickSaleProductType === "physical" ? Number(quickSaleProductStock) : 0;
    if (!name) { setError("Escribe el nombre del artículo."); return; }
    if (quickSaleProductPrice === "" || quickSaleProductCost === "" || !Number.isFinite(salePrice) || salePrice < 0 || !Number.isFinite(costPrice) || costPrice < 0) { setError("Escribe un precio y un costo válidos, sin valores negativos."); return; }
    if (quickSaleProductType === "physical" && (!Number.isFinite(openingStock) || openingStock < 0)) { setError("Escribe una cantidad inicial válida."); return; }
    setQuickSaleProductSaving(true); setError(""); setNotice("");
    try {
      const { data: productId, error: createError } = await supabase.rpc("create_product_with_opening_stock", {
        p_business_id: activeBusiness.id, p_name: name, p_category_id: quickSaleProductCategoryId || null, p_sku: null,
        p_description: null, p_product_type: quickSaleProductType, p_unit_name: "unidad",
        p_sale_price_minor: toMinorUnits(salePrice, currencyCode), p_cost_price_minor: toMinorUnits(costPrice, currencyCode),
        p_opening_stock: openingStock, p_low_stock_threshold: null, p_commercial_presentation: null
      });
      if (createError) throw createError;
      const { data: created, error: readError } = await supabase.from("products")
        .select("id,business_id,category_id,sku,slug,name,description,commercial_presentation,product_type,unit_name,sale_price_minor,cost_price_minor,stock_on_hand,low_stock_threshold,track_inventory,is_sellable,is_published,image_paths,archived_at,created_at")
        .eq("business_id", activeBusiness.id).eq("id", productId).single();
      if (readError) throw readError;
      setSaleProducts((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setSaleProductChoice(created.id); setSaleQuantity("1");
      setQuickSaleProductName(""); setQuickSaleProductCategoryId(""); setShowQuickSaleCategoryForm(false); setQuickSaleCategoryName(""); setQuickSaleProductType("physical"); setQuickSaleProductPrice(""); setQuickSaleProductCost(""); setQuickSaleProductStock("1");
      setShowQuickSaleProductForm(false);
      setNotice("Artículo creado y seleccionado para esta venta. Completa los demás datos antes de guardar.");
    } catch (e) { setError(friendlyError(e)); }
    finally { setQuickSaleProductSaving(false); }
  }

  function addSaleLine() {
    const product = saleProducts.find((item) => item.id === saleProductChoice);
    const quantity = Number(saleQuantity);
    if (!product) { setError("Elige un producto."); return; }
    if (!Number.isFinite(quantity) || quantity <= 0) { setError("La cantidad debe ser mayor que cero."); return; }
    if (product.track_inventory && quantity > Number(product.stock_on_hand)) {
      setError("No hay existencias suficientes de " + product.name + ". Disponibles: " + Number(product.stock_on_hand).toLocaleString("es-CO") + ".");
      return;
    }
    setSaleItems((current) => {
      const exists = current.find((item) => item.product_id === product.id);
      if (exists) return current.map((item) => item.product_id === product.id ? { ...item, quantity: Number((Number(item.quantity) + quantity).toFixed(3)) } : item);
      return [...current, { product_id: product.id, name: product.name, quantity,
        unit_price_minor: Number(product.sale_price_minor || 0), unit_cost_minor: Number(product.cost_price_minor || 0),
        unit_name: product.unit_name || "unidad", track_inventory: product.track_inventory, stock_on_hand: Number(product.stock_on_hand || 0) }];
    });
    setSaleProductChoice(""); setSaleQuantity("1"); setError("");
  }

  async function createSale(event) {
    event.preventDefault();
    if (!activeBusiness?.id) return;
    if (!saleItems.length) { setError("Añade al menos un producto a la venta."); return; }
    const total = saleItems.reduce((sum, item) => sum + Math.round(item.unit_price_minor * Number(item.quantity)), 0);
    const payment = toMinorUnits(salePayment || 0, currencyCode);
    if (payment < 0 || payment > total) { setError("El abono debe estar entre cero y el total de la venta."); return; }
    setSaleSaving(true); setError(""); setNotice("");
    try {
      const { data, error: saleError } = await supabase.rpc("create_sale", {
        p_business_id: activeBusiness.id, p_customer_id: saleCustomerId || null,
        p_items: saleItems.map((item) => ({ product_id: item.product_id, quantity: Number(item.quantity) })),
        p_amount_paid_minor: payment, p_notes: saleNotes.trim() || null, p_initial_payment_method: saleInitialPaymentMethod
      });
      if (saleError) throw saleError;
      const sale = Array.isArray(data) ? data[0] : data;
      const wasOnFirstSalesPage = salesPage === 1;
      setSalesPage(1);
      setShowSaleForm(false); setSaleCustomerId(""); setSaleProductChoice(""); setSaleQuantity("1");
      setSaleItems([]); setSalePayment(""); setSaleInitialPaymentMethod("Efectivo"); setSaleNotes("");
      setNotice("Venta " + (sale?.sale_number || "registrada") + " guardada. El inventario se actualizó.");
      if (wasOnFirstSalesPage) await loadSalesModuleData();
    } catch (e) { setError(friendlyError(e)); }
    finally { setSaleSaving(false); }
  }

  async function registerSalePayment(event, sale) {
    event.preventDefault();
    if (!activeBusiness?.id || !sale || !canManageSales) return;
    const amount = toMinorUnits(salePaymentAmount, currencyCode);
    const outstanding = Math.max(0, Number(sale.total_minor || 0) - Number(sale.amount_paid_minor || 0));
    if (!Number.isFinite(amount) || amount <= 0) { setError("El abono debe ser mayor que cero."); return; }
    if (amount > outstanding) { setError("El abono no puede superar el saldo pendiente de la venta."); return; }
    setSalePaymentSaving(true); setError(""); setNotice("");
    try {
      const { data, error: paymentError } = await supabase.rpc("record_sale_payment", {
        p_business_id: activeBusiness.id,
        p_sale_id: sale.id,
        p_amount_minor: amount,
        p_payment_method: salePaymentMethod,
        p_paid_at: new Date((salePaymentDate || todayInBogota()) + "T12:00:00-05:00").toISOString(),
        p_notes: salePaymentNotes.trim() || null
      });
      if (paymentError) throw paymentError;
      setSalePaymentFormFor(null);
      setSalePaymentAmount(""); setSalePaymentMethod("Efectivo");
      setSalePaymentDate(todayInBogota()); setSalePaymentNotes("");
      const result = Array.isArray(data) ? data[0] : data;
      setNotice("Abono registrado. Saldo pendiente: " + money(result?.balance_minor ?? Math.max(0, outstanding - amount), currencyCode) + ".");
      await loadSalesModuleData();
    } catch (e) { setError(friendlyError(e)); }
    finally { setSalePaymentSaving(false); }
  }

  function openSalePaymentForm(sale) {
    const outstanding = Math.max(0, Number(sale.total_minor || 0) - Number(sale.amount_paid_minor || 0));
    setSalePaymentFormFor(sale.id);
    setSalePaymentAmount(String(outstanding / (10 ** currencyDigits(currencyCode))));
    setSalePaymentMethod("Efectivo");
    setSalePaymentDate(todayInBogota());
    setSalePaymentNotes("");
    setError(""); setNotice("");
  }

  function clearSaleDraft() {
    setShowSaleForm(false); setSaleCustomerId(""); setSaleProductChoice(""); setSaleQuantity("1");
    setSaleItems([]); setSalePayment(""); setSaleInitialPaymentMethod("Efectivo"); setSaleNotes(""); setError("");
  }

  function saleStatusLabel(status) {
    return ({ paid: "Pagada", partially_paid: "Con abono", pending: "Por cobrar", draft: "Borrador", canceled: "Anulada", refunded: "Devuelta" })[status] || status || "—";
  }

  const filteredProducts = [...products].sort((a, b) => compareInventoryProducts(a, b, productSort));
  useEffect(() => {
    if (!activeBusiness?.id || screen !== "stats") return;
    let alive=true;
    setBalanceTrendLoading(true);
    const dateKey=(date)=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
    const today=todayInBogota();
    const start=new Date(today+"T12:00:00-05:00");start.setDate(start.getDate()-6);
    const startKey=dateKey(start);
    const tomorrow=new Date(today+"T12:00:00-05:00");tomorrow.setDate(tomorrow.getDate()+1);
    const tomorrowKey=dateKey(tomorrow);
    const startAt=startKey+"T00:00:00-05:00",endAt=tomorrowKey+"T00:00:00-05:00";
    Promise.all([
      supabase.from("sale_payments").select("paid_at,amount_minor").eq("business_id",activeBusiness.id).gte("paid_at",startAt).lt("paid_at",endAt),
      supabase.from("expenses").select("expense_date,amount_minor").eq("business_id",activeBusiness.id).gte("expense_date",startKey).lte("expense_date",today),
      supabase.from("purchase_payments").select("paid_at,amount_minor").eq("business_id",activeBusiness.id).gte("paid_at",startAt).lt("paid_at",endAt)
    ]).then(([sales,expenses,purchases])=>{
      if(!alive)return;
      const firstError=sales.error||expenses.error||purchases.error;
      if(firstError)throw firstError;
      setBalanceTrendRows({payments:sales.data||[],expenses:expenses.data||[],purchasePayments:purchases.data||[]});
    }).catch((e)=>{if(alive)setError(friendlyError(e));})
      .finally(()=>{if(alive)setBalanceTrendLoading(false);});
    return ()=>{alive=false;};
  },[activeBusiness?.id,screen]);

  const balanceChartData = useMemo(() => {
    const today = new Date(todayInBogota() + "T12:00:00-05:00");
    const keyFor = (value) => {
      if (!value) return "";
      if (typeof value==="string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value).slice(0,10);
      return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
    };
    const buckets = new Map();
    for (let offset=6; offset>=0; offset--) {
      const date = new Date(today); date.setDate(date.getDate()-offset);
      const key = keyFor(date);
      buckets.set(key,{key,label:new Intl.DateTimeFormat("es-CO",{timeZone:"America/Bogota",day:"2-digit",month:"short"}).format(date),income:0,outgoing:0,value:0});
    }
    for (const row of balanceTrendRows.payments) { const b=buckets.get(keyFor(row.paid_at)); if (b) b.income+=Number(row.amount_minor||0); }
    for (const row of balanceTrendRows.expenses) { const b=buckets.get(keyFor(row.expense_date)); if (b) b.outgoing+=Number(row.amount_minor||0); }
    for (const row of balanceTrendRows.purchasePayments) { const b=buckets.get(keyFor(row.paid_at)); if (b) b.outgoing+=Number(row.amount_minor||0); }
    return [...buckets.values()].map((b)=>({...b,value:b.income-b.outgoing}));
  },[balanceTrendRows]);
  const visibleBulkProductRows = bulkProductRows.filter((row) => !search.trim() || [row._draftName, row.name, row._draftSku, row.sku, row.description, categories.find((category) => category.id === row.category_id)?.name].filter(Boolean).join(" ").toLocaleLowerCase("es").includes(search.trim().toLocaleLowerCase("es")));
  const totalProductPages = Math.max(1, Math.ceil(productsCount / productPageSize));
  const normalizedCatalogSearch = catalogSearch.trim().toLocaleLowerCase("es");
  const filteredCatalogProducts = [...catalogProducts].filter((product) => {
    const category = catalogCategories.find((item) => item.id === product.category_id)?.name || "";
    return [product.name, product.description, category].filter(Boolean).join(" ").toLocaleLowerCase("es").includes(normalizedCatalogSearch);
  }).sort((a, b) => catalogSort === "code" ? String(a.sku || "").localeCompare(String(b.sku || ""), "es", { numeric: true, sensitivity: "base" }) || String(a.name || "").localeCompare(String(b.name || ""), "es") : catalogSort === "price" ? Number(a.sale_price_minor || 0) - Number(b.sale_price_minor || 0) || String(a.name || "").localeCompare(String(b.name || ""), "es") : String(a.name || "").localeCompare(String(b.name || ""), "es", { numeric: true, sensitivity: "base" }));
  const catalogTotalPages = Math.max(1, Math.ceil(filteredCatalogProducts.length / catalogPageSize));
  useEffect(() => {
    if (catalogPage > catalogTotalPages) setCatalogPage(catalogTotalPages);
  }, [catalogPage, catalogTotalPages]);

  const catalogPageProducts = filteredCatalogProducts.slice((catalogPage - 1) * catalogPageSize, catalogPage * catalogPageSize);
  const publishedCatalogCount = catalogProducts.filter((product) => product.is_published && product.is_sellable).length;
  const profitPeriodDateKey = (value) => {
    if (!value) return "";
    const date = String(value).includes("T") ? new Date(value) : new Date(String(value) + "T12:00:00-05:00");
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return values.year + "-" + values.month + "-" + values.day;
  };
  const todayBogotaKey = profitPeriodDateKey(new Date().toISOString());
  const currentMonthKey = todayBogotaKey.slice(0, 7);
  const profitInPeriod = (value) => {
    if (profitabilityPeriod === "all") return true;
    const key = profitPeriodDateKey(value);
    if (!key) return false;
    if (profitabilityPeriod === "day") return key === todayBogotaKey;
    if (profitabilityPeriod === "month") return key.slice(0, 7) === currentMonthKey;
    if (profitabilityPeriod === "year") return key.slice(0, 4) === todayBogotaKey.slice(0, 4);
    if (profitabilityPeriod === "custom") return key >= (profitabilityDateFrom || todayBogotaKey) && key <= (profitabilityDateTo || todayBogotaKey);
    const nowDate = new Date(todayBogotaKey + "T12:00:00Z");
    const weekStart = new Date(nowDate); weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
    if (profitabilityPeriod === "week") return key >= weekStart.toISOString().slice(0,10) && key <= todayBogotaKey;
    const day = new Date(key + "T12:00:00-05:00").getTime();
    const now = new Date(todayBogotaKey + "T12:00:00-05:00").getTime();
    return day >= now - 30 * 24 * 60 * 60 * 1000 && day <= now + 24 * 60 * 60 * 1000;
  };
  const periodSales = profitabilitySales.filter((sale) => !["canceled", "refunded"].includes(sale.status) && profitInPeriod(sale.sold_at || sale.created_at));
  const periodSaleIds = new Set(periodSales.map((sale) => sale.id));
  const periodSaleItems = profitabilitySaleItems.filter((item) => periodSaleIds.has(item.sale_id));
  const periodExpenses = profitabilityExpenses.filter((expense) => profitInPeriod(expense.expense_date));
  const shiftDateKey = (key, offset) => {
    const date = new Date(key + "T12:00:00Z");
    date.setUTCDate(date.getUTCDate() + offset);
    return date.toISOString().slice(0, 10);
  };
  const weekOffset = (new Date(todayBogotaKey + "T12:00:00Z").getUTCDay() + 6) % 7;
  const yearStart = todayBogotaKey.slice(0, 4) + "-01-01";
  const monthStart = todayBogotaKey.slice(0, 7) + "-01";
  const statsRangeStart = statsPeriod === "day" ? todayBogotaKey
    : statsPeriod === "week" ? shiftDateKey(todayBogotaKey, -weekOffset)
    : statsPeriod === "month" ? monthStart
    : statsPeriod === "year" ? yearStart
    : statsPeriod === "all" ? "0001-01-01"
    : (statsDateFrom || monthStart);
  const statsRangeEnd = statsPeriod === "custom" ? (statsDateTo || todayBogotaKey) : todayBogotaKey;
  const formatStatsDate = (key) => new Date(key + "T12:00:00-05:00").toLocaleDateString("es-CO", { timeZone: "America/Bogota", day: "2-digit", month: "2-digit", year: "numeric" });
  const statsRangeLabel = statsPeriod === "all"
    ? "Todo el historial hasta " + formatStatsDate(todayBogotaKey)
    : statsRangeStart === statsRangeEnd
      ? formatStatsDate(statsRangeStart)
      : "Desde " + formatStatsDate(statsRangeStart) + " hasta " + formatStatsDate(statsRangeEnd);
  const statsInPeriod = (value) => {
    const key = profitPeriodDateKey(value);
    return Boolean(key && key >= statsRangeStart && key <= statsRangeEnd);
  };
  const statsPeriodSales = statsSales.filter((sale) => !["canceled", "refunded", "draft"].includes(sale.status) && statsInPeriod(sale.sold_at || sale.created_at));
  const statsPeriodPayments = statsPayments.filter((payment) => statsInPeriod(payment.paid_at));
  const statsPeriodExpenses = statsExpenses.filter((expense) => statsInPeriod(expense.expense_date));
  const statsPeriodPurchases = statsPurchases.filter((purchase) => !["cancelled", "canceled", "draft"].includes(String(purchase.status || "").toLowerCase()) && statsInPeriod(purchase.purchased_at || purchase.created_at));
  const statsPeriodPurchasePayments = statsPurchasePayments.filter((payment) => statsInPeriod(payment.paid_at));
  const statsSalesTotal = statsPeriodSales.reduce((sum, sale) => sum + Number(sale.total_minor || 0), 0);
  const statsCollected = statsPayments.length
    ? statsPeriodPayments.reduce((sum, payment) => sum + Number(payment.amount_minor || 0), 0)
    : statsPeriodSales.reduce((sum, sale) => sum + Number(sale.amount_paid_minor || 0), 0);
  const statsOutstanding = statsPeriodSales.reduce((sum, sale) => sum + Math.max(0, Number(sale.total_minor || 0) - Number(sale.amount_paid_minor || 0)), 0);
  const statsExpensesTotal = statsPeriodExpenses.reduce((sum, expense) => sum + Number(expense.amount_minor || 0), 0);
  const statsPaidPurchases = statsPurchasePayments.length
    ? statsPeriodPurchasePayments.reduce((sum, payment) => sum + Number(payment.amount_minor || 0), 0)
    : statsPeriodPurchases.reduce((sum, purchase) => sum + Number(purchase.amount_paid_minor || 0), 0);
  const statsCashBalance = statsCollected - statsExpensesTotal - statsPaidPurchases;

  function downloadStatsExcel() {
    const unit = 10 ** currencyDigits(currencyCode);
    const rows = [
      ["treseiscinco - Estadísticas"],
      ["Negocio", activeBusiness?.name || ""],
      ["Periodo", statsRangeLabel],
      [],
      ["Indicador", "Importe"],
      ["Ingresos", statsCollected / unit],
      ["Gastos", statsExpensesTotal / unit],
      ["Compras pagadas", statsPaidPurchases / unit],
      ["Balance", statsCashBalance / unit],
      ["Ventas registradas", statsSalesTotal / unit],
      ["Pendiente por cobrar", statsOutstanding / unit],
      [],
      ["Movimiento", "Fecha", "Referencia", "Importe"]
    ];
    if (statsPayments.length) {
      const saleNames = new Map(statsSales.map((sale) => [sale.id, sale.sale_number || "Venta"]));
      statsPeriodPayments.forEach((payment) => rows.push(["Ingreso", profitPeriodDateKey(payment.paid_at), saleNames.get(payment.sale_id) || "Abono", Number(payment.amount_minor || 0) / unit]));
    } else {
      statsPeriodSales.filter((sale) => Number(sale.amount_paid_minor || 0) > 0).forEach((sale) => rows.push(["Ingreso", profitPeriodDateKey(sale.sold_at || sale.created_at), sale.sale_number || "Venta", Number(sale.amount_paid_minor || 0) / unit]));
    }
    statsPeriodExpenses.forEach((expense) => rows.push(["Gasto", profitPeriodDateKey(expense.expense_date), expense.description || expense.category || "Gasto", Number(expense.amount_minor || 0) / unit]));
    if (statsPurchasePayments.length) {
      const purchaseNames = new Map(statsPurchases.map((purchase) => [purchase.id, purchase.purchase_number || "Compra"]));
      statsPeriodPurchasePayments.forEach((payment) => rows.push(["Compra pagada", profitPeriodDateKey(payment.paid_at), purchaseNames.get(payment.purchase_id) || "Pago de compra", Number(payment.amount_minor || 0) / unit]));
    } else {
      statsPeriodPurchases.filter((purchase) => Number(purchase.amount_paid_minor || 0) > 0).forEach((purchase) => rows.push(["Compra pagada", profitPeriodDateKey(purchase.purchased_at || purchase.created_at), purchase.purchase_number || "Compra", Number(purchase.amount_paid_minor || 0) / unit]));
    }
    const csv = "\uFEFF" + rows.map((row) => row.map((value) => {
      const cell = String(value ?? "");
      return /[;\r\n"]/.test(cell) ? '"' + cell.replace(/"/g, '""') + '"' : cell;
    }).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "treseiscinco-estadisticas-" + statsRangeStart + "-a-" + statsRangeEnd + ".csv";
    document.body.appendChild(downloadLink); downloadLink.click(); downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function printStatsReport() { window.print(); }

  const profitSalesTotal = periodSales.reduce((sum, sale) => sum + Number(sale.total_minor || 0), 0);
  const profitPaidTotal = periodSales.reduce((sum, sale) => sum + Number(sale.amount_paid_minor || 0), 0);
  const profitCostOfSales = periodSaleItems.reduce((sum, item) => sum + Math.round(Number(item.unit_cost_minor || 0) * Number(item.quantity || 0)), 0);
  const profitLineRevenue = periodSaleItems.reduce((sum, item) => sum + Number(item.line_total_minor || 0), 0);
  const profitGross = profitLineRevenue - profitCostOfSales;
  const profitExpenseTotal = periodExpenses.reduce((sum, expense) => sum + Number(expense.amount_minor || 0), 0);
  const profitNet = profitGross - profitExpenseTotal;
  const expensesByCategory = Object.values(periodExpenses.reduce((groups, expense) => {
    const category = expense.category || "Otro";
    if (!groups[category]) groups[category] = { name: category, amount: 0, count: 0 };
    groups[category].amount += Number(expense.amount_minor || 0);
    groups[category].count += 1;
    return groups;
  }, {})).sort((a, b) => b.amount - a.amount);
  const profitByItem = Object.values(periodSaleItems.reduce((groups, item) => {
    const name = item.item_name || "Artículo sin nombre";
    if (!groups[name]) groups[name] = { name, quantity: 0, revenue: 0, cost: 0 };
    groups[name].quantity += Number(item.quantity || 0);
    groups[name].revenue += Number(item.line_total_minor || 0);
    groups[name].cost += Math.round(Number(item.unit_cost_minor || 0) * Number(item.quantity || 0));
    return groups;
  }, {})).sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost));

  const isBusinessManager = ["owner", "admin"].includes(activeBusiness?.role);
  const isBusinessOwner = activeBusiness?.role === "owner";
  const businessPermissions = activeBusiness?.permissions || {};
  const canPermission = (permission) => isBusinessManager
    || Boolean(businessPermissions[permission])
    || (permission === "suppliers_manage" && Boolean(businessPermissions.purchases_manage));
  const canManageProducts = canPermission("products_manage");
  const canManageSales = canPermission("sales_manage");
  const canManageCustomers = canPermission("customers_manage");
  const canManagePurchases = canPermission("purchases_manage");
  const canManageExpenses = canPermission("expenses_manage");
  const canViewPurchases = canPermission("purchases_view");
  const canViewExpenses = canPermission("expenses_view");
  const canViewSuppliers = canPermission("suppliers_view") || canViewPurchases;
  const effectivePurchaseTab = screen === "suppliers" ? "suppliers"
    : purchaseModuleTab === "suppliers" && canViewSuppliers
      ? "suppliers"
      : canViewPurchases
        ? (purchaseModuleTab === "expenses" && canViewExpenses ? "expenses" : "purchases")
        : "expenses";
  function canAccessScreen(next) {
    if (next === "home" || next === "setup") return true;
    if (next === "platform_admin") return isPlatformAdmin;
    if (next === "receivables") return canPermission("sales_view");
    if (next === "payables") return canViewPurchases;
    if (next === "settings") return isBusinessOwner;
    if (next === "team") return isBusinessManager;
    if (next === "products") return canPermission("products_view");
    if (next === "sales" || next === "stats" || next === "quotes") return canPermission("sales_view");
    if (next === "customers") return canPermission("customers_view");
    if (next === "purchases") return canViewPurchases || canViewExpenses;
    if (next === "suppliers") return canViewSuppliers;
    if (next === "profitability") return canPermission("sales_view") && canViewExpenses;
    if (next === "audit") return canPermission("reports_view") || isBusinessManager;
    if (next === "catalog") return canManageProducts;
    return false;
  }
  const visibleAreas = areas.filter((area) => canAccessScreen(area.screen));
  const homeShortcutOrder = ["products","sales","customers","stats","quotes","purchases"];
  const homeShortcutAreas = visibleAreas.filter((area) => homeShortcutOrder.includes(area.screen)).sort((a,b) => homeShortcutOrder.indexOf(a.screen)-homeShortcutOrder.indexOf(b.screen));

  function navigate(next, purchaseTab = "purchases") {
    if (!canAccessScreen(next)) { setError("Tu cuenta no tiene permiso para abrir ese módulo."); return; }
    setScreen(next); setMobileNavOpen(false); setError(""); setNotice(""); setShowProductForm(false);
    if (next !== "quotes") clearQuoteDraft();
    if (next === "purchases") { setPurchaseModuleTab(purchaseTab); if (purchaseTab !== "suppliers") setShowSupplierForm(false); }
    if (next !== "purchases") { setShowPurchaseForm(false); setShowExpenseForm(false); setShowSupplierForm(false); }
    if (next !== "products") { setAdjustingId(null); }
  }

  useEffect(() => {
    setSidebarLayout(normalizeSidebarLayout(activeBusiness?.settings?.sidebar_layout));
    setSidebarEditing(false);
  }, [activeBusiness?.id]);

  useEffect(() => {
    setHelpOpen(false);
    document.dispatchEvent(new CustomEvent("treseiscinco:field-help-open", { detail: { source: null } }));
  }, [screen, activeBusiness?.id]);

  function updateSidebarDraft(updater) {
    setSidebarLayout((current) => normalizeSidebarLayout(typeof updater === "function" ? updater(current) : updater));
  }

  async function saveSidebarLayout() {
    if (!activeBusiness?.id || !isBusinessOwner) return;
    setSidebarSaving(true); setError(""); setNotice("");
    const nextLayout = normalizeSidebarLayout(sidebarLayout);
    const nextSettings = { ...(activeBusiness.settings || {}), sidebar_layout: nextLayout };
    try {
      const { data, error: saveError } = await supabase.from("businesses")
        .update({ settings: nextSettings }).eq("id", activeBusiness.id)
        .select("id,settings").maybeSingle();
      if (saveError) throw saveError;
      if (!data) throw new Error("No se pudo guardar el menú. Comprueba que tu sesión siga activa.");
      setActiveBusiness((current) => current ? { ...current, settings: data.settings || nextSettings } : current);
      setBusinesses((current) => current.map((business) => business.id === data.id ? { ...business, settings: data.settings || nextSettings } : business));
      setSidebarLayout(normalizeSidebarLayout(data.settings?.sidebar_layout));
      setSidebarEditing(false);
      setNotice("Menú guardado. El orden y los nombres se conservaron.");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSidebarSaving(false);
    }
  }

  function confirmSidebarDrop(payload, targetGroupId, targetItemId = null) {
    if (!payload || !isBusinessOwner) return;
    const accepted = window.confirm("¿Deseas moverlo aquí? Si aceptas, guardaré el nuevo orden del menú. Si cancelas, lo dejaré como estaba.");
    if (!accepted) {
      if (sidebarPreDragRef.current) setSidebarLayout(normalizeSidebarLayout(sidebarPreDragRef.current));
      setDraggedSidebarItem(null); setSidebarTouchDragging(false); setSidebarEditing(false);
      return;
    }
    if (payload.type === "item") moveSidebarItem(payload.id, targetGroupId, targetItemId);
    else if (payload.type === "group") moveSidebarGroup(payload.id, targetGroupId);
    setSidebarEditing(false);
    setDraggedSidebarItem(null);
    setSidebarTouchDragging(false);
    setSidebarConfirmSave(true);
  }

  useEffect(() => {
    if (!sidebarConfirmSave) return;
    setSidebarConfirmSave(false);
    saveSidebarLayout();
  }, [sidebarConfirmSave, sidebarLayout]);

  function moveSidebarItem(itemId, targetGroupId, targetItemId = null) {
    updateSidebarDraft((current) => {
      const next = current.map((group) => ({ ...group, items: [...group.items] }));
      let moving = null;
      for (const group of next) {
        const index = group.items.findIndex((item) => item.id === itemId);
        if (index >= 0) { [moving] = group.items.splice(index, 1); break; }
      }
      if (!moving) return current;
      const target = next.find((group) => group.id === targetGroupId);
      if (!target) return current;
      const targetIndex = targetItemId ? target.items.findIndex((item) => item.id === targetItemId) : -1;
      target.items.splice(targetIndex < 0 ? target.items.length : targetIndex, 0, moving);
      return next;
    });
  }

  function moveSidebarGroup(groupId, targetGroupId) {
    updateSidebarDraft((current) => {
      const next = [...current];
      const from = next.findIndex((group) => group.id === groupId);
      const to = next.findIndex((group) => group.id === targetGroupId);
      if (from < 0 || to < 0 || from === to) return current;
      const [moving] = next.splice(from, 1);
      next.splice(to, 0, moving);
      return next;
    });
  }

  function startSidebarMouseDrag(event, payload) {
    if (!isBusinessOwner) {
      event.preventDefault();
      return;
    }
    sidebarPreDragRef.current = normalizeSidebarLayout(sidebarLayout);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", payload.id);
    }
    setDraggedSidebarItem(payload);
  }

  function startSidebarTouchDrag(event, payload) {
    if (!isBusinessOwner) return;
    if (sidebarEditing && event.target?.closest && event.target.closest("input, button")) return;
    if (!event.touches || event.touches.length !== 1) return;
    const touch = event.touches[0];
    sidebarPreDragRef.current = normalizeSidebarLayout(sidebarLayout);
    sidebarTouchRef.current = {
      ...payload,
      startX: touch.clientX,
      startY: touch.clientY,
      dragging: false,
      lastTarget: null
    };
    if (sidebarLongPressTimerRef.current) window.clearTimeout(sidebarLongPressTimerRef.current);
    sidebarLongPressTimerRef.current = window.setTimeout(() => {
      const active = sidebarTouchRef.current;
      if (!active) return;
      active.dragging = true;
      sidebarSuppressClickRef.current = true;
      setDraggedSidebarItem({ type: active.type, id: active.id });
      setSidebarTouchDragging(true);
    }, 320);
  }

  function moveSidebarTouchDrag(event) {
    const active = sidebarTouchRef.current;
    if (!active || !event.touches || event.touches.length !== 1) return;
    const touch = event.touches[0];
    if (!active.dragging) {
      if (Math.hypot(touch.clientX - active.startX, touch.clientY - active.startY) > 12) {
        if (sidebarLongPressTimerRef.current) window.clearTimeout(sidebarLongPressTimerRef.current);
        sidebarLongPressTimerRef.current = null;
        sidebarTouchRef.current = null;
      }
      return;
    }

    event.preventDefault();
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetItem = target?.closest?.("[data-sidebar-item-id]");
    const targetGroup = target?.closest?.("[data-sidebar-group-id]");
    if (active.type === "item" && targetItem) {
      const targetId = targetItem.dataset.sidebarItemId;
      const targetGroupId = targetItem.closest("[data-sidebar-group-id]")?.dataset.sidebarGroupId;
      const targetKey = "item:" + targetGroupId + ":" + targetId;
      if (targetId && targetGroupId && targetId !== active.id && targetKey !== active.lastTarget) {
        moveSidebarItem(active.id, targetGroupId, targetId);
        active.groupId = targetGroupId;
        active.lastTarget = targetKey;
      }
    } else if (active.type === "item" && targetGroup && targetGroup.dataset.sidebarGroupId
      && targetGroup.dataset.sidebarGroupId !== active.groupId) {
      const targetKey = "end:" + targetGroup.dataset.sidebarGroupId;
      if (targetKey !== active.lastTarget) {
        moveSidebarItem(active.id, targetGroup.dataset.sidebarGroupId);
        active.groupId = targetGroup.dataset.sidebarGroupId;
        active.lastTarget = targetKey;
      }
    } else if (active.type === "group" && targetGroup) {
      const targetGroupId = targetGroup.dataset.sidebarGroupId;
      if (targetGroupId && targetGroupId !== active.id && active.lastTarget !== "group:" + targetGroupId) {
        moveSidebarGroup(active.id, targetGroupId);
        active.lastTarget = "group:" + targetGroupId;
      }
    }
  }

  function finishSidebarTouchDrag() {
    if (sidebarLongPressTimerRef.current) window.clearTimeout(sidebarLongPressTimerRef.current);
    sidebarLongPressTimerRef.current = null;
    const drag = sidebarTouchRef.current;
    if (drag?.dragging) {
      setSidebarTouchDragging(false);
      setDraggedSidebarItem(null);
      setSidebarEditing(false);
      if (drag.lastTarget) {
        const accepted = window.confirm("¿Deseas moverlo aquí? Si aceptas, guardaré el nuevo orden del menú. Si cancelas, desharé el movimiento.");
        if (accepted) setSidebarConfirmSave(true);
        else if (sidebarPreDragRef.current) setSidebarLayout(normalizeSidebarLayout(sidebarPreDragRef.current));
      }
      window.setTimeout(() => { sidebarSuppressClickRef.current = false; }, 650);
    }
    sidebarTouchRef.current = null;
  }

  sidebarTouchHandlersRef.current = {
    move: moveSidebarTouchDrag,
    end: finishSidebarTouchDrag
  };

  useEffect(() => {
    const handleDocumentTouchMove = (event) => sidebarTouchHandlersRef.current.move?.(event);
    const handleDocumentTouchEnd = () => sidebarTouchHandlersRef.current.end?.();
    document.addEventListener("touchmove", handleDocumentTouchMove, { passive: false });
    document.addEventListener("touchend", handleDocumentTouchEnd);
    document.addEventListener("touchcancel", handleDocumentTouchEnd);
    return () => {
      document.removeEventListener("touchmove", handleDocumentTouchMove);
      document.removeEventListener("touchend", handleDocumentTouchEnd);
      document.removeEventListener("touchcancel", handleDocumentTouchEnd);
      if (sidebarLongPressTimerRef.current) window.clearTimeout(sidebarLongPressTimerRef.current);
    };
  }, []);

  function navigateSidebarItem(item) {
    navigate(item.screen);
  }

  function switchActiveBusiness(businessId) {
    const nextBusiness = businesses.find((business) => business.id === businessId);
    if (!nextBusiness || nextBusiness.id === activeBusiness?.id) return;
    cancelProductForm();
    clearSaleDraft();
    resetCustomerForm();
    clearTeamForm();
    setActiveBusiness(nextBusiness);
    setScreen("sales");
    setShowPurchaseForm(false); setShowSupplierForm(false); setShowExpenseForm(false);
    setShowArchivedProducts(false); setSearch(""); setCustomerSearch("");
    setProductStockFilter("all"); setProductCategoryFilter("all"); setProductTypeFilter("all"); setProductSort("name"); setBulkEditMode(false); setBulkProductRows([]);
    setSalePaymentFormFor(null); setPurchasePaymentFormFor(null);
    setViewingVariantsFor(null); setVariantDraft(blankVariantDraft); setEditingVariantId(null);
    setProductPage(1); setSalesPage(1); setCustomersPage(1); setPurchasesPage(1); setExpensesPage(1);
    setPurchaseModuleTab("purchases");
    setError(""); setNotice("");
  }

  const activeBusinessLogoUrl = getBusinessLogoUrl(activeBusiness?.logo_path);
  const activeTheme = normalizeBusinessTheme(activeBusiness?.theme);
  const safeAppText = readableText(activeTheme.background, activeTheme.text);
  const safeMutedText = readableText(activeTheme.surface, "#69758A");
  const safeDangerText = readableText(activeTheme.surface, "#B42318");
  const safeSuccessText = readableText(activeTheme.surface, "#16824B");
  const safeSidebarText = readableText(activeTheme.sidebarBackground, activeTheme.sidebarText);
  const safeAccent = readableAccent(activeTheme.primary, activeTheme.surface);
  const appThemeStyle = { "--green": safeAccent, "--brand-teal": safeAccent, "--brand-blue": safeAccent, "--brand-yellow": safeAccent, "--soft-green": `color-mix(in srgb, ${safeAccent} 12%, white)`, "--paper": activeTheme.surface, "--ink": readableText(activeTheme.surface, activeTheme.text), "--muted": safeMutedText, "--danger-text": safeDangerText, "--success-text": safeSuccessText, "--primary-button-text": readableText(safeAccent, "#FFFFFF"), "--sidebar-background": activeTheme.sidebarBackground, "--sidebar-text": safeSidebarText, "--button-hover": activeTheme.buttonHover, "--button-hover-text": readableText(activeTheme.buttonHover, activeTheme.buttonHoverText), "--app-background": activeTheme.background, background: activeTheme.background, color: safeAppText };
  const contextualHelpEnabled = activeBusiness?.settings?.contextual_help_enabled !== false;
  const contextualHelpKey = screen === "products" && showProductForm ? "productForm"
    : screen === "sales" && salePaymentFormFor ? "salePaymentForm"
    : screen === "sales" && showSaleForm ? "saleForm"
    : screen === "customers" && showCustomerForm ? "customerForm"
    : screen === "purchases" && purchasePaymentFormFor ? "purchasePaymentForm"
    : screen === "suppliers" ? (showSupplierForm ? "supplierForm" : "suppliers")
    : screen === "purchases" && effectivePurchaseTab === "suppliers" ? (showSupplierForm ? "supplierForm" : "suppliers")
    : screen === "purchases" && effectivePurchaseTab === "expenses" ? (showExpenseForm ? "expenseForm" : "expenses")
    : screen === "purchases" && showPurchaseForm ? "purchaseForm"
    : screen === "team" && teamFormOpen ? "teamForm"
    : screen;
  const contextualHelp = contextualHelpContent[contextualHelpKey] || contextualHelpContent.home;

  const requestedPublicCatalog = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("catalog") : null;
  if (requestedPublicCatalog && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestedPublicCatalog)) {
    return <PublicCatalog businessId={requestedPublicCatalog} />;
  }

  if (!authReady) return <div className="loading-screen"><div className="brand-mark"><img className="brand-symbol" src="/symbol-treseiscinco.svg" alt="treseiscinco" /></div><p>Preparando tu espacio…</p></div>;

  if (!session || mode === "update-password") return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <a className="brand" href="/"><img className="brand-logo-full" src="/brand-treseiscinco.svg" alt="treseiscinco" /></a>
        <div className="auth-pitch"><p className="eyebrow">TU NEGOCIO, CON CLARIDAD</p><h1>Menos enredos.<br /><em>Más negocio.</em></h1><p>Productos, ventas, costos y clientes en un solo lugar, fácil de entender y usar.</p></div>
        <span className="panel-footnote">Un espacio independiente para cada negocio.</span>
      </section>
      <section className="auth-form-panel"><div className="auth-form-wrap">
        <p className="eyebrow">{mode === "signup" ? "EMPIEZA GRATIS" : mode === "forgot" || mode === "update-password" ? "RECUPERA TU ACCESO" : "QUÉ BUENO VERTE"}</p>
        <h2>{mode === "signup" ? "Crea tu cuenta" : mode === "forgot" ? "Recupera tu acceso" : mode === "update-password" ? "Crea una nueva contraseña" : "Inicia sesión"}</h2>
        <p className="form-intro">{mode === "signup" ? "Primero creamos tu acceso. Después podrás registrar tu negocio." : mode === "forgot" ? "Escribe el correo de tu cuenta y te enviaremos un enlace para recuperar el acceso." : mode === "update-password" ? "Elige una contraseña nueva para volver a entrar a tu cuenta." : "Entra para continuar con tu negocio."}</p>
        <form onSubmit={submitAuth} className="form-stack">
          {mode === "signup" && <label><span className="field-label-heading">Tu nombre<FieldHelp text="Escribe el nombre que se mostrará en tu cuenta." /></span><input autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="¿Cómo te llamas?" required maxLength={120} /></label>}
          {mode !== "update-password" && <label><span className="field-label-heading">Correo electrónico<FieldHelp text="Usa un correo al que tengas acceso; servirá para iniciar sesión y recibir comunicaciones de la cuenta." /></span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required /></label>}
          {mode !== "forgot" && <label><span className="field-label-heading">{mode === "update-password" ? "Nueva contraseña" : "Contraseña"}<FieldHelp text="Usa una contraseña de al menos 6 caracteres." /></span><input type="password" autoComplete={mode === "signup" || mode === "update-password" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} required /></label>}
          {mode === "login" && <p className="forgot-password-row"><button type="button" className="text-button" onClick={() => { setMode("forgot"); setPassword(""); setError(""); setNotice(""); }}>Olvidé mi contraseña</button></p>}
          
        {error && <p className="message error" role="alert">{error}</p>}{notice && <p className="message success" role="status">{notice}</p>}
          <button className="primary-button" disabled={busy}>{busy ? "Un momento…" : mode === "signup" ? "Crear mi cuenta" : mode === "forgot" ? "Enviar enlace de recuperación" : mode === "update-password" ? "Guardar nueva contraseña" : "Entrar"}</button>
        </form>
        {mode !== "update-password" && <p className="switch-mode">{mode === "forgot" ? "¿Recordaste tu contraseña?" : mode === "signup" ? "¿Ya tienes cuenta?" : "¿Primera vez por aquí?"} <button type="button" className="text-button" onClick={() => { setMode(mode === "signup" || mode === "forgot" ? "login" : "signup"); setPassword(""); setError(""); setNotice(""); }}>{mode === "signup" || mode === "forgot" ? "Inicia sesión" : "Crear cuenta"}</button></p>}
        <p className="privacy-note">Tu información pertenece a tu negocio. No uses datos reales de clientes hasta completar las pruebas de seguridad.</p>
      </div></section>
    </main>
  );

  if (!businesses.length || screen === "setup") return (
    <main className="setup-shell"><header className="topbar"><a className="brand" href="/"><img className="brand-logo-full" src="/brand-treseiscinco.svg" alt="treseiscinco" /></a><button className="text-button" onClick={signOut}>Cerrar sesión</button></header>
      <section className="setup-card"><p className="eyebrow">PASO 1 DE 1</p><h1>¿Cómo se llama<br /><em>tu negocio?</em></h1><p>Este nombre identifica tu espacio. Más adelante podrás configurar tu logo, colores y equipo.</p>
        <form className="form-stack" onSubmit={createBusiness}><label><span className="field-label-heading">Nombre del negocio<FieldHelp text="Este nombre identifica el espacio de tu negocio dentro de treseiscinco." /></span><input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ej. Mi tienda" maxLength={120} required autoFocus /></label>
          {error && <p className="message error" role="alert">{error}</p>}{notice && <p className="message success" role="status">{notice}</p>}
          <button className="primary-button" disabled={busy}>{busy ? "Creando espacio…" : "Crear mi espacio"}</button>
        </form><p className="privacy-note">Cada negocio tiene sus propios datos y permisos.</p>
      </section>
    </main>
  );

  return (
    <main className="app-shell" style={appThemeStyle}>
      <aside className="sidebar">
        <a className="brand" href="/"><img className="brand-logo-full" src="/brand-treseiscinco.svg" alt="treseiscinco" /></a>
        <div className="business-logo-stage" aria-label={"Identidad de " + (activeBusiness?.name || "tu negocio")}>
          <span className={"business-avatar" + (activeBusinessLogoUrl ? " has-business-logo" : "")}><span className="business-avatar-initial">{(activeBusiness?.name || "T").slice(0,1).toUpperCase()}</span>{activeBusinessLogoUrl && <img src={activeBusinessLogoUrl} alt={"Logo de " + (activeBusiness?.name || "negocio")} onError={(event) => { event.currentTarget.remove(); event.currentTarget.parentElement?.classList.remove("has-business-logo"); }} />}</span>
        </div>
        <div className={"business-switcher" + (businesses.length > 1 ? " business-switcher-multiple" : "")}>
          {businesses.length > 1
            ? <><select aria-label="Cambiar de negocio" value={activeBusiness?.id || ""} onChange={(e) => switchActiveBusiness(e.target.value)}>{businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select><span className="switch-caret">⌄</span></>
            : <span className="business-name">{activeBusiness?.name}</span>}
        </div>

        <nav className={"nav-list" + (sidebarEditing ? " nav-list-editing" : "") + (sidebarTouchDragging ? " nav-list-touch-dragging" : "")} aria-label="Navegación del negocio">
          {sidebarLayout.filter((group) => sidebarEditing || group.items.some((item) => item.id === "home" || item.id === "settings" ? (item.id === "settings" ? isBusinessOwner : true) : item.id === "suppliers" ? (canPermission("suppliers_view") || canViewPurchases) : canAccessScreen(item.screen))).map((group) => <section key={group.id} data-sidebar-group-id={group.id} className={"sidebar-nav-group" + (!group.title.trim() && !sidebarEditing ? " sidebar-nav-group-untitled" : "")}
            onDragOver={(event) => { if (isBusinessOwner) event.preventDefault(); }}
            onDrop={(event) => { if (!isBusinessOwner) return; event.preventDefault(); confirmSidebarDrop(draggedSidebarItem, group.id); }}>
            {!group.items.some((navItem) => navItem.id === "home") && <div className="sidebar-group-heading">
              {sidebarEditing ? <><span className="sidebar-drag-handle" title="Arrastra con el ratón o mantén presionado para mover el grupo" draggable={isBusinessOwner && !(typeof window !== "undefined" && "ontouchstart" in window)} onTouchStart={(event) => startSidebarTouchDrag(event, { type: "group", id: group.id })} onDragStart={(event) => startSidebarMouseDrag(event, { type: "group", id: group.id })}>⠿</span><input aria-label="Nombre del grupo" value={group.title} maxLength={60} onChange={(event) => updateSidebarDraft((current) => current.map((candidate) => candidate.id === group.id ? { ...candidate, title: event.target.value } : candidate))} /></> : <>{isBusinessOwner && <span className="sidebar-reorder-grip" title="Arrastra con el ratón o mantén presionado para mover el grupo" draggable={!(typeof window !== "undefined" && "ontouchstart" in window)} onTouchStart={(event) => startSidebarTouchDrag(event, { type: "group", id: group.id })} onDragStart={(event) => startSidebarMouseDrag(event, { type: "group", id: group.id })}>⠿</span>}<p className="nav-label">{group.title}</p></>}
              {sidebarEditing && <button type="button" className="sidebar-mini-action danger-text" title="Eliminar grupo vacío" disabled={group.items.length > 0 || sidebarLayout.length < 2} onClick={() => updateSidebarDraft((current) => current.filter((candidate) => candidate.id !== group.id))}>×</button>}
            </div>}
            {group.items.filter((item) => item.id === "home" || item.id === "settings" ? (item.id === "settings" ? isBusinessOwner : true) : item.id === "suppliers" ? (canPermission("suppliers_view") || canViewPurchases) : canAccessScreen(item.screen)).map((item) => (
              <div key={item.id} data-sidebar-item-id={item.id} className="sidebar-nav-row"
                onDragOver={(event) => { if (isBusinessOwner) event.preventDefault(); }}
                onDrop={(event) => { if (!isBusinessOwner) return; event.preventDefault(); event.stopPropagation(); if (draggedSidebarItem?.id !== item.id) confirmSidebarDrop(draggedSidebarItem, group.id, item.id); }}>
                {sidebarEditing ? <>
                  <span className="sidebar-drag-handle" title="Arrastra con el ratón o mantén presionado para mover" draggable={isBusinessOwner && !(typeof window !== "undefined" && "ontouchstart" in window)} onTouchStart={(event) => startSidebarTouchDrag(event, { type: "item", id: item.id, groupId: group.id })} onDragStart={(event) => startSidebarMouseDrag(event, { type: "item", id: item.id, groupId: group.id })}>⠿</span>
                  <input className="sidebar-icon-edit" aria-label={"Icono de " + item.label} value={item.icon} maxLength={4} onChange={(event) => updateSidebarDraft((current) => current.map((candidate) => ({ ...candidate, items: candidate.items.map((entry) => entry.id === item.id ? { ...entry, icon: event.target.value } : entry) })))} />
                  <input className="sidebar-label-edit" aria-label={"Nombre de " + item.label} value={item.label} maxLength={60} onChange={(event) => updateSidebarDraft((current) => current.map((candidate) => ({ ...candidate, items: candidate.items.map((entry) => entry.id === item.id ? { ...entry, label: event.target.value } : entry) })))} />
                </> : <>{isBusinessOwner && <span className="sidebar-reorder-grip" title="Arrastra con el ratón o mantén presionado para mover" draggable={!(typeof window !== "undefined" && "ontouchstart" in window)} onTouchStart={(event) => startSidebarTouchDrag(event, { type: "item", id: item.id, groupId: group.id })} onDragStart={(event) => startSidebarMouseDrag(event, { type: "item", id: item.id, groupId: group.id })}>⠿</span>}<button className={(screen === item.screen && (item.id !== "suppliers" || purchaseModuleTab === "suppliers") ? "nav-item active" : "nav-item")} onClick={() => { if (sidebarSuppressClickRef.current) return; navigateSidebarItem(item); }}><span className="nav-icon"><AppIcon name={item.id} size={19} /></span>{item.label}</button></>}
              </div>
            ))}
          </section>)}
        </nav>
        <div className="sidebar-bottom"><button className="logout-button" onClick={signOut} disabled={busy}>Cerrar sesión</button></div>
      </aside>
      <section className={"main-content" + (screen === "home" ? " main-content-home" : "")}>
        <header className="main-header"><button type="button" className="mobile-nav-toggle" aria-expanded={mobileNavOpen} aria-controls="mobile-module-navigation" onClick={() => setMobileNavOpen((open) => !open)}><span aria-hidden="true">{mobileNavOpen ? "×" : "☷"}</span>{mobileNavOpen ? "Cerrar módulos" : "Módulos"}</button><div>{screen !== "home" && <p className="eyebrow">{screen === "products" ? "CATÁLOGO Y EXISTENCIAS" : screen === "sales" ? "ACTIVIDAD COMERCIAL" : screen === "stats" ? "ESTADÍSTICAS Y BALANCE" : screen === "quotes" ? "PROPUESTAS COMERCIALES" : screen === "customers" ? "RELACIONES CON CLIENTES" : screen === "profitability" ? "RENTABILIDAD" : screen === "purchases" ? "COMPRAS Y GASTOS" : screen === "suppliers" ? "PROVEEDORES" : screen === "catalog" ? "CATÁLOGO" : screen === "team" ? "PERSONAL" : screen === "settings" ? "CONFIGURACIÓN" : "TU ESPACIO DE TRABAJO"}</p>}<h1>{screen === "products" ? "Productos" : screen === "settings" ? "Configuración" : screen === "suppliers" ? "Proveedores" : screen === "home" ? "Inicio" : areas.find((a) => a.screen === screen)?.title || "Tu negocio"}</h1></div>{businesses.length > 1 && <label className="mobile-business-switcher"><span>Negocio activo</span><select aria-label="Cambiar de negocio" value={activeBusiness?.id || ""} onChange={(event) => switchActiveBusiness(event.target.value)}>{businesses.map((business) => <option value={business.id} key={business.id}>{business.name} · {business.role === "owner" ? "Propietario" : business.role === "admin" ? "Administrador" : "Empleado"}</option>)}</select></label>}<span className="role-pill">{activeBusiness?.role === "owner" ? "Propietario" : activeBusiness?.role === "admin" ? "Administrador" : "Empleado"}</span></header>
        {mobileNavOpen && <nav id="mobile-module-navigation" className="mobile-module-navigation" aria-label="Módulos disponibles"><div className="mobile-module-menu-heading"><strong>Elegir módulo</strong><button type="button" className="mobile-module-menu-close" onClick={() => setMobileNavOpen(false)} aria-label="Cerrar menú de módulos">×</button></div><button type="button" className={"mobile-module-card"+(screen==="home"?" active":"")} onClick={()=>navigate("home")}><AppIcon name="home" size={23}/><span><strong>Inicio</strong><small>Panorama de tu negocio</small></span><b>›</b></button><button type="button" className={"mobile-module-card"+(screen==="sales"?" active":"")} onClick={()=>navigate("sales")}><AppIcon name="sales" size={23}/><span><strong>Movimientos diarios</strong><small>Ventas y actividad de hoy</small></span><b>›</b></button>{visibleAreas.filter((area)=>area.screen!=="sales").map((area)=><button type="button" key={area.screen} className={"mobile-module-card"+(screen===area.screen?" active":"")} onClick={()=>navigate(area.screen)}><AppIcon name={area.screen} size={23}/><span><strong>{area.title}</strong><small>{area.description}</small></span><b>›</b></button>)}{canViewSuppliers && <button type="button" className={"mobile-module-card"+(screen==="suppliers"?" active":"")} onClick={()=>navigate("suppliers")}><AppIcon name="suppliers" size={23}/><span><strong>Proveedores</strong><small>Contactos de abastecimiento</small></span><b>›</b></button>}{isBusinessOwner && <button type="button" className={"mobile-module-card"+(screen==="settings"?" active":"")} onClick={()=>navigate("settings")}><AppIcon name="settings" size={23}/><span><strong>Configuración</strong><small>Datos, horarios, pagos y apariencia</small></span><b>›</b></button>}{isPlatformAdmin && <button type="button" className={"mobile-module-card"+(screen==="platform_admin"?" active":"")} onClick={()=>navigate("platform_admin")}><AppIcon name="team" size={23}/><span><strong>Administración de plataforma</strong><small>Pruebas, actividad y pagos</small></span><b>›</b></button>}</nav>}
        {error && <p className="message error" role="alert">{error}</p>}
        {notice && <p className="message success" role="status">{notice}<button className="dismiss-button" onClick={() => setNotice("")}>Cerrar</button></p>}
        {screen === "audit" ? (
<section className="audit-page">
  <div className="products-intro"><div><h2>Historial de cambios</h2><p>Cada fila responde quién hizo qué y cuándo. Los cambios se registran directamente desde la base de datos.</p></div></div>
  <div className="audit-toolbar panel">
    <div className="stats-period-buttons" role="group" aria-label="Periodo de auditoría">{[["day","Hoy"],["week","Semana"],["month","Mes"],["year","Año"],["custom","Rango"],["all","Todo"]].map(([value,label]) => <button type="button" key={value} className={auditPeriod === value ? "stats-period-button active" : "stats-period-button"} aria-pressed={auditPeriod === value} onClick={() => setAuditPeriod(value)}>{label}</button>)}</div>
    {auditPeriod === "custom" && <div className="stats-custom-dates"><label><span>Desde</span><input type="date" value={auditDateFrom} max={auditDateTo || todayInBogota()} onChange={(e) => setAuditDateFrom(e.target.value)} /></label><label><span>Hasta</span><input type="date" value={auditDateTo} min={auditDateFrom || undefined} max={todayInBogota()} onChange={(e) => setAuditDateTo(e.target.value)} /></label></div>}
    <p>{auditRows.length ? auditRows.length + " cambios cargados" : "Sin cambios para este periodo"}</p>
  </div>
  {auditLoading && !auditRows.length ? <div className="empty-state">Cargando auditorías…</div> : auditRows.length ? <div className="audit-list panel">
    <div className="audit-list-heading"><span>Usuario</span><span>Qué hizo</span><span>Fecha y hora</span></div>
    {auditRows.map((entry) => {
      const roleLabel = ({owner:"Propietario",admin:"Administrador",employee:"Empleado",sin_acceso_actual:"Ya no pertenece al equipo"})[entry.actor_role] || "Usuario";
      const typeLabel = ({sales:"venta",sale_items:"artículo de venta",sale_payments:"abono de venta",products:"producto",product_categories:"categoría",product_variants:"variante",product_images:"foto de producto",customers:"cliente",purchases:"compra",purchase_items:"artículo de compra",purchase_payments:"pago a proveedor",expenses:"gasto",suppliers:"proveedor",quotes:"cotización",quote_items:"artículo de cotización",stock_movements:"movimiento de inventario",business_coupons:"cupón",businesses:"configuración del negocio",business_members:"acceso del equipo"})[entry.entity_type] || String(entry.entity_type || "registro").replaceAll("_"," ");
      const label = entry.details?.label || typeLabel;
      const when = new Date(entry.created_at).toLocaleString("es-CO", {timeZone:"America/Bogota", dateStyle:"medium", timeStyle:"short"});
      const changes = Object.entries(entry.details?.changes || {}).filter(([key]) => key !== "registro");
      const formatAuditValue = (value, key) => {
        if (value === null || value === undefined || value === "") return "vacío";
        if (typeof value === "boolean") return value ? "Sí" : "No";
        if (key === "status") return ({draft:"Borrador",open:"Pendiente",paid:"Pagado",partially_paid:"Abono parcial",cancelled:"Cancelado",canceled:"Cancelado",active:"Activo",inactive:"Inactivo"})[String(value)] || String(value).replaceAll("_"," ");
        if (key.endsWith("_minor") && Number.isFinite(Number(value))) return money(Number(value), currencyCode);
        if (["quantity","stock_on_hand"].includes(key) && Number.isFinite(Number(value))) return Number(value).toLocaleString("es-CO");
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
      };
      return <article className="audit-row" key={entry.id}>
        <div className="audit-actor"><div className="audit-actor-heading"><strong>{entry.actor_name || "Usuario desconocido"}</strong><span className={"audit-role " + (entry.actor_role === "owner" ? "owner" : entry.actor_role === "employee" ? "employee" : "")}>{roleLabel}</span></div><span>{entry.actor_email || "Correo no disponible"}</span></div>
        <div className="audit-action"><strong>{entry.action} {typeLabel}: {label}</strong>{entry.action === "Actualizó" && changes.length > 0 && <details><summary>Ver {changes.length} {changes.length === 1 ? "cambio" : "cambios"}</summary><ul>{changes.map(([key, values]) => <li key={key}><span>{({status:"Estado",total_minor:"Total",amount_paid_minor:"Abonado",sale_price_minor:"Precio de venta",cost_price_minor:"Costo",stock_on_hand:"Existencias",name:"Nombre",description:"Descripción",quantity:"Cantidad",notes:"Notas",is_sellable:"Se puede vender",archived_at:"Archivado"})[key] || key.replaceAll("_"," ")}</span>: <code>{formatAuditValue(values?.antes, key)} → {formatAuditValue(values?.despues, key)}</code></li>)}</ul></details>}</div>
        <time dateTime={entry.created_at}>{when}</time>
      </article>;
    })}
    {auditHasMore && <div className="audit-load-more"><button type="button" className="secondary-button" disabled={auditLoading} onClick={() => loadAuditEntries(false)}>{auditLoading ? "Cargando…" : "Cargar cambios anteriores"}</button></div>}
  </div> : <div className="empty-state"><span className="empty-icon">◷</span><h3>No hay cambios registrados en este periodo</h3><p>Los cambios hechos desde que se activó la auditoría aparecerán aquí con usuario, rol y hora.</p></div>}
</section>
) : screen === "sales" ? (
<section className="sales-page">
<div className="products-intro"><div><h2>Movimientos de ventas</h2><p>Por defecto ves las ventas de hoy. Cambia rápidamente a otra fecha o consulta un rango.</p></div>{canManageSales && <button type="button" className="primary-button compact-button" onClick={() => { if(showSaleForm) clearSaleDraft(); else {setShowSaleForm(true);setError("");setNotice("");} }}>{showSaleForm?"Cancelar venta":"+ Nueva venta"}</button>}</div>
<div className="sales-date-toolbar panel"><div className="stats-period-buttons" role="group" aria-label="Periodo de ventas">{[["day","Hoy"],["date","Fecha"],["week","Semana"],["month","Mes"],["year","Año"],["custom","Rango"],["all","Todo"]].map(([value,label]) => <button type="button" key={value} className={salesPeriod === value ? "stats-period-button active" : "stats-period-button"} aria-pressed={salesPeriod === value} onClick={() => {if(value==="date"&&salesPeriod!=="date")setSalesSelectedDate(todayInBogota());setSalesPeriod(value);setSalesPage(1);}}>{label}</button>)}</div>{salesPeriod === "date" && <div className="sales-single-date"><button type="button" className="secondary-button" aria-label="Día anterior" onClick={() => {const d=new Date(salesSelectedDate+"T12:00:00Z");d.setUTCDate(d.getUTCDate()-1);setSalesSelectedDate(d.toISOString().slice(0,10));setSalesPage(1);}}>← Anterior</button><label><span>Ver movimientos del día</span><input type="date" value={salesSelectedDate} max={todayInBogota()} onChange={(e)=>{setSalesSelectedDate(e.target.value);setSalesPage(1);}} /></label><button type="button" className="secondary-button" aria-label="Día siguiente" disabled={salesSelectedDate>=todayInBogota()} onClick={() => {const d=new Date(salesSelectedDate+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+1);setSalesSelectedDate(d.toISOString().slice(0,10));setSalesPage(1);}}>Siguiente →</button></div>}{salesPeriod === "custom" && <div className="stats-custom-dates"><label><span>Desde</span><input type="date" value={salesDateFrom} max={salesDateTo || todayInBogota()} onChange={(e) => {setSalesDateFrom(e.target.value);setSalesPage(1);}} /></label><label><span>Hasta</span><input type="date" value={salesDateTo} min={salesDateFrom || undefined} max={todayInBogota()} onChange={(e) => {setSalesDateTo(e.target.value);setSalesPage(1);}} /></label></div>}<p>{salesPeriod === "day" ? "Ventas de hoy" : salesPeriod === "date" ? "Movimientos del " + new Date(salesSelectedDate+"T12:00:00Z").toLocaleDateString("es-CO",{timeZone:"America/Bogota",dateStyle:"long"}) : salesPeriod === "all" ? "Todo el historial" : salesPeriod === "custom" ? "Del " + salesDateFrom + " al " + salesDateTo : salesPeriod === "week" ? "Desde el lunes de esta semana" : salesPeriod === "month" ? "Desde el primer día del mes" : "Desde el primer día del año"}</p></div>
{canManageSales && showSaleForm && <form className="sale-form panel" onSubmit={createSale}>
<h3>Nueva venta</h3>
<div className="sale-builder">
<label><span className="field-label-heading">Cliente<FieldHelp enabled={contextualHelpEnabled} text="Relaciona la venta con un cliente registrado. Déjalo vacío si es una venta sin cliente." /></span><select value={saleCustomerId} onChange={e=>{if(e.target.value==="__create_sale_customer__"){setShowQuickCustomerForm(true);setError("");return;}setSaleCustomerId(e.target.value);}}><option value="">Venta sin cliente</option>{customers.map(customer=><option key={customer.id} value={customer.id}>{customer.full_name}{customer.company_name&&customer.company_name!==customer.full_name?" · "+customer.company_name:""}</option>)}{canManageCustomers&&<option value="__create_sale_customer__">＋ Nuevo cliente…</option>}</select>{canManageCustomers && <button type="button" className="text-button" onClick={()=>{setShowQuickCustomerForm(v=>!v);setError("");}}> {showQuickCustomerForm?"Cancelar":"＋ Crear cliente"} </button>}</label>
<label><span className="field-label-heading">Producto<FieldHelp enabled={contextualHelpEnabled} text="Elige el producto que vas a vender. Se usará su precio actual y se comprobarán las existencias disponibles." /></span><select value={saleProductChoice} onChange={e=>setSaleProductChoice(e.target.value)}><option value="">Elige un producto…</option>{saleProducts.map(product=><option key={product.id} value={product.id}>{product.name} · {money(product.sale_price_minor,currencyCode)}{product.track_inventory?" · Stock "+Number(product.stock_on_hand).toLocaleString("es-CO"):""}</option>)}</select>{canManageProducts && <button type="button" className="text-button" onClick={() => setShowQuickSaleProductForm((open) => !open)}>{showQuickSaleProductForm ? "Cancelar nuevo artículo" : "＋ Nuevo artículo"}</button>}</label>
<label><span className="field-label-heading">Cantidad<FieldHelp enabled={contextualHelpEnabled} text="Indica cuántas unidades vas a vender." /></span><input type="number" min="0.001" step="0.001" value={saleQuantity} onChange={e=>setSaleQuantity(e.target.value)}/></label><button type="button" className="secondary-button sale-add-button" onClick={addSaleLine}>+ Agregar</button>
</div>
{showQuickSaleProductForm && canManageProducts && <div className="panel quick-customer-form quick-sale-product-form" onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }}>
  <strong>Nuevo artículo</strong><p className="inline-create-hint">Se creará y quedará seleccionado en esta venta. El registro completo lo puedes ampliar después desde Productos.</p>
  <div className="sale-builder quick-product-fields">
    <label><span className="field-label-heading">Nombre *</span><input value={quickSaleProductName} onChange={(event) => setQuickSaleProductName(event.target.value)} maxLength={160} /></label>
    <label><span className="field-label-heading">Categoría</span><select value={quickSaleProductCategoryId} onChange={(event) => { if (event.target.value === "__create_sale_category__") { setShowQuickSaleCategoryForm(true); return; } setQuickSaleProductCategoryId(event.target.value); }}><option value="">Sin categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}<option value="__create_sale_category__">＋ Nueva categoría…</option></select>{showQuickSaleCategoryForm && <div className="inline-create-panel" onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }}><label><span>Nombre de la nueva categoría</span><input value={quickSaleCategoryName} onChange={(event) => setQuickSaleCategoryName(event.target.value)} maxLength={80} placeholder="Ej. Accesorios, insumos…" /></label><div className="inline-create-actions"><button type="button" className="primary-button" disabled={quickSaleCategorySaving || !quickSaleCategoryName.trim()} onClick={addQuickSaleCategory}>{quickSaleCategorySaving ? "Guardando…" : "Crear y seleccionar"}</button><button type="button" className="text-button" onClick={() => { setShowQuickSaleCategoryForm(false); setQuickSaleCategoryName(""); }}>Cancelar</button></div></div>}</label>
    <label><span className="field-label-heading">Tipo</span><select value={quickSaleProductType} onChange={(event) => setQuickSaleProductType(event.target.value)}><option value="physical">Producto físico</option><option value="service">Servicio</option><option value="digital">Digital</option></select></label>
    <label><span className="field-label-heading">Precio de venta *</span><input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={quickSaleProductPrice} onChange={(event) => setQuickSaleProductPrice(event.target.value)} /></label>
    <label><span className="field-label-heading">Costo por unidad *</span><input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={quickSaleProductCost} onChange={(event) => setQuickSaleProductCost(event.target.value)} /></label>
    {quickSaleProductType === "physical" && <label><span className="field-label-heading">Existencias iniciales</span><input type="number" min="0" step="0.001" value={quickSaleProductStock} onChange={(event) => setQuickSaleProductStock(event.target.value)} /></label>}
    <button type="button" className="primary-button" disabled={quickSaleProductSaving || !quickSaleProductName.trim() || quickSaleProductPrice === "" || quickSaleProductCost === ""} onClick={addQuickSaleProduct}>{quickSaleProductSaving ? "Guardando…" : "Crear y seleccionar"}</button>
  </div>
</div>}
{showQuickCustomerForm && canManageCustomers && <div className="panel quick-customer-form" onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }}>
  <strong>Nuevo cliente</strong><p className="inline-create-hint">Se agregará a la venta actual sin cerrar este formulario.</p>
  <div className="sale-builder">
    <label><span className="field-label-heading">Nombre o empresa *</span><input value={quickCustomerName} onChange={e=>setQuickCustomerName(e.target.value)} required maxLength={200} autoComplete="name" /></label>
    <label><span className="field-label-heading">Teléfono</span><input value={quickCustomerPhone} onChange={e=>setQuickCustomerPhone(e.target.value)} maxLength={40} autoComplete="tel" /></label>
    <label><span className="field-label-heading">Nombre o razón social</span><input value={quickCustomerCompany} onChange={(e) => setQuickCustomerCompany(e.target.value)} maxLength={200} /></label>
    <label><span className="field-label-heading">Correo</span><input type="email" value={quickCustomerEmail} onChange={e=>setQuickCustomerEmail(e.target.value)} maxLength={254} autoComplete="email" /></label>
    <label><span className="field-label-heading">WhatsApp</span><input type="tel" value={quickCustomerWhatsapp} onChange={(e) => setQuickCustomerWhatsapp(e.target.value)} maxLength={40} /></label>
    <label><span className="field-label-heading">Tipo de documento</span><select value={quickCustomerDocumentType} onChange={(e) => setQuickCustomerDocumentType(e.target.value)}><option value="">Sin especificar</option><option value="CC">Cédula de ciudadanía</option><option value="NIT">NIT</option><option value="CE">Cédula de extranjería</option><option value="TI">Tarjeta de identidad</option><option value="PP">Pasaporte</option><option value="OTHER">Otro</option></select></label>
    <label><span className="field-label-heading">Número de documento</span><input value={quickCustomerDocumentNumber} onChange={(e) => setQuickCustomerDocumentNumber(e.target.value)} maxLength={80} /></label>
    <label><span className="field-label-heading">Ciudad</span><input value={quickCustomerCity} onChange={(e) => setQuickCustomerCity(e.target.value)} maxLength={100} /></label>
    <label><span className="field-label-heading">Dirección</span><input value={quickCustomerAddress} onChange={(e) => setQuickCustomerAddress(e.target.value)} maxLength={300} /></label>
    <button type="button" className="primary-button" disabled={quickCustomerSaving || !quickCustomerName.trim()} onClick={addQuickCustomer}>{quickCustomerSaving?"Guardando…":"Guardar y seleccionar"}</button>
  </div>
</div>}
{!saleProducts.length&&<p className="helper-text">No hay productos activos disponibles para vender. Registra o activa un producto primero.</p>}
{saleItems.length>0&&<div className="sale-cart"><div className="sale-cart-heading"><strong>Artículos de la venta</strong><span>{saleItems.length} productos</span></div>
{saleItems.map(item=><div className="sale-cart-row" key={item.product_id}><div className="sale-cart-name"><strong>{item.name}</strong><span>{money(item.unit_price_minor,currencyCode)} por {item.unit_name}</span></div><label><span className="field-label-heading">Cantidad<FieldHelp enabled={contextualHelpEnabled} text="Ajusta las unidades de esta línea de venta; el total se recalcula automáticamente." /></span><input type="number" min="0.001" step="0.001" value={item.quantity} onChange={e=>setSaleItems(current=>current.map(line=>line.product_id===item.product_id?{...line,quantity:e.target.value}:line))}/></label><strong className="sale-line-total">{money(Math.round(item.unit_price_minor*Number(item.quantity||0)),currencyCode)}</strong><button type="button" className="text-button danger-text" onClick={()=>setSaleItems(current=>current.filter(line=>line.product_id!==item.product_id))}>Quitar</button></div>)}
<div className="sale-total-line"><span>Total</span><strong>{money(saleItems.reduce((sum,item)=>sum+Math.round(item.unit_price_minor*Number(item.quantity||0)),0),currencyCode)}</strong></div></div>}
<div className="sale-bottom-fields"><label><span className="field-label-heading">Abono recibido<FieldHelp enabled={contextualHelpEnabled} text="Dinero que el cliente entrega ahora como parte de esta venta. Si es menor que el total, quedará un saldo pendiente." /></span><input type="number" min="0" step={currencyDigits(currencyCode)===0?"1":"0.01"} value={salePayment} onChange={e=>setSalePayment(e.target.value)} placeholder="0"/></label><label><span className="field-label-heading">Forma de pago inicial<FieldHelp enabled={contextualHelpEnabled} text="Indica cómo recibes el primer pago de esta venta: efectivo, transferencia, tarjeta u otro medio." /></span><select value={saleInitialPaymentMethod} onChange={e=>setSaleInitialPaymentMethod(e.target.value)}><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option><option>Otro</option></select></label><label><span className="field-label-heading">Nota<FieldHelp enabled={contextualHelpEnabled} text="Anota un detalle breve para recordar una entrega, un acuerdo o una referencia de la venta." /></span><input value={saleNotes} onChange={e=>setSaleNotes(e.target.value)} maxLength={1000} placeholder="Ej. entrega el viernes"/></label></div>
<p className="helper-text">Se usará el precio actual. La venta y la salida de inventario se guardan juntas; si no hay unidades suficientes, no se guardará.</p>
{!saleItems.length && <p className="helper-text sale-empty-cart-hint">Todavía no hay productos agregados. Elige un producto y pulsa «+ Agregar». Si intentas guardar antes, te indicaremos qué falta.</p>}
<div className="form-actions"><button type="button" className="secondary-button" onClick={clearSaleDraft}>Cancelar</button><button type="submit" className="primary-button" disabled={saleSaving}>{saleSaving?"Guardando…":"Guardar venta"}</button></div>
</form>}
<div className="sales-toolbar"><span>{salesCount} {salesCount===1?"venta":"ventas"} · Página {salesPage} de {Math.max(1,Math.ceil(salesCount/salesPageSize))}</span><label className="sales-page-size"><span className="field-label-heading">Mostrar<FieldHelp enabled={contextualHelpEnabled} text="Define cuántas ventas aparecen en cada página de la lista." /></span><select value={salesPageSize} onChange={(e)=>{setSalesPageSize(Number(e.target.value));setSalesPage(1);}}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label></div>
{salesLoading?<div className="empty-state">Cargando ventas…</div>:salesData.length?<div className="sales-list">{salesData.map(sale=><article className="sale-record panel mobile-detail-trigger" key={sale.id} onClick={(event) => { if (!window.matchMedia("(max-width: 640px)").matches || event.target.closest("button,a,input,select,textarea")) return; setSelectedRecordDetail({type:"Venta",title:sale.sale_number || "Venta",fields:[{label:"Cliente",value:sale.customer_name},{label:"Fecha",value:new Date(sale.sold_at||sale.created_at).toLocaleString("es-CO",{dateStyle:"medium",timeStyle:"short"})},{label:"Estado",value:saleStatusLabel(sale.status)},{label:"Total",value:money(sale.total_minor,sale.currency_code||currencyCode)},{label:"Abonado",value:money(sale.amount_paid_minor,sale.currency_code||currencyCode)},{label:"Pendiente",value:money(Math.max(0,Number(sale.total_minor)-Number(sale.amount_paid_minor)),sale.currency_code||currencyCode)},{label:"Artículos",value:(sale.items||[]).map(item=>item.item_name+" × "+Number(item.quantity).toLocaleString("es-CO")+" — "+money(item.line_total_minor,sale.currency_code||currencyCode)).join("\n")||"Sin artículos"},{label:"Historial de abonos",value:(sale.payments||[]).map(p=>money(p.amount_minor,sale.currency_code||currencyCode)+" · "+p.payment_method+" · "+new Date(p.paid_at).toLocaleDateString("es-CO",{timeZone:"America/Bogota",dateStyle:"medium"})+(p.notes?" · "+p.notes:"")).join("\n")||"Sin abonos"}],notes:sale.notes}); }}>
<div className="sale-record-top"><div><strong>{sale.sale_number}</strong><span>{new Date(sale.sold_at||sale.created_at).toLocaleString("es-CO",{dateStyle:"medium",timeStyle:"short"})}</span></div><span className={"status-pill "+(sale.status==="paid"?"status-active":sale.status==="canceled"||sale.status==="refunded"?"status-inactive":"status-unpublished")}>{saleStatusLabel(sale.status)}</span></div>
<div className="sale-record-customer">{sale.customer_name}</div>
{sale.items.length>0&&<div className="sale-record-items">{sale.items.map(item=><div key={item.id}><span>{item.item_name} × {Number(item.quantity).toLocaleString("es-CO")}</span><strong>{money(item.line_total_minor,sale.currency_code||currencyCode)}</strong></div>)}</div>}
<div className="sale-record-bottom"><div><span>Total</span><strong>{money(sale.total_minor,sale.currency_code||currencyCode)}</strong></div><div><span>Abonado</span><strong>{money(sale.amount_paid_minor,sale.currency_code||currencyCode)}</strong></div><div><span>Pendiente</span><strong>{money(Math.max(0,Number(sale.total_minor)-Number(sale.amount_paid_minor)),sale.currency_code||currencyCode)}</strong></div></div>
{canPermission("sales_view") && <div className="quote-share-actions sale-document-actions"><button type="button" className="secondary-button action-small" onClick={() => printSaleDocument(sale)}>Factura / PDF / Imprimir</button><button type="button" className="primary-button action-small" onClick={() => shareSaleImage(sale)}>Compartir imagen</button></div>}
<div className="sale-payment-history"><div className="sale-payment-history-heading"><strong>Historial de abonos</strong><span>{(sale.payments||[]).length} {(sale.payments||[]).length===1?"pago":"pagos"}</span></div>
{(sale.payments||[]).length ? <div className="sale-payment-list">{sale.payments.map((paymentRow)=><div className="sale-payment-row" key={paymentRow.id}><div><strong>{money(paymentRow.amount_minor,sale.currency_code||currencyCode)}</strong><span>{paymentRow.payment_method} · {new Date(paymentRow.paid_at).toLocaleDateString("es-CO",{timeZone:"America/Bogota",dateStyle:"medium"})}</span>{paymentRow.notes&&<small>{paymentRow.notes}</small>}</div></div>)}</div> : <p className="sale-payment-empty">No hay abonos registrados.</p>}
{canManageSales && Math.max(0,Number(sale.total_minor)-Number(sale.amount_paid_minor))>0 && !["canceled","refunded","draft"].includes(sale.status) && <button type="button" className="secondary-button sale-register-payment-button" onClick={()=>salePaymentFormFor===sale.id?setSalePaymentFormFor(null):openSalePaymentForm(sale)}>{salePaymentFormFor===sale.id?"Cancelar":"＋ Registrar abono"}</button>}
{canManageSales && salePaymentFormFor===sale.id && <form className="sale-payment-form" onSubmit={(event)=>registerSalePayment(event,sale)}>
<label><span className="field-label-heading">Valor del abono<FieldHelp enabled={contextualHelpEnabled} text="Monto del pago adicional. No puede superar el saldo pendiente de la venta." /></span><input type="number" min="0.01" max={Math.max(0,Number(sale.total_minor)-Number(sale.amount_paid_minor))/(10**currencyDigits(currencyCode))} step={currencyDigits(currencyCode)===0?"1":"0.01"} value={salePaymentAmount} onChange={e=>setSalePaymentAmount(e.target.value)} required/></label>
<label><span className="field-label-heading">Forma de pago<FieldHelp enabled={contextualHelpEnabled} text="Selecciona el medio por el cual se recibió este abono." /></span><select value={salePaymentMethod} onChange={e=>setSalePaymentMethod(e.target.value)}><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option><option>Otro</option></select></label>
<label><span className="field-label-heading">Fecha del abono<FieldHelp enabled={contextualHelpEnabled} text="Fecha en que recibiste realmente el dinero; se guarda en el historial de pagos." /></span><input type="date" max={todayInBogota()} value={salePaymentDate} onChange={e=>setSalePaymentDate(e.target.value)} required/></label>
<label className="sale-payment-notes"><span className="field-label-heading">Nota<FieldHelp enabled={contextualHelpEnabled} text="Referencia corta para identificar el pago, por ejemplo el número de una transferencia." /></span><input value={salePaymentNotes} onChange={e=>setSalePaymentNotes(e.target.value)} maxLength={1000} placeholder="Referencia o detalle del pago"/></label>
<div className="form-actions"><button type="button" className="secondary-button" onClick={()=>setSalePaymentFormFor(null)}>Cancelar</button><button type="submit" className="primary-button" disabled={salePaymentSaving}>{salePaymentSaving?"Registrando…":"Guardar abono"}</button></div>
</form>}
</div>
{sale.notes&&<p className="sale-record-note">{sale.notes}</p>}</article>)}</div>:<div className="empty-state"><span className="empty-icon">↗</span><h3>No hay ventas en este periodo</h3><p>Prueba otra fecha o elige «Todo» para consultar el historial completo. No mostramos ventas de ejemplo.</p>{canManageSales && <button className="primary-button" onClick={()=>{setShowSaleForm(true);setError("");}}>+ Registrar primera venta</button>}</div>}
{!salesLoading && salesCount > salesPageSize && <div className="pagination-bar sales-pagination"><span className="count-label">Mostrando {(salesPage-1)*salesPageSize+1}–{Math.min(salesPage*salesPageSize,salesCount)} de {salesCount}</span><div className="pagination-controls"><button type="button" className="secondary-button" disabled={salesPage<=1} onClick={()=>setSalesPage((page)=>Math.max(1,page-1))}>Anterior</button><span className="page-label">{salesPage} / {Math.ceil(salesCount/salesPageSize)}</span><button type="button" className="secondary-button" disabled={salesPage>=Math.ceil(salesCount/salesPageSize)} onClick={()=>setSalesPage((page)=>page+1)}>Siguiente</button></div></div>}
</section>
) : screen === "customers" ? (
<section className="customers-page">
<div className="products-intro"><div><h2>Tu cartera de clientes</h2><p>Guarda los datos de las personas y empresas que te compran para encontrarlas y asociarlas fácilmente a una venta.</p></div>{canManageCustomers && <button type="button" className="primary-button compact-button" onClick={()=>{if(showCustomerForm)resetCustomerForm();else{setCustomerDraft(blankCustomer);setEditingCustomerId(null);setShowCustomerForm(true);setError("");setNotice("");}}}>{showCustomerForm?"Cancelar":"+ Nuevo cliente"}</button>}</div>
<div className="customer-toolbar"><label className="search-box"><span className="field-label-heading"><span>⌕</span><FieldHelp enabled={contextualHelpEnabled} text="Busca clientes por nombre, empresa, documento o datos de contacto." /></span><input value={customerSearch} onChange={e=>{setCustomerSearch(e.target.value);setCustomersPage(1);}} placeholder="Buscar por nombre, empresa, documento o contacto…"/></label><span className="count-label">{customersCount} {customersCount===1?"cliente":"clientes"}</span></div>
{canManageCustomers && showCustomerForm&&<form className="customer-form panel" onSubmit={addCustomer}>
<div className="customer-form-heading"><div><p className="eyebrow">{editingCustomerId?"DATOS DEL CLIENTE":"NUEVO REGISTRO"}</p><h3>{editingCustomerId?"Editar cliente":"Nuevo cliente"}</h3></div><span className="customer-form-hint">Persona o empresa</span></div>
<div className="customer-form-grid">
<label><span className="field-label-heading">Nombre{!customerDraft.company_name.trim()?" *":""}<FieldHelp enabled={contextualHelpEnabled} text="Nombre de la persona de contacto. Si registras una empresa, puedes usar el campo Empresa." /></span><input autoComplete="given-name" value={customerDraft.first_name} onChange={e=>setCustomerDraft(current=>({...current,first_name:e.target.value}))} maxLength={100} required={!customerDraft.company_name.trim()} placeholder="Nombre"/></label>
<label><span className="field-label-heading">Apellidos<FieldHelp enabled={contextualHelpEnabled} text="Apellidos de la persona de contacto; es opcional." /></span><input autoComplete="family-name" value={customerDraft.last_name} onChange={e=>setCustomerDraft(current=>({...current,last_name:e.target.value}))} maxLength={120} placeholder="Apellidos"/></label>
<label><span className="field-label-heading">Empresa{!customerDraft.first_name.trim()&&!customerDraft.last_name.trim()?" *":""}<FieldHelp enabled={contextualHelpEnabled} text="Escribe el nombre de la empresa si el registro corresponde a un negocio." /></span><input autoComplete="organization" value={customerDraft.company_name} onChange={e=>setCustomerDraft(current=>({...current,company_name:e.target.value}))} maxLength={180} required={!customerDraft.first_name.trim()&&!customerDraft.last_name.trim()} placeholder="Nombre de la empresa"/></label>
<label><span className="field-label-heading">Tipo de documento<FieldHelp enabled={contextualHelpEnabled} text="Elige el tipo de identificación del cliente, si necesitas registrarlo." /></span><select value={customerDraft.document_type} onChange={e=>setCustomerDraft(current=>({...current,document_type:e.target.value}))}><option value="">Selecciona el tipo…</option><option value="CC">Cédula de ciudadanía (CC)</option><option value="CE">Cédula de extranjería (CE)</option><option value="NIT">NIT</option><option value="TI">Tarjeta de identidad (TI)</option><option value="PP">Pasaporte</option><option value="PPT">Permiso por protección temporal (PPT)</option><option value="OTHER">Otro</option></select></label>
<label><span className="field-label-heading">Documento<FieldHelp enabled={contextualHelpEnabled} text="Documento de identidad o identificación tributaria del cliente, si necesitas conservar ese dato." /></span><input value={customerDraft.document_number} onChange={e=>setCustomerDraft(current=>({...current,document_number:e.target.value}))} maxLength={60} autoComplete="off" placeholder="Número de documento"/></label>
<label><span className="field-label-heading">Correo<FieldHelp enabled={contextualHelpEnabled} text="Correo del cliente para contacto o envío de información." /></span><input type="email" autoComplete="email" value={customerDraft.email} onChange={e=>setCustomerDraft(current=>({...current,email:e.target.value}))} maxLength={254} placeholder="cliente@correo.com"/></label>
<label><span className="field-label-heading">Teléfono<FieldHelp enabled={contextualHelpEnabled} text="Teléfono principal de contacto del cliente." /></span><input type="tel" autoComplete="tel" value={customerDraft.phone} onChange={e=>setCustomerDraft(current=>({...current,phone:e.target.value}))} maxLength={60} placeholder="Número de contacto"/></label>
<label><span className="field-label-heading">WhatsApp<FieldHelp enabled={contextualHelpEnabled} text="Número de WhatsApp del cliente, si quieres registrarlo por separado." /></span><input type="tel" value={customerDraft.whatsapp} onChange={e=>setCustomerDraft(current=>({...current,whatsapp:e.target.value}))} maxLength={60} placeholder="Número de WhatsApp"/></label>
<label><span className="field-label-heading">Ciudad<FieldHelp enabled={contextualHelpEnabled} text="Ciudad donde se encuentra el cliente." /></span><input autoComplete="address-level2" value={customerDraft.city} onChange={e=>setCustomerDraft(current=>({...current,city:e.target.value}))} maxLength={100} placeholder="Ciudad"/></label>
<label className="customer-span-two"><span className="field-label-heading">Dirección<FieldHelp enabled={contextualHelpEnabled} text="Dirección para contacto, facturación o entrega, cuando corresponda." /></span><input autoComplete="street-address" value={customerDraft.address} onChange={e=>setCustomerDraft(current=>({...current,address:e.target.value}))} maxLength={300} placeholder="Dirección de residencia o entrega"/></label>
<label className="customer-span-two"><span className="field-label-heading">Notas<FieldHelp enabled={contextualHelpEnabled} text="Guarda detalles útiles para futuras ventas o para atender mejor al cliente." /></span><textarea rows="3" value={customerDraft.notes} onChange={e=>setCustomerDraft(current=>({...current,notes:e.target.value}))} maxLength={1500} placeholder="Información útil para atender a este cliente"/></label>
</div>
<div className="form-actions"><button type="button" className="secondary-button" onClick={resetCustomerForm}>Cancelar</button><button type="submit" className="primary-button" disabled={busy}>{busy?"Guardando…":editingCustomerId?"Guardar cambios":"Guardar cliente"}</button></div>
</form>}
{salesLoading?<div className="empty-state">Cargando clientes…</div>:customers.length?<div className="customer-list panel">
<div className="customer-list-heading"><span>Cliente / empresa</span><span>Contacto</span><span>Documento</span><span>Ciudad</span><span></span></div>
{customers.map(customer=><article className="customer-row" key={customer.id} tabIndex={0} onClick={() => { if (window.matchMedia("(max-width: 640px)").matches) setSelectedCustomer(customer); }} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && window.matchMedia("(max-width: 640px)").matches) { event.preventDefault(); setSelectedCustomer(customer); } }}>
<div className="customer-name-cell"><strong>{customer.full_name||customer.company_name}</strong>{customer.company_name&&customer.company_name!==customer.full_name&&<span>{customer.company_name}</span>}</div>
<div className="customer-contact-cell"><span>{customer.email||"Sin correo"}</span><span>{customer.phone||customer.whatsapp||"Sin teléfono"}</span></div>
<span>{[customer.document_type,customer.document_number].filter(Boolean).join(" ")||"Sin documento"}</span><span>{customer.city||"—"}</span>
{canManageCustomers && <button type="button" className="text-button" onClick={(event)=>{event.stopPropagation();startEditCustomer(customer);setSelectedCustomer(null);}}>Editar</button>}
</article>)}
</div>:<div className="empty-state"><span className="empty-icon">◎</span><h3>No hay clientes registrados</h3><p>Registra a una persona o empresa para asociarla a tus ventas.</p>{canManageCustomers && <button className="primary-button" onClick={()=>{setCustomerDraft(blankCustomer);setEditingCustomerId(null);setShowCustomerForm(true);}}>+ Añadir cliente</button>}</div>}
{!salesLoading && customersCount > customersPageSize && <div className="pagination-bar customer-pagination"><span className="count-label">Mostrando {(customersPage-1)*customersPageSize+1}–{Math.min(customersPage*customersPageSize,customersCount)} de {customersCount}</span><div className="pagination-controls"><button type="button" className="secondary-button" disabled={customersPage<=1} onClick={()=>setCustomersPage((page)=>Math.max(1,page-1))}>Anterior</button><span className="page-label">{customersPage} / {Math.ceil(customersCount/customersPageSize)}</span><button type="button" className="secondary-button" disabled={customersPage>=Math.ceil(customersCount/customersPageSize)} onClick={()=>setCustomersPage((page)=>page+1)}>Siguiente</button></div></div>}
{selectedCustomer && <div className="customer-detail-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setSelectedCustomer(null); }}>
  <section className="customer-detail-card" role="dialog" aria-modal="true" aria-labelledby="customer-detail-title">
    <header className="customer-detail-header"><div><span className="customer-detail-kicker">FICHA DEL CLIENTE</span><h2 id="customer-detail-title">{selectedCustomer.full_name || selectedCustomer.company_name || "Cliente"}</h2>{selectedCustomer.company_name && selectedCustomer.company_name !== selectedCustomer.full_name && <p>{selectedCustomer.company_name}</p>}</div><button type="button" className="customer-detail-close" aria-label="Cerrar ficha" onClick={() => setSelectedCustomer(null)}>×</button></header>
    <div className="customer-detail-content">
      <section className="customer-detail-group"><h3>Contacto</h3>
        <div className="customer-detail-field"><span>Correo electrónico</span>{selectedCustomer.email ? <a href={"mailto:" + selectedCustomer.email}>{selectedCustomer.email}</a> : <strong>Sin registrar</strong>}</div>
        <div className="customer-detail-field"><span>Teléfono</span>{selectedCustomer.phone ? <a href={"tel:" + selectedCustomer.phone}>{selectedCustomer.phone}</a> : <strong>Sin registrar</strong>}</div>
        <div className="customer-detail-field"><span>WhatsApp</span>{selectedCustomer.whatsapp ? <a href={"https://wa.me/" + selectedCustomer.whatsapp.replace(/\D/g, "")} target="_blank" rel="noreferrer">{selectedCustomer.whatsapp}</a> : <strong>Sin registrar</strong>}</div>
      </section>
      <section className="customer-detail-group"><h3>Identificación</h3>
        <div className="customer-detail-field"><span>Tipo de documento</span><strong>{selectedCustomer.document_type || "Sin registrar"}</strong></div>
        <div className="customer-detail-field"><span>Número de documento</span><strong>{selectedCustomer.document_number || "Sin registrar"}</strong></div>
      </section>
      <section className="customer-detail-group"><h3>Ubicación</h3>
        <div className="customer-detail-field"><span>Ciudad</span><strong>{selectedCustomer.city || "Sin registrar"}</strong></div>
        <div className="customer-detail-field"><span>Dirección</span><strong>{selectedCustomer.address || "Sin registrar"}</strong></div>
      </section>
      <section className="customer-detail-group"><h3>Notas</h3><p className="customer-detail-notes">{selectedCustomer.notes || "No hay notas guardadas para este cliente."}</p></section>
      <p className="customer-detail-created">Cliente registrado {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString("es-CO", {year:"numeric",month:"long",day:"numeric"}) : "—"}</p>
    </div>
    <footer className="customer-detail-actions">
      {(selectedCustomer.whatsapp || selectedCustomer.phone) && <a className="customer-detail-whatsapp" href={"https://wa.me/" + (selectedCustomer.whatsapp || selectedCustomer.phone).replace(/\D/g, "")} target="_blank" rel="noreferrer">Abrir WhatsApp</a>}
      {canManageCustomers && <button type="button" className="primary-button" onClick={() => { const customer = selectedCustomer; setSelectedCustomer(null); startEditCustomer(customer); }}>Editar cliente</button>}
      <button type="button" className="secondary-button" onClick={() => setSelectedCustomer(null)}>Cerrar ficha</button>
    </footer>
  </section>
</div>}

</section>
 ) : screen === "team" ? (
          <section className="team-page">
            <div className="products-intro team-intro">
              <div><h2>Personas y accesos</h2><p>Invita a tu equipo y asigna a cada persona únicamente los módulos y acciones que necesita.</p></div>
              <button type="button" className="primary-button compact-button" onClick={() => {
                if (teamFormOpen && !teamEditingUserId) clearTeamForm();
                else { setTeamEmail(""); setTeamPermissionDraft({ ...blankTeamPermissions, ...employeePermissionProfiles.vendedor.permissions }); setTeamPermissionProfile("vendedor"); setTeamEditingUserId(null); setTeamFormOpen(true); setError(""); setNotice(""); }
              }}>{teamFormOpen && !teamEditingUserId ? "Cancelar" : "+ Añadir colaborador"}</button>
            </div>
            <div className="team-info-panel panel">
              <span className="team-info-icon">♙</span>
              <div><strong>¿Cómo agregar a alguien?</strong><p>La persona debe crear primero su cuenta en treseiscinco. Después, escribe aquí el mismo correo y elige sus permisos. Este formulario no envía correos.</p></div>
            </div>
            {teamFormOpen && <form className="team-form panel" onSubmit={saveTeamMember}>
              <div className="team-form-heading"><div><p className="eyebrow">{teamEditingUserId ? "PERMISOS DEL COLABORADOR" : "NUEVO ACCESO"}</p><h3>{teamEditingUserId ? "Editar permisos" : "Añadir colaborador"}</h3><p>Marca solo lo que esa persona necesita para trabajar.</p></div></div>
              {!teamEditingUserId && <label className="team-email-field"><span className="field-label-heading">Perfil inicial<FieldHelp enabled={contextualHelpEnabled} text="Selecciona una función como punto de partida. Puedes ajustar los permisos manualmente antes de guardar." /></span><select value={teamPermissionProfile} onChange={(e) => { const profile = employeePermissionProfiles[e.target.value] || employeePermissionProfiles.personalizado; setTeamPermissionProfile(e.target.value); setTeamPermissionDraft({ ...blankTeamPermissions, ...profile.permissions }); }}><option value="vendedor">Vendedor</option><option value="atencion">Atención al cliente</option><option value="inventario">Inventario</option><option value="compras">Compras y proveedores</option><option value="personalizado">Personalizado</option></select><span className="helper-text">{employeePermissionProfiles[teamPermissionProfile]?.description}</span></label>}
              <label className="team-email-field"><span className="field-label-heading">Correo de la cuenta de treseiscinco *
                <FieldHelp enabled={contextualHelpEnabled} text="Escribe el correo de la cuenta de treseiscinco de la persona que invitarás al equipo." /></span><input type="email" value={teamEmail} onChange={(e) => setTeamEmail(e.target.value)} required disabled={Boolean(teamEditingUserId)} maxLength={254} autoComplete="email" placeholder="persona@correo.com" />
              </label>
              <div className="team-permission-header"><span>Módulo</span><span>Consultar</span><span>Crear y modificar</span></div>
              <div className="team-permission-list">{teamPermissionGroups.map((group) => <div className="team-permission-row" key={group.view}>
                <strong>{group.label}</strong>
                <label className="team-check"><input type="checkbox" checked={Boolean(teamPermissionDraft[group.view])} onChange={(e) => changeTeamPermission(group.view, e.target.checked)} /><span className="field-label-heading">Ver<FieldHelp enabled={contextualHelpEnabled} text="Permite que esta persona consulte información de esta sección sin cambiarla." /></span></label>
                <label className="team-check"><input type="checkbox" checked={Boolean(teamPermissionDraft[group.manage])} onChange={(e) => changeTeamPermission(group.manage, e.target.checked)} /><span className="field-label-heading">Administrar<FieldHelp enabled={contextualHelpEnabled} text="Permite que esta persona cree o modifique registros de esta sección." /></span></label>
              </div>)}</div>
              <p className="helper-text">Para que una tarea funcione, algunos datos relacionados también deben poder leerse. Por ejemplo, ventas necesita consultar productos y clientes; compras puede actualizar existencias y costos.</p>
              <div className="form-actions"><button type="button" className="secondary-button" onClick={clearTeamForm}>Cancelar</button><button type="submit" className="primary-button" disabled={teamSaving}>{teamSaving ? "Guardando…" : teamEditingUserId ? "Guardar permisos" : "Añadir al equipo"}</button></div>
            </form>}
            {teamLoading ? <div className="empty-state">Cargando el equipo…</div>
              : teamRows.length ? <div className="team-member-list">{teamRows.map((member) => {
                const isEmployee = member.role === "employee";
                const memberRequestedPermissions = (member.permissions || {})._modules_requested || member.permissions || {};
                const granted = teamPermissionGroups.filter((group) => Boolean(memberRequestedPermissions[group.view] || memberRequestedPermissions[group.manage])).map((group) => group.label);
                return <article className="team-member panel" key={member.member_id}>
                  <div className="team-member-avatar">{(member.display_name || member.email || "?").slice(0, 1).toLocaleUpperCase("es")}</div>
                  <div className="team-member-main"><div className="team-member-title"><strong>{member.display_name || member.email}</strong><span className={"team-role-pill " + (isEmployee ? "team-role-employee" : "team-role-admin")}>{member.role === "owner" ? "Propietario" : member.role === "admin" ? "Administrador" : "Colaborador"}</span></div>
                    <span className="team-member-email">{member.email}</span>
                    <div className="team-member-details">
                      <div className="team-member-detail"><span>Rol</span><strong>{member.role === "owner" ? "Propietario" : member.role === "admin" ? "Administrador" : "Colaborador"}</strong></div>
                      <div className="team-member-detail"><span>Celular</span>{member.phone ? <a href={"tel:" + String(member.phone).replace(/[^+\d]/g, "")}>{member.phone}</a> : <strong className="muted-value">Sin registrar</strong>}</div>
                      <div className="team-member-detail"><span>Desde</span><strong>{member.joined_at ? new Intl.DateTimeFormat(uiLanguage === "en" ? "en-US" : "es-CO", { year: "numeric", month: "short", day: "numeric" }).format(new Date(member.joined_at)) : "—"}</strong></div>
                    </div>
                    <p className="team-member-permissions"><strong>Accesos:</strong> {isEmployee ? (granted.length ? granted.join(" · ") : "Sin acceso a módulos") : "Acceso completo al negocio"}</p>
                  </div>
                  {isEmployee && <div className="team-member-actions"><button type="button" className="icon-action-button" title="Editar permisos" aria-label={"Editar permisos de " + (member.display_name || member.email)} onClick={() => startEditTeamMember(member)}>✎</button><button type="button" className="text-button danger-text" disabled={teamSaving} onClick={() => removeTeamMember(member)}>Quitar acceso</button></div>}
                </article>;
              })}</div>
              : <div className="empty-state"><span className="empty-icon">♙</span><h3>El equipo empieza aquí</h3><p>Por ahora solo hay miembros que ya pertenecen al negocio. No se ha creado ningún colaborador de ejemplo.</p><button type="button" className="primary-button" onClick={() => { setTeamEmail(""); setTeamPermissionDraft(blankTeamPermissions); setTeamEditingUserId(null); setTeamFormOpen(true); }}>+ Añadir colaborador</button></div>}
          </section>
 ) : screen === "catalog" ? (
          <section className="catalog-admin-page">
            <div className="products-intro catalog-admin-intro">
              <div><p className="eyebrow">VITRINA COMERCIAL</p><h2>Catálogo</h2><p>Publica los productos que quieras mostrar y comparte un único enlace con tus clientes.</p></div>
              <div className="catalog-admin-actions">
                <button type="button" className="secondary-button compact-button" onClick={copyPublicCatalogLink}>Copiar enlace</button>
                <a className="primary-button compact-button catalog-open-link" href={window.location.origin + "/?catalog=" + encodeURIComponent(activeBusiness?.id || "")} target="_blank" rel="noreferrer">Abrir catálogo</a>
              </div>
            </div>
            <div className="catalog-share-panel panel">
              <div><span className="eyebrow">ENLACE PÚBLICO</span><strong>{publishedCatalogCount} {publishedCatalogCount === 1 ? "producto publicado" : "productos publicados"}</strong><p>Solo se muestran productos publicados y activos. El enlace no revela costos ni existencias internas.</p></div>
              <input aria-label="Enlace público del catálogo" readOnly value={window.location.origin + "/?catalog=" + encodeURIComponent(activeBusiness?.id || "")} onFocus={(e) => e.target.select()} />
            </div>
            <div className="catalog-filter-row">
              <input aria-label="Buscar en productos del catálogo" value={catalogSearch} onChange={(e) => { setCatalogSearch(e.target.value); setCatalogPage(1); }} placeholder="Buscar producto o categoría…" />
              <div className="catalog-filter-actions"><span>{filteredCatalogProducts.length} {filteredCatalogProducts.length === 1 ? "producto" : "productos"}</span><label className="catalog-sort-control"><span>Ordenar</span><select value={catalogSort} onChange={(e)=>{setCatalogSort(e.target.value);setCatalogPage(1);}} aria-label="Ordenar productos del catálogo"><option value="name">Nombre A–Z</option><option value="code">Código</option><option value="price">Precio</option></select></label><div className="view-switch" role="group" aria-label="Vista del catálogo"><button type="button" className={catalogViewMode === "rows" ? "view-option active" : "view-option"} onClick={() => setCatalogViewMode("rows")} aria-pressed={catalogViewMode === "rows"}><AppIcon name="list" size={16} /> Filas</button><button type="button" className={catalogViewMode === "cards" ? "view-option active" : "view-option"} onClick={() => setCatalogViewMode("cards")} aria-pressed={catalogViewMode === "cards"}><AppIcon name="grid" size={16} /> Tarjetas</button><button type="button" className={catalogViewMode === "compact" ? "view-option active" : "view-option"} onClick={() => setCatalogViewMode("compact")} aria-pressed={catalogViewMode === "compact"}><AppIcon name="list" size={16} /> Compacta</button></div></div>
            </div>
            {catalogLoading ? <div className="empty-state">Cargando productos reales…</div>
              : filteredCatalogProducts.length ? <div className={catalogViewMode === "cards" ? "catalog-admin-list catalog-admin-cards" : catalogViewMode === "compact" ? "catalog-admin-list catalog-admin-compact" : "catalog-admin-list"}>{catalogPageProducts.map((product) => {
                const category = catalogCategories.find((item) => item.id === product.category_id)?.name || "Sin categoría";
                return <article className="catalog-admin-row panel" key={product.id}>
                  <div className="catalog-admin-product"><CatalogAdminImage businessId={activeBusiness.id} product={product} /><div><strong>{product.name}</strong><span>{category}</span>{product.description && <small>{product.description}</small>}</div></div>
                  <div className="catalog-admin-price"><strong>{money(product.sale_price_minor, currencyCode)}</strong><span>por {product.unit_name || "unidad"}</span></div>
                  <div className="catalog-admin-publish">
                    <span className={product.is_published && product.is_sellable ? "status-pill status-active" : "status-pill status-inactive"}>{product.is_published && product.is_sellable ? "Publicado" : product.is_published ? "Producto inactivo" : "Oculto"}</span>
                    <button type="button" className={product.is_published ? "secondary-button action-small" : "primary-button action-small"} disabled={catalogPublishingId === product.id || (!product.is_sellable && !product.is_published)} onClick={() => toggleCatalogPublication(product)}>{catalogPublishingId === product.id ? "Guardando…" : product.is_published ? "Retirar" : "Publicar"}</button>
                  </div>
                </article>;
              })}</div>
              : <div className="empty-state"><span className="empty-icon">◉</span><h3>{catalogProducts.length ? "No hay resultados" : "Todavía no hay productos"}</h3><p>{catalogProducts.length ? "Prueba otra palabra o categoría." : "Crea tus productos primero; luego publícalos aquí para compartirlos."}</p><button type="button" className="secondary-button" onClick={() => navigate("products")}>Ir a productos</button></div>}
            {!catalogLoading && filteredCatalogProducts.length > 0 && <div className="pagination-bar catalog-pagination"><label className="page-size-control"><span className="field-label-heading">Mostrar</span><select value={catalogPageSize} onChange={(e) => { setCatalogPageSize(Number(e.target.value)); setCatalogPage(1); }}><option value={8}>8</option><option value={12}>12</option><option value={24}>24</option><option value={48}>48</option></select> por página</label><div className="pagination-controls"><button type="button" className="secondary-button" disabled={catalogPage <= 1} onClick={() => setCatalogPage((page) => Math.max(1, page - 1))}>Anterior</button><span className="pagination-status">Página {Math.min(catalogPage, catalogTotalPages)} de {catalogTotalPages}</span><button type="button" className="secondary-button" disabled={catalogPage >= catalogTotalPages} onClick={() => setCatalogPage((page) => Math.min(catalogTotalPages, page + 1))}>Siguiente</button></div></div>}
          </section>
        ) : screen === "quotes" ? (
          <section className="quotes-page">
            <div className="products-intro">
              <div><h2>Cotizaciones para tus clientes</h2><p>Prepara propuestas con productos, cantidades, precios y fecha de validez. Los valores se guardan en este negocio.</p></div>
              {canManageSales && <button type="button" className="primary-button compact-button" onClick={() => { if (showQuoteForm) clearQuoteDraft(); else { setShowQuoteForm(true); setError(""); setNotice(""); } }}>{showQuoteForm ? "Cancelar" : "+ Nueva cotización"}</button>}
            </div>
            {showQuoteForm && canManageSales && <form className="quote-form panel" onSubmit={createQuote}>
              <h3>{editingQuoteId ? "Ajustar cotización" : "Nueva cotización"}</h3>
              <div className="quote-customer-fields">
                <label><span className="field-label-heading">Seleccionar cliente registrado</span><select value={quoteCustomerId} onChange={(e) => { const id = e.target.value; if (id === "__create_quote_customer__") { setShowQuickQuoteCustomerForm(true); setError(""); return; } setQuoteCustomerId(id); const customer = quoteCustomers.find((item) => item.id === id); if (customer) { setQuoteCustomerName(customer.company_name || customer.full_name || ""); setQuoteCustomerEmail(customer.email || ""); setQuoteCustomerPhone(customer.phone || customer.whatsapp || ""); } }}><option value="">Cliente nuevo / escribir manualmente</option>{quoteCustomers.map((customer) => <option key={customer.id} value={customer.id}>{customer.company_name && customer.company_name !== customer.full_name ? customer.company_name + " · " + customer.full_name : customer.full_name || customer.company_name}</option>)}{canManageCustomers&&<option value="__create_quote_customer__">＋ Nuevo cliente…</option>}</select></label>{canManageCustomers && <button type="button" className="secondary-button inline-customer-toggle" onClick={() => setShowQuickQuoteCustomerForm((open) => !open)}>{showQuickQuoteCustomerForm ? "Cancelar nuevo cliente" : "＋ Nuevo cliente"}</button>}
                <label><span className="field-label-heading">Cliente o empresa *</span><input value={quoteCustomerName} onChange={(e) => { setQuoteCustomerName(e.target.value); if (quoteCustomerId) setQuoteCustomerId(""); }} maxLength={200} required placeholder="Nombre del cliente" /></label>
                <label><span className="field-label-heading">Correo</span><input type="email" value={quoteCustomerEmail} onChange={(e) => setQuoteCustomerEmail(e.target.value)} maxLength={254} placeholder="cliente@correo.com" /></label>
                <label><span className="field-label-heading">Teléfono / WhatsApp</span><input value={quoteCustomerPhone} onChange={(e) => setQuoteCustomerPhone(e.target.value)} maxLength={60} placeholder="Número de contacto" /></label>
                <label><span className="field-label-heading">Válida hasta</span><input type="date" min={todayInBogota()} value={quoteValidUntil} onChange={(e) => setQuoteValidUntil(e.target.value)} /></label>
              </div>
              {showQuickQuoteCustomerForm && canManageCustomers && <div className="quick-customer-form quick-quote-customer-form" onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }}>
                <strong>Nuevo cliente</strong><p className="inline-create-hint">Guárdalo y se seleccionará en esta cotización, sin perder los artículos que ya añadiste.</p>
                <div className="sale-builder">
                  <label><span className="field-label-heading">Nombre o empresa *</span><input value={quickQuoteCustomerName} onChange={(event) => setQuickQuoteCustomerName(event.target.value)} maxLength={200} autoComplete="name" /></label>
                  <label><span className="field-label-heading">Teléfono</span><input value={quickQuoteCustomerPhone} onChange={(event) => setQuickQuoteCustomerPhone(event.target.value)} maxLength={40} autoComplete="tel" /></label>
                  <label><span className="field-label-heading">Nombre o razón social</span><input value={quickQuoteCustomerCompany} onChange={(event) => setQuickQuoteCustomerCompany(event.target.value)} maxLength={200} /></label>
                  <label><span className="field-label-heading">Correo</span><input type="email" value={quickQuoteCustomerEmail} onChange={(event) => setQuickQuoteCustomerEmail(event.target.value)} maxLength={254} autoComplete="email" /></label>
                  <label><span className="field-label-heading">WhatsApp</span><input type="tel" value={quickQuoteCustomerWhatsapp} onChange={(event) => setQuickQuoteCustomerWhatsapp(event.target.value)} maxLength={40} /></label>
                  <label><span className="field-label-heading">Tipo de documento</span><select value={quickQuoteCustomerDocumentType} onChange={(event) => setQuickQuoteCustomerDocumentType(event.target.value)}><option value="">Sin especificar</option><option value="CC">Cédula de ciudadanía</option><option value="NIT">NIT</option><option value="CE">Cédula de extranjería</option><option value="TI">Tarjeta de identidad</option><option value="PP">Pasaporte</option><option value="OTHER">Otro</option></select></label>
                  <label><span className="field-label-heading">Número de documento</span><input value={quickQuoteCustomerDocumentNumber} onChange={(event) => setQuickQuoteCustomerDocumentNumber(event.target.value)} maxLength={80} /></label>
                  <label><span className="field-label-heading">Ciudad</span><input value={quickQuoteCustomerCity} onChange={(event) => setQuickQuoteCustomerCity(event.target.value)} maxLength={100} /></label>
                  <label><span className="field-label-heading">Dirección</span><input value={quickQuoteCustomerAddress} onChange={(event) => setQuickQuoteCustomerAddress(event.target.value)} maxLength={300} /></label>
                  <button type="button" className="primary-button" disabled={quickQuoteCustomerSaving || !quickQuoteCustomerName.trim()} onClick={addQuickQuoteCustomer}>{quickQuoteCustomerSaving ? "Guardando…" : "Guardar y seleccionar"}</button>
                </div>
              </div>}
              {quoteProducts.length > 0 && <label className="quote-product-select"><span className="field-label-heading">Cargar desde productos (opcional)</span><select value={quoteProductChoice} onChange={(e) => { const id = e.target.value; const product = quoteProducts.find((item) => item.id === id); setQuoteProductChoice(id); if (product) { setQuoteItemName(product.name); setQuoteUnitPrice(String(Number(product.sale_price_minor || 0) / (10 ** currencyDigits(currencyCode)))); } }}><option value="">Artículo personalizado…</option>{quoteProducts.map((product) => <option value={product.id} key={product.id}>{product.name} · {money(product.sale_price_minor, currencyCode)}</option>)}</select></label>}
              <div className="quote-item-builder">
                <label><span className="field-label-heading">Artículo o servicio *</span><input value={quoteItemName} onChange={(e) => { setQuoteItemName(e.target.value); setQuoteProductChoice(""); }} maxLength={200} placeholder="Nombre del artículo o servicio" /></label>
                <label><span className="field-label-heading">Cantidad</span><input type="number" min="0.001" step="0.001" value={quoteQuantity} onChange={(e) => setQuoteQuantity(e.target.value)} /></label>
                <label><span className="field-label-heading">Precio unitario</span><input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={quoteUnitPrice} onChange={(e) => setQuoteUnitPrice(e.target.value)} placeholder="0" /></label>
                <button type="button" className="secondary-button quote-add-item" onClick={addQuoteItem}>+ Agregar artículo</button>
              </div>
              {quoteItems.length > 0 && <div className="quote-cart">
                <div className="quote-cart-heading"><strong>Artículos cotizados</strong><span>{quoteItems.length} {quoteItems.length === 1 ? "artículo" : "artículos"}</span></div>
                {quoteItems.map((item) => <div className="quote-cart-row quote-edit-row" key={item.id}><div className="quote-edit-item-name"><strong>{item.name}</strong><span>{money(item.line_total_minor, currencyCode)}</span></div><label className="quote-inline-field"><span>Cantidad</span><input type="number" min="0.001" step="0.001" value={item.quantity} onChange={(e) => { const quantity = Number(e.target.value || 0); setQuoteItems((current) => current.map((row) => row.id === item.id ? { ...row, quantity, line_total_minor: Math.round(Number(row.unit_price_minor || 0) * quantity) } : row)); }} /></label><label className="quote-inline-field"><span>Precio unitario</span><input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={Number(item.unit_price_minor || 0) / (10 ** currencyDigits(currencyCode))} onChange={(e) => { const unit_price_minor = toMinorUnits(e.target.value || 0, currencyCode); setQuoteItems((current) => current.map((row) => row.id === item.id ? { ...row, unit_price_minor, line_total_minor: Math.round(unit_price_minor * Number(row.quantity || 0)) } : row)); }} /></label><button type="button" className="text-button danger-text" onClick={() => setQuoteItems((current) => current.filter((row) => row.id !== item.id))}>Quitar</button></div>)}
                <div className="quote-total-line"><span>Total de la cotización</span><strong>{money(quoteItems.reduce((sum, item) => sum + item.line_total_minor, 0), currencyCode)}</strong></div>
              </div>}
              <label><span className="field-label-heading">Notas y condiciones</span><textarea rows="2" value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)} maxLength={1500} placeholder="Tiempos, forma de entrega u otras condiciones" /></label>
              <div className="form-actions"><button type="button" className="secondary-button" onClick={clearQuoteDraft}>Cancelar</button><button type="submit" className="primary-button" disabled={quoteSaving}>{quoteSaving ? "Guardando…" : "Guardar cotización"}</button></div>
            </form>}
            <div className="quotes-toolbar">
              <label><span className="field-label-heading">Buscar</span><input value={quotesSearch} onChange={(e) => { setQuotesSearch(e.target.value); setQuotesPage(1); }} placeholder="Número o cliente…" /></label>
              <label><span className="field-label-heading">Estado</span><select value={quotesStatusFilter} onChange={(e) => { setQuotesStatusFilter(e.target.value); setQuotesPage(1); }}><option value="all">Todos</option><option value="draft">Borrador</option><option value="sent">Enviada</option><option value="accepted">Aceptada</option><option value="rejected">Rechazada</option><option value="expired">Vencida</option><option value="converted">Convertida en venta</option><option value="cancelled">Cancelada</option></select></label>
              <span className="count-label">{quotesCount} {quotesCount === 1 ? "cotización" : "cotizaciones"}</span>
            </div>
            {quotesLoading ? <div className="empty-state">Cargando cotizaciones…</div>
              : quotesRows.length ? <div className="quotes-list">{quotesRows.map((quote) => <article className="quote-record panel" key={quote.id}>
                <div className="quote-record-top"><div><strong>{quote.quote_number}</strong><span>{new Date(quote.created_at).toLocaleDateString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium" })}</span></div><span className={"status-pill " + (quote.status === "accepted" || quote.status === "converted" ? "status-active" : quote.status === "rejected" || quote.status === "cancelled" || quote.status === "expired" ? "status-inactive" : "status-unpublished")}>{quoteStatusLabel(quote.status)}</span></div>
                <div className="quote-record-customer"><strong>{quote.customer_name}</strong>{quote.customer_email && <span>{quote.customer_email}</span>}{quote.customer_phone && <span>{quote.customer_phone}</span>}</div>
                {quote.items.length > 0 && <div className="quote-record-items">{quote.items.map((item) => <div key={item.id}><span>{item.item_name} × {Number(item.quantity).toLocaleString("es-CO")}</span><strong>{money(item.line_total_minor, quote.currency_code || currencyCode)}</strong></div>)}</div>}
                {quote.notes && <p className="quote-record-note">{quote.notes}</p>}
                <div className="quote-record-bottom"><div><span>Total</span><strong>{money(quote.total_minor, quote.currency_code || currencyCode)}</strong></div><div><span>Válida hasta</span><strong>{quote.valid_until ? new Date(quote.valid_until + "T12:00:00-05:00").toLocaleDateString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium" }) : "Sin fecha límite"}</strong></div></div>
                {canManageSales && <div className="quote-record-actions">
                  <div className="quote-share-actions">
                    {quote.status !== "converted" && quote.status !== "cancelled" && <button type="button" className="secondary-button action-small" onClick={() => editQuote(quote)}>Ajustar propuesta</button>}
                    <button type="button" className="secondary-button action-small" onClick={() => printQuoteDocument(quote)}>PDF / Imprimir</button>
                    <button type="button" className="primary-button action-small" onClick={() => shareQuoteImage(quote)}>Compartir imagen</button>
                  </div>
                  <label><span className="field-label-heading">Estado</span><select value={quote.status} onChange={(e) => updateQuoteStatus(quote, e.target.value)}><option value="draft">Borrador</option><option value="sent">Enviada</option><option value="accepted">Aceptada</option><option value="rejected">Rechazada</option><option value="expired">Vencida</option><option value="converted">Convertida en venta</option><option value="cancelled">Cancelada</option></select></label>
                </div>}
              </article>)}</div>
              : <div className="empty-state"><span className="empty-icon">▧</span><h3>{quotesCount ? "No hay resultados" : "Aún no hay cotizaciones"}</h3><p>{quotesCount ? "Prueba otro nombre o estado." : "Crea tu primera cotización para dejar por escrito lo que le estás ofreciendo a un cliente."}</p>{canManageSales && <button type="button" className="primary-button" onClick={() => setShowQuoteForm(true)}>+ Nueva cotización</button>}</div>}
            {!quotesLoading && quotesCount > 0 && <div className="pagination-bar quotes-pagination"><label className="page-size-control"><span className="field-label-heading">Mostrar</span><select value={quotesPageSize} onChange={(e) => { setQuotesPageSize(Number(e.target.value)); setQuotesPage(1); }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select> por página</label><div className="pagination-controls"><button type="button" className="secondary-button" disabled={quotesPage <= 1} onClick={() => setQuotesPage((page) => Math.max(1, page - 1))}>Anterior</button><span className="pagination-status">Página {Math.min(quotesPage, Math.max(1, Math.ceil(quotesCount / quotesPageSize)))} de {Math.max(1, Math.ceil(quotesCount / quotesPageSize))}</span><button type="button" className="secondary-button" disabled={quotesPage >= Math.ceil(quotesCount / quotesPageSize)} onClick={() => setQuotesPage((page) => Math.min(Math.ceil(quotesCount / quotesPageSize), page + 1))}>Siguiente</button></div></div>}
          </section>
        ) : screen === "stats" ? (
          <section className="stats-page">
            <div className="products-intro stats-intro"><div><h2>Estadísticas y balance</h2><p>Elige un periodo y descarga un informe de los movimientos registrados.</p></div></div>
            <div className="stats-filter-toolbar">
              <div className="stats-period-buttons" role="group" aria-label="Periodo de estadísticas">
                {[["day","Día"],["week","Semana"],["month","Mes"],["year","Año"],["custom","Desde / hasta"],["all","Todo"]].map(([value,label]) => <button type="button" key={value} className={statsPeriod === value ? "stats-period-button active" : "stats-period-button"} aria-pressed={statsPeriod === value} onClick={() => setStatsPeriod(value)}>{label}</button>)}
              </div>
              {statsPeriod === "custom" && <div className="stats-custom-dates"><label><span className="field-label-heading">Desde</span><input type="date" value={statsDateFrom} max={statsDateTo || todayBogotaKey} onChange={(e) => setStatsDateFrom(e.target.value)} /></label><label><span className="field-label-heading">Hasta</span><input type="date" value={statsDateTo} min={statsDateFrom || undefined} max={todayBogotaKey} onChange={(e) => setStatsDateTo(e.target.value)} /></label></div>}
              <div className="stats-export-actions"><button type="button" className="secondary-button compact-button" onClick={downloadStatsExcel}>Exportar Excel (CSV)</button><button type="button" className="primary-button compact-button" onClick={printStatsReport}>PDF / Imprimir</button></div>
              <p className="stats-range-label">{statsRangeLabel}</p>
            </div>
            {statsLoading ? <div className="empty-state">Revisando ventas, cobros y gastos…</div> : <>
              <div className="stats-metrics">
                <article className="stats-metric panel stats-income"><span>Ingresos</span><strong>{money(statsCollected, currencyCode)}</strong><small>Pagos recibidos en el periodo</small></article>
                <article className="stats-metric panel"><span>Gastos</span><strong>{money(statsExpensesTotal, currencyCode)}</strong><small>{statsPeriodExpenses.length} {statsPeriodExpenses.length === 1 ? "gasto registrado" : "gastos registrados"}</small></article>
                <article className="stats-metric panel"><span>Compras pagadas</span><strong>{money(statsPaidPurchases, currencyCode)}</strong><small>Pagos de compras del periodo</small></article>
                <article className={"stats-metric panel stats-balance" + (statsCashBalance < 0 ? " profit-negative" : " profit-positive")}><span>Balance</span><strong>{money(statsCashBalance, currencyCode)}</strong><small>Ingresos − gastos − compras pagadas</small></article>
              </div>
              <SimpleBars title="Balance diario" description="Diferencia entre pagos recibidos y salidas registradas durante los últimos siete días." data={balanceChartData.map((item)=>({key:item.key,label:item.label,value:item.value}))} formatValue={(value)=>money(value,currencyCode)} />
              <div className="stats-secondary-metrics"><span>Ventas registradas: <strong>{money(statsSalesTotal, currencyCode)}</strong></span><span>Pendiente por cobrar: <strong>{money(statsOutstanding, currencyCode)}</strong></span><span>{statsPeriodSales.length} {statsPeriodSales.length === 1 ? "venta" : "ventas"}</span></div>
              <section className="stats-pending panel"><div className="stats-section-heading"><div><h3>Ventas con saldo pendiente</h3><p>Las ventas con dinero por cobrar en el periodo elegido.</p></div><button type="button" className="secondary-button compact-button" onClick={() => navigate("sales")}>Ver ventas</button></div>
                {statsPeriodSales.filter((sale) => Number(sale.total_minor || 0) > Number(sale.amount_paid_minor || 0)).length
                  ? <div className="stats-pending-list">{statsPeriodSales.filter((sale) => Number(sale.total_minor || 0) > Number(sale.amount_paid_minor || 0)).sort((a, b) => (Number(b.total_minor || 0) - Number(b.amount_paid_minor || 0)) - (Number(a.total_minor || 0) - Number(a.amount_paid_minor || 0))).slice(0, 10).map((sale) => <div className="stats-pending-row" key={sale.id}><div><strong>{sale.sale_number || "Venta"}</strong><span>{new Date(sale.sold_at || sale.created_at).toLocaleDateString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium" })}</span></div><strong>{money(Math.max(0, Number(sale.total_minor || 0) - Number(sale.amount_paid_minor || 0)), sale.currency_code || currencyCode)}</strong></div>)}</div>
                  : <p className="stats-empty-note">No hay saldos pendientes en este periodo.</p>}
              </section>
              <p className="stats-disclaimer">El balance compara los pagos registrados con los gastos anotados en el mismo periodo. Las ventas a crédito aparecen aparte como pendiente por cobrar; no se cuentan como dinero recibido.</p>
              {!statsSales.length && !statsExpenses.length && !statsPayments.length && !statsPurchases.length && !statsPurchasePayments.length && <div className="empty-state"><h3>Aún no hay movimientos</h3><p>Las estadísticas se llenarán cuando registres ventas, abonos y gastos.</p><button type="button" className="secondary-button" onClick={() => navigate("sales")}>Ir a ventas</button></div>}
            </>}
          </section>
        ) : screen === "profitability" ? (
          <section className="profitability-page">
            <div className="products-intro profitability-intro">
              <div><h2>Ingresos, costos y resultado</h2><p>Compara lo vendido con el costo de los artículos y los gastos que registraste durante el periodo elegido.</p></div>
              <label className="profitability-period-label"><span className="field-label-heading">Periodo
                <FieldHelp enabled={contextualHelpEnabled} text="Elige el periodo para consultar ingresos, costos y utilidad." /></span><select value={profitabilityPeriod} onChange={(e) => setProfitabilityPeriod(e.target.value)}>
                  <option value="day">Hoy</option><option value="week">Esta semana</option><option value="month">Este mes</option><option value="year">Este año</option><option value="30days">Últimos 30 días</option><option value="custom">Rango de fechas</option><option value="all">Todo el historial</option>
                </select>
              </label>
            </div>
            {profitabilityPeriod === "custom" && <div className="sales-date-toolbar panel"><div className="stats-custom-dates"><label><span>Desde</span><input type="date" value={profitabilityDateFrom} max={profitabilityDateTo || todayBogotaKey} onChange={(e) => setProfitabilityDateFrom(e.target.value)} /></label><label><span>Hasta</span><input type="date" value={profitabilityDateTo} min={profitabilityDateFrom || undefined} max={todayBogotaKey} onChange={(e) => setProfitabilityDateTo(e.target.value)} /></label></div></div>}
            {profitabilityLoading ? <div className="empty-state">Calculando con tus registros reales…</div> : <>
              <div className="profitability-metrics">
                <article className="profit-metric panel"><span>Ventas registradas</span><strong>{money(profitSalesTotal, currencyCode)}</strong><small>{periodSales.length} {periodSales.length === 1 ? "venta" : "ventas"} · {money(profitPaidTotal, currencyCode)} abonados</small></article>
                <article className="profit-metric panel"><span>Costo de lo vendido</span><strong>{money(profitCostOfSales, currencyCode)}</strong><small>Según el costo guardado en cada venta</small></article>
                <article className="profit-metric panel"><span>Ganancia bruta estimada</span><strong className={profitGross < 0 ? "profit-negative" : "profit-positive"}>{money(profitGross, currencyCode)}</strong><small>{profitLineRevenue > 0 ? Math.round((profitGross / profitLineRevenue) * 100) + "% de margen bruto" : "Sin ventas con artículos en este periodo"}</small></article>
                <article className="profit-metric panel"><span>Gastos registrados</span><strong>{money(profitExpenseTotal, currencyCode)}</strong><small>{periodExpenses.length} {periodExpenses.length === 1 ? "gasto" : "gastos"}</small></article>
                <article className="profit-metric panel profit-metric-primary"><span>Resultado estimado</span><strong className={profitNet < 0 ? "profit-negative" : "profit-positive"}>{money(profitNet, currencyCode)}</strong><small>Ganancia bruta menos gastos registrados</small></article>
              </div>
              <div className="profitability-secondary-metrics">
                <div><span>Pendiente por cobrar</span><strong>{money(periodSales.reduce((sum, sale) => sum + Math.max(0, Number(sale.total_minor || 0) - Number(sale.amount_paid_minor || 0)), 0), currencyCode)}</strong></div>
                <div><span>Margen bruto</span><strong>{profitLineRevenue > 0 ? Math.round((profitGross / profitLineRevenue) * 100) + "%" : "—"}</strong></div>
              </div>
              <section className="profit-goal-panel panel">
                <div className="profit-breakdown-heading"><div><h3>Plan para ganar más el próximo mes</h3><p>Una simulación clara basada en el resultado del periodo seleccionado; no cambia tus registros.</p></div><label className="profit-goal-percent"><span>Meta de crecimiento</span><span><input type="number" min="1" max="500" step="1" value={targetProfitPercent} onChange={(e) => setTargetProfitPercent(e.target.value)} /> %</span></label></div>
                {profitNet > 0 ? <div className="profit-goal-grid">
                  <div><span>Resultado actual</span><strong>{money(profitNet, currencyCode)}</strong></div>
                  <div><span>Resultado objetivo</span><strong>{money(Math.round(profitNet * (1 + Math.max(0, Number(targetProfitPercent || 0)) / 100)), currencyCode)}</strong></div>
                  <div><span>Te falta generar</span><strong>{money(Math.round(profitNet * Math.max(0, Number(targetProfitPercent || 0)) / 100), currencyCode)}</strong></div>
                  <p>{profitLineRevenue > 0 && profitGross > 0 ? "Para alcanzar esa diferencia, podrías generar aproximadamente " + money(Math.ceil((profitNet * Math.max(0, Number(targetProfitPercent || 0)) / 100) / (profitGross / profitLineRevenue)), currencyCode) + " en ventas adicionales si mantienes el margen bruto actual, o reducir gastos por " + money(Math.round(profitNet * Math.max(0, Number(targetProfitPercent || 0)) / 100), currencyCode) + " en el periodo." : "No hay un margen bruto positivo suficiente para estimar ventas adicionales con fiabilidad. Revisa los precios y costos, o plantea una reducción de gastos de " + money(Math.round(profitNet * Math.max(0, Number(targetProfitPercent || 0)) / 100), currencyCode) + "."} Es una guía, no una garantía.</p>
                </div> : <p className="profit-empty-note">El resultado del periodo no es positivo todavía. Primero identifica los gastos que puedes reducir y revisa el margen de tus productos; cuando tengas una base positiva, el simulador calculará la meta porcentual.</p>}
                {profitNet > 0 && (profitByItem.length > 0 || expensesByCategory.length > 0) && <div className="profit-goal-actions"><strong>Por dónde empezar</strong>{profitByItem[0] && <p>Prioriza vender <b>{profitByItem[0].name}</b>: fue el artículo con mayor contribución bruta en este periodo ({money(profitByItem[0].revenue - profitByItem[0].cost, currencyCode)} en total). Mantén controlado su costo y evita descuentos que se coman el margen.</p>}{expensesByCategory[0] && <p>Revisa los gastos de <b>{expensesByCategory[0].name}</b>, la categoría con mayor valor registrado ({money(expensesByCategory[0].amount, currencyCode)}). Identifica qué parte se puede reducir sin afectar las ventas.</p>}</div>}
              </section>
              <section className="profit-allocations-panel panel">
                <div className="profit-breakdown-heading"><div><h3>Distribución opcional de la ganancia</h3><p>Activa solo los porcentajes que uses. Se calculan sobre un resultado positivo y no se restan de la rentabilidad contable.</p></div></div>
                <div className="profit-allocation-list">
                  {["diezmo","ahorro","otra"].map((key) => {
                    const allocation = allocationSettings[key];
                    const label = key === "diezmo" ? "Diezmo" : key === "ahorro" ? "Ahorro" : allocation.name || "Otra asignación";
                    const amount = Math.round(Math.max(0, profitNet) * Math.min(100, Math.max(0, Number(allocation.percent || 0))) / 100);
                    return <div className="profit-allocation-row" key={key}>
                      <label className="profit-allocation-toggle"><input type="checkbox" checked={Boolean(allocation.enabled)} disabled={!isBusinessOwner} onChange={(e) => setAllocationSettings((current) => ({ ...current, [key]: { ...current[key], enabled: e.target.checked } }))} /><span>{label}</span></label>
                      {key === "otra" && <input className="profit-allocation-name" aria-label="Nombre de la otra asignación" value={allocation.name || ""} maxLength={50} disabled={!isBusinessOwner} onChange={(e) => setAllocationSettings((current) => ({ ...current, otra: { ...current.otra, name: e.target.value } }))} placeholder="Nombre de la asignación" />}
                      <label className="profit-allocation-rate"><span>Porcentaje</span><span><input type="number" min="0" max="100" step="0.5" value={allocation.percent} disabled={!isBusinessOwner} onChange={(e) => setAllocationSettings((current) => ({ ...current, [key]: { ...current[key], percent: Math.min(100, Math.max(0, Number(e.target.value || 0))) } }))} /> %</span></label>
                      <strong>{allocation.enabled ? money(amount, currencyCode) : "Desactivado"}</strong>
                    </div>;
                  })}
                </div>
                <div className="profit-allocation-footer"><span>Distribución activa: {Object.values(allocationSettings).filter((item) => item.enabled).reduce((sum, item) => sum + Math.max(0, Number(item.percent || 0)), 0).toLocaleString("es-CO")}%</span>{isBusinessOwner && <button type="button" className="primary-button compact-button" onClick={saveAllocationSettings} disabled={busy}>{busy ? "Guardando…" : "Guardar porcentajes"}</button>}</div>
                <label className="profit-simulation-toggle"><input type="checkbox" checked={simulateAllocations} onChange={(e) => setSimulateAllocations(e.target.checked)} /><span>Restar asignaciones del resultado disponible <small>(solo simulación; no modifica la rentabilidad contable)</small></span></label>
                {simulateAllocations && <div className="profit-simulation-result"><span>Disponible después de asignaciones activas</span><strong>{money(Math.max(0, Math.max(0, profitNet) - Object.values(allocationSettings).filter((item) => item.enabled).reduce((sum, item) => sum + Math.round(Math.max(0, profitNet) * Math.min(100, Math.max(0, Number(item.percent || 0))) / 100), 0)), currencyCode)}</strong></div>}
                {!isBusinessOwner && <p className="helper-text">Solo el propietario puede cambiar estos porcentajes.</p>}
              </section>
              <div className="profitability-breakdowns">
                <section className="profit-breakdown panel">
                  <div className="profit-breakdown-heading"><div><h3>Costos por artículo vendido</h3><p>Lo que costaron los artículos que ya vendiste.</p></div></div>
                  {periodSaleItems.length ? <div className="profit-data-list">{Object.values(periodSaleItems.reduce((groups, item) => {
                    const name = item.item_name || "Artículo sin nombre";
                    if (!groups[name]) groups[name] = { name, quantity: 0, revenue: 0, cost: 0 };
                    groups[name].quantity += Number(item.quantity || 0);
                    groups[name].revenue += Number(item.line_total_minor || 0);
                    groups[name].cost += Math.round(Number(item.unit_cost_minor || 0) * Number(item.quantity || 0));
                    return groups;
                  }, {})).sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost)).slice(0, 12).map((item) => <div className="profit-data-row" key={item.name}>
                    <div><strong>{item.name}</strong><span>{Number(item.quantity).toLocaleString("es-CO")} unidades · costo {money(item.cost, currencyCode)}</span></div>
                    <strong className={(item.revenue - item.cost) < 0 ? "profit-negative" : "profit-positive"}>{money(item.revenue - item.cost, currencyCode)}</strong>
                  </div>)}</div> : <p className="profit-empty-note">Todavía no hay ventas con artículos en este periodo.</p>}
                </section>
                <section className="profit-breakdown panel">
                  <div className="profit-breakdown-heading"><div><h3>Gastos por categoría</h3><p>Las salidas de dinero que has anotado.</p></div></div>
                  {expensesByCategory.length ? <div className="profit-data-list">{expensesByCategory.map((group) => <div className="profit-data-row" key={group.name}>
                    <div><strong>{group.name}</strong><span>{group.count} {group.count === 1 ? "registro" : "registros"}</span></div><strong>{money(group.amount, currencyCode)}</strong>
                  </div>)}</div> : <p className="profit-empty-note">Todavía no hay gastos registrados en este periodo.</p>}
                </section>
              </div>
              <p className="profitability-disclaimer">Este cálculo es orientativo: usa el costo que quedó guardado en cada venta y los gastos que registraste. No incluye gastos que aún no hayas anotado ni calcula impuestos, depreciación o ajustes contables. Las compras de inventario no se restan otra vez porque su costo se reconoce al vender el artículo.</p>
              {!periodSales.length && !periodExpenses.length && <div className="empty-state"><span className="empty-icon">◷</span><h3>No hay movimientos en este periodo</h3><p>Cuando registres ventas y gastos, los números aparecerán aquí sin datos de ejemplo.</p><button type="button" className="secondary-button" onClick={() => navigate("sales")}>Ir a ventas</button></div>}
            </>}
          </section>
        ) : (screen === "purchases" || screen === "suppliers") ? (
          <section className="purchases-page">
            {screen === "purchases" && <div className="products-intro">
              <div><h2>Movimientos del negocio</h2><p>Registra las compras de inventario, los pagos a proveedores y los gastos de funcionamiento sin duplicar operaciones.</p></div>
            </div>}
            {screen === "purchases" && <div className="purchase-module-tabs" role="tablist" aria-label="Compras y gastos">
              {canViewPurchases && <button type="button" role="tab" aria-selected={effectivePurchaseTab === "purchases"} className={effectivePurchaseTab === "purchases" ? "purchase-tab active" : "purchase-tab"} onClick={() => { setPurchaseModuleTab("purchases"); setShowSupplierForm(false); }}>Compras <span>{purchasesCount}</span></button>}
              {canViewExpenses && <button type="button" role="tab" aria-selected={effectivePurchaseTab === "expenses"} className={effectivePurchaseTab === "expenses" ? "purchase-tab active" : "purchase-tab"} onClick={() => { setPurchaseModuleTab("expenses"); setShowSupplierForm(false); }}>Gastos <span>{expensesCount}</span></button>}
            </div>}
            {screen === "purchases" && effectivePurchaseTab !== "suppliers" && <div className="sales-date-toolbar panel"><div className="stats-period-buttons" role="group" aria-label="Periodo de compras y gastos">{[["day","Hoy"],["week","Semana"],["month","Mes"],["year","Año"],["custom","Rango"],["all","Todo"]].map(([value,label]) => <button type="button" key={value} className={purchasePeriod === value ? "stats-period-button active" : "stats-period-button"} aria-pressed={purchasePeriod === value} onClick={() => {setPurchasePeriod(value);setPurchasesPage(1);setExpensesPage(1);}}>{label}</button>)}</div>{purchasePeriod === "custom" && <div className="stats-custom-dates"><label><span>Desde</span><input type="date" value={purchaseDateFrom} max={purchaseDateTo || todayInBogota()} onChange={(e) => {setPurchaseDateFrom(e.target.value);setPurchasesPage(1);setExpensesPage(1);}} /></label><label><span>Hasta</span><input type="date" value={purchaseDateTo} min={purchaseDateFrom || undefined} max={todayInBogota()} onChange={(e) => {setPurchaseDateTo(e.target.value);setPurchasesPage(1);setExpensesPage(1);}} /></label></div>}<p>{purchasePeriod === "day" ? "Movimientos de hoy" : purchasePeriod === "all" ? "Todo el historial" : purchasePeriod === "custom" ? "Del " + purchaseDateFrom + " al " + purchaseDateTo : purchasePeriod === "week" ? "Desde el lunes de esta semana" : purchasePeriod === "month" ? "Desde el primer día del mes" : "Desde el primer día del año"}</p></div>}
            {effectivePurchaseTab === "purchases" ? <>
              <div className="products-intro purchase-subintro">
                <div><h3>Compras de inventario</h3><p>Al guardar una compra, las existencias se suman en un solo paso.</p></div>
                <div className="purchase-toolbar-actions">
                  {canManagePurchases && <button type="button" className="primary-button compact-button" onClick={() => { setShowPurchaseForm((open) => !open); setError(""); setNotice(""); }}>{showPurchaseForm ? "Cancelar compra" : "+ Nueva compra"}</button>}
                </div>
              </div>
              {canPermission("suppliers_manage") && showSupplierForm && <form className="purchase-form panel" onSubmit={addSupplier}>
                <div className="purchase-form-heading"><div><p className="eyebrow">CONTACTOS</p><h3>Nuevo proveedor</h3></div></div>
                <div className="purchase-form-grid">
                  <label><span className="field-label-heading">Nombre del proveedor *<FieldHelp enabled={contextualHelpEnabled} text="Nombre de la persona o empresa que te suministra productos o materiales." /></span><input value={supplierDraft.name} onChange={(e) => setSupplierDraft((d) => ({ ...d, name: e.target.value }))} maxLength={180} required placeholder="Nombre o empresa" /></label>
                  <label><span className="field-label-heading">NIT o documento<FieldHelp enabled={contextualHelpEnabled} text="Identificación tributaria o documento del proveedor, si lo tienes." /></span><input value={supplierDraft.tax_id} onChange={(e) => setSupplierDraft((d) => ({ ...d, tax_id: e.target.value }))} maxLength={80} placeholder="Opcional" /></label>
                  <label><span className="field-label-heading">Teléfono<FieldHelp enabled={contextualHelpEnabled} text="Teléfono de contacto del proveedor." /></span><input type="tel" value={supplierDraft.phone} onChange={(e) => setSupplierDraft((d) => ({ ...d, phone: e.target.value }))} maxLength={60} placeholder="Número de contacto" /></label>
                  <label><span className="field-label-heading">Correo<FieldHelp enabled={contextualHelpEnabled} text="Correo para comunicarte con el proveedor." /></span><input type="email" value={supplierDraft.email} onChange={(e) => setSupplierDraft((d) => ({ ...d, email: e.target.value }))} maxLength={254} placeholder="proveedor@correo.com" /></label>
                  <label className="purchase-span-two"><span className="field-label-heading">Dirección<FieldHelp enabled={contextualHelpEnabled} text="Dirección del proveedor para entregas, facturas o contacto." /></span><input value={supplierDraft.address} onChange={(e) => setSupplierDraft((d) => ({ ...d, address: e.target.value }))} maxLength={300} placeholder="Dirección del proveedor" /></label>
                  <label className="purchase-span-two"><span className="field-label-heading">Notas<FieldHelp enabled={contextualHelpEnabled} text="Información adicional útil sobre el proveedor." /></span><input value={supplierDraft.notes} onChange={(e) => setSupplierDraft((d) => ({ ...d, notes: e.target.value }))} maxLength={1000} placeholder="Información útil" /></label>
                </div>
                <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowSupplierForm(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar proveedor"}</button></div>
              </form>}
              {canManagePurchases && showPurchaseForm && <form className="purchase-form panel" onSubmit={createPurchase}>
                <div className="purchase-form-heading"><div><p className="eyebrow">ENTRADA DE INVENTARIO</p><h3>Nueva compra</h3></div><span className="purchase-form-hint">Se guarda con su historial</span></div>
                <div className="purchase-form-grid">
                  <label><span className="field-label-heading">Fecha de compra *<FieldHelp enabled={contextualHelpEnabled} text="Registra la fecha en que hiciste la compra." /></span><input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required /></label>
                  <label><span className="field-label-heading">Proveedor<FieldHelp enabled={contextualHelpEnabled} text="Selecciona el proveedor al que corresponde esta compra; puedes dejarlo sin asignar." /></span><select value={purchaseSupplierId} onChange={(e) => { if (e.target.value === "__create_supplier__") { setShowQuickPurchaseSupplierForm(true); return; } setPurchaseSupplierId(e.target.value); }}><option value="">Sin proveedor</option>{suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}{canPermission("suppliers_manage") && <option value="__create_supplier__">＋ Nuevo proveedor…</option>}</select></label>
                  {showQuickPurchaseSupplierForm && canPermission("suppliers_manage") && <div className="inline-create-panel quick-purchase-supplier" onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }}>
                    <strong>Nuevo proveedor</strong><p className="inline-create-hint">Se guardará como contacto y quedará seleccionado en esta compra.</p>
                    <div className="inline-create-fields-grid">
                      <label><span>Nombre o empresa *</span><input value={supplierDraft.name} onChange={(event) => setSupplierDraft((current) => ({...current,name:event.target.value}))} maxLength={180} placeholder="Nombre del proveedor" /></label>
                      <label><span>Teléfono</span><input type="tel" value={supplierDraft.phone} onChange={(event) => setSupplierDraft((current) => ({...current,phone:event.target.value}))} maxLength={60} /></label>
                      <label><span>Correo</span><input type="email" value={supplierDraft.email} onChange={(event) => setSupplierDraft((current) => ({...current,email:event.target.value}))} maxLength={254} /></label>
                    </div>
                    <div className="inline-create-actions"><button type="button" className="primary-button" disabled={busy || !supplierDraft.name.trim()} onClick={() => addSupplier()}>{busy ? "Guardando…" : "Guardar y seleccionar"}</button><button type="button" className="text-button" onClick={() => {setShowQuickPurchaseSupplierForm(false);setSupplierDraft(blankSupplier);}}>Cancelar</button></div>
                  </div>}
                  <label><span className="field-label-heading">Producto registrado<FieldHelp enabled={contextualHelpEnabled} text="Elige un producto ya registrado para completar automáticamente su nombre y costo cuando corresponda." /></span><select value={purchaseProductChoice} onChange={(e) => { const id = e.target.value; const product = purchaseProducts.find((p) => p.id === id); setPurchaseProductChoice(id); setPurchaseItemName(product?.name || ""); setPurchaseUnitCost(product ? String(Number(product.cost_price_minor || 0) / (10 ** currencyDigits(currencyCode))) : ""); }}><option value="">Otro artículo / no vincular</option>{purchaseProducts.map((product) => <option value={product.id} key={product.id}>{product.name}{product.sku ? " · " + product.sku : ""}</option>)}</select></label>
                  <label><span className="field-label-heading">Artículo comprado *<FieldHelp enabled={contextualHelpEnabled} text="Describe el producto o material que compraste para identificarlo en el historial." /></span><input value={purchaseItemName} onChange={(e) => { setPurchaseItemName(e.target.value); if (purchaseProductChoice) setPurchaseProductChoice(""); }} maxLength={180} required placeholder="Nombre del material o producto" /></label>
                  <label><span className="field-label-heading">Cantidad *<FieldHelp enabled={contextualHelpEnabled} text="Cantidad comprada. Se usa con el costo unitario para calcular el subtotal." /></span><input type="number" min="0.001" step="0.001" value={purchaseQuantity} onChange={(e) => setPurchaseQuantity(e.target.value)} required /></label>
                  <label><span className="field-label-heading">Costo por unidad *<FieldHelp enabled={contextualHelpEnabled} text="Costo por unidad que pagaste al comprar este artículo." /></span><input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={purchaseUnitCost} onChange={(e) => setPurchaseUnitCost(e.target.value)} required placeholder="0" /></label>
                </div>
                <button type="button" className="secondary-button purchase-add-item" onClick={addPurchaseLine}>＋ Añadir artículo</button>
                {purchaseCart.length > 0 && <div className="purchase-cart">
                  <div className="purchase-cart-heading"><strong>Artículos de la compra</strong><span>{purchaseCart.length}</span></div>
                  {purchaseCart.map((item) => <div className="purchase-cart-row" key={item.line_id}>
                    <div><strong>{item.name}</strong><span>{item.product_id ? "Vinculado a tu inventario" : "Sin vínculo a inventario"} · {money(toMinorUnits(item.unit_cost, currencyCode), currencyCode)} por {item.unit_name}</span></div>
                    <label><span className="field-label-heading">Cantidad<FieldHelp enabled={contextualHelpEnabled} text="Ajusta la cantidad de esta línea de compra; sus valores se actualizan." /></span><input type="number" min="0.001" step="0.001" value={item.quantity} onChange={(e) => setPurchaseCart((current) => current.map((line) => line.line_id === item.line_id ? { ...line, quantity: e.target.value } : line))} /></label>
                    <strong>{money(Math.round(toMinorUnits(item.unit_cost, currencyCode) * Number(item.quantity || 0)), currencyCode)}</strong>
                    <button type="button" className="text-button danger-text" onClick={() => setPurchaseCart((current) => current.filter((line) => line.line_id !== item.line_id))}>Quitar</button>
                  </div>)}
                  <div className="purchase-cart-subtotal"><span>Subtotal</span><strong>{money(purchaseCart.reduce((sum, item) => sum + Math.round(toMinorUnits(item.unit_cost, currencyCode) * Number(item.quantity || 0)), 0), currencyCode)}</strong></div>
                </div>}
                <div className="purchase-form-grid purchase-money-fields">
                  <label><span className="field-label-heading">Impuestos u otros cargos<FieldHelp enabled={contextualHelpEnabled} text="Registra impuestos, transporte u otros cobros que se suman al costo de la compra." /></span><input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={purchaseTax} onChange={(e) => setPurchaseTax(e.target.value)} /></label>
                  <label><span className="field-label-heading">Abono realizado<FieldHelp enabled={contextualHelpEnabled} text="Dinero que pagas ahora al proveedor como parte de esta compra. Si es menor que el total, queda un saldo por pagar." /></span><input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={purchasePayment} onChange={(e) => setPurchasePayment(e.target.value)} /></label>
                  <label><span className="field-label-heading">Forma de pago inicial<FieldHelp enabled={contextualHelpEnabled} text="Indica cómo pagaste esta compra al proveedor: efectivo, transferencia, tarjeta u otro medio." /></span><select value={purchaseInitialPaymentMethod} onChange={(e) => setPurchaseInitialPaymentMethod(e.target.value)}><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option><option>Otro</option></select></label>
                  <label className="purchase-span-two"><span className="field-label-heading">Nota<FieldHelp enabled={contextualHelpEnabled} text="Añade un comentario sobre la compra, como número de factura, transporte o detalles de entrega." /></span><input value={purchaseNotes} onChange={(e) => setPurchaseNotes(e.target.value)} maxLength={1500} placeholder="Factura, transporte, entrega…" /></label>
                </div>
                <div className="purchase-total-summary"><span>Total estimado</span><strong>{money(purchaseCart.reduce((sum, item) => sum + Math.round(toMinorUnits(item.unit_cost, currencyCode) * Number(item.quantity || 0)), 0) + toMinorUnits(purchaseTax || 0, currencyCode), currencyCode)}</strong></div>
                <p className="helper-text">Solo los artículos vinculados a un producto suman existencias. Los artículos libres quedan registrados en la compra, sin cambiar tu inventario.</p>
                <div className="form-actions"><button type="button" className="secondary-button" onClick={() => { setShowPurchaseForm(false); setPurchaseCart([]); }}>Cancelar</button><button type="submit" className="primary-button" disabled={busy || !purchaseCart.length}>{busy ? "Guardando…" : "Guardar compra"}</button></div>
              </form>}
              {purchaseLoading ? <div className="empty-state">Cargando compras…</div> : purchaseRows.length ? <div className="purchase-record-list">{purchaseRows.map((purchase) => {
                const supplier = suppliers.find((item) => item.id === purchase.supplier_id);
                const items = purchaseItemsByPurchase[purchase.id] || [];
                const pending = Math.max(0, Number(purchase.total_minor) - Number(purchase.amount_paid_minor));
                return <article className="purchase-record panel mobile-detail-trigger" key={purchase.id} onClick={(event) => { if (!window.matchMedia("(max-width: 640px)").matches || event.target.closest("button,a,input,select,textarea")) return; setSelectedRecordDetail({type:"Compra",title:purchase.purchase_number || "Compra",fields:[{label:"Fecha",value:purchase.purchased_at ? new Date(purchase.purchased_at).toLocaleDateString("es-CO",{timeZone:"America/Bogota",dateStyle:"medium"}) : "Sin definir"},{label:"Proveedor",value:supplier?.name || "Sin proveedor"},{label:"Estado",value:purchaseStatusLabel(purchase.status)},{label:"Total",value:money(purchase.total_minor,purchase.currency_code||currencyCode)},{label:"Pagado",value:money(purchase.amount_paid_minor,purchase.currency_code||currencyCode)},{label:"Pendiente",value:money(pending,purchase.currency_code||currencyCode)},{label:"Artículos",value:items.map(item=>item.item_name+" × "+Number(item.quantity).toLocaleString("es-CO")+" — "+money(item.line_total_minor,purchase.currency_code||currencyCode)).join("\n")||"Sin artículos"},{label:"Historial de pagos",value:(purchase.payments||[]).map(p=>money(p.amount_minor,purchase.currency_code||currencyCode)+" · "+p.payment_method+" · "+new Date(p.paid_at).toLocaleDateString("es-CO",{timeZone:"America/Bogota",dateStyle:"medium"})+(p.notes?" · "+p.notes:"")).join("\n")||"Sin pagos"}],notes:purchase.notes}); }}>
                  <div className="purchase-record-top"><div><strong>{purchase.purchase_number}</strong><span>{purchase.purchased_at ? new Date(purchase.purchased_at).toLocaleDateString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium" }) : "Fecha sin definir"}{supplier ? " · " + supplier.name : ""}</span></div><span className={"status-pill " + (purchase.status === "paid" ? "status-active" : purchase.status === "canceled" || purchase.status === "refunded" ? "status-inactive" : "status-unpublished")}>{purchaseStatusLabel(purchase.status)}</span></div>
                  {items.length > 0 && <div className="purchase-record-items">{items.map((item) => <div key={item.id}><span>{item.item_name} × {Number(item.quantity).toLocaleString("es-CO")}</span><strong>{money(item.line_total_minor, purchase.currency_code || currencyCode)}</strong></div>)}</div>}
                  <div className="purchase-record-totals"><div><span>Total</span><strong>{money(purchase.total_minor, purchase.currency_code || currencyCode)}</strong></div><div><span>Pagado</span><strong>{money(purchase.amount_paid_minor, purchase.currency_code || currencyCode)}</strong></div><div><span>Pendiente</span><strong>{money(pending, purchase.currency_code || currencyCode)}</strong></div></div>
                  <div className="purchase-payment-history"><div className="purchase-payment-history-heading"><strong>Historial de pagos</strong><span>{(purchase.payments || []).length} {(purchase.payments || []).length === 1 ? "pago" : "pagos"}</span></div>
                    {(purchase.payments || []).length ? <div className="purchase-payment-list">{purchase.payments.map((payment) => <div className="purchase-payment-row" key={payment.id}><div><strong>{money(payment.amount_minor,purchase.currency_code||currencyCode)}</strong><span>{payment.payment_method} · {new Date(payment.paid_at).toLocaleDateString("es-CO",{timeZone:"America/Bogota",dateStyle:"medium"})}</span>{payment.notes&&<small>{payment.notes}</small>}</div></div>)}</div> : <p className="purchase-payment-empty">No hay pagos registrados.</p>}
                    {canManagePurchases && pending > 0 && !["canceled","refunded","draft"].includes(purchase.status) && <button type="button" className="secondary-button purchase-register-payment-button" onClick={() => purchasePaymentFormFor === purchase.id ? setPurchasePaymentFormFor(null) : openPurchasePaymentForm(purchase)}>{purchasePaymentFormFor === purchase.id ? "Cancelar" : "＋ Registrar pago"}</button>}
                    {canManagePurchases && purchasePaymentFormFor === purchase.id && <form className="purchase-payment-form" onSubmit={(event) => recordPurchasePayment(event,purchase)}>
                      <label><span className="field-label-heading">Valor del pago<FieldHelp enabled={contextualHelpEnabled} text="Importe que estás pagando al proveedor ahora. No puede superar lo que falta por pagar." /></span><input type="number" min="0.01" max={pending/(10**currencyDigits(currencyCode))} step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={purchasePaymentAmount} onChange={(e) => setPurchasePaymentAmount(e.target.value)} required /></label>
                      <label><span className="field-label-heading">Forma de pago<FieldHelp enabled={contextualHelpEnabled} text="Elige el medio usado para hacer este pago al proveedor." /></span><select value={purchasePaymentMethod} onChange={(e) => setPurchasePaymentMethod(e.target.value)}><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option><option>Otro</option></select></label>
                      <label><span className="field-label-heading">Fecha del pago<FieldHelp enabled={contextualHelpEnabled} text="Fecha real en que hiciste este pago al proveedor." /></span><input type="date" max={todayInBogota()} value={purchasePaymentDate} onChange={(e) => setPurchasePaymentDate(e.target.value)} required /></label>
                      <label className="purchase-payment-notes"><span className="field-label-heading">Nota<FieldHelp enabled={contextualHelpEnabled} text="Añade una referencia breve para recordar este pago, como el número de una transferencia." /></span><input value={purchasePaymentNotes} onChange={(e) => setPurchasePaymentNotes(e.target.value)} maxLength={1000} placeholder="Referencia o detalle del pago" /></label>
                      <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setPurchasePaymentFormFor(null)}>Cancelar</button><button type="submit" className="primary-button" disabled={purchasePaymentSaving}>{purchasePaymentSaving ? "Registrando…" : "Guardar pago"}</button></div>
                    </form>}
                  </div>
                  {purchase.notes && <p className="purchase-note">{purchase.notes}</p>}
                </article>;
              })}</div> : <div className="empty-state"><span className="empty-icon">▤</span><h3>No hay compras en este periodo</h3><p>Prueba otra fecha o elige «Todo» para consultar el historial completo. No cargamos operaciones de ejemplo.</p>{canManagePurchases && <button type="button" className="primary-button" onClick={() => setShowPurchaseForm(true)}>+ Nueva compra</button>}</div>}
              {!purchaseLoading && purchasesCount > purchasesPageSize && <div className="pagination-bar purchase-pagination"><span className="count-label">Mostrando {(purchasesPage-1)*purchasesPageSize+1}–{Math.min(purchasesPage*purchasesPageSize,purchasesCount)} de {purchasesCount} compras</span><div className="pagination-controls"><button type="button" className="secondary-button" disabled={purchasesPage<=1} onClick={()=>setPurchasesPage((page)=>Math.max(1,page-1))}>Anterior</button><span className="page-label">{purchasesPage} / {Math.ceil(purchasesCount/purchasesPageSize)}</span><button type="button" className="secondary-button" disabled={purchasesPage>=Math.ceil(purchasesCount/purchasesPageSize)} onClick={()=>setPurchasesPage((page)=>page+1)}>Siguiente</button></div></div>}
              {suppliers.length > 0 && <details className="supplier-directory panel"><summary>Proveedores guardados ({suppliers.length})</summary><div className="supplier-directory-list">{suppliers.map((supplier) => <div className="supplier-directory-row" key={supplier.id}><strong>{supplier.name}</strong><span>{supplier.phone || supplier.email || supplier.tax_id || "Sin contacto registrado"}</span></div>)}</div></details>}
            </> : effectivePurchaseTab === "suppliers" ? <>
              <div className="products-intro purchase-subintro">
                <div><h3>{screen === "suppliers" ? "Tus contactos de compra" : "Directorio de proveedores"}</h3><p>Organiza los datos de las personas y empresas que te suministran materiales y productos.</p></div>
                {canPermission("suppliers_manage") && <button type="button" className="primary-button compact-button" onClick={() => { setShowSupplierForm((open) => !open); setSupplierDraft(blankSupplier); setError(""); }}>{showSupplierForm ? "Cancelar" : "+ Nuevo proveedor"}</button>}
              </div>
              {canPermission("suppliers_manage") && showSupplierForm && <form className="purchase-form panel" onSubmit={addSupplier}>
                <div className="purchase-form-heading"><div><p className="eyebrow">CONTACTOS</p><h3>Nuevo proveedor</h3></div></div>
                <div className="purchase-form-grid">
                  <label><span className="field-label-heading">Nombre del proveedor *<FieldHelp enabled={contextualHelpEnabled} text="Nombre de la persona o empresa que te suministra productos o materiales." /></span><input value={supplierDraft.name} onChange={(e) => setSupplierDraft((d) => ({ ...d, name: e.target.value }))} maxLength={180} required placeholder="Nombre o empresa" /></label>
                  <label><span className="field-label-heading">NIT o documento<FieldHelp enabled={contextualHelpEnabled} text="Identificación tributaria o documento del proveedor, si lo tienes." /></span><input value={supplierDraft.tax_id} onChange={(e) => setSupplierDraft((d) => ({ ...d, tax_id: e.target.value }))} maxLength={80} placeholder="Opcional" /></label>
                  <label><span className="field-label-heading">Teléfono<FieldHelp enabled={contextualHelpEnabled} text="Teléfono de contacto del proveedor." /></span><input type="tel" value={supplierDraft.phone} onChange={(e) => setSupplierDraft((d) => ({ ...d, phone: e.target.value }))} maxLength={60} placeholder="Número de contacto" /></label>
                  <label><span className="field-label-heading">Correo<FieldHelp enabled={contextualHelpEnabled} text="Correo para comunicarte con el proveedor." /></span><input type="email" value={supplierDraft.email} onChange={(e) => setSupplierDraft((d) => ({ ...d, email: e.target.value }))} maxLength={254} placeholder="proveedor@correo.com" /></label>
                  <label className="purchase-span-two"><span className="field-label-heading">Dirección<FieldHelp enabled={contextualHelpEnabled} text="Dirección del proveedor para entregas, facturas o contacto." /></span><input value={supplierDraft.address} onChange={(e) => setSupplierDraft((d) => ({ ...d, address: e.target.value }))} maxLength={300} placeholder="Dirección del proveedor" /></label>
                  <label className="purchase-span-two"><span className="field-label-heading">Notas<FieldHelp enabled={contextualHelpEnabled} text="Información adicional útil sobre el proveedor." /></span><input value={supplierDraft.notes} onChange={(e) => setSupplierDraft((d) => ({ ...d, notes: e.target.value }))} maxLength={1000} placeholder="Información útil" /></label>
                </div>
                <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowSupplierForm(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar proveedor"}</button></div>
              </form>}
              {purchaseLoading ? <div className="empty-state">Cargando proveedores…</div> : suppliers.length ? <div className="supplier-directory-list supplier-directory-page">{suppliers.map((supplier) => <article className="supplier-directory-row panel mobile-detail-trigger" key={supplier.id} tabIndex={0} role="button" onClick={() => { if (window.matchMedia("(max-width: 640px)").matches) setSelectedRecordDetail({ type: "Proveedor", title: supplier.name, fields: [{label:"NIT o documento",value:supplier.tax_id},{label:"Teléfono",value:supplier.phone},{label:"Correo",value:supplier.email},{label:"Dirección",value:supplier.address}], notes:supplier.notes }); }} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && window.matchMedia("(max-width: 640px)").matches) { event.preventDefault(); setSelectedRecordDetail({ type: "Proveedor", title: supplier.name, fields: [{label:"NIT o documento",value:supplier.tax_id},{label:"Teléfono",value:supplier.phone},{label:"Correo",value:supplier.email},{label:"Dirección",value:supplier.address}], notes:supplier.notes }); } }}><div><strong>{supplier.name}</strong><span>{supplier.tax_id || "Sin NIT/documento"}</span></div><div><span>{supplier.phone || "Sin teléfono"}</span><span>{supplier.email || "Sin correo"}</span></div><div><span>{supplier.address || "Sin dirección"}</span>{supplier.notes && <small>{supplier.notes}</small>}</div></article>)}</div> : <div className="empty-state"><span className="empty-icon">♧</span><h3>Aún no hay proveedores</h3><p>Agrega tus proveedores para asociarlos a las compras y gastos. No hay datos de ejemplo.</p>{canPermission("suppliers_manage") && <button type="button" className="primary-button" onClick={() => setShowSupplierForm(true)}>+ Nuevo proveedor</button>}</div>}
            </> : <>
              <div className="products-intro purchase-subintro">
                <div><h3>Salidas de dinero</h3><p>Anota arriendo, servicios, reparaciones, herramientas y otros pagos para tener el costo real de funcionamiento.</p></div>
                {canManageExpenses && <button type="button" className="primary-button compact-button" onClick={() => { setShowExpenseForm((open) => !open); setError(""); setNotice(""); }}>{showExpenseForm ? "Cancelar gasto" : "+ Nuevo gasto"}</button>}
              </div>
              {canManageExpenses && showExpenseForm && <form className="purchase-form panel" onSubmit={addExpense}>
                <div className="purchase-form-heading"><div><p className="eyebrow">SALIDA DE DINERO</p><h3>Nuevo gasto</h3></div></div>
                <div className="purchase-form-grid">
                  <label><span className="field-label-heading">Descripción *<FieldHelp enabled={contextualHelpEnabled} text="Describe en qué consistió el gasto para reconocerlo en los reportes." /></span><input value={expenseDraft.description} onChange={(e) => setExpenseDraft((d) => ({ ...d, description: e.target.value }))} maxLength={220} required placeholder="Ej. Reparación de una máquina" /></label>
                  <label><span className="field-label-heading">Categoría<FieldHelp enabled={contextualHelpEnabled} text="Selecciona el tipo de gasto para agruparlo y entender en qué se usa el dinero." /></span><select value={expenseDraft.category} onChange={(e) => setExpenseDraft((d) => ({ ...d, category: e.target.value }))}><option>Operativo</option><option>Arriendo</option><option>Servicios públicos</option><option>Transporte</option><option>Publicidad</option><option>Reparaciones y mantenimiento</option><option>Muebles y equipos</option><option>Honorarios y servicios</option><option>Comisiones bancarias</option><option>Otro</option></select></label>
                  <label><span className="field-label-heading">Valor *<FieldHelp enabled={contextualHelpEnabled} text="Monto del gasto. Queda registrado como salida de dinero y se considera en el cálculo de rentabilidad." /></span><input type="number" min="0.01" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={expenseDraft.amount} onChange={(e) => setExpenseDraft((d) => ({ ...d, amount: e.target.value }))} required placeholder="0" /></label>
                  <label><span className="field-label-heading">Fecha *<FieldHelp enabled={contextualHelpEnabled} text="Registra la fecha en que se realizó el gasto." /></span><input type="date" value={expenseDraft.expense_date} onChange={(e) => setExpenseDraft((d) => ({ ...d, expense_date: e.target.value }))} required /></label>
                  <label><span className="field-label-heading">Forma de pago<FieldHelp enabled={contextualHelpEnabled} text="Elige el medio utilizado para pagar este gasto." /></span><select value={expenseDraft.payment_method} onChange={(e) => setExpenseDraft((d) => ({ ...d, payment_method: e.target.value }))}><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option><option>Otro</option></select></label>
                  <label><span className="field-label-heading">Proveedor<FieldHelp enabled={contextualHelpEnabled} text="Vincula el gasto con un proveedor si corresponde." /></span><select value={expenseDraft.supplier_id} onChange={(e) => { if (e.target.value === "__create_expense_supplier__") { setShowQuickExpenseSupplierForm(true); setError(""); return; } setExpenseDraft((d) => ({ ...d, supplier_id: e.target.value })); }}><option value="">Sin proveedor</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}{canPermission("suppliers_manage")&&<option value="__create_expense_supplier__">＋ Nuevo proveedor…</option>}</select></label>
                  {showQuickExpenseSupplierForm && canPermission("suppliers_manage") && <div className="inline-create-panel quick-expense-supplier full-span"><strong>Nuevo proveedor</strong><p className="inline-create-hint">Se guardará como contacto y quedará seleccionado en este gasto, sin borrar los datos del formulario.</p><div className="inline-create-fields-grid"><label><span>Nombre *</span><input value={supplierDraft.name} onChange={(e) => setSupplierDraft((d) => ({ ...d, name: e.target.value }))} maxLength={180} required /></label><label><span>NIT o documento</span><input value={supplierDraft.tax_id} onChange={(e) => setSupplierDraft((d) => ({ ...d, tax_id: e.target.value }))} maxLength={80} /></label><label><span>Teléfono</span><input type="tel" value={supplierDraft.phone} onChange={(e) => setSupplierDraft((d) => ({ ...d, phone: e.target.value }))} maxLength={60} /></label><label><span>Correo</span><input type="email" value={supplierDraft.email} onChange={(e) => setSupplierDraft((d) => ({ ...d, email: e.target.value }))} maxLength={254} /></label><label className="inline-create-span-two"><span>Dirección</span><input value={supplierDraft.address} onChange={(e) => setSupplierDraft((d) => ({ ...d, address: e.target.value }))} maxLength={300} /></label></div><div className="inline-create-actions"><button type="button" className="primary-button" disabled={busy || !supplierDraft.name.trim()} onClick={() => addSupplier()}>{busy ? "Guardando…" : "Guardar y seleccionar"}</button><button type="button" className="text-button" onClick={() => { setShowQuickExpenseSupplierForm(false); setSupplierDraft(blankSupplier); }}>Cancelar</button></div></div>}
                  <label className="purchase-span-two"><span className="field-label-heading">Nota<FieldHelp enabled={contextualHelpEnabled} text="Guarda una referencia, factura o detalle útil para reconocer este gasto después." /></span><input value={expenseDraft.notes} onChange={(e) => setExpenseDraft((d) => ({ ...d, notes: e.target.value }))} maxLength={1500} placeholder="Factura, referencia o detalle" /></label>
                </div>
                <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowExpenseForm(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar gasto"}</button></div>
              </form>}
              {purchaseLoading ? <div className="empty-state">Cargando gastos…</div> : expenseRows.length ? <div className="expense-record-list">{expenseRows.map((expense) => {
                const supplier = suppliers.find((item) => item.id === expense.supplier_id);
                return <article className="expense-record panel mobile-detail-trigger" key={expense.id} onClick={(event) => { if (!window.matchMedia("(max-width: 640px)").matches || event.target.closest("button,a,input,select,textarea")) return; setSelectedRecordDetail({type:"Gasto",title:expense.description || "Gasto",fields:[{label:"Categoría",value:expense.category},{label:"Fecha",value:new Date(expense.expense_date+"T12:00:00-05:00").toLocaleDateString("es-CO",{timeZone:"America/Bogota",dateStyle:"medium"})},{label:"Valor",value:money(expense.amount_minor,expense.currency_code||currencyCode)},{label:"Forma de pago",value:expense.payment_method},{label:"Proveedor",value:supplier?.name || "Sin proveedor"}],notes:expense.notes}); }}>
                  <div className="expense-record-main"><span className="expense-category">{expense.category}</span><strong>{expense.description}</strong><span>{new Date(expense.expense_date + "T12:00:00-05:00").toLocaleDateString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium" })}{supplier ? " · " + supplier.name : ""}{expense.payment_method ? " · " + expense.payment_method : ""}</span>{expense.notes && <small>{expense.notes}</small>}</div>
                  <strong className="expense-amount">{money(expense.amount_minor, expense.currency_code || currencyCode)}</strong>
                </article>;
              })}</div> : <div className="empty-state"><span className="empty-icon">↘</span><h3>No hay gastos en este periodo</h3><p>Prueba otra fecha o elige «Todo» para consultar el historial completo. No hay datos de ejemplo.</p>{canManageExpenses && <button type="button" className="primary-button" onClick={() => setShowExpenseForm(true)}>+ Nuevo gasto</button>}</div>}
              {!purchaseLoading && expensesCount > expensesPageSize && <div className="pagination-bar purchase-pagination"><span className="count-label">Mostrando {(expensesPage-1)*expensesPageSize+1}–{Math.min(expensesPage*expensesPageSize,expensesCount)} de {expensesCount} gastos</span><div className="pagination-controls"><button type="button" className="secondary-button" disabled={expensesPage<=1} onClick={()=>setExpensesPage((page)=>Math.max(1,page-1))}>Anterior</button><span className="page-label">{expensesPage} / {Math.ceil(expensesCount/expensesPageSize)}</span><button type="button" className="secondary-button" disabled={expensesPage>=Math.ceil(expensesCount/expensesPageSize)} onClick={()=>setExpensesPage((page)=>page+1)}>Siguiente</button></div></div>}
            </>}
          </section>
        ) : screen === "products" ? (

          <section className="products-page">
            <section className="inventory-overview">
              <div className="inventory-page-heading">
                <div><p className="eyebrow">CATÁLOGO Y EXISTENCIAS</p><h2>Inventario</h2><p>Controla tus artículos, revisa el valor de las existencias y encuentra rápidamente lo que necesitas reponer.</p></div>
                {canManageProducts && <button className="primary-button compact-button" disabled={bulkEditMode || bulkProductsLoading || bulkProductsSaving} onClick={() => { if (showProductForm) cancelProductForm(); else { setShowProductForm(true); setEditingProductId(null); setProductForm(blankProduct); setError(""); } }}>{showProductForm ? (editingProductId ? "Cancelar edición" : "Cancelar") : "＋ Agregar artículo"}</button>}
              </div>
              <div className="inventory-metric-grid">
                <article className="inventory-metric-card"><span>Referencias en inventario</span><strong>{inventoryOverviewLoading ? "…" : inventoryOverview.productCount.toLocaleString("es-CO")}</strong><p>Artículos guardados en tu tienda</p></article>
                <article className="inventory-metric-card"><span>Unidades disponibles</span><strong>{inventoryOverviewLoading ? "…" : inventoryOverview.trackedUnits.toLocaleString("es-CO", { maximumFractionDigits: 3 })}</strong><p>Existencias físicas registradas</p></article>
                <article className="inventory-metric-card"><span>Costo total del inventario</span><strong>{inventoryOverviewLoading ? "Calculando…" : money(inventoryOverview.costMinor, currencyCode)}</strong><p>Costo de las unidades en stock</p></article>
                <article className="inventory-metric-card"><span>Valor de venta estimado</span><strong>{inventoryOverviewLoading ? "Calculando…" : money(inventoryOverview.retailMinor, currencyCode)}</strong><p>Si se vende todo el stock disponible</p></article>
                <button type="button" className={"inventory-metric-card inventory-metric-action" + (productStockFilter === "out_of_stock" ? " selected" : "")} onClick={() => { setProductStockFilter((current) => current === "out_of_stock" ? "all" : "out_of_stock"); setProductPage(1); }} aria-pressed={productStockFilter === "out_of_stock"}><span>Sin stock</span><strong>{inventoryOverviewLoading ? "…" : inventoryOverview.outOfStockCount.toLocaleString("es-CO")}</strong><p>{productStockFilter === "out_of_stock" ? "Mostrar todos los artículos" : "Ver artículos agotados"}</p></button>
              </div>
              {inventoryOverview.lowStockCount > 0 && <button type="button" className="inventory-low-stock-notice" onClick={() => { setProductStockFilter((current) => current === "low_stock" ? "all" : "low_stock"); setProductPage(1); }}><span><strong>{inventoryOverview.lowStockCount} {inventoryOverview.lowStockCount === 1 ? "artículo necesita" : "artículos necesitan"} reposición</strong><small>Según el mínimo definido en cada ficha.</small></span><span>{productStockFilter === "low_stock" ? "Ver todos" : "Revisar"} ›</span></button>}
            </section>
            <div className="inventory-data-actions"><div><strong>Carga inicial del inventario</strong><p>Descarga una plantilla compatible con Excel y carga hasta 500 artículos por archivo CSV. Los códigos repetidos o filas inválidas se omiten y se informan.</p></div><div className="inventory-data-action-buttons"><button type="button" className="secondary-button" onClick={downloadInventoryTemplate}>Descargar plantilla</button><label className={"secondary-button inventory-import-label"+(inventoryImportBusy?" disabled":"")}>{inventoryImportBusy?"Importando…":"Importar CSV"}<input type="file" accept=".csv,text/csv" onChange={importInventoryFile} disabled={inventoryImportBusy||!canManageProducts} /></label></div>{inventoryImportProgress&&<span className="inventory-import-progress">{inventoryImportProgress}</span>}</div>
            <div className="inventory-controls panel">
              <label className="inventory-search"><span>Buscar artículo</span><input value={search} onChange={(e) => { setSearch(e.target.value); setProductPage(1); }} placeholder="Nombre, código o descripción…" /></label>
              <label><span>Existencias</span><select value={productStockFilter} onChange={(e) => { setProductStockFilter(e.target.value); setProductPage(1); }}><option value="all">Todos los niveles</option><option value="in_stock">Con stock</option><option value="low_stock">Bajo el mínimo</option><option value="out_of_stock">Sin stock</option></select></label>
              <label><span>Categoría</span><select value={productCategoryFilter} onChange={(e) => { setProductCategoryFilter(e.target.value); setProductPage(1); }}><option value="all">Todas las categorías</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
              <label><span>Tipo</span><select value={productTypeFilter} onChange={(e) => { setProductTypeFilter(e.target.value); setProductPage(1); }}><option value="all">Todos los tipos</option><option value="physical">Físicos</option><option value="service">Servicios</option><option value="digital">Digitales</option></select></label>
              <label><span>Ordenar por</span><select value={productSort} onChange={(e) => { setProductSort(e.target.value); setProductPage(1); }}><option value="name">Nombre (A–Z)</option><option value="name_desc">Nombre (Z–A)</option><option value="code">Código (A–Z)</option><option value="code_desc">Código (Z–A)</option><option value="price">Precio (menor a mayor)</option><option value="price_desc">Precio (mayor a menor)</option><option value="cost">Costo (menor a mayor)</option><option value="cost_desc">Costo (mayor a menor)</option><option value="stock">Existencias (menor a mayor)</option><option value="stock_desc">Existencias (mayor a menor)</option><option value="profit">Ganancia (mayor a menor)</option><option value="profit_asc">Ganancia (menor a mayor)</option><option value="margin">Margen (mayor a menor)</option><option value="margin_asc">Margen (menor a mayor)</option></select></label>
              <span className="inventory-result-count">{productsLoading ? "Actualizando inventario…" : productsCount.toLocaleString("es-CO") + (productsCount === 1 ? " resultado" : " resultados")}</span>
            </div>
            {canManageProducts && !showProductForm && <div className="category-manager">
              <button type="button" className="category-toggle" onClick={() => setShowCategoryManager((open) => !open)} aria-expanded={showCategoryManager}>
                <span>{showCategoryManager ? "▾" : "▸"} Gestionar categorías</span><span className="category-toggle-count">{categories.length}</span>
              </button>
              {showCategoryManager && <section className="category-panel panel">
                <p className="category-management-hint">Para crear una categoría nueva, utiliza el desplegable «Categoría» dentro de la ficha del artículo. Aquí puedes renombrar o eliminar las categorías existentes.</p>
                {categories.length ? <div className="category-admin-list">{categories.map((category) => <div className="category-admin-row" key={category.id}>
                  {editingCategoryId === category.id ? <form className="category-edit-form" onSubmit={updateCategory}><input value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} maxLength={80} required autoFocus aria-label="Nuevo nombre de categoría" /><button className="secondary-button" disabled={busy}>Guardar</button><button type="button" className="text-button" onClick={() => { setEditingCategoryId(null); setEditingCategoryName(""); }}>Cancelar</button></form> : <>
                    <span className="category-admin-name">{category.name}</span>
                    <div className="category-admin-actions"><button type="button" className="icon-action-button" title="Editar categoría" aria-label="Editar categoría" onClick={() => { setEditingCategoryId(category.id); setEditingCategoryName(category.name); setConfirmDeleteCategoryId(null); }}><AppIcon name="edit" size={15}/></button>
                      {confirmDeleteCategoryId === category.id ? <><button type="button" className="text-button danger-text" disabled={busy} onClick={() => deleteCategory(category.id)}>Sí, eliminar</button><button type="button" className="text-button" onClick={() => setConfirmDeleteCategoryId(null)}>Cancelar</button></> : <button type="button" className="icon-action-button icon-action-danger" title="Eliminar categoría" aria-label="Eliminar categoría" onClick={() => setConfirmDeleteCategoryId(category.id)}><AppIcon name="trash" size={15}/></button>}
                    </div>
                  </>}
                </div>)}</div> : <p className="category-empty-note">No hay categorías todavía.</p>}
              </section>}
            </div>}
            {canManageProducts && showProductForm && <form className="product-form panel" onSubmit={addProduct}>
              <h3>{editingProductId ? "Editar producto" : "Datos del producto"}</h3>
              {!editingProductId && <div className="product-photo-uploader full-span">
                <span className="photo-section-label">Fotos del producto (máximo 3)</span>
                <div className="photo-slot-grid">
                  {stagedImages.map((image, index) => <figure className="photo-filled-slot" key={image.preview}>
                    <img src={image.preview} alt={image.name} />
                    <button type="button" className="photo-remove-button" title="Quitar foto" aria-label={"Quitar foto " + (index + 1)} onClick={() => { URL.revokeObjectURL(image.preview); setStagedImages((current) => current.filter((_, i) => i !== index)); }}>×</button>
                  </figure>)}
                  {Array.from({ length: Math.max(0, 3 - stagedImages.length) }).map((_, index) => <label className="photo-empty-slot" key={"photo-empty-" + index}>
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || stagedImages.length >= 3} onChange={chooseNewProductImages} />
                    <span className="photo-plus" aria-hidden="true">＋</span><strong>Agregar foto<FieldHelp enabled={contextualHelpEnabled} text="Selecciona una imagen para la fotografía del producto. Se aceptan JPG, PNG o WebP." /></strong>
                  </label>)}
                </div>
                <span className="photo-help">JPG, PNG o WebP. Máximo 5 MB al cargarla; se convierte a WebP de máximo 1,5 MB antes de guardarse.</span>
              </div>}
              <div className="form-grid">
                <label><span className="field-label-heading">Nombre *<FieldHelp enabled={contextualHelpEnabled} text="Nombre con el que identificas el producto o servicio en las listas y ventas." /></span><input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} maxLength={160} required placeholder="Ej. Camiseta blanca" /></label>
                <label><span className="field-label-heading">Código del artículo<FieldHelp enabled={contextualHelpEnabled} text="Código interno o SKU para identificar y buscar este artículo. Puedes dejarlo vacío." /></span><input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} maxLength={100} placeholder="Ej. SKU-001" /></label>
                <div className="product-category-field"><label><span className="field-label-heading">Categoría<FieldHelp enabled={contextualHelpEnabled} text="Clasifica el producto para organizarlo y encontrarlo con mayor facilidad." /></span><select value={productForm.category_id} onChange={(e) => { if (e.target.value === "__create_category__") { setShowQuickCategoryForm(true); return; } setProductForm((current) => ({ ...current, category_id: e.target.value })); }}><option value="">Sin categoría</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}<option value="__create_category__">＋ Nueva categoría…</option></select></label>{showQuickCategoryForm && <div className="inline-create-panel" onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }}><label><span>Nombre de la nueva categoría</span><input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} maxLength={80} placeholder="Ej. Accesorios, insumos…" autoFocus /></label><div className="inline-create-actions"><button type="button" className="primary-button" disabled={busy || !categoryName.trim()} onClick={() => addCategory()}>{busy ? "Guardando…" : "Crear y seleccionar"}</button><button type="button" className="text-button" onClick={() => { setShowQuickCategoryForm(false); setCategoryName(""); }}>Cancelar</button></div></div>}</div>
                <label><span className="field-label-heading">Tipo<FieldHelp enabled={contextualHelpEnabled} text="El tipo determina si el artículo maneja inventario físico, corresponde a un servicio o es digital." /></span><select value={productForm.product_type} disabled={!!editingProductId} onChange={(e) => setProductForm({ ...productForm, product_type: e.target.value, stock: e.target.value === "physical" ? productForm.stock : "0" })}><option value="physical">Producto físico</option><option value="service">Servicio</option><option value="digital">Producto digital</option></select></label>
                <label><span className="field-label-heading">Precio de venta<FieldHelp enabled={contextualHelpEnabled} text="Precio que cobras al cliente por una unidad. Se usa al calcular el total de la venta." /></span><input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={productForm.sale_price} onChange={(e) => setProductForm({ ...productForm, sale_price: e.target.value })} required placeholder={currencyDigits(currencyCode) === 0 ? "0" : "0.00"} /></label>
                <label><span className="field-label-heading">Costo por unidad<FieldHelp enabled={contextualHelpEnabled} text="Cuánto te cuesta adquirir o elaborar una unidad. Este dato ayuda a calcular la utilidad." /></span><input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={productForm.cost_price} onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })} required placeholder={currencyDigits(currencyCode) === 0 ? "0" : "0.00"} /></label>
                <label><span className="field-label-heading">Unidad<FieldHelp enabled={contextualHelpEnabled} text="Selecciona cómo mides o vendes este producto, por ejemplo unidad, par, kilogramo o servicio." /></span><select value={productForm.unit_name} onChange={(e) => setProductForm({ ...productForm, unit_name: e.target.value })} required>{unitOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label><span className="field-label-heading">Presentación comercial<FieldHelp enabled={contextualHelpEnabled} text="Anota el formato comercial para distinguir presentaciones, por ejemplo caja por 12 o botella de 500 ml." /></span><input value={productForm.commercial_presentation} onChange={(e) => setProductForm({ ...productForm, commercial_presentation: e.target.value })} maxLength={120} placeholder="Ej. 80 g, caja x 12, 500 ml" /></label>
                {productForm.unit_name === "personalizada" && <label><span className="field-label-heading">Nombre de la unidad<FieldHelp enabled={contextualHelpEnabled} text="Si eliges una unidad personalizada, escribe aquí su nombre." /></span><input value={productForm.unit_custom} onChange={(e) => setProductForm({ ...productForm, unit_custom: e.target.value })} maxLength={30} required placeholder="Ej. lámina, rollo, sesión" /></label>}
                {productForm.product_type === "physical" && <><label><span className="field-label-heading">{editingProductId ? "Existencias actuales" : "Existencias iniciales"}<FieldHelp enabled={contextualHelpEnabled} text="Existencias actuales al editar un producto o cantidad inicial al crearlo. Las operaciones pueden actualizar el inventario." /></span><input type="number" min="0" step="0.001" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} readOnly={!!editingProductId} required /></label><label><span className="field-label-heading">Avisarme cuando queden<FieldHelp enabled={contextualHelpEnabled} text="Define el mínimo de existencias. Cuando el inventario llegue a ese número o baje de él, sabrás que debes reponer." /></span><input type="number" min="0" step="0.001" value={productForm.low_stock} onChange={(e) => setProductForm({ ...productForm, low_stock: e.target.value })} placeholder="Ej. 3" /></label></>}
                <label className="full-span"><span className="field-label-heading">Descripción<FieldHelp enabled={contextualHelpEnabled} text="Agrega detalles que ayuden a distinguir el producto y explicárselo a tus clientes." /></span><textarea rows="2" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} maxLength={2000} placeholder="Detalles que te ayuden a identificarlo" /></label>
              </div>
              {editingProductId && products.find((item) => item.id === editingProductId) && <div className="product-edit-tools full-span">
                {renderStockAdjustment(products.find((item) => item.id === editingProductId))}
                <section className="edit-subpanel"><div className="edit-subpanel-heading"><strong>Fotografías</strong><span>Hasta 3 fotos</span></div>{renderPhotoManager(products.find((item) => item.id === editingProductId))}</section>
              </div>}
              {!categories.length && <p className="helper-text full-span">Puedes añadir categorías desde el botón «Categorías».</p>}
              <p className="helper-text">{editingProductId ? "Las existencias se ajustan aquí y las fotos se administran dentro de esta ficha." : "La presentación comercial es opcional. El inventario inicial queda guardado en el historial; luego puedes completar los datos desde Editar."}</p>
              <div className="form-actions"><button type="button" className="secondary-button" onClick={cancelProductForm}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? "Guardando…" : editingProductId ? "Guardar cambios" : "Guardar producto"}</button></div>
            </form>}
            <div className="product-tools"><div className="product-tools-actions">
                {canManageProducts && <button type="button" className="secondary-button action-small" onClick={() => { setShowArchivedProducts((show) => !show); setProductPage(1); }} disabled={bulkEditMode || bulkProductsLoading || bulkProductsSaving}>{showArchivedProducts ? "Ver activos" : "Archivados"}</button>}
                {canManageProducts && <button type="button" className="secondary-button action-small bulk-edit-toggle" disabled={bulkProductsLoading || bulkProductsSaving} onClick={() => { if (bulkEditMode) { if (bulkEditHasChanges && !window.confirm("Hay cambios sin guardar. ¿Quieres salir sin guardarlos?")) return; setBulkEditMode(false); } else { loadBulkProducts(); } }}>{bulkEditMode ? "Salir de edición masiva" : bulkProductsLoading ? "Cargando inventario…" : "Editar todos"}</button>}
                <div className="view-switch" role="group" aria-label="Vista de productos">
                  <button type="button" className={viewMode === "rows" ? "view-option active" : "view-option"} onClick={() => setViewMode("rows")} aria-pressed={viewMode === "rows"}><span>☷</span> Filas</button>
                  <button type="button" className={viewMode === "cards" ? "view-option active" : "view-option"} onClick={() => setViewMode("cards")} aria-pressed={viewMode === "cards"}><span>▦</span> Tarjetas</button>
                </div>
                <span className="count-label">{productsCount} {productsCount === 1 ? "artículo" : "artículos"}</span>
              </div>
            </div>
            {bulkEditMode && <section className="bulk-inventory-editor">
              <div className="bulk-inventory-heading">
                <div><span className="eyebrow">INVENTARIO · EDICIÓN EN LOTE</span><h3>Edita varios artículos en una sola vista</h3><p>Los cambios se guardan solo cuando pulses «Guardar cambios». La ganancia y el margen se recalculan automáticamente.</p></div>
                <div className="bulk-inventory-summary"><strong>{visibleBulkProductRows.length.toLocaleString("es-CO")}</strong><span>{visibleBulkProductRows.length === 1 ? "artículo visible" : "artículos visibles"}</span></div>
              </div>
              {bulkProductsLoading ? <div className="empty-state">Cargando todos los artículos del inventario…</div> : visibleBulkProductRows.length ? <div className="bulk-inventory-grid">
                {visibleBulkProductRows.map((row) => {
                  const saleMinor = Number.isFinite(Number(row._draftSalePrice)) ? toMinorUnits(row._draftSalePrice || 0, currencyCode) : 0;
                  const costMinor = Number.isFinite(Number(row._draftCostPrice)) ? toMinorUnits(row._draftCostPrice || 0, currencyCode) : 0;
                  const profitMinor = saleMinor - costMinor;
                  const margin = saleMinor > 0 ? (profitMinor / saleMinor) * 100 : 0;
                  const changed = String(row._draftName ?? "").trim() !== String(row.name ?? "").trim() ||
                    String(row._draftSku ?? "").trim() !== String(row.sku ?? "").trim() ||
                    Number(row._draftSalePrice || 0) !== Number(row.sale_price_minor || 0) / (10 ** currencyDigits(currencyCode)) ||
                    Number(row._draftCostPrice || 0) !== Number(row.cost_price_minor || 0) / (10 ** currencyDigits(currencyCode)) ||
                    (row.track_inventory && Number(row._draftStock || 0) !== Number(row.stock_on_hand || 0));
                  return <article className={"bulk-inventory-card" + (changed ? " has-changes" : "")} key={row.id}>
                    <div className="bulk-card-heading">
                      <div className="product-symbol">{row.product_type === "service" ? "◷" : row.product_type === "digital" ? "◇" : "▦"}</div>
                      <span className={row.is_sellable ? "status-pill status-active" : "status-pill status-inactive"}>{row.is_sellable ? "Activo" : "Inactivo"}</span>
                    </div>
                    <label className="bulk-card-name"><span>Producto</span><input value={row._draftName} maxLength={160} onChange={(event) => updateBulkDraft(row.id, "_draftName", event.target.value)} aria-label={"Nombre de " + row.name} /></label>
                    <div className="bulk-card-meta"><span>{categories.find((category) => category.id === row.category_id)?.name || "Sin categoría"}</span></div>
                    <label className="bulk-card-sku-field"><span>Código del artículo</span><input value={row._draftSku} maxLength={100} onChange={(event) => updateBulkDraft(row.id, "_draftSku", event.target.value)} aria-label={"Código de " + row.name} placeholder="Opcional" /></label>
                    <div className="bulk-card-edit-fields">
                      <label><span>Precio</span><input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={row._draftSalePrice} onChange={(event) => updateBulkDraft(row.id, "_draftSalePrice", event.target.value)} /></label>
                      <label><span>Costo</span><input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={row._draftCostPrice} onChange={(event) => updateBulkDraft(row.id, "_draftCostPrice", event.target.value)} /></label>
                      <label className="bulk-card-stock-field"><span>Cantidad disponible</span><input type="number" min="0" step="0.001" disabled={!row.track_inventory} value={row.track_inventory ? row._draftStock : ""} placeholder="No aplica" onChange={(event) => updateBulkDraft(row.id, "_draftStock", event.target.value)} /></label>
                    </div>
                    <div className="bulk-card-profit">
                      <div><span>Ganancia por unidad</span><strong className={profitMinor < 0 ? "negative-value" : ""}>{money(profitMinor, currencyCode)}</strong></div>
                      <div><span>Margen</span><strong className={margin < 0 ? "negative-value" : ""}>{margin.toLocaleString("es-CO", { maximumFractionDigits: 1 })}%</strong></div>
                    </div>
                    <div className="bulk-card-footer">
                      <span className={changed ? "bulk-change-status pending" : "bulk-change-status"}>{changed ? "Sin guardar" : "Al día"}</span>
                      <button type="button" className="text-button" onClick={() => openBulkHistory(row)}>Historial</button>
                    </div>
                  </article>;
                })}
              </div> : <div className="empty-state"><h3>No hay artículos para editar</h3><p>Prueba otra búsqueda o revisa el filtro de archivados.</p></div>}
              <div className="bulk-inventory-footer">
                <span>{bulkEditHasChanges ? "Tienes cambios pendientes." : "Todos los artículos están al día."} Las variaciones de stock se registran en el historial.</span>
                <button type="button" className="primary-button" disabled={bulkProductsSaving || bulkProductsLoading || !bulkEditHasChanges} onClick={saveBulkProductChanges}>{bulkProductsSaving ? "Guardando cambios…" : "Guardar cambios"}</button>
              </div>
            </section>}

            {bulkHistoryProduct && <div className="bulk-history-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setBulkHistoryProduct(null); }}>
              <section className="bulk-history-dialog panel" role="dialog" aria-modal="true" aria-label={"Historial de " + bulkHistoryProduct.name}>
                <div className="bulk-history-heading"><div><span className="eyebrow">MOVIMIENTOS DE STOCK</span><h3>{bulkHistoryProduct.name}</h3><p>Consulta las entradas, salidas y ajustes registrados de este artículo.</p></div><button type="button" className="icon-action-button" aria-label="Cerrar historial" onClick={() => setBulkHistoryProduct(null)}>×</button></div>
                {bulkHistoryLoading ? <div className="empty-state">Cargando historial…</div> : bulkHistoryRows.length ? <div className="bulk-history-list">{bulkHistoryRows.map((movement) => {
                  const quantity = Number(movement.quantity_delta || 0);
                  const label = ({ opening: "Existencias iniciales", sale: "Venta", purchase: "Compra", adjustment_in: "Ajuste de entrada", adjustment_out: "Ajuste de salida", return: "Devolución", return_in: "Devolución", damage: "Daño o pérdida" })[movement.movement_type] || (movement.movement_type ? movement.movement_type.replaceAll("_", " ") : "Movimiento");
                  return <article className="bulk-history-row" key={movement.id}><strong className={quantity < 0 ? "negative-value" : ""}>{quantity > 0 ? "+" : ""}{quantity.toLocaleString("es-CO")}</strong><div><b>{label}</b><span>{new Date(movement.created_at).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium", timeStyle: "short" })}</span>{movement.notes && <small>{movement.notes}</small>}</div></article>;
                })}</div> : <div className="empty-state"><h3>Sin movimientos</h3><p>Este artículo aún no tiene movimientos de existencias registrados.</p></div>}
                {bulkHistoryCount > 10 && <div className="bulk-history-pagination"><button type="button" className="secondary-button" disabled={bulkHistoryPage <= 1 || bulkHistoryLoading} onClick={() => setBulkHistoryPage((page) => Math.max(1, page - 1))}>Anterior</button><span>Página {bulkHistoryPage} de {Math.ceil(bulkHistoryCount / 10)}</span><button type="button" className="secondary-button" disabled={bulkHistoryPage >= Math.ceil(bulkHistoryCount / 10) || bulkHistoryLoading} onClick={() => setBulkHistoryPage((page) => Math.min(Math.ceil(bulkHistoryCount / 10), page + 1))}>Siguiente</button></div>}
              </section>
            </div>}

            {viewingVariantsFor && (() => {
              const variantProduct = products.find((product) => product.id === viewingVariantsFor);
              if (!variantProduct) return null;
              const rows = variantsByProduct[variantProduct.id] || [];
              return <div className="variant-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setViewingVariantsFor(null); resetVariantDraft(); } }}>
                <section className="variant-manager panel" role="dialog" aria-modal="true" aria-label={"Variantes de " + variantProduct.name}>
                  <div className="variant-manager-heading"><div><p className="eyebrow">PRODUCTO</p><h3>Variantes de {variantProduct.name}</h3><p>Ejemplos: talla M, color azul o presentación de 500 ml.</p></div><button type="button" className="icon-action-button" title="Cerrar" aria-label="Cerrar variantes" onClick={() => { setViewingVariantsFor(null); resetVariantDraft(); }}>×</button></div>
                  {rows.length ? <div className="variant-list">{rows.map((variant) => <article className={"variant-row" + (!variant.is_active ? " variant-inactive" : "")} key={variant.id}>
                    <div className="variant-row-main"><strong>{variant.variant_name}: {variant.variant_value}</strong><span>{variant.sku ? "Código " + variant.sku : "Sin código"}{variant.stock_on_hand != null ? " · Existencias " + Number(variant.stock_on_hand).toLocaleString("es-CO") : ""}</span>{variant.sale_price_minor != null && <small>{money(variant.sale_price_minor, currencyCode)}</small>}</div>
                    <div className="variant-row-actions">{canManageProducts && <button type="button" className="text-button" onClick={() => editProductVariant(variant)}>Editar</button>}{canManageProducts && <button type="button" className="text-button danger-text" disabled={variantBusy} onClick={() => removeProductVariant(variant)}>Quitar</button>}</div>
                  </article>)}</div> : <div className="variant-empty"><strong>Este producto todavía no tiene variantes</strong><span>Añade talla, color, tamaño u otra opción que necesites distinguir.</span></div>}
                  {canManageProducts && <form className="variant-form" onSubmit={saveProductVariant}>
                    <h4>{editingVariantId ? "Editar variante" : "Añadir variante"}</h4>
                    <div className="variant-form-grid">
                      <label><span className="field-label-heading">Tipo de variante *<FieldHelp enabled={contextualHelpEnabled} text="Escribe qué característica diferencia la variante, por ejemplo Talla o Color." /></span><input value={variantDraft.variant_name} onChange={(event) => setVariantDraft((draft) => ({ ...draft, variant_name: event.target.value }))} maxLength={80} required placeholder="Ej. Talla" /></label>
                      <label><span className="field-label-heading">Valor *<FieldHelp enabled={contextualHelpEnabled} text="Indica el valor de la variante, por ejemplo M, Azul o 500 ml." /></span><input value={variantDraft.variant_value} onChange={(event) => setVariantDraft((draft) => ({ ...draft, variant_value: event.target.value }))} maxLength={120} required placeholder="Ej. M" /></label>
                      <label><span className="field-label-heading">Código de variante<FieldHelp enabled={contextualHelpEnabled} text="Código interno opcional para distinguir esta variante." /></span><input value={variantDraft.sku} onChange={(event) => setVariantDraft((draft) => ({ ...draft, sku: event.target.value }))} maxLength={100} placeholder="Opcional" /></label>
                      <label><span className="field-label-heading">Precio propio<FieldHelp enabled={contextualHelpEnabled} text="Deja vacío para usar el precio general del producto; escribe un valor si esta variante tiene otro precio." /></span><input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={variantDraft.sale_price} onChange={(event) => setVariantDraft((draft) => ({ ...draft, sale_price: event.target.value }))} placeholder="Usar precio del producto" /></label>
                      <label><span className="field-label-heading">Existencias propias<FieldHelp enabled={contextualHelpEnabled} text="Existencias reservadas para esta variante, cuando cada variante lleva inventario separado." /></span><input type="number" min="0" step="0.001" value={variantDraft.stock_on_hand} onChange={(event) => setVariantDraft((draft) => ({ ...draft, stock_on_hand: event.target.value }))} placeholder="Sin inventario separado" /></label>
                    </div>
                    <p className="helper-text">Si dejas precio o existencias vacíos, esta variante usará los datos generales del producto. Las variantes aún no sustituyen el inventario principal en el registro de ventas.</p>
                    <div className="form-actions"><button type="button" className="secondary-button" onClick={resetVariantDraft}>Limpiar</button><button type="submit" className="primary-button" disabled={variantBusy}>{variantBusy ? "Guardando…" : editingVariantId ? "Guardar cambios" : "Añadir variante"}</button></div>
                  </form>}
                </section>
              </div>;
            })()}
            {!bulkEditMode && (productsLoading ? <div className="empty-state">Cargando tus productos…</div> : filteredProducts.length ? (
              viewMode === "rows" ? (
                <div className="product-table-wrap panel">
                  <table className="product-table">
                    <thead><tr>
                      <th>Producto</th><th>Código</th><th>Unidad</th><th>Precio {currencyCode}</th><th>Otras monedas</th><th>Presentación</th><th>Existencias</th><th>Estado</th><th>Catálogo</th><th>Compartir / acciones</th>
                    </tr></thead>
                    <tbody>{filteredProducts.map((p) => <React.Fragment key={p.id}>
                      <tr className="product-table-row mobile-detail-trigger" onClick={(event) => { if (!window.matchMedia("(max-width: 640px)").matches || event.target.closest("button,a,input,select,textarea")) return; openProductDetail(p); }}>
                        <td className="product-table-name"><div className="product-cell">
                          <div className="product-symbol product-thumb">{p.image_paths?.[0] && productImageUrls[p.id + "|" + p.image_paths[0]] ? <img src={productImageUrls[p.id + "|" + p.image_paths[0]]} alt={"Foto de " + p.name} onError={() => handleProductImageError(p.id, p.image_paths[0])} /> : <span>{p.product_type === "service" ? "◷" : p.product_type === "digital" ? "◇" : "▦"}</span>}</div>
                          <div className="product-cell-copy"><strong>{p.name}</strong><span>{categories.find((cat) => cat.id === p.category_id)?.name || "Sin categoría"} · {p.product_type === "physical" ? "Producto físico" : p.product_type === "service" ? "Servicio" : "Digital"}</span></div>
                        </div></td>
                        <td><code className="product-code">{p.sku || "—"}</code></td>
                        <td>{p.unit_name || "unidad"}</td>
                        <td className="product-table-price"><strong>{money(p.sale_price_minor, currencyCode)}</strong><small>Costo {money(p.cost_price_minor, currencyCode)}</small></td>
                        <td><span className="muted-value">—</span></td>
                        <td>{p.commercial_presentation || <span className="muted-value">—</span>}</td>
                        <td><div className="product-table-stock"><strong>{p.track_inventory ? Number(p.stock_on_hand).toLocaleString("es-CO") : "No aplica"}</strong>{p.track_inventory && <small>{p.unit_name || "unidades"}</small>}{p.track_inventory && p.low_stock_threshold !== null && Number(p.stock_on_hand) <= Number(p.low_stock_threshold) && <span className="stock-alert">Pocas existencias</span>}</div></td>
                        <td><span className={p.archived_at ? "status-pill status-inactive" : p.is_sellable ? "status-pill status-active" : "status-pill status-inactive"}>{p.archived_at ? "Archivado" : p.is_sellable ? "Activo" : "Inactivo"}</span></td>
                        <td><div className="catalog-cell"><span className={p.is_published ? "status-pill status-published" : "status-pill status-unpublished"}>{p.is_published ? "Publicado" : "No publicado"}</span></div></td>
                        <td><div className="product-row-actions">
                          <button type="button" className="icon-action-button share-product-button" title={"Compartir "+p.name} aria-label={"Compartir "+p.name} onClick={()=>shareProduct(p)}>↗</button>{canManageProducts && <button type="button" className="icon-action-button" title="Editar producto" aria-label="Editar producto" onClick={() => startEditProduct(p)}><AppIcon name="edit" size={16}/></button>}
                        </div></td>
                      </tr>
                    </React.Fragment>)}</tbody>
                  </table>
                </div>
              ) : (
                <div className="product-list product-list-cards">{filteredProducts.map((p) => {
  const productVariants = variantsByProduct[p.id] || [];
  const productProfitMinor = Number(p.sale_price_minor || 0) - Number(p.cost_price_minor || 0);
  const productMargin = Number(p.sale_price_minor || 0) > 0 ? (productProfitMinor / Number(p.sale_price_minor)) * 100 : 0;
  return <article className="product-card panel product-card-wa mobile-detail-trigger" key={p.id} onClick={(event) => { if (!window.matchMedia("(max-width: 640px)").matches || event.target.closest("button,a,input,select,textarea")) return; openProductDetail(p); }}>
    <div className="product-card-wa-top">
      <div className="product-symbol product-thumb">{p.image_paths?.[0] && productImageUrls[p.id + "|" + p.image_paths[0]] ? <img src={productImageUrls[p.id + "|" + p.image_paths[0]]} alt={"Foto de " + p.name} onError={() => handleProductImageError(p.id, p.image_paths[0])} /> : <span>{p.product_type === "service" ? "◷" : p.product_type === "digital" ? "◇" : "▦"}</span>}</div>
      <div className="product-card-wa-copy">
        <h3>{p.name}</h3>
        <span className="product-card-wa-category">{categories.find((cat) => cat.id === p.category_id)?.name || "Sin categoría"}</span>
        <div className="product-card-wa-code"><span>Código</span><code>{p.sku || "—"}</code></div>
      </div>
    </div>
    <div className="product-card-wa-price-row">
      <div className="product-card-wa-price"><strong>{money(p.sale_price_minor, currencyCode)}</strong><small>Costo {money(p.cost_price_minor, currencyCode)}</small></div>
      <span className={p.archived_at ? "status-pill status-inactive" : p.is_sellable ? "status-pill status-active" : "status-pill status-inactive"}>{p.archived_at ? "Archivado" : p.is_sellable ? "Activo" : "Inactivo"}</span>
    </div>
    <div className="product-card-wa-details">
      <div><span>Existencias</span><strong>{p.track_inventory ? Number(p.stock_on_hand).toLocaleString("es-CO") + " " + (p.unit_name || "unidades") : "No aplica"}</strong>{p.track_inventory && p.low_stock_threshold !== null && Number(p.stock_on_hand) <= Number(p.low_stock_threshold) && <small className="stock-alert">Pocas existencias</small>}</div>
      <div><span>Unidad</span><strong>{p.unit_name || "unidad"}</strong></div>
      {p.commercial_presentation && <div className="product-card-wa-presentation"><span>Presentación</span><strong>{p.commercial_presentation}</strong></div>}
    </div>
    <div className="product-card-profit-row"><div><span>Ganancia por unidad</span><strong className={productProfitMinor < 0 ? "negative-value" : ""}>{money(productProfitMinor, currencyCode)}</strong></div><div><span>Margen</span><strong className={productMargin < 0 ? "negative-value" : ""}>{productMargin.toLocaleString("es-CO", { maximumFractionDigits: 1 })}%</strong></div></div>
    <div className="product-card-actions">
      <div className="product-card-variants"><div><span>Variantes</span><strong>{productVariants.length} {productVariants.length === 1 ? "variante" : "variantes"}</strong></div><button type="button" className="text-button" onClick={() => openProductVariants(p)}>Ver variantes</button><button type="button" className="text-button product-history-button" onClick={() => openBulkHistory(p)}>Historial</button></div>
      <div className="product-card-action-buttons"><button type="button" className="icon-action-button share-product-button" title={"Compartir "+p.name} aria-label={"Compartir "+p.name} onClick={()=>shareProduct(p)}>↗</button>{canManageProducts && <button type="button" className="icon-action-button" title="Editar producto" aria-label="Editar producto" onClick={() => startEditProduct(p)}>✎</button>}{canManageProducts && <button type="button" className="text-button" disabled={busy} onClick={() => archiveProduct(p)}>{p.archived_at ? "Restaurar" : "Archivar"}</button>}</div>
    </div>
  </article>;
})}</div>
              )
            ) : <div className="empty-state"><span className="empty-icon">▦</span><h3>{search ? "No encontramos coincidencias" : "Todavía no hay productos"}</h3><p>{search ? "Prueba con otro nombre." : "Añade tu primer producto. Solo mostraremos lo que guardes de verdad."}</p>{!search && <button className="primary-button" onClick={() => setShowProductForm(true)}>+ Crear primer producto</button>}</div>)}

            {!bulkEditMode && !productsLoading && productsCount > 0 && <div className="pagination-bar">
              <label className="page-size-control"><span className="field-label-heading">Mostrar
                <FieldHelp enabled={contextualHelpEnabled} text="Elige cuántos productos mostrar por página." /></span><select value={productPageSize} onChange={(e) => { setProductPageSize(Number(e.target.value)); setProductPage(1); }}>
                  <option value={12}>12</option><option value={24}>24</option><option value={48}>48</option>
                </select>
                por página
              </label>
              <div className="pagination-controls">
                <button type="button" className="secondary-button" disabled={productPage <= 1 || productsLoading} onClick={() => setProductPage((page) => Math.max(1, page - 1))}>Anterior</button>
                <span className="pagination-status">Página {Math.min(productPage, totalProductPages)} de {totalProductPages}</span>
                <button type="button" className="secondary-button" disabled={productPage >= totalProductPages || productsLoading} onClick={() => setProductPage((page) => Math.min(totalProductPages, page + 1))}>Siguiente</button>
              </div>
            </div>}
            
          </section>
        ) : screen === "payments" ? (
          <PaymentsAdmin business={activeBusiness} />
        ) : screen === "coupons" ? (
          <CouponsAdmin business={activeBusiness} />
        ) : screen === "settings" ? (
          <section className="settings-page">
            <div className="settings-intro"><h2>Configuración del negocio</h2><p>Administra la apariencia del sistema y los datos comerciales que aparecerán en las cotizaciones para tus clientes.</p></div>
            <div className="settings-tabs" role="tablist" aria-label="Secciones de configuración">
              {[
                ["general", "General"],
                ["company", "Mi empresa"],
                ["customization", "Personalización"],
                ["help", "Ayudas"],
                ["language", "Idioma"],
                ["taxes", "Impuestos"],
                ["data", "Datos y copias"]
              ].map(([tab, label]) => <button key={tab} type="button" role="tab" aria-selected={settingsTab === tab} className={settingsTab === tab ? "settings-tab active" : "settings-tab"} onClick={() => setSettingsTab(tab)}>{label}</button>)}
            </div>
            <form className="settings-card panel" onSubmit={saveSettings}>
              <div hidden={!["general", "customization", "help", "language", "taxes", "data"].includes(settingsTab)} className="settings-tab-panel">
              <div hidden={settingsTab !== "general"} className="settings-tab-content">
              <div className="settings-icon"><AppIcon name="settings" size={23} /></div>
              <h3>Datos del negocio</h3>
              <p>Actualiza el nombre y la moneda de las operaciones.</p>
              {settingsChecking ? <p className="helper-text">Comprobando si ya hay importes guardados…</p> : <>
                <label className="settings-field"><span className="field-label-heading">Nombre del negocio<FieldHelp enabled={contextualHelpEnabled} text="Nombre con el que se mostrará tu negocio en treseiscinco." /></span><input value={settingsBusinessName} onChange={(e) => setSettingsBusinessName(e.target.value)} maxLength={160} required disabled={activeBusiness?.role !== "owner"} placeholder="Nombre de tu negocio" /></label>
                <label className="settings-field"><span className="field-label-heading">Moneda principal<FieldHelp enabled={contextualHelpEnabled} text="Moneda usada para nuevos importes y reportes. Si ya hay operaciones registradas, cambiarla requiere conversión." /></span><select value={settingsCurrency} disabled={activeBusiness?.role !== "owner"} onChange={(e) => setSettingsCurrency(e.target.value)}>{currencyOptions.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}</select></label><p className="settings-payment-currency-note"><strong>Importante sobre los pagos:</strong> los pagos en línea dentro de treseiscinco solo se procesan mediante Wompi y, actualmente, Wompi admite COP. Si eliges otra moneda o no quieres usar Wompi, selecciona <strong>Pedidos por WhatsApp</strong> en “Mi empresa”; en ese caso, el cliente acuerda el pago directamente contigo y treseiscinco no lo verifica.</p>
                {settingsHasData && settingsCurrency !== currencyCode ? <div className="settings-conversion-box"><p className="helper-text">Se convertirán los precios de venta y costo del catálogo y sus variantes. Las ventas, compras, gastos y cotizaciones existentes conservarán sus importes y moneda históricos.</p><label className="settings-field"><span>Tasa de conversión</span><span className="helper-text">¿Cuántas unidades de {settingsCurrency} equivalen a 1 {currencyCode}?</span><input type="number" min="0.00000001" step="any" inputMode="decimal" value={settingsConversionRate} onChange={(e) => setSettingsConversionRate(e.target.value)} placeholder="Ej. 0,00024" required /></label><p className="helper-text">Confirma la tasa antes de guardar. La conversión se ejecuta en una sola transacción en la base de datos.</p></div> : settingsHasData ? <p className="helper-text">Puedes cambiar la moneda principal. Si eliges otra, te pediremos una tasa para convertir los precios actuales del catálogo sin modificar los movimientos históricos.</p> : <p className="helper-text">Elige la moneda para los precios del catálogo y los próximos movimientos de dinero.</p>}
                {activeBusiness?.role !== "owner" && <p className="helper-text">Solo el propietario puede cambiar estos ajustes.</p>}
              </>}
              </div>
              <div hidden={settingsTab !== "customization"} className="settings-tab-content">
              <div className="settings-section-divider" />
              <h3>Logo del negocio</h3>
              <p>Tu logo se conservará para las próximas sesiones y se mostrará en la navegación y el catálogo público.</p>
              <div className="settings-logo-editor">
                <div className="settings-logo-preview">{(settingsLogoPreview || (!settingsRemoveLogo && activeBusiness?.logo_path)) ? <img src={settingsLogoPreview || getBusinessLogoUrl(activeBusiness?.logo_path)} alt="Vista previa del logo del negocio" /> : <span>31</span>}</div>
                <div className="settings-logo-controls">
                  <label className="settings-field"><span className="field-label-heading">Elegir logo<FieldHelp enabled={contextualHelpEnabled} text="Sube el logo de tu negocio para identificarlo en la aplicación y el catálogo compartido." /></span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseBusinessLogo} disabled={activeBusiness?.role !== "owner" || busy} /></label>
                  <p className="helper-text">JPG, PNG o WebP; máximo 5 MB. Se optimiza al guardar.</p>
                  {(settingsLogoFile || activeBusiness?.logo_path) && <button type="button" className="secondary-button settings-remove-logo" onClick={clearBusinessLogo} disabled={activeBusiness?.role !== "owner" || busy}>{settingsRemoveLogo ? "Logo marcado para quitar" : "Quitar logo"}</button>}
                  {settingsLogoFile && <p className="settings-logo-filename">Seleccionado: {settingsLogoFile.name}</p>}
                </div>
              </div>

              <div className="settings-section-divider" />
              <h3>Colores y apariencia</h3>
              <p>Elige una paleta que se aplique a las pantallas del negocio y se conserve al volver a entrar.</p>
              <div className="settings-color-grid">
                <label className="settings-color-field"><span className="field-label-heading"><span>Color principal (elige cualquier color)</span><FieldHelp enabled={contextualHelpEnabled} text="Elige cualquier color. Se aplicará a botones, enlaces, indicadores y elementos activos; no estás obligado a usar la paleta de treseiscinco." /></span><input type="color" aria-label="Color principal" value={settingsTheme.primary} onChange={(e) => setSettingsTheme((current) => ({ ...current, primary: e.target.value }))} disabled={activeBusiness?.role !== "owner"} /><code>{settingsTheme.primary.toUpperCase()}</code></label>
                <label className="settings-color-field"><span className="field-label-heading"><span>Fondo de pantalla</span><FieldHelp enabled={contextualHelpEnabled} text="Color de fondo general de las pantallas." /></span><input type="color" aria-label="Color de fondo" value={settingsTheme.background} onChange={(e) => setSettingsTheme((current) => ({ ...current, background: e.target.value }))} disabled={activeBusiness?.role !== "owner"} /><code>{settingsTheme.background.toUpperCase()}</code></label>
                <label className="settings-color-field"><span className="field-label-heading"><span>Fondo de tarjetas</span><FieldHelp enabled={contextualHelpEnabled} text="Color de fondo de tarjetas y paneles." /></span><input type="color" aria-label="Color de tarjetas" value={settingsTheme.surface} onChange={(e) => setSettingsTheme((current) => ({ ...current, surface: e.target.value }))} disabled={activeBusiness?.role !== "owner"} /><code>{settingsTheme.surface.toUpperCase()}</code></label>
                <label className="settings-color-field"><span className="field-label-heading"><span>Color del texto</span><FieldHelp enabled={contextualHelpEnabled} text="Color usado para los textos principales de la interfaz." /></span><input type="color" aria-label="Color del texto" value={settingsTheme.text} onChange={(e) => setSettingsTheme((current) => ({ ...current, text: e.target.value }))} disabled={activeBusiness?.role !== "owner"} /><code>{settingsTheme.text.toUpperCase()}</code></label>
                <label className="settings-color-field"><span className="field-label-heading"><span>Fondo del sidebar</span><FieldHelp enabled={contextualHelpEnabled} text="Cambia solo el fondo del menú lateral, sin modificar el fondo de las pantallas ni las tarjetas." /></span><input type="color" aria-label="Fondo del sidebar" value={settingsTheme.sidebarBackground} onChange={(e) => setSettingsTheme((current) => ({ ...current, sidebarBackground: e.target.value }))} disabled={activeBusiness?.role !== "owner"} /><code>{settingsTheme.sidebarBackground.toUpperCase()}</code></label>
                <label className="settings-color-field"><span className="field-label-heading"><span>Texto del sidebar</span><FieldHelp enabled={contextualHelpEnabled} text="Cambia por separado los textos del menú lateral para que puedas mantener un contraste legible con su fondo." /></span><input type="color" aria-label="Texto del sidebar" value={settingsTheme.sidebarText} onChange={(e) => setSettingsTheme((current) => ({ ...current, sidebarText: e.target.value }))} disabled={activeBusiness?.role !== "owner"} /><code>{settingsTheme.sidebarText.toUpperCase()}</code></label>
                <label className="settings-color-field"><span>Color del botón al pasar el cursor<FieldHelp enabled={contextualHelpEnabled} text="Color de fondo que toman los botones cuando pasas el cursor por encima." /></span><input type="color" aria-label="Color del botón al pasar el cursor" value={settingsTheme.buttonHover} onChange={(e) => setSettingsTheme((current) => ({ ...current, buttonHover: e.target.value }))} disabled={activeBusiness?.role !== "owner"} /><code>{settingsTheme.buttonHover.toUpperCase()}</code></label>
                <label className="settings-color-field"><span>Color del texto del botón al pasar el cursor<FieldHelp enabled={contextualHelpEnabled} text="Color de la letra de los botones mientras el cursor está encima." /></span><input type="color" aria-label="Color del texto del botón al pasar el cursor" value={settingsTheme.buttonHoverText} onChange={(e) => setSettingsTheme((current) => ({ ...current, buttonHoverText: e.target.value }))} disabled={activeBusiness?.role !== "owner"} /><code>{settingsTheme.buttonHoverText.toUpperCase()}</code></label>
              </div>
              <div className="settings-theme-preview" style={{ "--preview-primary": settingsTheme.primary, "--preview-background": settingsTheme.background, "--preview-surface": settingsTheme.surface, "--preview-text": settingsTheme.text, "--preview-sidebar-background": settingsTheme.sidebarBackground, "--preview-sidebar-text": settingsTheme.sidebarText, "--button-hover": settingsTheme.buttonHover, "--button-hover-text": settingsTheme.buttonHoverText }}>
                <div className="settings-theme-preview-brand">{settingsLogoPreview || activeBusiness?.logo_path ? <img src={settingsLogoPreview || getBusinessLogoUrl(activeBusiness?.logo_path)} alt="" /> : <span>31</span>}<strong>{settingsBusinessName || activeBusiness?.name || "Tu negocio"}</strong></div>
                <div className="settings-theme-preview-sidebar"><strong className="settings-app-brand"><img src="/symbol-treseiscinco.svg" alt="" /> <span>treseiscinco</span></strong><span>Inicio</span><span>Productos</span><span>Ventas</span></div>
                <p>Comprueba el aspecto general, el color propio del sidebar y los colores de los botones.</p><button type="button">Acción principal</button>
              </div>
              {activeBusiness?.role === "owner" && <div className="settings-theme-reset-block"><button type="button" className="settings-reset-theme" onClick={() => setSettingsTheme({ ...treseiscincoTheme })}><span aria-hidden="true">↺</span> Usar paleta de treseiscinco</button><p>Recupera la paleta habitual de treseiscinco. También puedes elegir cualquier color con los controles anteriores. Tu logo no se modifica; guarda para aplicar los cambios.</p></div>}
              </div>
              <div hidden={settingsTab !== "help"} className="settings-tab-content">
              <div className="settings-section-divider" />
              <h3>Ayudas contextuales</h3>
              <p>Una guía clara que cambia según la sección en la que estés, con instrucciones y consejos prácticos.</p>
              <label className="settings-help-toggle"><input type="checkbox" checked={settingsHelpEnabled} onChange={(e) => setSettingsHelpEnabled(e.target.checked)} disabled={activeBusiness?.role !== "owner"} /><span><strong>Mostrar ayudas contextuales<FieldHelp enabled={contextualHelpEnabled} text="Activa o desactiva tanto las ayudas breves de los campos como el panel explicativo general." /></strong><small>El botón «Ayuda» abre el mismo panel explicativo sobre formularios y ventanas.</small></span></label>
              {activeBusiness?.role !== "owner" && <p className="helper-text">Solo el propietario puede modificar esta preferencia.</p>}
              </div>
              <div hidden={settingsTab !== "language"} className="settings-tab-content language-settings-panel">
                <div className="settings-icon"><AppIcon name="grid" size={23} /></div>
                <h3>Idioma de la aplicación</h3>
                <p>Selecciona el idioma de toda la interfaz de treseiscinco. El cambio se aplica inmediatamente y se guarda en este navegador.</p>
                <label className="settings-field"><span className="field-label-heading">Idioma</span><select value={uiLanguage} onChange={(event) => { const next = event.target.value === "en" ? "en" : "es"; setUiLanguage(next); try { window.localStorage.setItem("treseiscinco-language", next); } catch {} setNotice(next === "en" ? "Language saved." : "Idioma guardado."); }}><option value="es">Español</option><option value="en">English</option></select></label>
                <p className="helper-text">Al elegir English se traducen los textos de navegación, formularios, botones, ayudas, estados y mensajes que estén incluidos en el catálogo de traducciones. Los nombres y datos escritos por ti no se traducen.</p>
              </div>
              <div hidden={settingsTab !== "taxes"} className="settings-tab-content tax-settings-panel">
                <div className="settings-icon"><AppIcon name="stats" size={23} /></div>
                <h3>Impuestos y tratamiento fiscal</h3>
                <p>Configura el perfil tributario de tu negocio. No activaremos el cobro de IVA por defecto ni cambiaremos movimientos históricos.</p>
                <label className="settings-field"><span className="field-label-heading">¿Cómo está tu negocio frente al IVA?</span><select value={settingsTaxProfile.vatStatus} onChange={(event) => setSettingsTaxProfile((current) => ({ ...current, vatStatus: event.target.value }))} disabled={activeBusiness?.role !== "owner"}><option value="unsure">No estoy seguro todavía</option><option value="responsible">Responsable de IVA</option><option value="not_responsible">No responsable de IVA</option><option value="not_applicable">Mis operaciones no están gravadas con IVA</option></select></label>
                {settingsTaxProfile.vatStatus === "responsible" && <>
                  <label className="settings-field"><span className="field-label-heading">Tarifa predeterminada de IVA</span><select value={settingsTaxProfile.defaultRateMode === "custom" ? "custom" : String(settingsTaxProfile.defaultRate)} onChange={(event) => setSettingsTaxProfile((current) => event.target.value === "custom" ? { ...current, defaultRateMode: "custom" } : { ...current, defaultRateMode: "standard", defaultRate: Number(event.target.value) })} disabled={activeBusiness?.role !== "owner"}><option value="19">IVA general (19 %)</option><option value="5">IVA diferencial (5 %)</option><option value="0">0 %</option><option value="custom">Tarifa personalizada</option></select></label>
                  {settingsTaxProfile.defaultRateMode === "custom" && <label className="settings-field"><span className="field-label-heading">Porcentaje de IVA</span><input type="number" min="0" max="100" step="0.01" inputMode="decimal" value={settingsTaxProfile.customRate} onChange={(event) => setSettingsTaxProfile((current) => ({ ...current, customRate: event.target.value }))} disabled={activeBusiness?.role !== "owner"} /></label>}
                  <label className="settings-help-toggle"><input type="checkbox" checked={settingsTaxProfile.pricesIncludeVat} onChange={(event) => setSettingsTaxProfile((current) => ({ ...current, pricesIncludeVat: event.target.checked }))} disabled={activeBusiness?.role !== "owner"} /><span><strong>Los precios ya incluyen IVA</strong><small>Activa esta opción si la tarifa publicada ya contiene el impuesto.</small></span></label>
                  <label className="settings-help-toggle"><input type="checkbox" checked={settingsTaxProfile.showVatBreakdown} onChange={(event) => setSettingsTaxProfile((current) => ({ ...current, showVatBreakdown: event.target.checked }))} disabled={activeBusiness?.role !== "owner"} /><span><strong>Mostrar IVA por separado en nuevos documentos</strong><small>Preferencia para documentos que admitan desglose tributario.</small></span></label>
                </>}
                <div className="tax-guidance-note">
                  <strong>Importante:</strong>
                  <p>Esta configuración guarda tu perfil y una tarifa predeterminada; no activa por sí sola el cobro de IVA ni recalcula ventas, compras o cotizaciones. La tarifa puede variar según el producto o servicio y tu responsabilidad tributaria. Revisa tu RUT y confirma tu situación con un contador o la DIAN antes de cobrar IVA.</p>
                </div>
                {activeBusiness?.role !== "owner" && <p className="helper-text">Solo el propietario puede modificar estos ajustes.</p>}
              </div>
              <div hidden={settingsTab !== "data"} className="settings-tab-content settings-data-panel">
                <div className="settings-icon"><AppIcon name="settings" size={23}/></div>
                <h3>Copias de seguridad</h3>
                <p>Descarga una copia de los registros accesibles de este negocio. El archivo incluye las filas que tus permisos permiten consultar y señala cualquier tabla que no se haya podido exportar.</p>
                <div className="settings-data-card"><div><strong>Copia de seguridad del negocio</strong><p>Productos, categorías, clientes, proveedores, ventas, pagos, compras, gastos, movimientos, cotizaciones, cupones y auditoría cuando los permisos lo permitan.</p></div><button type="button" className="primary-button" onClick={downloadBusinessBackup} disabled={backupBusy||!activeBusiness?.id||activeBusiness?.role!=="owner"}>{backupBusy?"Preparando copia…":"Descargar copia"}</button></div>
                {activeBusiness?.role!=="owner"&&<p className="helper-text">Solo el propietario puede descargar una copia completa del negocio.</p>}
                <div className="tax-guidance-note"><strong>Importante</strong><p>La descarga no incluye contraseñas, credenciales privadas de pasarelas ni cuentas de acceso. Guarda el archivo en un lugar seguro; contiene información comercial y datos de clientes.</p></div>
              </div>
              </div>
              <div hidden={settingsTab !== "company"} className="settings-tab-panel company-profile-panel">
                <div className="settings-icon"><AppIcon name="team" size={23} /></div>
                <h3>Mi empresa</h3>
                <p>Estos datos acompañarán el logo en las cotizaciones y documentos que compartas con tus clientes.</p>
                <label className="settings-field"><span className="field-label-heading">Nombre comercial</span><input value={settingsCommercialProfile.tradeName} onChange={(e) => setSettingsCommercialProfile((current) => ({ ...current, tradeName: e.target.value }))} maxLength={160} disabled={activeBusiness?.role !== "owner"} placeholder={settingsBusinessName || "Nombre que verá tu cliente"} /></label>
                <label className="settings-field"><span className="field-label-heading">NIT o documento</span><input value={settingsCommercialProfile.documentNumber} onChange={(e) => setSettingsCommercialProfile((current) => ({ ...current, documentNumber: e.target.value }))} maxLength={80} disabled={activeBusiness?.role !== "owner"} placeholder="Identificación tributaria (opcional)" /></label>
                <div className="company-profile-grid">
                  <label className="settings-field"><span className="field-label-heading">Correo comercial</span><input type="email" value={settingsCommercialProfile.email} onChange={(e) => setSettingsCommercialProfile((current) => ({ ...current, email: e.target.value }))} maxLength={254} disabled={activeBusiness?.role !== "owner"} placeholder="ventas@tuempresa.com" /></label>
                  <label className="settings-field"><span className="field-label-heading">Teléfono / WhatsApp</span><input value={settingsCommercialProfile.phone} onChange={(e) => setSettingsCommercialProfile((current) => ({ ...current, phone: e.target.value }))} maxLength={60} disabled={activeBusiness?.role !== "owner"} placeholder="Número de contacto" /></label>
                </div>
                <label className="settings-field"><span className="field-label-heading">Dirección</span><input value={settingsCommercialProfile.address} onChange={(e) => setSettingsCommercialProfile((current) => ({ ...current, address: e.target.value }))} maxLength={220} disabled={activeBusiness?.role !== "owner"} placeholder="Dirección comercial" /></label>
                <div className="company-profile-grid">
                  <label className="settings-field"><span className="field-label-heading">Ciudad</span><input value={settingsCommercialProfile.city} onChange={(e) => setSettingsCommercialProfile((current) => ({ ...current, city: e.target.value }))} maxLength={100} disabled={activeBusiness?.role !== "owner"} placeholder="Ciudad, departamento" /></label>
                  <label className="settings-field"><span className="field-label-heading">Sitio web</span><input value={settingsCommercialProfile.website} onChange={(e) => setSettingsCommercialProfile((current) => ({ ...current, website: e.target.value }))} maxLength={200} disabled={activeBusiness?.role !== "owner"} placeholder="https://tuempresa.com" /></label>
                </div>
                <label className="settings-field"><span className="field-label-heading">Descripción pública</span><textarea value={settingsCommercialProfile.publicDescription} onChange={(e) => setSettingsCommercialProfile((current) => ({ ...current, publicDescription: e.target.value }))} maxLength={500} rows={3} disabled={activeBusiness?.role !== "owner"} placeholder="Cuenta brevemente qué ofrece tu negocio. Aparecerá en tu catálogo público." /></label>
                <div className="business-card-preview-wrap">
                  <div className="business-card-preview">
                    <div className="business-card-preview-logo">{activeBusiness?.logo_path?<img src={getBusinessLogoUrl(activeBusiness.logo_path)} alt="Logo de la empresa"/>:<span>{(settingsCommercialProfile.tradeName||settingsBusinessName||activeBusiness?.name||"T").slice(0,1).toUpperCase()}</span>}</div>
                    <div className="business-card-preview-copy"><small>INFORMACIÓN COMERCIAL</small><h3>{settingsCommercialProfile.tradeName||settingsBusinessName||activeBusiness?.name||"Tu negocio"}</h3>{settingsCommercialProfile.publicDescription&&<p>{settingsCommercialProfile.publicDescription}</p>}{settingsCommercialProfile.phone&&<span>{settingsCommercialProfile.phone}</span>}{settingsCommercialProfile.email&&<span>{settingsCommercialProfile.email}</span>}{[settingsCommercialProfile.address,settingsCommercialProfile.city].filter(Boolean).join(", ")&&<span>{[settingsCommercialProfile.address,settingsCommercialProfile.city].filter(Boolean).join(", ")}</span>}{settingsCommercialProfile.website&&<span>{settingsCommercialProfile.website}</span>}</div>
                  </div>
                  <div className="business-card-preview-actions"><span>Vista previa · 9 × 5 cm</span><button type="button" className="secondary-button" onClick={printBusinessCard}>Imprimir o guardar como PDF</button></div>
                </div>
                <div className="settings-section-divider" />
                <div className="settings-hours-editor"><div><h4>Horario de atención</h4><p>Marca los días en que trabajas. Puedes indicar dos turnos si cierras al mediodía.</p></div>
                  {([{key:"mon",label:"Lunes"},{key:"tue",label:"Martes"},{key:"wed",label:"Miércoles"},{key:"thu",label:"Jueves"},{key:"fri",label:"Viernes"},{key:"sat",label:"Sábado"},{key:"sun",label:"Domingo"}]).map((day) => { const dayHours=settingsCommercialProfile.hoursSchedule?.[day.key] || {enabled:false,periods:[{open:"09:00",close:"18:00"}]}; const periods=Array.isArray(dayHours.periods)&&dayHours.periods.length?dayHours.periods:[{open:"09:00",close:"18:00"}]; return <div className={"settings-hours-day"+(dayHours.enabled?" is-enabled":"")} key={day.key}><label className="settings-hours-day-check"><input type="checkbox" checked={Boolean(dayHours.enabled)} disabled={activeBusiness?.role!=="owner"} onChange={(e)=>setSettingsCommercialProfile((current)=>({ ...current, hoursSchedule:{...(current.hoursSchedule||{}),[day.key]:{enabled:e.target.checked,periods:(current.hoursSchedule?.[day.key]?.periods?.length?current.hoursSchedule[day.key].periods:[{open:"09:00",close:"18:00"}])}} }))}/><strong>{day.label}</strong></label>
                    <div className="settings-hours-periods">{periods.slice(0,2).map((period,index)=><div className="settings-hours-period" key={index}><span>{index===0?"Primer turno":"Segundo turno"}</span><label><span>Apertura</span><input type="time" value={period.open||""} disabled={!dayHours.enabled||activeBusiness?.role!=="owner"} onChange={(e)=>setSettingsCommercialProfile((current)=>({ ...current,hoursSchedule:{...(current.hoursSchedule||{}),[day.key]:{...dayHours,periods:periods.map((p,i)=>i===index?{...p,open:e.target.value}:p)}} }))}/></label><label><span>Cierre</span><input type="time" value={period.close||""} disabled={!dayHours.enabled||activeBusiness?.role!=="owner"} onChange={(e)=>setSettingsCommercialProfile((current)=>({ ...current,hoursSchedule:{...(current.hoursSchedule||{}),[day.key]:{...dayHours,periods:periods.map((p,i)=>i===index?{...p,close:e.target.value}:p)}} }))}/></label></div>)}</div>
                    {dayHours.enabled && periods.length<2 && <button type="button" className="settings-hours-add" disabled={activeBusiness?.role!=="owner"} onClick={()=>setSettingsCommercialProfile((current)=>({ ...current,hoursSchedule:{...(current.hoursSchedule||{}),[day.key]:{...dayHours,periods:[{...periods[0],close:periods[0].open==="09:00"&&periods[0].close==="18:00"?"12:00":periods[0].close},{open:periods[0].open==="09:00"&&periods[0].close==="18:00"?"13:00":periods[0].close,close:"17:00"}]}} }))}>＋ Agregar segundo turno</button>}{dayHours.enabled && periods.length>1 && <button type="button" className="settings-hours-add remove" disabled={activeBusiness?.role!=="owner"} onClick={()=>setSettingsCommercialProfile((current)=>({ ...current,hoursSchedule:{...(current.hoursSchedule||{}),[day.key]:{...dayHours,periods:periods.slice(0,1)}} }))}>− Quitar segundo turno</button>}</div>})}
                </div>
                <div className="settings-section-divider" /><h3>Cómo quieres recibir pedidos</h3><p>Elige un canal para el catálogo público. No necesitas activar Wompi si prefieres coordinar el pedido por WhatsApp.</p>
                <div className="settings-channel-choices"><label className={settingsCommercialProfile.orderChannel==="wompi"?"selected":""}><input type="radio" name="orderChannel" checked={settingsCommercialProfile.orderChannel==="wompi"} disabled={activeBusiness?.role!=="owner"} onChange={()=>setSettingsCommercialProfile((current)=>({...current,orderChannel:"wompi"}))}/><span><strong>Pago en línea con Wompi</strong><small>El cliente va al checkout seguro si los cobros están configurados.</small></span></label><label className={settingsCommercialProfile.orderChannel==="whatsapp"?"selected":""}><input type="radio" name="orderChannel" checked={settingsCommercialProfile.orderChannel==="whatsapp"} disabled={activeBusiness?.role!=="owner"} onChange={()=>setSettingsCommercialProfile((current)=>({...current,orderChannel:"whatsapp"}))}/><span><strong>Pedidos por WhatsApp</strong><small>El catálogo envía el resumen del carrito al número comercial configurado.</small></span></label></div>
              </div>
              <div className="form-actions"><button type="submit" className="primary-button" disabled={busy || settingsChecking || activeBusiness?.role !== "owner"}>{busy ? "Guardando…" : "Guardar configuración"}</button></div>
            </form>
            <p className="settings-footnote">Negocio: <strong>{activeBusiness?.name}</strong> · Zona horaria: America/Bogota</p>
          </section>

        ) : screen === "receivables" ? (
          <section className="accounts-page">
            <div className="products-intro"><div><h2>Cuentas por cobrar</h2><p>Controla las ventas pendientes y registra abonos sin perder el registro actual.</p></div><button type="button" className="secondary-button" onClick={()=>navigate("sales")}>Ir a ventas</button></div>
            <div className="accounts-metrics"><article className="accounts-metric panel"><span>Ventas con saldo</span><strong>{receivableRows.filter(x=>x.balance_minor>0).length}</strong></article><article className="accounts-metric panel"><span>Total por cobrar</span><strong>{money(receivableRows.reduce((n,x)=>n+x.balance_minor,0),currencyCode)}</strong></article><article className="accounts-metric panel"><span>Ventas saldadas</span><strong>{receivableRows.filter(x=>x.balance_minor<=0).length}</strong></article></div>
            <div className="accounts-toolbar"><label><span>Buscar cliente o venta</span><input value={accountsSearch} onChange={e=>setAccountsSearch(e.target.value)} placeholder="Nombre, número o celular"/></label><label><span>Estado</span><select value={accountsStatusFilter} onChange={e=>setAccountsStatusFilter(e.target.value)}><option value="pending">Con saldo pendiente</option><option value="all">Todas las ventas</option></select></label><label><span>Ordenar por</span><select value={accountsSort} onChange={e=>setAccountsSort(e.target.value)}><option value="newest">Más recientes</option><option value="oldest">Más antiguas</option><option value="balance_desc">Mayor saldo</option><option value="balance_asc">Menor saldo</option><option value="name">Nombre del cliente</option></select></label></div>
            {accountsLoading?<div className="empty-state">Consultando saldos…</div>:(()=>{const q=accountsSearch.trim().toLocaleLowerCase("es");const rows=receivableRows.filter(x=>(accountsStatusFilter==="all"||x.balance_minor>0)&&(!q||[x.sale_number,x.customer?.full_name,x.customer?.company_name,x.customer?.phone,x.customer?.whatsapp].filter(Boolean).join(" ").toLocaleLowerCase("es").includes(q)));rows.sort((a,b)=>accountsSort==="oldest"?new Date(a.sold_at||a.created_at)-new Date(b.sold_at||b.created_at):accountsSort==="balance_desc"?b.balance_minor-a.balance_minor:accountsSort==="balance_asc"?a.balance_minor-b.balance_minor:accountsSort==="name"?String(a.customer?.company_name||a.customer?.full_name||"").localeCompare(String(b.customer?.company_name||b.customer?.full_name||""),"es"):new Date(b.sold_at||b.created_at)-new Date(a.sold_at||a.created_at));return rows.length?<div className="account-record-list">{rows.slice(0,250).map(x=><article className="account-record panel" key={x.id}><div className="account-record-heading"><div><span className="account-record-kicker">{x.sale_number||"Venta"}</span><h3>{x.customer?.company_name||x.customer?.full_name||"Cliente sin ficha"}</h3><span>{new Date(x.sold_at||x.created_at).toLocaleDateString("es-CO",{timeZone:"America/Bogota",dateStyle:"medium"})}</span></div><span className={"status-pill "+(x.balance_minor>0?"status-unpublished":"status-active")}>{x.balance_minor>0?"Pendiente":"Saldada"}</span></div><div className="account-record-amounts"><div><span>Total</span><strong>{money(x.total_minor,x.currency_code||currencyCode)}</strong></div><div><span>Abonado</span><strong>{money(x.amount_paid_minor,x.currency_code||currencyCode)}</strong></div><div className={x.balance_minor>0?"account-balance-open":""}><span>Saldo</span><strong>{money(x.balance_minor,x.currency_code||currencyCode)}</strong></div></div>{x.balance_minor>0&&canManageSales&&<button type="button" className="primary-button compact-button" onClick={()=>openSalePaymentForm(x)}>＋ Registrar abono</button>}{salePaymentFormFor===x.id&&x.balance_minor>0&&<form className="account-payment-form" onSubmit={e=>registerSalePayment(e,x)}><div className="account-payment-grid"><label><span>Valor del abono</span><input type="number" min="1" max={x.balance_minor/(10**currencyDigits(x.currency_code||currencyCode))} value={salePaymentAmount} onChange={e=>setSalePaymentAmount(e.target.value)} required/></label><label><span>Forma de pago</span><select value={salePaymentMethod} onChange={e=>setSalePaymentMethod(e.target.value)}><option>Efectivo</option><option>Transferencia</option><option>Nequi</option><option>Tarjeta</option><option>Otro</option></select></label><label><span>Fecha</span><input type="date" max={todayInBogota()} value={salePaymentDate} onChange={e=>setSalePaymentDate(e.target.value)} required/></label><label><span>Nota</span><input value={salePaymentNotes} onChange={e=>setSalePaymentNotes(e.target.value)} maxLength={1000}/></label></div><div className="form-actions"><button type="button" className="secondary-button" onClick={()=>setSalePaymentFormFor(null)}>Cancelar</button><button className="primary-button" disabled={salePaymentSaving}>Guardar abono</button></div></form>}</article>)}</div>:<div className="empty-state"><h3>No hay resultados</h3><p>Prueba otro filtro o registra una venta con saldo pendiente.</p><button className="secondary-button" onClick={()=>navigate("sales")}>Ir a ventas</button></div>})()}
          </section>
        ) : screen === "payables" ? (
          <section className="accounts-page">
            <div className="products-intro"><div><h2>Cuentas por pagar</h2><p>Consulta saldos de proveedores y registra pagos vinculados a cada compra.</p></div><button type="button" className="secondary-button" onClick={()=>navigate("purchases")}>Ir a compras</button></div>
            <div className="accounts-metrics"><article className="accounts-metric panel"><span>Compras con saldo</span><strong>{payableRows.filter(x=>x.balance_minor>0).length}</strong></article><article className="accounts-metric panel"><span>Total por pagar</span><strong>{money(payableRows.reduce((n,x)=>n+x.balance_minor,0),currencyCode)}</strong></article><article className="accounts-metric panel"><span>Compras saldadas</span><strong>{payableRows.filter(x=>x.balance_minor<=0).length}</strong></article></div>
            <div className="accounts-toolbar"><label><span>Buscar proveedor o compra</span><input value={accountsSearch} onChange={e=>setAccountsSearch(e.target.value)} placeholder="Proveedor, número o correo"/></label><label><span>Estado</span><select value={accountsStatusFilter} onChange={e=>setAccountsStatusFilter(e.target.value)}><option value="pending">Con saldo pendiente</option><option value="all">Todas las compras</option></select></label><label><span>Ordenar por</span><select value={accountsSort} onChange={e=>setAccountsSort(e.target.value)}><option value="newest">Más recientes</option><option value="oldest">Más antiguas</option><option value="balance_desc">Mayor saldo</option><option value="balance_asc">Menor saldo</option><option value="name">Nombre del proveedor</option></select></label></div>
            {accountsLoading?<div className="empty-state">Consultando pagos…</div>:(()=>{const q=accountsSearch.trim().toLocaleLowerCase("es");const rows=payableRows.filter(x=>(accountsStatusFilter==="all"||x.balance_minor>0)&&(!q||[x.purchase_number,x.supplier?.name,x.supplier?.phone,x.supplier?.email,x.supplier?.tax_id].filter(Boolean).join(" ").toLocaleLowerCase("es").includes(q)));rows.sort((a,b)=>accountsSort==="oldest"?new Date(a.purchased_at||a.created_at)-new Date(b.purchased_at||b.created_at):accountsSort==="balance_desc"?b.balance_minor-a.balance_minor:accountsSort==="balance_asc"?a.balance_minor-b.balance_minor:accountsSort==="name"?String(a.supplier?.name||"").localeCompare(String(b.supplier?.name||""),"es"):new Date(b.purchased_at||b.created_at)-new Date(a.purchased_at||a.created_at));return rows.length?<div className="account-record-list">{rows.slice(0,250).map(x=><article className="account-record panel" key={x.id}><div className="account-record-heading"><div><span className="account-record-kicker">{x.purchase_number||"Compra"}</span><h3>{x.supplier?.name||"Proveedor sin ficha"}</h3><span>{new Date(x.purchased_at||x.created_at).toLocaleDateString("es-CO",{timeZone:"America/Bogota",dateStyle:"medium"})}</span></div><span className={"status-pill "+(x.balance_minor>0?"status-unpublished":"status-active")}>{x.balance_minor>0?"Pendiente":"Saldada"}</span></div><div className="account-record-amounts"><div><span>Total</span><strong>{money(x.total_minor,x.currency_code||currencyCode)}</strong></div><div><span>Pagado</span><strong>{money(x.amount_paid_minor,x.currency_code||currencyCode)}</strong></div><div className={x.balance_minor>0?"account-balance-open":""}><span>Saldo</span><strong>{money(x.balance_minor,x.currency_code||currencyCode)}</strong></div></div>{x.balance_minor>0&&canManagePurchases&&<button type="button" className="primary-button compact-button" onClick={()=>openPurchasePaymentForm(x)}>＋ Registrar pago</button>}{purchasePaymentFormFor===x.id&&x.balance_minor>0&&<form className="account-payment-form" onSubmit={e=>recordPurchasePayment(e,x)}><div className="account-payment-grid"><label><span>Valor del pago</span><input type="number" min="1" max={x.balance_minor/(10**currencyDigits(x.currency_code||currencyCode))} value={purchasePaymentAmount} onChange={e=>setPurchasePaymentAmount(e.target.value)} required/></label><label><span>Forma de pago</span><select value={purchasePaymentMethod} onChange={e=>setPurchasePaymentMethod(e.target.value)}><option>Efectivo</option><option>Transferencia</option><option>Nequi</option><option>Tarjeta</option><option>Otro</option></select></label><label><span>Fecha</span><input type="date" max={todayInBogota()} value={purchasePaymentDate} onChange={e=>setPurchasePaymentDate(e.target.value)} required/></label><label><span>Nota</span><input value={purchasePaymentNotes} onChange={e=>setPurchasePaymentNotes(e.target.value)} maxLength={1000}/></label></div><div className="form-actions"><button type="button" className="secondary-button" onClick={()=>setPurchasePaymentFormFor(null)}>Cancelar</button><button className="primary-button" disabled={purchasePaymentSaving}>Guardar pago</button></div></form>}</article>)}</div>:<div className="empty-state"><h3>No hay resultados</h3><p>Prueba otro filtro o registra una compra con saldo pendiente.</p><button className="secondary-button" onClick={()=>navigate("purchases")}>Ir a compras</button></div>})()}
          </section>
        ) : screen === "platform_admin" ? (
          <section className="platform-admin-page">
            <div className="products-intro"><div><p className="eyebrow">CONTROL INTERNO</p><h2>Administración de plataforma</h2><p>Usuarios, actividad, pruebas de 30 días, pagos e historial. Los cobros recurrentes se conectarán después.</p></div><button type="button" className="secondary-button" onClick={loadPlatformAdminDashboard} disabled={platformAdminLoading}>Actualizar</button></div>
            {!isPlatformAdmin?<div className="empty-state"><h3>Acceso restringido</h3><p>Este panel se valida también en el servidor.</p></div>:platformAdminLoading&&!platformAdminData?<div className="empty-state">Cargando estadísticas…</div>:<>
              <div className="platform-admin-metrics">
                {[[ "Cuentas registradas",platformAdminData?.summary?.total_users ],["Activos hoy",platformAdminData?.summary?.active_today],["Activos en 7 días",platformAdminData?.summary?.active_7d],["Activos en 30 días",platformAdminData?.summary?.active_30d],["PWA detectadas",platformAdminData?.summary?.installed_users],["Pruebas activas",platformAdminData?.summary?.trials_live],["Suscripciones activas",platformAdminData?.summary?.subscribers_active]].map(([label,value])=><article key={label} className="platform-admin-metric panel"><span>{label}</span><strong>{Number(value||0).toLocaleString("es-CO")}</strong></article>)}
                <article className="platform-admin-metric panel"><span>Pagos confirmados este mes</span><strong>{money(platformAdminData?.summary?.collected_month||0,"COP")}</strong></article>
              </div>
              <div className="platform-admin-controls"><label><span>Buscar negocio o correo</span><input value={platformAdminSearch} onChange={e=>setPlatformAdminSearch(e.target.value)} placeholder="Nombre o correo"/></label><label><span>Motivo de la acción</span><input value={platformAdminNote} onChange={e=>setPlatformAdminNote(e.target.value)} maxLength={2000} placeholder="Nota interna opcional"/></label></div>
              <div className="platform-admin-business-list">{(platformAdminData?.subscriptions||[]).filter(x=>!platformAdminSearch.trim()||[x.business_name,x.owner_email].filter(Boolean).join(" ").toLocaleLowerCase("es").includes(platformAdminSearch.trim().toLocaleLowerCase("es"))).map(x=>{const labels={trialing:"En prueba",active:"Activa",past_due:"Pago pendiente",canceled:"Cancelada",expired:"Vencida",paused:"Pausada"};return <article className="platform-business-card panel" key={x.subscription_id}>
                <div className="platform-business-heading"><div><span>{x.owner_email}</span><h3>{x.business_name}</h3><small>Creado: {x.business_created_at?new Date(x.business_created_at).toLocaleDateString("es-CO",{timeZone:"America/Bogota"}):"—"} · Última actividad: {x.last_seen_at?new Date(x.last_seen_at).toLocaleString("es-CO",{timeZone:"America/Bogota",dateStyle:"medium",timeStyle:"short"}):"Sin datos"}</small></div><span className={"status-pill "+(x.status==="active"?"status-active":x.status==="trialing"?"status-unpublished":"status-inactive")}>{labels[x.status]||x.status}</span></div>
                <div className="platform-business-facts"><div><span>Inicio</span><strong>{x.current_period_start?new Date(x.current_period_start).toLocaleDateString("es-CO",{timeZone:"America/Bogota"}):"—"}</strong></div><div><span>Vence</span><strong>{x.current_period_end?new Date(x.current_period_end).toLocaleDateString("es-CO",{timeZone:"America/Bogota"}):"—"}</strong></div><div><span>Días restantes</span><strong>{x.current_period_end?x.days_remaining+" días":"—"}</strong></div><div><span>Total recibido</span><strong>{money(x.total_paid_minor||0,"COP")}</strong></div><div><span>Instalación</span><strong>{x.is_installed?"Detectada":"No detectada"}</strong></div></div>
                <div className="platform-subscription-editor"><label><span>Estado</span><select value={platformAdminStatusDrafts[x.subscription_id]||x.status} onChange={e=>setPlatformAdminStatusDrafts(v=>({...v,[x.subscription_id]:e.target.value}))}><option value="trialing">En prueba</option><option value="active">Activa</option><option value="past_due">Pago pendiente</option><option value="paused">Pausada</option><option value="canceled">Cancelada</option><option value="expired">Vencida</option></select></label><label><span>Fin del periodo</span><input type="datetime-local" value={platformAdminPeriodDrafts[x.subscription_id]??""} onChange={e=>setPlatformAdminPeriodDrafts(v=>({...v,[x.subscription_id]:e.target.value}))}/></label><button type="button" className="secondary-button action-small" disabled={platformAdminSaving} onClick={()=>updatePlatformSubscription(x)}>Guardar cambios</button><button type="button" className="secondary-button action-small" disabled={platformAdminSaving} onClick={()=>updatePlatformSubscription(x,"trialing",7)}>Extender prueba 7 días</button></div>
                <button type="button" className="primary-button compact-button" onClick={()=>{setPlatformPaymentBusiness(v=>v===x.business_id?"":x.business_id);setPlatformPaymentDraft({interval:"month",amount:"",method:"Nequi",reference:"",notes:""});}}>＋ Registrar pago</button>
                {platformPaymentBusiness===x.business_id&&<form className="platform-payment-form" onSubmit={e=>submitPlatformPayment(e,x)}><h4>Confirmar pago recibido</h4><p>Confirma solo después de verificar el ingreso en Nequi o tu cuenta bancaria.</p><div className="platform-payment-grid"><label><span>Periodo</span><select value={platformPaymentDraft.interval} onChange={e=>setPlatformPaymentDraft(v=>({...v,interval:e.target.value}))}><option value="month">Mensual</option><option value="quarter">Trimestral</option><option value="year">Anual</option></select></label><label><span>Valor (COP)</span><input type="number" min="1" value={platformPaymentDraft.amount} onChange={e=>setPlatformPaymentDraft(v=>({...v,amount:e.target.value}))} required/></label><label><span>Medio</span><select value={platformPaymentDraft.method} onChange={e=>setPlatformPaymentDraft(v=>({...v,method:e.target.value}))}><option>Nequi</option><option>Transferencia bancaria</option><option>Efectivo</option><option>Wompi manual</option><option>Tarjeta manual</option><option>Otro</option></select></label><label><span>Referencia única{["Nequi","Transferencia bancaria","Wompi manual","Tarjeta manual"].includes(platformPaymentDraft.method)?" *":""}</span><input value={platformPaymentDraft.reference} onChange={e=>setPlatformPaymentDraft(v=>({...v,reference:e.target.value}))} maxLength={180} required={["Nequi","Transferencia bancaria","Wompi manual","Tarjeta manual"].includes(platformPaymentDraft.method)}/></label><label><span>Notas</span><input value={platformPaymentDraft.notes} onChange={e=>setPlatformPaymentDraft(v=>({...v,notes:e.target.value}))} maxLength={2000}/></label></div><div className="form-actions"><button type="button" className="secondary-button" onClick={()=>setPlatformPaymentBusiness("")}>Cancelar</button><button type="submit" className="primary-button" disabled={platformAdminSaving}>Confirmar y activar</button></div></form>}
              </article>})}</div>
              <section className="platform-history-section panel"><h3>Historial de pagos</h3>{(platformAdminData?.payments||[]).length?<div className="platform-history-table-wrap"><table className="platform-history-table"><thead><tr><th>Fecha</th><th>Negocio</th><th>Medio / referencia</th><th>Periodo</th><th>Valor</th><th>Estado</th></tr></thead><tbody>{platformAdminData.payments.map(p=><tr key={p.id}><td>{new Date(p.received_at||p.created_at).toLocaleDateString("es-CO",{timeZone:"America/Bogota"})}</td><td>{p.business_name}<small>{p.owner_email}</small></td><td>{p.payment_method}<small>{p.external_reference||"Sin referencia"}</small></td><td>{{month:"Mensual",quarter:"Trimestral",year:"Anual"}[p.billing_interval]}</td><td>{money(p.amount_minor,p.currency_code||"COP")}</td><td>{p.status}</td></tr>)}</tbody></table></div>:<p>No hay pagos registrados.</p>}</section>
              <section className="platform-history-section panel"><h3>Historial de suscripciones</h3>{(platformAdminData?.events||[]).length?<div className="platform-events-list">{platformAdminData.events.slice(0,100).map(e=><article className="platform-event-row" key={e.id}><div><strong>{e.business_name}</strong><span>{e.event_type.replaceAll("_"," ")} · {e.old_status||"—"} → {e.new_status||"—"}</span><small>{new Date(e.created_at).toLocaleString("es-CO",{timeZone:"America/Bogota",dateStyle:"medium",timeStyle:"short"})}{e.actor_email?" · "+e.actor_email:""}</small>{e.metadata?.note&&<p>{e.metadata.note}</p>}</div>{e.amount_minor!=null&&<strong>{money(e.amount_minor,e.currency_code||"COP")}</strong>}</article>)}</div>:<p>El historial aparecerá aquí cuando se creen pruebas, cambios y pagos.</p>}</section>
            </>}
          </section>
        ) : screen === "home" ? <div className="home-dashboard">
          <section className="home-workspace-hero">
            <div className="home-workspace-copy">
              <p>Tu negocio en un vistazo. Registra una operación o entra directamente al área en la que necesitas trabajar.</p>
            </div>
            <div className="home-workspace-actions">
              {canAccessScreen("sales") && <button className="primary-button home-primary-action" onClick={() => { clearSaleDraft(); navigate("sales"); setShowSaleForm(true); }}><AppIcon name="sales" size={17}/> Registrar venta</button>}
              {(canManageProducts || canManageSales || canManagePurchases || canManageExpenses || canManageCustomers) && <div className="home-create-menu" ref={homeCreateMenuRef}>
                <button type="button" className={"secondary-button home-create-trigger"+(homeCreateMenuOpen?" is-open":"")} aria-haspopup="true" aria-expanded={homeCreateMenuOpen} onClick={() => setHomeCreateMenuOpen((open) => !open)}><AppIcon name="plus" size={17}/> Crear <AppIcon name="chevron-down" size={16}/></button>
                {homeCreateMenuOpen && <div className="home-create-dropdown" role="group" aria-label="Acciones para crear">
                  {canManageProducts && <button type="button" onClick={() => { setHomeCreateMenuOpen(false); navigate("products"); setProductForm(blankProduct); setEditingProductId(null); setShowProductForm(true); }}><span className="home-create-item-icon"><AppIcon name="products" size={18}/></span><span><strong>Crear artículo</strong><small>Producto, servicio o artículo digital</small></span></button>}
                  {canManageSales && <button type="button" onClick={() => { setHomeCreateMenuOpen(false); clearQuoteDraft(); setError(""); setNotice(""); navigate("quotes"); setShowQuoteForm(true); }}><span className="home-create-item-icon"><AppIcon name="quotes" size={18}/></span><span><strong>Crear cotización</strong><small>Preparar una propuesta para un cliente</small></span></button>}
                  {canManagePurchases && <button type="button" onClick={() => { setHomeCreateMenuOpen(false); setPurchaseModuleTab("purchases"); setShowPurchaseForm(true); navigate("purchases"); }}><span className="home-create-item-icon"><AppIcon name="purchases" size={18}/></span><span><strong>Registrar compra</strong><small>Ingresar una compra de proveedor</small></span></button>}
                  {canManageExpenses && <button type="button" onClick={() => { setHomeCreateMenuOpen(false); setPurchaseModuleTab("expenses"); setShowExpenseForm(true); navigate("purchases"); }}><span className="home-create-item-icon"><AppIcon name="expenses" size={18}/></span><span><strong>Registrar gasto</strong><small>Registrar una salida de dinero</small></span></button>}
                  {canManageCustomers && <button type="button" onClick={() => { setHomeCreateMenuOpen(false); setCustomerDraft(blankCustomer); setEditingCustomerId(null); setShowCustomerForm(true); navigate("customers"); }}><span className="home-create-item-icon"><AppIcon name="customers" size={18}/></span><span><strong>Crear cliente</strong><small>Guardar los datos de un cliente</small></span></button>}
                </div>}
              </div>}
              {!appInstalled && <button type="button" className="home-utility-action install-app-button" onClick={requestPwaInstall}><AppIcon name="grid" size={16}/>{installPrompt ? "Instalar aplicación" : "Cómo instalar"}</button>}
            </div>
          </section>
          {showInstallGuide && !appInstalled && <section className="install-guide-panel panel">
            <div className="install-guide-heading"><div><span className="eyebrow">TRESEISCINCO · APP INSTALABLE</span><h3>Usa treseiscinco desde tu pantalla de inicio</h3><p>La instalación crea un acceso directo con aspecto de aplicación. Necesitas conexión a internet para consultar y guardar los datos del negocio.</p></div><button type="button" className="icon-action-button" aria-label="Cerrar instrucciones" onClick={() => setShowInstallGuide(false)}>×</button></div>
            <div className="install-guide-steps">
              <div><strong>Android · Chrome</strong><p>Abre el menú ⋮ del navegador y elige «Instalar aplicación» o «Agregar a pantalla principal».</p></div>
              <div><strong>iPhone · Safari</strong><p>Toca Compartir y selecciona «Agregar a pantalla de inicio»; después confirma «Agregar».</p></div>
              <div><strong>Computador · Chrome o Edge</strong><p>Busca el icono Instalar en la barra de direcciones o abre el menú del navegador y selecciona «Instalar treseiscinco».</p></div>
            </div>
          </section>}
          {businessSubscription && ["trialing","expired"].includes(businessSubscription.status) && <section className={"trial-status-banner panel"+(businessSubscription.status==="expired"?" trial-expired":"")}><div><strong>{businessSubscription.status==="expired"?"Tu prueba gratuita terminó":"Prueba gratuita de treseiscinco"}</strong><p>{businessSubscription.status==="expired"?"Tu periodo de prueba ha terminado. Revisa con treseiscinco las opciones para continuar.":("Te quedan "+Math.max(0,Math.ceil((new Date(businessSubscription.current_period_end).getTime()-Date.now())/86400000))+" días de prueba. Finaliza el "+new Date(businessSubscription.current_period_end).toLocaleDateString("es-CO",{timeZone:"America/Bogota",dateStyle:"long"})+".")}</p></div><span>{businessSubscription.status==="expired"?"Periodo vencido":"Acceso de prueba"}</span></section>}
          <section className="home-operating-summary">
            <div className="home-section-heading"><div><h2>Cifras clave</h2><p>Indicadores actualizados desde tus movimientos registrados.</p></div><span className="home-updated-label">{homeSummary.loading || inventoryOverviewLoading ? "Actualizando…" : "Datos reales"}</span></div>
            <div className="home-operating-metrics">
              {canAccessScreen("products") && <button type="button" className="home-operating-metric" onClick={() => navigate("products")}><span>Referencias</span><strong>{inventoryOverviewLoading ? "…" : inventoryOverview.productCount.toLocaleString("es-CO")}</strong><small>Artículos en inventario</small></button>}
              {canAccessScreen("products") && <button type="button" className={"home-operating-metric" + (inventoryOverview.outOfStockCount ? " home-metric-alert" : "")} onClick={() => { setProductStockFilter("out_of_stock"); setProductPage(1); navigate("products"); }}><span>Sin stock</span><strong>{inventoryOverviewLoading ? "…" : inventoryOverview.outOfStockCount.toLocaleString("es-CO")}</strong><small>{inventoryOverview.outOfStockCount ? "Revisar agotados" : "Sin agotados registrados"}</small></button>}
              {canAccessScreen("products") && <button type="button" className="home-operating-metric" onClick={() => navigate("products")}><span>Costo del inventario</span><strong>{inventoryOverviewLoading ? "…" : money(inventoryOverview.costMinor, currencyCode)}</strong><small>Capital registrado en existencias</small></button>}
              {canAccessScreen("products") && <button type="button" className="home-operating-metric" onClick={() => navigate("products")}><span>Valor de venta estimado</span><strong>{inventoryOverviewLoading ? "…" : money(inventoryOverview.retailMinor, currencyCode)}</strong><small>Si vendes todo el stock actual</small></button>}
              {canAccessScreen("sales") && <button type="button" className="home-operating-metric" onClick={() => navigate("sales")}><span>Ventas de hoy</span><strong>{homeSummary.loading ? "…" : money(homeSummary.todaySalesMinor, currencyCode)}</strong><small>{homeSummary.loading ? "Consultando operaciones" : homeSummary.todaySalesCount.toLocaleString("es-CO") + (homeSummary.todaySalesCount === 1 ? " venta registrada" : " ventas registradas")}</small></button>}
              {canAccessScreen("quotes") && <button type="button" className={"home-operating-metric" + (homeSummary.openQuotesCount ? " home-metric-attention" : "")} onClick={() => navigate("quotes")}><span>Cotizaciones por revisar</span><strong>{homeSummary.loading ? "…" : homeSummary.openQuotesCount.toLocaleString("es-CO")}</strong><small>{homeSummary.openQuotesCount ? "Borradores y enviadas" : "No hay cotizaciones abiertas"}</small></button>}
            </div>
            {inventoryOverview.lowStockCount > 0 && canAccessScreen("products") && <button type="button" className="home-stock-warning" onClick={() => { setProductStockFilter("low_stock"); setProductPage(1); navigate("products"); }}><span><strong>{inventoryOverview.lowStockCount} artículos están en su mínimo o por debajo</strong><small>Abre el filtro y revisa qué necesitas reponer.</small></span><b>Ver inventario ↗</b></button>}
            {homeSummary.error && <p className="helper-text">No se pudo actualizar toda la actividad: {homeSummary.error}</p>}
          </section>
          <section className="home-work-modules">
            <div className="home-section-heading home-modules-heading"><div><h2>Accesos principales</h2><p>Las tareas más habituales, en su sitio. El resto de módulos está en el menú lateral.</p></div><span className="count-label">{homeShortcutAreas.length} accesos</span></div>
            <section className="area-grid home-area-grid">{homeShortcutAreas.map((area) => <button type="button" className={"area-card area-card-button home-area-card home-area-card-"+area.screen} key={area.screen} onClick={() => navigate(area.screen)}><div className="area-card-top"><span className="area-icon"><AppIcon name={area.screen} size={22} /></span><span className="area-arrow" aria-hidden="true">↗</span></div><h3>{area.title}</h3><p>{area.description}</p></button>)}</section>
          </section>
        </div> : <section className="empty-state"><span className="empty-icon">{areas.find((a) => a.screen === screen)?.icon || "⌘"}</span><h3>{areas.find((a) => a.screen === screen)?.title || "Sección"}</h3><p>Estamos construyendo esta parte sobre la misma base segura. Tus datos no se simulan ni se inventan.</p><button className="secondary-button" onClick={() => navigate("home")}>Volver a Inicio</button></section>}
        <footer className="app-footer"><span>Los datos se separan por negocio.</span></footer>
      </section>
      <div className={"ai-assistant-layer" + (contextualHelpEnabled ? " ai-with-help" : "")}>
        {aiOpen && <section id="treseiscinco-ai-panel" className="ai-assistant-panel" role="dialog" aria-label="Asistente IA de treseiscinco">
          <header className="ai-assistant-header"><div><span className="ai-assistant-spark">✦</span><div><strong>IA avanzada</strong><small>{activeBusiness?.name || "Sin negocio seleccionado"} · datos según permisos</small></div></div><button type="button" aria-label="Cerrar asistente" onClick={() => setAiOpen(false)}>×</button></header>
          <div ref={aiMessagesRef} className="ai-assistant-messages" aria-live="polite">
            {!aiHistory.length && <div className="ai-assistant-welcome"><strong>Tu negocio, con datos reales.</strong><p>Consulta quién te ha comprado más, cómo van tus ventas y qué productos necesitan reposición. La IA solo usa los datos permitidos por tu perfil.</p><div className="ai-assistant-suggestions"><button type="button" onClick={() => setAiMessage("¿Quién me ha comprado más este mes?")}>Mejor cliente este mes</button><button type="button" onClick={() => setAiMessage("¿Qué productos debo reponer?")}>Qué debo reponer</button><button type="button" onClick={() => setAiMessage("Dame un resumen de ventas de este mes.")}>Resumen de ventas</button></div></div>}
            {aiHistory.map((item, index) => <div className={"ai-assistant-message " + item.role} key={index}><span>{item.role === "assistant" ? "IA" : "Tú"}</span><p>{item.content}</p>{item.role === "assistant" && item.elapsedMs != null && <small className="ai-assistant-meta">{item.dataBacked ? "Información del negocio" : "Respuesta del asistente"}</small>}</div>)}
            {aiBusy && <div className="ai-assistant-thinking">Estoy revisando la información…</div>}
          </div>
          <form className="ai-assistant-form" onSubmit={sendAiMessage}><textarea value={aiMessage} onChange={(e) => setAiMessage(e.target.value)} placeholder={aiVoiceListening ? "Escuchando… habla ahora" : "Escribe o dicta tu pregunta…"} rows={2} maxLength={1500} disabled={aiBusy} /><button type="button" className={"ai-voice-button"+(aiVoiceListening?" listening":"")} onClick={toggleAiVoice} aria-label={aiVoiceListening?"Detener dictado":"Hablar con la IA"} title={aiVoiceListening?"Detener dictado":"Hablar con la IA"}>{aiVoiceListening ? "■" : "🎙"}</button><button type="submit" disabled={aiBusy || !aiMessage.trim()} aria-label="Enviar pregunta">➤</button></form>
          <p className="ai-assistant-disclaimer">Uso la información registrada en este negocio y no invento cifras. Si algún dato no está disponible, te lo diré con claridad.</p>
        </section>}
        <button type="button" className="ai-assistant-trigger" aria-expanded={aiOpen} aria-controls="treseiscinco-ai-panel" onClick={() => { setHelpOpen(false); document.dispatchEvent(new CustomEvent("treseiscinco:field-help-open", { detail: { source: null } })); setAiOpen((open) => !open); }}><span>✦</span> IA</button>
      </div>
      {contextualHelpEnabled && <div className="context-help-layer">
        <button type="button" className="context-help-trigger" aria-expanded={helpOpen} aria-controls="contextual-help-panel" onClick={() => { setAiOpen(false); document.dispatchEvent(new CustomEvent("treseiscinco:field-help-open", { detail: { source: null } })); setHelpOpen((open) => !open); }}><span className="context-help-trigger-icon" aria-hidden="true">?</span><span>Ayuda</span></button>
        {helpOpen && <aside id="contextual-help-panel" className="context-help-panel" role="dialog" aria-modal="false" aria-label={"Ayuda: " + contextualHelp.title}>
          <header className="context-help-header"><div><p>AYUDA CONTEXTUAL</p><h2>{contextualHelp.title}</h2></div><button type="button" className="context-help-close" aria-label="Cerrar ayuda" onClick={() => setHelpOpen(false)}>×</button></header>
          <p className="context-help-intro">{contextualHelp.intro}</p>
          <div className="context-help-section"><strong>Cómo hacerlo</strong><ol>{contextualHelp.steps.map((step, index) => <li key={index}><span>{index + 1}</span><p>{step}</p></li>)}</ol></div>
          <div className="context-help-tip"><strong><span aria-hidden="true">✦</span> Consejo útil</strong><p>{contextualHelp.tip}</p></div>
          <footer className="context-help-footer"><button type="button" className="primary-button" onClick={() => setHelpOpen(false)}>Entendido</button></footer>
        </aside>}
      </div>}

      {selectedRecordDetail && <div className="customer-detail-backdrop record-detail-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setSelectedRecordDetail(null); }}><section className="customer-detail-card record-detail-card" role="dialog" aria-modal="true" aria-labelledby="record-detail-title"><header className="customer-detail-header"><div><span className="customer-detail-kicker">DETALLE DEL REGISTRO · {selectedRecordDetail.type}</span><h2 id="record-detail-title">{selectedRecordDetail.title}</h2></div><button type="button" className="customer-detail-close" aria-label="Cerrar detalle" onClick={() => setSelectedRecordDetail(null)}>×</button></header><div className="customer-detail-content">{selectedRecordDetail.fields.filter(field => field.value !== undefined && field.value !== null && String(field.value).trim() !== "").map((field,index)=><div className="customer-detail-field record-detail-field" key={field.label+index}><span>{field.label}</span><strong>{String(field.value)}</strong></div>)}{selectedRecordDetail.notes && <section className="customer-detail-group"><h3>Notas</h3><p className="customer-detail-notes">{selectedRecordDetail.notes}</p></section>}</div><footer className="customer-detail-actions"><button type="button" className="secondary-button" onClick={() => setSelectedRecordDetail(null)}>Cerrar ficha</button></footer></section></div>}
    </main>
  );
}
