import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "./lib/supabase.js";

const areas = [
  { icon: "▦", title: "Productos e inventario", description: "Productos, fotos, precios y existencias.", screen: "products" },
  { icon: "↗", title: "Ventas", description: "Registra ventas, abonos y saldos.", screen: "sales" },
  { icon: "◎", title: "Clientes", description: "Personas y empresas relacionadas con tus ventas.", screen: "customers" },
  { icon: "◷", title: "Costos y rentabilidad", description: "Costos, margen y utilidad de tu negocio.", screen: "profitability" },
  { icon: "▤", title: "Compras y gastos", description: "Compras, proveedores y gastos.", screen: "purchases" },
  { icon: "◉", title: "Catálogo para compartir", description: "Un catálogo público para tus clientes.", screen: "catalog" },
  { icon: "⌘", title: "Equipo y permisos", description: "Accesos para empleados según su función.", screen: "team" }
];

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
  ["COP", "Peso colombiano"], ["USD", "Dólar estadounidense"], ["EUR", "Euro"],
  ["MXN", "Peso mexicano"], ["PEN", "Sol peruano"], ["CLP", "Peso chileno"],
  ["ARS", "Peso argentino"], ["BRL", "Real brasileño"], ["CAD", "Dólar canadiense"],
  ["GBP", "Libra esterlina"], ["JPY", "Yen japonés"], ["AUD", "Dólar australiano"]
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
const blankProduct = { name: "", category_id: "", description: "", commercial_presentation: "", product_type: "physical", unit_name: "unidad", unit_custom: "", sale_price: "", cost_price: "", stock: "0", low_stock: "" };
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
const blankCustomer = { first_name: "", last_name: "", company_name: "", document_type: "", document_number: "", email: "", phone: "", whatsapp: "", city: "", address: "", notes: "" };

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

function PublicCatalog({ businessId }) {
  const [page, setPage] = useState(0);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const pageSize = 12;

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

  const business = payload?.business;
  const items = payload?.products || [];
  const total = Number(payload?.total || 0);
  return <main className="public-catalog-shell">
    <header className="public-catalog-header">
      <a href={window.location.origin} className="public-catalog-brand" aria-label="Treintayuno">31</a>
      <div><span>CATÁLOGO DE PRODUCTOS</span><h1>{business?.name || "Catálogo"}</h1></div>
    </header>
    {loading ? <div className="public-catalog-message"><span className="loading-dots">31</span><p>Cargando el catálogo…</p></div>
      : error ? <div className="public-catalog-message"><h2>No se pudo abrir el catálogo</h2><p>{error}</p><button type="button" className="secondary-button" onClick={() => setRetryKey((key) => key + 1)}>Reintentar</button></div>
      : !business ? <div className="public-catalog-message"><h2>Este catálogo no está disponible</h2><p>Revisa que el enlace sea correcto.</p></div>
      : <section className="public-catalog-content">
        <div className="public-catalog-intro"><div><p>Una selección de productos de {business.name}.</p><span>{total} {total === 1 ? "producto publicado" : "productos publicados"}</span></div><span className="public-catalog-currency">{business.currency_code}</span></div>
        {items.length ? <div className="public-catalog-grid">{items.map((product) => <article className="public-catalog-card" key={product.id}>
          <PublicCatalogImage businessId={businessId} product={product} />
          <div className="public-catalog-card-copy">
            <span className="public-catalog-category">{product.category_name || "Producto"}</span>
            <h2>{product.name}</h2>
            {product.description && <p>{product.description}</p>}
            {product.commercial_presentation && <span className="public-catalog-presentation">{product.commercial_presentation}</span>}
            <div className="public-catalog-price"><strong>{money(product.sale_price_minor, business.currency_code || "COP")}</strong><span>por {product.unit_name || "unidad"}</span></div>
          </div>
        </article>)}</div>
          : <div className="public-catalog-message"><h2>Pronto habrá productos aquí</h2><p>Este negocio aún no ha publicado productos para compartir.</p></div>}
        {total > pageSize && <nav className="public-catalog-pagination" aria-label="Páginas del catálogo">
          <button type="button" className="secondary-button" disabled={page <= 0} onClick={() => { setPage((current) => Math.max(0, current - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Anterior</button>
          <span>Página {page + 1} de {Math.ceil(total / pageSize)}</span>
          <button type="button" className="secondary-button" disabled={(page + 1) * pageSize >= total} onClick={() => { setPage((current) => current + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Siguiente</button>
        </nav>}
      </section>}
    <footer className="public-catalog-footer">Catálogo compartido con Treintayuno</footer>
  </main>;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [screen, setScreen] = useState("home");
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
  const [viewMode, setViewMode] = useState("rows");
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
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [purchaseModuleTab, setPurchaseModuleTab] = useState("purchases");
  const [purchaseRows, setPurchaseRows] = useState([]);
  const [purchaseItemsByPurchase, setPurchaseItemsByPurchase] = useState({});
  const [purchaseProducts, setPurchaseProducts] = useState([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierDraft, setSupplierDraft] = useState(blankSupplier);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseSupplierId, setPurchaseSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(todayInBogota());
  const [purchaseProductChoice, setPurchaseProductChoice] = useState("");
  const [purchaseItemName, setPurchaseItemName] = useState("");
  const [purchaseQuantity, setPurchaseQuantity] = useState("1");
  const [purchaseUnitCost, setPurchaseUnitCost] = useState("");
  const [purchaseCart, setPurchaseCart] = useState([]);
  const [purchaseTax, setPurchaseTax] = useState("0");
  const [purchasePayment, setPurchasePayment] = useState("0");
  const [purchaseNotes, setPurchaseNotes] = useState("");
  const [expenseRows, setExpenseRows] = useState([]);
  const [profitabilityLoading, setProfitabilityLoading] = useState(false);
  const [profitabilitySales, setProfitabilitySales] = useState([]);
  const [profitabilitySaleItems, setProfitabilitySaleItems] = useState([]);
  const [profitabilityExpenses, setProfitabilityExpenses] = useState([]);
  const [profitabilityPeriod, setProfitabilityPeriod] = useState("month");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseDraft, setExpenseDraft] = useState(blankExpense);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogPublishingId, setCatalogPublishingId] = useState(null);
  const [teamRows, setTeamRows] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [teamEmail, setTeamEmail] = useState("");
  const [teamPermissionDraft, setTeamPermissionDraft] = useState(blankTeamPermissions);
  const [teamEditingUserId, setTeamEditingUserId] = useState(null);
  const [teamSaving, setTeamSaving] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [saleProducts, setSaleProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerDraft, setCustomerDraft] = useState(blankCustomer);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleCustomerId, setSaleCustomerId] = useState("");
  const [saleProductChoice, setSaleProductChoice] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [saleItems, setSaleItems] = useState([]);
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
  const [settingsChecking, setSettingsChecking] = useState(false);
  const [settingsHasData, setSettingsHasData] = useState(false);
  const [search, setSearch] = useState("");
  const [adjustingId, setAdjustingId] = useState(null);
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const currencyCode = activeBusiness?.currency_code || "COP";

  const loadBusinesses = useCallback(async (userId) => {
    const { data, error: queryError } = await supabase
      .from("business_members")
      .select("business_id, role, permissions, businesses(id, name, logo_path, theme, currency_code)")
      .eq("user_id", userId);
    if (queryError) throw queryError;
    const list = (data || []).map((row) => ({ ...row.businesses, role: row.role, permissions: row.permissions || {} })).filter((b) => b?.id);
    setBusinesses(list);
    setActiveBusiness((current) => list.find((b) => b.id === current?.id) || list[0] || null);
    setScreen((current) => list.length ? (current === "setup" ? "home" : current) : "setup");
    return list;
  }, []);

  const loadProducts = useCallback(async () => {
    if (!activeBusiness?.id) return;
    setProductsLoading(true); setError("");
    try {
      const from = (productPage - 1) * productPageSize;
      const to = from + productPageSize - 1;
      let productsQuery = supabase.from("products")
        .select("id,business_id,category_id,sku,slug,name,description,commercial_presentation,product_type,unit_name,sale_price_minor,cost_price_minor,stock_on_hand,low_stock_threshold,track_inventory,is_sellable,is_published,image_paths,archived_at,created_at", { count: "exact" })
        .eq("business_id", activeBusiness.id).order("name").range(from, to);
      productsQuery = showArchivedProducts ? productsQuery.not("archived_at", "is", null) : productsQuery.is("archived_at", null);
      if (search.trim()) productsQuery = productsQuery.ilike("name", "%" + search.trim() + "%");
      const [productResult, categoryResult] = await Promise.all([
        productsQuery,
        supabase.from("product_categories").select("id,name,description,sort_order").eq("business_id", activeBusiness.id).order("name")
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
  }, [activeBusiness?.id, productPage, productPageSize, search, showArchivedProducts]);

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (!currentSession) {
        setBusinesses([]); setActiveBusiness(null); setProducts([]); setCategories([]); setScreen("home");
      } else {
        queueMicrotask(() => loadBusinesses(currentSession.user.id).catch((e) => setError(friendlyError(e))));
      }
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [loadBusinesses]);

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

  useEffect(() => {
    if (screen !== "settings" || !activeBusiness?.id) return;
    let alive = true;
    setSettingsCurrency(activeBusiness.currency_code || "COP");
    setSettingsChecking(true);
    setError("");
    businessHasFinancialData(activeBusiness.id)
      .then((hasData) => { if (alive) setSettingsHasData(hasData); })
      .catch((e) => { if (alive) setError(friendlyError(e)); })
      .finally(() => { if (alive) setSettingsChecking(false); });
    return () => { alive = false; };
  }, [screen, activeBusiness?.id, activeBusiness?.currency_code]);

  async function submitAuth(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "signup") {
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
        theme: { primary: "#2d5947", background: "#f7f6f1" }
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
    event.preventDefault();
    if (!activeBusiness?.id || !categoryName.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { error: insertError } = await supabase.from("product_categories").insert({ business_id: activeBusiness.id, name: categoryName.trim() });
      if (insertError) throw insertError;
      setCategoryName(""); setNotice("Categoría creada."); await loadProducts();
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
    setBusy(true); setError(""); setNotice("");
    try {
      const hasData = await businessHasFinancialData(activeBusiness.id);
      setSettingsHasData(hasData);
      if (hasData && settingsCurrency !== currencyCode) {
        throw new Error("Para cambiar la moneda después de registrar productos u operaciones, primero se necesita una conversión de importes.");
      }
      if (settingsCurrency === currencyCode) {
        setNotice("La moneda ya está configurada."); return;
      }
      const { data, error: updateError } = await supabase.from("businesses")
        .update({ currency_code: settingsCurrency })
        .eq("id", activeBusiness.id).select("id,currency_code").maybeSingle();
      if (updateError) throw updateError;
      if (!data) throw new Error("No se pudo guardar la moneda. Comprueba que hayas iniciado sesión como propietario.");
      setActiveBusiness((current) => current ? { ...current, currency_code: data.currency_code } : current);
      setBusinesses((current) => current.map((business) => business.id === data.id ? { ...business, currency_code: data.currency_code } : business));
      setNotice("Moneda guardada. Los nuevos importes usarán esta moneda.");
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  function cancelProductForm() {
    stagedImages.forEach((image) => URL.revokeObjectURL(image.preview));
    setStagedImages([]);
    setProductForm(blankProduct);
    if (editingProductId) setOpenProductGalleries((current) => ({ ...current, [editingProductId]: false }));
    setEditingProductId(null);
    setAdjustDelta(""); setAdjustNote("");
    setShowProductForm(false);
    setError("");
  }

  function startEditProduct(product) {
    stagedImages.forEach((image) => URL.revokeObjectURL(image.preview));
    const knownUnit = unitOptions.some(([value]) => value === product.unit_name);
    const digits = currencyDigits(currencyCode);
    setStagedImages([]);
    setEditingProductId(product.id);
    setAdjustDelta(""); setAdjustNote("");
    setOpenProductGalleries((current) => ({ ...current, [product.id]: true }));
    setShowProductForm(true);
    setProductForm({
      name: product.name || "",
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
        mutation = mutation.update({ ...payload, updated_at: new Date().toISOString() })
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
        await loadProducts();
        setNotice("Producto actualizado. El historial de existencias se conservó.");
        return;
      }
      const { data: newProductId, error: rpcError } = await supabase.rpc("create_product_with_opening_stock", {
        p_business_id: activeBusiness.id,
        p_name: productForm.name.trim(),
        p_category_id: productForm.category_id || null,
        p_sku: null,
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
      await loadProducts();
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  function renderStockAdjustment(product) {
    if (!editingProductId || editingProductId !== product.id || !product.track_inventory) return null;
    return <section className="edit-subpanel">
      <div className="edit-subpanel-heading"><strong>Existencias</strong><span>Actuales: {Number(product.stock_on_hand).toLocaleString("es-CO")} {product.unit_name || "unidades"}</span></div>
      <div className="stock-adjust-form">
        <div>
          <label>Cambio (+ entra, − sale)<input type="number" step="0.001" value={adjustDelta} onChange={(e) => setAdjustDelta(e.target.value)} placeholder="Ej. 5 o -2" /></label>
          <label>Motivo<input value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} maxLength={500} placeholder="Compra, daño, conteo…" /></label>
        </div>
        <button type="button" className="primary-button" disabled={busy || !adjustDelta || Number(adjustDelta) === 0} onClick={() => saveInlineStock(product.id)}>{busy ? "Guardando…" : "Guardar ajuste"}</button>
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
      {(product.image_paths || []).length < 3 && <label className="image-upload-label">+ Añadir foto
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploadingImagesFor === product.id || busy} onChange={(event) => chooseExistingProductImages(product, event)} />
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
          .eq("business_id", activeBusiness.id).order("full_name").limit(500);
        const safeTerm = customerSearch.trim().replace(/[^\p{L}\p{N}@.+\-_\s]/gu, " ").replace(/\s+/g, " ").slice(0, 100);
        if (safeTerm) {
          const filter = ["full_name", "company_name", "email", "phone", "whatsapp", "document_number", "city"]
            .map((field) => field + ".ilike.%" + safeTerm + "%").join(",");
          query = query.or(filter);
        }
        const result = await query;
        if (result.error) throw result.error;
        setCustomers(result.data || []);
      } else {
        const [salesResult, productsResult, customersResult] = await Promise.all([
          supabase.from("sales").select("id,business_id,customer_id,sale_number,status,currency_code,total_minor,amount_paid_minor,notes,sold_at,created_at")
            .eq("business_id", activeBusiness.id).order("created_at", { ascending: false }).limit(100),
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
      if (screen === "customers") setCustomers([]);
      else { setSalesData([]); setSaleProducts([]); }
    } finally { setSalesLoading(false); }
  }

  useEffect(() => {
    if ((screen === "sales" || screen === "customers") && activeBusiness?.id) loadSalesModuleData();
  }, [screen, activeBusiness?.id, customerSearch]);

  async function loadPurchasesModuleData() {
    if (!activeBusiness?.id || screen !== "purchases") return;
    setPurchaseLoading(true); setError("");
    try {
      const privileged = ["owner", "admin"].includes(activeBusiness.role);
      const permissions = activeBusiness.permissions || {};
      const mayReadPurchases = privileged || Boolean(permissions.purchases_view);
      const mayReadExpenses = privileged || Boolean(permissions.expenses_view);
      const mayReadSuppliers = privileged || Boolean(permissions.suppliers_view);
      const mayManagePurchases = privileged || Boolean(permissions.purchases_manage);
      const none = Promise.resolve({ data: [], error: null });
      const [purchaseResult, expenseResult, supplierResult, productResult] = await Promise.all([
        mayReadPurchases ? supabase.from("purchases").select("id,business_id,supplier_id,purchase_number,status,currency_code,subtotal_minor,tax_minor,total_minor,amount_paid_minor,notes,purchased_at,created_at")
          .eq("business_id", activeBusiness.id).order("purchased_at", { ascending: false }).limit(100) : none,
        mayReadExpenses ? supabase.from("expenses").select("id,business_id,category,description,amount_minor,currency_code,expense_date,payment_method,supplier_id,notes,created_at")
          .eq("business_id", activeBusiness.id).order("expense_date", { ascending: false }).limit(100) : none,
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
      if (purchaseList.length) {
        const itemsResult = await supabase.from("purchase_items")
          .select("id,purchase_id,product_id,item_name,quantity,unit_cost_minor,line_total_minor")
          .eq("business_id", activeBusiness.id).in("purchase_id", purchaseList.map((purchase) => purchase.id))
          .order("created_at");
        if (itemsResult.error) throw itemsResult.error;
        for (const item of itemsResult.data || []) {
          if (!itemMap[item.purchase_id]) itemMap[item.purchase_id] = [];
          itemMap[item.purchase_id].push(item);
        }
      }
      setPurchaseRows(purchaseList);
      setPurchaseItemsByPurchase(itemMap);
      setExpenseRows(expenseResult.data || []);
      setSuppliers(supplierResult.data || []);
      setPurchaseProducts(productResult.data || []);
    } catch (e) {
      setError(friendlyError(e));
      setPurchaseRows([]); setPurchaseItemsByPurchase({});
      setExpenseRows([]); setSuppliers([]); setPurchaseProducts([]);
    } finally { setPurchaseLoading(false); }
  }

  useEffect(() => {
    if (screen === "purchases" && activeBusiness?.id) loadPurchasesModuleData();
  }, [screen, activeBusiness?.id]);

  async function loadCatalogAdminData() {
    if (!activeBusiness?.id || screen !== "catalog") return;
    setCatalogLoading(true); setError("");
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        supabase.from("products").select("id,business_id,name,category_id,description,commercial_presentation,unit_name,sale_price_minor,is_published,is_sellable,image_paths,archived_at")
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
        p_items: purchaseCart.map((item) => ({
          product_id: item.product_id, item_name: item.name, quantity: Number(item.quantity),
          unit_cost_minor: toMinorUnits(item.unit_cost, currencyCode)
        }))
      });
      if (purchaseError) throw purchaseError;
      setShowPurchaseForm(false); setPurchaseSupplierId(""); setPurchaseDate(todayInBogota());
      setPurchaseCart([]); setPurchaseTax("0"); setPurchasePayment("0"); setPurchaseNotes("");
      setNotice("Compra guardada. El ingreso a inventario y su historial se actualizaron juntos.");
      await loadPurchasesModuleData();
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  async function addSupplier(event) {
    event.preventDefault();
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
      setPurchaseSupplierId(data.id); setSupplierDraft(blankSupplier); setShowSupplierForm(false);
      setNotice("Proveedor guardado: " + data.name + ".");
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
      setExpenseDraft({ ...blankExpense, expense_date: todayInBogota() });
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
        result = await supabase.from("customers").update(payload)
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
    setBusy(true); setError(""); setNotice("");
    try {
      const { data, error: saleError } = await supabase.rpc("create_sale", {
        p_business_id: activeBusiness.id, p_customer_id: saleCustomerId || null,
        p_items: saleItems.map((item) => ({ product_id: item.product_id, quantity: Number(item.quantity) })),
        p_amount_paid_minor: payment, p_notes: saleNotes.trim() || null, p_initial_payment_method: saleInitialPaymentMethod
      });
      if (saleError) throw saleError;
      const sale = Array.isArray(data) ? data[0] : data;
      setShowSaleForm(false); setSaleCustomerId(""); setSaleProductChoice(""); setSaleQuantity("1");
      setSaleItems([]); setSalePayment(""); setSaleInitialPaymentMethod("Efectivo"); setSaleNotes("");
      setNotice("Venta " + (sale?.sale_number || "registrada") + " guardada. El inventario se actualizó.");
      await loadSalesModuleData();
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
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

  const filteredProducts = products;
  const totalProductPages = Math.max(1, Math.ceil(productsCount / productPageSize));
  const normalizedCatalogSearch = catalogSearch.trim().toLocaleLowerCase("es");
  const filteredCatalogProducts = catalogProducts.filter((product) => {
    const category = catalogCategories.find((item) => item.id === product.category_id)?.name || "";
    return [product.name, product.description, category].filter(Boolean).join(" ").toLocaleLowerCase("es").includes(normalizedCatalogSearch);
  });
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
    if (profitabilityPeriod === "month") return key.slice(0, 7) === currentMonthKey;
    const day = new Date(key + "T12:00:00-05:00").getTime();
    const now = new Date(todayBogotaKey + "T12:00:00-05:00").getTime();
    return day >= now - 30 * 24 * 60 * 60 * 1000 && day <= now + 24 * 60 * 60 * 1000;
  };
  const periodSales = profitabilitySales.filter((sale) => !["canceled", "refunded"].includes(sale.status) && profitInPeriod(sale.sold_at || sale.created_at));
  const periodSaleIds = new Set(periodSales.map((sale) => sale.id));
  const periodSaleItems = profitabilitySaleItems.filter((item) => periodSaleIds.has(item.sale_id));
  const periodExpenses = profitabilityExpenses.filter((expense) => profitInPeriod(expense.expense_date));
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

  const isBusinessManager = ["owner", "admin"].includes(activeBusiness?.role);
  const isBusinessOwner = activeBusiness?.role === "owner";
  const businessPermissions = activeBusiness?.permissions || {};
  const requestedBusinessPermissions = businessPermissions._modules_requested || businessPermissions;
  const canPermission = (permission) => isBusinessManager
    || Boolean(requestedBusinessPermissions[permission])
    || (permission === "suppliers_manage" && Boolean(requestedBusinessPermissions.purchases_manage));
  const canManageProducts = canPermission("products_manage");
  const canManageSales = canPermission("sales_manage");
  const canManageCustomers = canPermission("customers_manage");
  const canManagePurchases = canPermission("purchases_manage");
  const canManageExpenses = canPermission("expenses_manage");
  const canViewPurchases = canPermission("purchases_view");
  const canViewExpenses = canPermission("expenses_view");
  const effectivePurchaseTab = canViewPurchases
    ? (purchaseModuleTab === "expenses" && canViewExpenses ? "expenses" : "purchases")
    : "expenses";
  function canAccessScreen(next) {
    if (next === "home" || next === "setup") return true;
    if (next === "settings") return isBusinessOwner;
    if (next === "team") return isBusinessManager;
    if (next === "products") return canPermission("products_view");
    if (next === "sales") return canPermission("sales_view");
    if (next === "customers") return canPermission("customers_view");
    if (next === "purchases") return canViewPurchases || canViewExpenses;
    if (next === "profitability") return canPermission("sales_view") && canViewExpenses;
    if (next === "catalog") return canManageProducts;
    return false;
  }
  const visibleAreas = areas.filter((area) => canAccessScreen(area.screen));

  function navigate(next) {
    if (!canAccessScreen(next)) { setError("Tu cuenta no tiene permiso para abrir ese módulo."); return; }
    setScreen(next); setError(""); setNotice(""); setShowProductForm(false);
    if (next !== "purchases") { setShowPurchaseForm(false); setShowExpenseForm(false); setShowSupplierForm(false); }
    if (next !== "products") { setAdjustingId(null); }
  }

  const requestedPublicCatalog = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("catalog") : null;
  if (requestedPublicCatalog && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestedPublicCatalog)) {
    return <PublicCatalog businessId={requestedPublicCatalog} />;
  }

  if (!authReady) return <div className="loading-screen"><div className="brand-mark">31</div><p>Preparando tu espacio…</p></div>;

  if (!session) return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <a className="brand" href="/"><span className="brand-mark">31</span><span className="brand-name">treintayuno</span></a>
        <div className="auth-pitch"><p className="eyebrow">TU NEGOCIO, CON CLARIDAD</p><h1>Menos enredos.<br /><em>Más negocio.</em></h1><p>Productos, ventas, costos y clientes en un solo lugar, fácil de entender y usar.</p></div>
        <span className="panel-footnote">Un espacio independiente para cada negocio.</span>
      </section>
      <section className="auth-form-panel"><div className="auth-form-wrap">
        <p className="eyebrow">{mode === "signup" ? "EMPIEZA GRATIS" : "QUÉ BUENO VERTE"}</p>
        <h2>{mode === "signup" ? "Crea tu cuenta" : "Inicia sesión"}</h2>
        <p className="form-intro">{mode === "signup" ? "Primero creamos tu acceso. Después podrás registrar tu negocio." : "Entra para continuar con tu negocio."}</p>
        <form onSubmit={submitAuth} className="form-stack">
          {mode === "signup" && <label>Tu nombre<input autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="¿Cómo te llamas?" required maxLength={120} /></label>}
          <label>Correo electrónico<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required /></label>
          <label>Contraseña<input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} required /></label>
          {error && <p className="message error" role="alert">{error}</p>}{notice && <p className="message success" role="status">{notice}</p>}
          <button className="primary-button" disabled={busy}>{busy ? "Un momento…" : mode === "signup" ? "Crear mi cuenta" : "Entrar"}</button>
        </form>
        <p className="switch-mode">{mode === "signup" ? "¿Ya tienes cuenta?" : "¿Primera vez por aquí?"} <button className="text-button" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setNotice(""); }}>{mode === "signup" ? "Inicia sesión" : "Crear cuenta"}</button></p>
        <p className="privacy-note">Tu información pertenece a tu negocio. No uses datos reales de clientes hasta completar las pruebas de seguridad.</p>
      </div></section>
    </main>
  );

  if (!businesses.length || screen === "setup") return (
    <main className="setup-shell"><header className="topbar"><a className="brand" href="/"><span className="brand-mark">31</span><span className="brand-name">treintayuno</span></a><button className="text-button" onClick={signOut}>Cerrar sesión</button></header>
      <section className="setup-card"><p className="eyebrow">PASO 1 DE 1</p><h1>¿Cómo se llama<br /><em>tu negocio?</em></h1><p>Este nombre identifica tu espacio. Más adelante podrás configurar tu logo, colores y equipo.</p>
        <form className="form-stack" onSubmit={createBusiness}><label>Nombre del negocio<input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ej. Mi tienda" maxLength={120} required autoFocus /></label>
          {error && <p className="message error" role="alert">{error}</p>}{notice && <p className="message success" role="status">{notice}</p>}
          <button className="primary-button" disabled={busy}>{busy ? "Creando espacio…" : "Crear mi espacio"}</button>
        </form><p className="privacy-note">Cada negocio tiene sus propios datos y permisos.</p>
      </section>
    </main>
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/"><span className="brand-mark">31</span><span className="brand-name">treintayuno</span></a>
        <div className="business-switcher"><span className="business-avatar">{(activeBusiness?.name || "T").slice(0,1).toUpperCase()}</span><span className="business-name">{activeBusiness?.name}</span><span className="switch-caret">⌄</span></div>
        <p className="nav-label">TU NEGOCIO</p>
        <nav className="nav-list">
          <button className={screen === "home" ? "nav-item active" : "nav-item"} onClick={() => navigate("home")}><span>⌂</span> Resumen</button>
          {visibleAreas.map((area) => <button key={area.title} className={screen === area.screen ? "nav-item active" : "nav-item"} onClick={() => navigate(area.screen)}><span>{area.icon}</span>{area.title}</button>)}
          {isBusinessOwner && <button className={screen === "settings" ? "nav-item active" : "nav-item"} onClick={() => navigate("settings")}><span>⚙</span> Configuración</button>}
        </nav>
        <div className="sidebar-bottom"><div className="user-chip"><span className="user-avatar">{(session.user.email || "U").slice(0,1).toUpperCase()}</span><span className="user-email">{session.user.email}</span></div><button className="logout-button" onClick={signOut} disabled={busy}>Cerrar sesión</button></div>
      </aside>
      <section className="main-content">
        <header className="main-header"><div><p className="eyebrow">TU ESPACIO DE TRABAJO</p><h1>{screen === "products" ? "Productos e inventario" : screen === "settings" ? "Configuración" : screen === "home" ? (activeBusiness?.name || "Mi negocio") : areas.find((a) => a.screen === screen)?.title || "Tu negocio"}</h1></div><span className="role-pill">{activeBusiness?.role === "owner" ? "Propietario" : activeBusiness?.role === "admin" ? "Administrador" : "Empleado"}</span></header>
        {error && <p className="message error" role="alert">{error}</p>}
        {notice && <p className="message success" role="status">{notice}<button className="dismiss-button" onClick={() => setNotice("")}>Cerrar</button></p>}
        {screen === "sales" ? (
<section className="sales-page">
<div className="products-intro"><div><h2>Ventas</h2><p>Registra ventas, abonos y saldos.</p></div>{canManageSales && <button type="button" className="primary-button compact-button" onClick={() => { if(showSaleForm) clearSaleDraft(); else {setShowSaleForm(true);setError("");setNotice("");} }}>{showSaleForm?"Cancelar venta":"+ Nueva venta"}</button>}</div>
{canManageSales && showSaleForm && <form className="sale-form panel" onSubmit={createSale}>
<h3>Nueva venta</h3>
<div className="sale-builder">
<label>Cliente<select value={saleCustomerId} onChange={e=>setSaleCustomerId(e.target.value)}><option value="">Venta sin cliente</option>{customers.map(customer=><option key={customer.id} value={customer.id}>{customer.full_name}{customer.company_name&&customer.company_name!==customer.full_name?" · "+customer.company_name:""}</option>)}</select></label>
<label>Producto<select value={saleProductChoice} onChange={e=>setSaleProductChoice(e.target.value)}><option value="">Elige un producto…</option>{saleProducts.map(product=><option key={product.id} value={product.id}>{product.name} · {money(product.sale_price_minor,currencyCode)}{product.track_inventory?" · Stock "+Number(product.stock_on_hand).toLocaleString("es-CO"):""}</option>)}</select></label>
<label>Cantidad<input type="number" min="0.001" step="0.001" value={saleQuantity} onChange={e=>setSaleQuantity(e.target.value)}/></label><button type="button" className="secondary-button sale-add-button" onClick={addSaleLine}>+ Agregar</button>
</div>
{!saleProducts.length&&<p className="helper-text">No hay productos activos disponibles para vender. Registra o activa un producto primero.</p>}
{saleItems.length>0&&<div className="sale-cart"><div className="sale-cart-heading"><strong>Artículos de la venta</strong><span>{saleItems.length} productos</span></div>
{saleItems.map(item=><div className="sale-cart-row" key={item.product_id}><div className="sale-cart-name"><strong>{item.name}</strong><span>{money(item.unit_price_minor,currencyCode)} por {item.unit_name}</span></div><label>Cantidad<input type="number" min="0.001" step="0.001" value={item.quantity} onChange={e=>setSaleItems(current=>current.map(line=>line.product_id===item.product_id?{...line,quantity:e.target.value}:line))}/></label><strong className="sale-line-total">{money(Math.round(item.unit_price_minor*Number(item.quantity||0)),currencyCode)}</strong><button type="button" className="text-button danger-text" onClick={()=>setSaleItems(current=>current.filter(line=>line.product_id!==item.product_id))}>Quitar</button></div>)}
<div className="sale-total-line"><span>Total</span><strong>{money(saleItems.reduce((sum,item)=>sum+Math.round(item.unit_price_minor*Number(item.quantity||0)),0),currencyCode)}</strong></div></div>}
<div className="sale-bottom-fields"><label>Abono recibido {currencyCode}<input type="number" min="0" step={currencyDigits(currencyCode)===0?"1":"0.01"} value={salePayment} onChange={e=>setSalePayment(e.target.value)} placeholder="0"/></label><label>Forma de pago inicial<select value={saleInitialPaymentMethod} onChange={e=>setSaleInitialPaymentMethod(e.target.value)}><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option><option>Otro</option></select></label><label>Nota<input value={saleNotes} onChange={e=>setSaleNotes(e.target.value)} maxLength={1000} placeholder="Ej. entrega el viernes"/></label></div>
<p className="helper-text">Se usará el precio actual. La venta y la salida de inventario se guardan juntas; si no hay unidades suficientes, no se guardará.</p>
<div className="form-actions"><button type="button" className="secondary-button" onClick={clearSaleDraft}>Cancelar</button><button type="submit" className="primary-button" disabled={busy||!saleItems.length}>{busy?"Guardando…":"Guardar venta"}</button></div>
</form>}
<div className="sales-toolbar"><span>{salesData.length} ventas recientes</span></div>
{salesLoading?<div className="empty-state">Cargando ventas…</div>:salesData.length?<div className="sales-list">{salesData.map(sale=><article className="sale-record panel" key={sale.id}>
<div className="sale-record-top"><div><strong>{sale.sale_number}</strong><span>{new Date(sale.sold_at||sale.created_at).toLocaleString("es-CO",{dateStyle:"medium",timeStyle:"short"})}</span></div><span className={"status-pill "+(sale.status==="paid"?"status-active":sale.status==="canceled"||sale.status==="refunded"?"status-inactive":"status-unpublished")}>{saleStatusLabel(sale.status)}</span></div>
<div className="sale-record-customer">{sale.customer_name}</div>
{sale.items.length>0&&<div className="sale-record-items">{sale.items.map(item=><div key={item.id}><span>{item.item_name} × {Number(item.quantity).toLocaleString("es-CO")}</span><strong>{money(item.line_total_minor,sale.currency_code||currencyCode)}</strong></div>)}</div>}
<div className="sale-record-bottom"><div><span>Total</span><strong>{money(sale.total_minor,sale.currency_code||currencyCode)}</strong></div><div><span>Abonado</span><strong>{money(sale.amount_paid_minor,sale.currency_code||currencyCode)}</strong></div><div><span>Pendiente</span><strong>{money(Math.max(0,Number(sale.total_minor)-Number(sale.amount_paid_minor)),sale.currency_code||currencyCode)}</strong></div></div>
<div className="sale-payment-history"><div className="sale-payment-history-heading"><strong>Historial de abonos</strong><span>{(sale.payments||[]).length} {(sale.payments||[]).length===1?"pago":"pagos"}</span></div>
{(sale.payments||[]).length ? <div className="sale-payment-list">{sale.payments.map((paymentRow)=><div className="sale-payment-row" key={paymentRow.id}><div><strong>{money(paymentRow.amount_minor,sale.currency_code||currencyCode)}</strong><span>{paymentRow.payment_method} · {new Date(paymentRow.paid_at).toLocaleDateString("es-CO",{timeZone:"America/Bogota",dateStyle:"medium"})}</span>{paymentRow.notes&&<small>{paymentRow.notes}</small>}</div></div>)}</div> : <p className="sale-payment-empty">No hay abonos registrados.</p>}
{canManageSales && Math.max(0,Number(sale.total_minor)-Number(sale.amount_paid_minor))>0 && !["canceled","refunded","draft"].includes(sale.status) && <button type="button" className="secondary-button sale-register-payment-button" onClick={()=>salePaymentFormFor===sale.id?setSalePaymentFormFor(null):openSalePaymentForm(sale)}>{salePaymentFormFor===sale.id?"Cancelar":"＋ Registrar abono"}</button>}
{canManageSales && salePaymentFormFor===sale.id && <form className="sale-payment-form" onSubmit={(event)=>registerSalePayment(event,sale)}>
<label>Valor del abono<input type="number" min="0.01" max={Math.max(0,Number(sale.total_minor)-Number(sale.amount_paid_minor))/(10**currencyDigits(currencyCode))} step={currencyDigits(currencyCode)===0?"1":"0.01"} value={salePaymentAmount} onChange={e=>setSalePaymentAmount(e.target.value)} required/></label>
<label>Forma de pago<select value={salePaymentMethod} onChange={e=>setSalePaymentMethod(e.target.value)}><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option><option>Otro</option></select></label>
<label>Fecha del abono<input type="date" max={todayInBogota()} value={salePaymentDate} onChange={e=>setSalePaymentDate(e.target.value)} required/></label>
<label className="sale-payment-notes">Nota<input value={salePaymentNotes} onChange={e=>setSalePaymentNotes(e.target.value)} maxLength={1000} placeholder="Referencia o detalle del pago"/></label>
<div className="form-actions"><button type="button" className="secondary-button" onClick={()=>setSalePaymentFormFor(null)}>Cancelar</button><button type="submit" className="primary-button" disabled={salePaymentSaving}>{salePaymentSaving?"Registrando…":"Guardar abono"}</button></div>
</form>}
</div>
{sale.notes&&<p className="sale-record-note">{sale.notes}</p>}</article>)}</div>:<div className="empty-state"><span className="empty-icon">↗</span><h3>Todavía no hay ventas</h3><p>Cuando registres la primera, aparecerá aquí. No mostramos ventas de ejemplo.</p>{canManageSales && <button className="primary-button" onClick={()=>{setShowSaleForm(true);setError("");}}>+ Registrar primera venta</button>}</div>}
</section>
) : screen === "customers" ? (
<section className="customers-page">
<div className="products-intro"><div><h2>Clientes</h2><p>Personas y empresas relacionadas con tus ventas.</p></div>{canManageCustomers && <button type="button" className="primary-button compact-button" onClick={()=>{if(showCustomerForm)resetCustomerForm();else{setCustomerDraft(blankCustomer);setEditingCustomerId(null);setShowCustomerForm(true);setError("");setNotice("");}}}>{showCustomerForm?"Cancelar":"+ Nuevo cliente"}</button>}</div>
<div className="customer-toolbar"><label className="search-box"><span>⌕</span><input value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} placeholder="Buscar por nombre, empresa, documento o contacto…"/></label><span className="count-label">{customers.length} {customers.length===1?"cliente":"clientes"}</span></div>
{canManageCustomers && showCustomerForm&&<form className="customer-form panel" onSubmit={addCustomer}>
<div className="customer-form-heading"><div><p className="eyebrow">{editingCustomerId?"DATOS DEL CLIENTE":"NUEVO REGISTRO"}</p><h3>{editingCustomerId?"Editar cliente":"Nuevo cliente"}</h3></div><span className="customer-form-hint">Persona o empresa</span></div>
<div className="customer-form-grid">
<label>Nombre{!customerDraft.company_name.trim()?" *":""}<input autoComplete="given-name" value={customerDraft.first_name} onChange={e=>setCustomerDraft(current=>({...current,first_name:e.target.value}))} maxLength={100} required={!customerDraft.company_name.trim()} placeholder="Nombre"/></label>
<label>Apellidos<input autoComplete="family-name" value={customerDraft.last_name} onChange={e=>setCustomerDraft(current=>({...current,last_name:e.target.value}))} maxLength={120} placeholder="Apellidos"/></label>
<label>Empresa{!customerDraft.first_name.trim()&&!customerDraft.last_name.trim()?" *":""}<input autoComplete="organization" value={customerDraft.company_name} onChange={e=>setCustomerDraft(current=>({...current,company_name:e.target.value}))} maxLength={180} required={!customerDraft.first_name.trim()&&!customerDraft.last_name.trim()} placeholder="Nombre de la empresa"/></label>
<label>Tipo de documento<select value={customerDraft.document_type} onChange={e=>setCustomerDraft(current=>({...current,document_type:e.target.value}))}><option value="">Selecciona el tipo…</option><option value="CC">Cédula de ciudadanía (CC)</option><option value="CE">Cédula de extranjería (CE)</option><option value="NIT">NIT</option><option value="TI">Tarjeta de identidad (TI)</option><option value="PP">Pasaporte</option><option value="PPT">Permiso por protección temporal (PPT)</option><option value="OTHER">Otro</option></select></label>
<label>Documento<input value={customerDraft.document_number} onChange={e=>setCustomerDraft(current=>({...current,document_number:e.target.value}))} maxLength={60} autoComplete="off" placeholder="Número de documento"/></label>
<label>Correo<input type="email" autoComplete="email" value={customerDraft.email} onChange={e=>setCustomerDraft(current=>({...current,email:e.target.value}))} maxLength={254} placeholder="cliente@correo.com"/></label>
<label>Teléfono<input type="tel" autoComplete="tel" value={customerDraft.phone} onChange={e=>setCustomerDraft(current=>({...current,phone:e.target.value}))} maxLength={60} placeholder="Número de contacto"/></label>
<label>WhatsApp<input type="tel" value={customerDraft.whatsapp} onChange={e=>setCustomerDraft(current=>({...current,whatsapp:e.target.value}))} maxLength={60} placeholder="Número de WhatsApp"/></label>
<label>Ciudad<input autoComplete="address-level2" value={customerDraft.city} onChange={e=>setCustomerDraft(current=>({...current,city:e.target.value}))} maxLength={100} placeholder="Ciudad"/></label>
<label className="customer-span-two">Dirección<input autoComplete="street-address" value={customerDraft.address} onChange={e=>setCustomerDraft(current=>({...current,address:e.target.value}))} maxLength={300} placeholder="Dirección de residencia o entrega"/></label>
<label className="customer-span-two">Notas<textarea rows="3" value={customerDraft.notes} onChange={e=>setCustomerDraft(current=>({...current,notes:e.target.value}))} maxLength={1500} placeholder="Información útil para atender a este cliente"/></label>
</div>
<div className="form-actions"><button type="button" className="secondary-button" onClick={resetCustomerForm}>Cancelar</button><button type="submit" className="primary-button" disabled={busy}>{busy?"Guardando…":editingCustomerId?"Guardar cambios":"Guardar cliente"}</button></div>
</form>}
{salesLoading?<div className="empty-state">Cargando clientes…</div>:customers.length?<div className="customer-list panel">
<div className="customer-list-heading"><span>Cliente / empresa</span><span>Contacto</span><span>Documento</span><span>Ciudad</span><span></span></div>
{customers.map(customer=><article className="customer-row" key={customer.id}>
<div className="customer-name-cell"><strong>{customer.full_name||customer.company_name}</strong>{customer.company_name&&customer.company_name!==customer.full_name&&<span>{customer.company_name}</span>}</div>
<div className="customer-contact-cell"><span>{customer.email||"Sin correo"}</span><span>{customer.phone||customer.whatsapp||"Sin teléfono"}</span></div>
<span>{[customer.document_type,customer.document_number].filter(Boolean).join(" ")||"Sin documento"}</span><span>{customer.city||"—"}</span>
{canManageCustomers && <button type="button" className="text-button" onClick={()=>startEditCustomer(customer)}>Editar</button>}
</article>)}
</div>:<div className="empty-state"><span className="empty-icon">◎</span><h3>No hay clientes registrados</h3><p>Registra a una persona o empresa para asociarla a tus ventas.</p>{canManageCustomers && <button className="primary-button" onClick={()=>{setCustomerDraft(blankCustomer);setEditingCustomerId(null);setShowCustomerForm(true);}}>+ Añadir cliente</button>}</div>}
</section>
 ) : screen === "team" ? (
          <section className="team-page">
            <div className="products-intro team-intro">
              <div><h2>Equipo y permisos</h2><p>Decide qué puede consultar o modificar cada colaborador.</p></div>
              <button type="button" className="primary-button compact-button" onClick={() => {
                if (teamFormOpen && !teamEditingUserId) clearTeamForm();
                else { setTeamEmail(""); setTeamPermissionDraft(blankTeamPermissions); setTeamEditingUserId(null); setTeamFormOpen(true); setError(""); setNotice(""); }
              }}>{teamFormOpen && !teamEditingUserId ? "Cancelar" : "+ Añadir colaborador"}</button>
            </div>
            <div className="team-info-panel panel">
              <span className="team-info-icon">♙</span>
              <div><strong>¿Cómo agregar a alguien?</strong><p>La persona debe crear primero su cuenta en Treintayuno. Después, escribe aquí el mismo correo y elige sus permisos. Este formulario no envía correos.</p></div>
            </div>
            {teamFormOpen && <form className="team-form panel" onSubmit={saveTeamMember}>
              <div className="team-form-heading"><div><p className="eyebrow">{teamEditingUserId ? "PERMISOS DEL COLABORADOR" : "NUEVO ACCESO"}</p><h3>{teamEditingUserId ? "Editar permisos" : "Añadir colaborador"}</h3><p>Marca solo lo que esa persona necesita para trabajar.</p></div></div>
              <label className="team-email-field">Correo de la cuenta de Treintayuno *
                <input type="email" value={teamEmail} onChange={(e) => setTeamEmail(e.target.value)} required disabled={Boolean(teamEditingUserId)} maxLength={254} autoComplete="email" placeholder="persona@correo.com" />
              </label>
              <div className="team-permission-header"><span>Módulo</span><span>Consultar</span><span>Crear y modificar</span></div>
              <div className="team-permission-list">{teamPermissionGroups.map((group) => <div className="team-permission-row" key={group.view}>
                <strong>{group.label}</strong>
                <label className="team-check"><input type="checkbox" checked={Boolean(teamPermissionDraft[group.view])} onChange={(e) => changeTeamPermission(group.view, e.target.checked)} /><span>Ver</span></label>
                <label className="team-check"><input type="checkbox" checked={Boolean(teamPermissionDraft[group.manage])} onChange={(e) => changeTeamPermission(group.manage, e.target.checked)} /><span>Administrar</span></label>
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
                    <p>{isEmployee ? (granted.length ? granted.join(" · ") : "Sin acceso a módulos") : "Acceso completo al negocio"}</p>
                  </div>
                  {isEmployee && <div className="team-member-actions"><button type="button" className="icon-action-button" title="Editar permisos" aria-label={"Editar permisos de " + (member.display_name || member.email)} onClick={() => startEditTeamMember(member)}>✎</button><button type="button" className="text-button danger-text" disabled={teamSaving} onClick={() => removeTeamMember(member)}>Quitar acceso</button></div>}
                </article>;
              })}</div>
              : <div className="empty-state"><span className="empty-icon">♙</span><h3>El equipo empieza aquí</h3><p>Por ahora solo hay miembros que ya pertenecen al negocio. No se ha creado ningún colaborador de ejemplo.</p><button type="button" className="primary-button" onClick={() => { setTeamEmail(""); setTeamPermissionDraft(blankTeamPermissions); setTeamEditingUserId(null); setTeamFormOpen(true); }}>+ Añadir colaborador</button></div>}
          </section>
 ) : screen === "catalog" ? (
          <section className="catalog-admin-page">
            <div className="products-intro catalog-admin-intro">
              <div><h2>Catálogo para compartir</h2><p>Elige qué productos pueden ver tus clientes con un enlace público.</p></div>
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
              <input aria-label="Buscar en productos del catálogo" value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} placeholder="Buscar producto o categoría…" />
              <span>{filteredCatalogProducts.length} {filteredCatalogProducts.length === 1 ? "producto" : "productos"}</span>
            </div>
            {catalogLoading ? <div className="empty-state">Cargando productos reales…</div>
              : filteredCatalogProducts.length ? <div className="catalog-admin-list">{filteredCatalogProducts.map((product) => {
                const category = catalogCategories.find((item) => item.id === product.category_id)?.name || "Sin categoría";
                return <article className="catalog-admin-row panel" key={product.id}>
                  <div className="catalog-admin-product"><span className="catalog-admin-symbol">▦</span><div><strong>{product.name}</strong><span>{category}</span>{product.description && <small>{product.description}</small>}</div></div>
                  <div className="catalog-admin-price"><strong>{money(product.sale_price_minor, currencyCode)}</strong><span>por {product.unit_name || "unidad"}</span></div>
                  <div className="catalog-admin-publish">
                    <span className={product.is_published && product.is_sellable ? "status-pill status-active" : "status-pill status-inactive"}>{product.is_published && product.is_sellable ? "Publicado" : product.is_published ? "Producto inactivo" : "Oculto"}</span>
                    <button type="button" className={product.is_published ? "secondary-button action-small" : "primary-button action-small"} disabled={catalogPublishingId === product.id || (!product.is_sellable && !product.is_published)} onClick={() => toggleCatalogPublication(product)}>{catalogPublishingId === product.id ? "Guardando…" : product.is_published ? "Retirar" : "Publicar"}</button>
                  </div>
                </article>;
              })}</div>
              : <div className="empty-state"><span className="empty-icon">◉</span><h3>{catalogProducts.length ? "No hay resultados" : "Todavía no hay productos"}</h3><p>{catalogProducts.length ? "Prueba otra palabra o categoría." : "Crea tus productos primero; luego publícalos aquí para compartirlos."}</p><button type="button" className="secondary-button" onClick={() => navigate("products")}>Ir a productos</button></div>}
          </section>
        ) : screen === "profitability" ? (
          <section className="profitability-page">
            <div className="products-intro profitability-intro">
              <div><h2>Costos y rentabilidad</h2><p>Mira cuánto vendiste, cuánto costó lo vendido y qué quedó después de los gastos.</p></div>
              <label className="profitability-period-label">Periodo
                <select value={profitabilityPeriod} onChange={(e) => setProfitabilityPeriod(e.target.value)}>
                  <option value="month">Este mes</option><option value="30days">Últimos 30 días</option><option value="all">Todo el historial</option>
                </select>
              </label>
            </div>
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
        ) : screen === "purchases" ? (
          <section className="purchases-page">
            <div className="products-intro">
              <div><h2>Compras y gastos</h2><p>Registra lo que entra y lo que sale. Los importes reales alimentan tus reportes.</p></div>
            </div>
            <div className="purchase-module-tabs" role="tablist" aria-label="Compras y gastos">
              {canViewPurchases && <button type="button" role="tab" aria-selected={effectivePurchaseTab === "purchases"} className={effectivePurchaseTab === "purchases" ? "purchase-tab active" : "purchase-tab"} onClick={() => setPurchaseModuleTab("purchases")}>Compras <span>{purchaseRows.length}</span></button>}
              {canViewExpenses && <button type="button" role="tab" aria-selected={effectivePurchaseTab === "expenses"} className={effectivePurchaseTab === "expenses" ? "purchase-tab active" : "purchase-tab"} onClick={() => setPurchaseModuleTab("expenses")}>Gastos <span>{expenseRows.length}</span></button>}
            </div>
            {effectivePurchaseTab === "purchases" ? <>
              <div className="products-intro purchase-subintro">
                <div><h3>Compras de inventario</h3><p>Al guardar una compra, las existencias se suman en un solo paso.</p></div>
                <div className="purchase-toolbar-actions">
                  {canPermission("suppliers_manage") && <button type="button" className="secondary-button compact-button" onClick={() => { setShowSupplierForm((open) => !open); setSupplierDraft(blankSupplier); setError(""); }}>{showSupplierForm ? "Cancelar proveedor" : "+ Proveedor"}</button>}
                  {canManagePurchases && <button type="button" className="primary-button compact-button" onClick={() => { setShowPurchaseForm((open) => !open); setError(""); setNotice(""); }}>{showPurchaseForm ? "Cancelar compra" : "+ Nueva compra"}</button>}
                </div>
              </div>
              {canPermission("suppliers_manage") && showSupplierForm && <form className="purchase-form panel" onSubmit={addSupplier}>
                <div className="purchase-form-heading"><div><p className="eyebrow">CONTACTOS</p><h3>Nuevo proveedor</h3></div></div>
                <div className="purchase-form-grid">
                  <label>Nombre del proveedor *<input value={supplierDraft.name} onChange={(e) => setSupplierDraft((d) => ({ ...d, name: e.target.value }))} maxLength={180} required placeholder="Nombre o empresa" /></label>
                  <label>NIT o documento<input value={supplierDraft.tax_id} onChange={(e) => setSupplierDraft((d) => ({ ...d, tax_id: e.target.value }))} maxLength={80} placeholder="Opcional" /></label>
                  <label>Teléfono<input type="tel" value={supplierDraft.phone} onChange={(e) => setSupplierDraft((d) => ({ ...d, phone: e.target.value }))} maxLength={60} placeholder="Número de contacto" /></label>
                  <label>Correo<input type="email" value={supplierDraft.email} onChange={(e) => setSupplierDraft((d) => ({ ...d, email: e.target.value }))} maxLength={254} placeholder="proveedor@correo.com" /></label>
                  <label className="purchase-span-two">Dirección<input value={supplierDraft.address} onChange={(e) => setSupplierDraft((d) => ({ ...d, address: e.target.value }))} maxLength={300} placeholder="Dirección del proveedor" /></label>
                  <label className="purchase-span-two">Notas<input value={supplierDraft.notes} onChange={(e) => setSupplierDraft((d) => ({ ...d, notes: e.target.value }))} maxLength={1000} placeholder="Información útil" /></label>
                </div>
                <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowSupplierForm(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar proveedor"}</button></div>
              </form>}
              {canManagePurchases && showPurchaseForm && <form className="purchase-form panel" onSubmit={createPurchase}>
                <div className="purchase-form-heading"><div><p className="eyebrow">ENTRADA DE INVENTARIO</p><h3>Nueva compra</h3></div><span className="purchase-form-hint">Se guarda con su historial</span></div>
                <div className="purchase-form-grid">
                  <label>Fecha de compra *<input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required /></label>
                  <label>Proveedor<select value={purchaseSupplierId} onChange={(e) => setPurchaseSupplierId(e.target.value)}><option value="">Sin proveedor</option>{suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}</select></label>
                  <label>Producto registrado<select value={purchaseProductChoice} onChange={(e) => { const id = e.target.value; const product = purchaseProducts.find((p) => p.id === id); setPurchaseProductChoice(id); setPurchaseItemName(product?.name || ""); setPurchaseUnitCost(product ? String(Number(product.cost_price_minor || 0) / (10 ** currencyDigits(currencyCode))) : ""); }}><option value="">Otro artículo / no vincular</option>{purchaseProducts.map((product) => <option value={product.id} key={product.id}>{product.name}{product.sku ? " · " + product.sku : ""}</option>)}</select></label>
                  <label>Artículo comprado *<input value={purchaseItemName} onChange={(e) => { setPurchaseItemName(e.target.value); if (purchaseProductChoice) setPurchaseProductChoice(""); }} maxLength={180} required placeholder="Nombre del material o producto" /></label>
                  <label>Cantidad *<input type="number" min="0.001" step="0.001" value={purchaseQuantity} onChange={(e) => setPurchaseQuantity(e.target.value)} required /></label>
                  <label>Costo por unidad *<input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={purchaseUnitCost} onChange={(e) => setPurchaseUnitCost(e.target.value)} required placeholder="0" /></label>
                </div>
                <button type="button" className="secondary-button purchase-add-item" onClick={addPurchaseLine}>＋ Añadir artículo</button>
                {purchaseCart.length > 0 && <div className="purchase-cart">
                  <div className="purchase-cart-heading"><strong>Artículos de la compra</strong><span>{purchaseCart.length}</span></div>
                  {purchaseCart.map((item) => <div className="purchase-cart-row" key={item.line_id}>
                    <div><strong>{item.name}</strong><span>{item.product_id ? "Vinculado a tu inventario" : "Sin vínculo a inventario"} · {money(toMinorUnits(item.unit_cost, currencyCode), currencyCode)} por {item.unit_name}</span></div>
                    <label>Cantidad<input type="number" min="0.001" step="0.001" value={item.quantity} onChange={(e) => setPurchaseCart((current) => current.map((line) => line.line_id === item.line_id ? { ...line, quantity: e.target.value } : line))} /></label>
                    <strong>{money(Math.round(toMinorUnits(item.unit_cost, currencyCode) * Number(item.quantity || 0)), currencyCode)}</strong>
                    <button type="button" className="text-button danger-text" onClick={() => setPurchaseCart((current) => current.filter((line) => line.line_id !== item.line_id))}>Quitar</button>
                  </div>)}
                  <div className="purchase-cart-subtotal"><span>Subtotal</span><strong>{money(purchaseCart.reduce((sum, item) => sum + Math.round(toMinorUnits(item.unit_cost, currencyCode) * Number(item.quantity || 0)), 0), currencyCode)}</strong></div>
                </div>}
                <div className="purchase-form-grid purchase-money-fields">
                  <label>Impuestos u otros cargos<input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={purchaseTax} onChange={(e) => setPurchaseTax(e.target.value)} /></label>
                  <label>Abono realizado<input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={purchasePayment} onChange={(e) => setPurchasePayment(e.target.value)} /></label>
                  <label className="purchase-span-two">Nota<input value={purchaseNotes} onChange={(e) => setPurchaseNotes(e.target.value)} maxLength={1500} placeholder="Factura, transporte, entrega…" /></label>
                </div>
                <div className="purchase-total-summary"><span>Total estimado</span><strong>{money(purchaseCart.reduce((sum, item) => sum + Math.round(toMinorUnits(item.unit_cost, currencyCode) * Number(item.quantity || 0)), 0) + toMinorUnits(purchaseTax || 0, currencyCode), currencyCode)}</strong></div>
                <p className="helper-text">Solo los artículos vinculados a un producto suman existencias. Los artículos libres quedan registrados en la compra, sin cambiar tu inventario.</p>
                <div className="form-actions"><button type="button" className="secondary-button" onClick={() => { setShowPurchaseForm(false); setPurchaseCart([]); }}>Cancelar</button><button type="submit" className="primary-button" disabled={busy || !purchaseCart.length}>{busy ? "Guardando…" : "Guardar compra"}</button></div>
              </form>}
              {purchaseLoading ? <div className="empty-state">Cargando compras…</div> : purchaseRows.length ? <div className="purchase-record-list">{purchaseRows.map((purchase) => {
                const supplier = suppliers.find((item) => item.id === purchase.supplier_id);
                const items = purchaseItemsByPurchase[purchase.id] || [];
                const pending = Math.max(0, Number(purchase.total_minor) - Number(purchase.amount_paid_minor));
                return <article className="purchase-record panel" key={purchase.id}>
                  <div className="purchase-record-top"><div><strong>{purchase.purchase_number}</strong><span>{purchase.purchased_at ? new Date(purchase.purchased_at).toLocaleDateString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium" }) : "Fecha sin definir"}{supplier ? " · " + supplier.name : ""}</span></div><span className={"status-pill " + (purchase.status === "paid" ? "status-active" : purchase.status === "canceled" || purchase.status === "refunded" ? "status-inactive" : "status-unpublished")}>{purchaseStatusLabel(purchase.status)}</span></div>
                  {items.length > 0 && <div className="purchase-record-items">{items.map((item) => <div key={item.id}><span>{item.item_name} × {Number(item.quantity).toLocaleString("es-CO")}</span><strong>{money(item.line_total_minor, purchase.currency_code || currencyCode)}</strong></div>)}</div>}
                  <div className="purchase-record-totals"><div><span>Total</span><strong>{money(purchase.total_minor, purchase.currency_code || currencyCode)}</strong></div><div><span>Pagado</span><strong>{money(purchase.amount_paid_minor, purchase.currency_code || currencyCode)}</strong></div><div><span>Pendiente</span><strong>{money(pending, purchase.currency_code || currencyCode)}</strong></div></div>
                  {purchase.notes && <p className="purchase-note">{purchase.notes}</p>}
                </article>;
              })}</div> : <div className="empty-state"><span className="empty-icon">▤</span><h3>Todavía no hay compras</h3><p>Registra tu primera compra. No cargamos operaciones de ejemplo.</p>{canManagePurchases && <button type="button" className="primary-button" onClick={() => setShowPurchaseForm(true)}>+ Nueva compra</button>}</div>}
              {suppliers.length > 0 && <details className="supplier-directory panel"><summary>Proveedores guardados ({suppliers.length})</summary><div className="supplier-directory-list">{suppliers.map((supplier) => <div className="supplier-directory-row" key={supplier.id}><strong>{supplier.name}</strong><span>{supplier.phone || supplier.email || supplier.tax_id || "Sin contacto registrado"}</span></div>)}</div></details>}
            </> : <>
              <div className="products-intro purchase-subintro">
                <div><h3>Gastos del negocio</h3><p>Registra servicios, arriendo, reparaciones, herramientas y otros pagos.</p></div>
                {canManageExpenses && <button type="button" className="primary-button compact-button" onClick={() => { setShowExpenseForm((open) => !open); setError(""); setNotice(""); }}>{showExpenseForm ? "Cancelar gasto" : "+ Nuevo gasto"}</button>}
              </div>
              {canManageExpenses && showExpenseForm && <form className="purchase-form panel" onSubmit={addExpense}>
                <div className="purchase-form-heading"><div><p className="eyebrow">SALIDA DE DINERO</p><h3>Nuevo gasto</h3></div></div>
                <div className="purchase-form-grid">
                  <label>Descripción *<input value={expenseDraft.description} onChange={(e) => setExpenseDraft((d) => ({ ...d, description: e.target.value }))} maxLength={220} required placeholder="Ej. Reparación de una máquina" /></label>
                  <label>Categoría<select value={expenseDraft.category} onChange={(e) => setExpenseDraft((d) => ({ ...d, category: e.target.value }))}><option>Operativo</option><option>Arriendo</option><option>Servicios públicos</option><option>Transporte</option><option>Publicidad</option><option>Reparaciones y mantenimiento</option><option>Muebles y equipos</option><option>Honorarios y servicios</option><option>Comisiones bancarias</option><option>Otro</option></select></label>
                  <label>Valor *<input type="number" min="0.01" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={expenseDraft.amount} onChange={(e) => setExpenseDraft((d) => ({ ...d, amount: e.target.value }))} required placeholder="0" /></label>
                  <label>Fecha *<input type="date" value={expenseDraft.expense_date} onChange={(e) => setExpenseDraft((d) => ({ ...d, expense_date: e.target.value }))} required /></label>
                  <label>Forma de pago<select value={expenseDraft.payment_method} onChange={(e) => setExpenseDraft((d) => ({ ...d, payment_method: e.target.value }))}><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option><option>Otro</option></select></label>
                  <label>Proveedor<select value={expenseDraft.supplier_id} onChange={(e) => setExpenseDraft((d) => ({ ...d, supplier_id: e.target.value }))}><option value="">Sin proveedor</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
                  <label className="purchase-span-two">Nota<input value={expenseDraft.notes} onChange={(e) => setExpenseDraft((d) => ({ ...d, notes: e.target.value }))} maxLength={1500} placeholder="Factura, referencia o detalle" /></label>
                </div>
                <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowExpenseForm(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar gasto"}</button></div>
              </form>}
              {purchaseLoading ? <div className="empty-state">Cargando gastos…</div> : expenseRows.length ? <div className="expense-record-list">{expenseRows.map((expense) => {
                const supplier = suppliers.find((item) => item.id === expense.supplier_id);
                return <article className="expense-record panel" key={expense.id}>
                  <div className="expense-record-main"><span className="expense-category">{expense.category}</span><strong>{expense.description}</strong><span>{new Date(expense.expense_date + "T12:00:00-05:00").toLocaleDateString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium" })}{supplier ? " · " + supplier.name : ""}{expense.payment_method ? " · " + expense.payment_method : ""}</span>{expense.notes && <small>{expense.notes}</small>}</div>
                  <strong className="expense-amount">{money(expense.amount_minor, expense.currency_code || currencyCode)}</strong>
                </article>;
              })}</div> : <div className="empty-state"><span className="empty-icon">↘</span><h3>Todavía no hay gastos</h3><p>Guarda tus gastos reales para incorporarlos a la rentabilidad. No hay datos de ejemplo.</p>{canManageExpenses && <button type="button" className="primary-button" onClick={() => setShowExpenseForm(true)}>+ Nuevo gasto</button>}</div>}
            </>}
          </section>
        ) : screen === "products" ? (

          <section className="products-page">
            <div className="products-intro"><div><h2>Tus productos, sin enredos</h2><p>Guarda el nombre, la categoría, los precios y las existencias reales.</p></div>{canManageProducts && <button className="primary-button compact-button" onClick={() => { if (showProductForm) cancelProductForm(); else { setShowProductForm(true); setEditingProductId(null); setProductForm(blankProduct); setError(""); } }}>{showProductForm ? (editingProductId ? "Cancelar edición" : "Cancelar") : "+ Nuevo producto"}</button>}</div>
            {canManageProducts && <div className="category-manager">
              <button type="button" className="category-toggle" onClick={() => setShowCategoryManager((open) => !open)} aria-expanded={showCategoryManager}>
                <span>{showCategoryManager ? "▾" : "▸"} Categorías</span><span className="category-toggle-count">{categories.length}</span>
              </button>
              {showCategoryManager && <section className="category-panel panel">
                <form className="category-create-form" onSubmit={addCategory}>
                  <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} maxLength={80} placeholder="Nombre de la categoría" required aria-label="Nombre de la nueva categoría" />
                  <button className="secondary-button" disabled={busy}>{busy ? "Guardando…" : "Añadir"}</button>
                </form>
                {categories.length ? <div className="category-admin-list">{categories.map((category) => <div className="category-admin-row" key={category.id}>
                  {editingCategoryId === category.id ? <form className="category-edit-form" onSubmit={updateCategory}><input value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} maxLength={80} required autoFocus aria-label="Nuevo nombre de categoría" /><button className="secondary-button" disabled={busy}>Guardar</button><button type="button" className="text-button" onClick={() => { setEditingCategoryId(null); setEditingCategoryName(""); }}>Cancelar</button></form> : <>
                    <span className="category-admin-name">{category.name}</span>
                    <div className="category-admin-actions"><button type="button" className="text-button" onClick={() => { setEditingCategoryId(category.id); setEditingCategoryName(category.name); setConfirmDeleteCategoryId(null); }}>Editar</button>
                      {confirmDeleteCategoryId === category.id ? <><button type="button" className="text-button danger-text" disabled={busy} onClick={() => deleteCategory(category.id)}>Sí, eliminar</button><button type="button" className="text-button" onClick={() => setConfirmDeleteCategoryId(null)}>Cancelar</button></> : <button type="button" className="text-button danger-text" onClick={() => setConfirmDeleteCategoryId(category.id)}>Eliminar</button>}
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
                    <span className="photo-plus" aria-hidden="true">＋</span><strong>Agregar foto</strong>
                  </label>)}
                </div>
                <span className="photo-help">JPG, PNG o WebP. Máximo 5 MB al cargarla; se convierte a WebP de máximo 1,5 MB antes de guardarse.</span>
              </div>}
              <div className="form-grid">
                <label>Nombre *<input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} maxLength={160} required placeholder="Ej. Camiseta blanca" /></label>
                <label>Categoría<select value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })} disabled={!categories.length}><option value="">{categories.length ? "Sin categoría" : "Primero crea una categoría"}</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                <label>Tipo<select value={productForm.product_type} disabled={!!editingProductId} onChange={(e) => setProductForm({ ...productForm, product_type: e.target.value, stock: e.target.value === "physical" ? productForm.stock : "0" })}><option value="physical">Producto físico</option><option value="service">Servicio</option><option value="digital">Producto digital</option></select></label>
                <label>Precio de venta<input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={productForm.sale_price} onChange={(e) => setProductForm({ ...productForm, sale_price: e.target.value })} required placeholder={currencyDigits(currencyCode) === 0 ? "0" : "0.00"} /></label>
                <label>Costo por unidad<input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={productForm.cost_price} onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })} required placeholder={currencyDigits(currencyCode) === 0 ? "0" : "0.00"} /></label>
                <label>Unidad<select value={productForm.unit_name} onChange={(e) => setProductForm({ ...productForm, unit_name: e.target.value })} required>{unitOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label>Presentación comercial<input value={productForm.commercial_presentation} onChange={(e) => setProductForm({ ...productForm, commercial_presentation: e.target.value })} maxLength={120} placeholder="Ej. 80 g, caja x 12, 500 ml" /></label>
                {productForm.unit_name === "personalizada" && <label>Nombre de la unidad<input value={productForm.unit_custom} onChange={(e) => setProductForm({ ...productForm, unit_custom: e.target.value })} maxLength={30} required placeholder="Ej. lámina, rollo, sesión" /></label>}
                {productForm.product_type === "physical" && <><label>{editingProductId ? "Existencias actuales" : "Existencias iniciales"}<input type="number" min="0" step="0.001" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} readOnly={!!editingProductId} required /></label><label>Avisarme cuando queden<input type="number" min="0" step="0.001" value={productForm.low_stock} onChange={(e) => setProductForm({ ...productForm, low_stock: e.target.value })} placeholder="Ej. 3" /></label></>}
                <label className="full-span">Descripción<textarea rows="2" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} maxLength={2000} placeholder="Detalles que te ayuden a identificarlo" /></label>
              </div>
              {editingProductId && products.find((item) => item.id === editingProductId) && <div className="product-edit-tools full-span">
                {renderStockAdjustment(products.find((item) => item.id === editingProductId))}
                <section className="edit-subpanel"><div className="edit-subpanel-heading"><strong>Fotografías</strong><span>Hasta 3 fotos</span></div>{renderPhotoManager(products.find((item) => item.id === editingProductId))}</section>
              </div>}
              {!categories.length && <p className="helper-text full-span">Puedes añadir categorías desde el botón «Categorías».</p>}
              <p className="helper-text">{editingProductId ? "Las existencias se ajustan aquí y las fotos se administran dentro de esta ficha." : "La presentación comercial es opcional. El inventario inicial queda guardado en el historial; luego puedes completar los datos desde Editar."}</p>
              <div className="form-actions"><button type="button" className="secondary-button" onClick={cancelProductForm}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? "Guardando…" : editingProductId ? "Guardar cambios" : "Guardar producto"}</button></div>
            </form>}
            <div className="product-tools">
              <label className="search-box"><span>⌕</span><input value={search} onChange={(e) => { setSearch(e.target.value); setProductPage(1); }} placeholder="Buscar producto por nombre…" /></label>
              <div className="product-tools-actions">
                {canManageProducts && <button type="button" className="secondary-button action-small" onClick={() => { setShowArchivedProducts((show) => !show); setProductPage(1); }}>{showArchivedProducts ? "Ver activos" : "Archivados"}</button>}
                <div className="view-switch" role="group" aria-label="Vista de productos">
                  <button type="button" className={viewMode === "rows" ? "view-option active" : "view-option"} onClick={() => setViewMode("rows")} aria-pressed={viewMode === "rows"}><span>☷</span> Filas</button>
                  <button type="button" className={viewMode === "cards" ? "view-option active" : "view-option"} onClick={() => setViewMode("cards")} aria-pressed={viewMode === "cards"}><span>▦</span> Tarjetas</button>
                </div>
                <span className="count-label">{productsCount} {productsCount === 1 ? "producto" : "productos"}</span>
              </div>
            </div>
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
                      <label>Tipo de variante *<input value={variantDraft.variant_name} onChange={(event) => setVariantDraft((draft) => ({ ...draft, variant_name: event.target.value }))} maxLength={80} required placeholder="Ej. Talla" /></label>
                      <label>Valor *<input value={variantDraft.variant_value} onChange={(event) => setVariantDraft((draft) => ({ ...draft, variant_value: event.target.value }))} maxLength={120} required placeholder="Ej. M" /></label>
                      <label>Código de variante<input value={variantDraft.sku} onChange={(event) => setVariantDraft((draft) => ({ ...draft, sku: event.target.value }))} maxLength={100} placeholder="Opcional" /></label>
                      <label>Precio propio<input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={variantDraft.sale_price} onChange={(event) => setVariantDraft((draft) => ({ ...draft, sale_price: event.target.value }))} placeholder="Usar precio del producto" /></label>
                      <label>Existencias propias<input type="number" min="0" step="0.001" value={variantDraft.stock_on_hand} onChange={(event) => setVariantDraft((draft) => ({ ...draft, stock_on_hand: event.target.value }))} placeholder="Sin inventario separado" /></label>
                    </div>
                    <p className="helper-text">Si dejas precio o existencias vacíos, esta variante usará los datos generales del producto. Las variantes aún no sustituyen el inventario principal en el registro de ventas.</p>
                    <div className="form-actions"><button type="button" className="secondary-button" onClick={resetVariantDraft}>Limpiar</button><button type="submit" className="primary-button" disabled={variantBusy}>{variantBusy ? "Guardando…" : editingVariantId ? "Guardar cambios" : "Añadir variante"}</button></div>
                  </form>}
                </section>
              </div>;
            })()}
            {productsLoading ? <div className="empty-state">Cargando tus productos…</div> : filteredProducts.length ? (
              viewMode === "rows" ? (
                <div className="product-table-wrap panel">
                  <table className="product-table">
                    <thead><tr>
                      <th>Producto</th><th>Código</th><th>Unidad</th><th>Precio {currencyCode}</th><th>Otras monedas</th><th>Presentación</th><th>Existencias</th><th>Estado</th><th>Catálogo</th><th>Acciones</th>
                    </tr></thead>
                    <tbody>{filteredProducts.map((p) => <React.Fragment key={p.id}>
                      <tr className="product-table-row">
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
                          {canManageProducts && <button type="button" className="icon-action-button" title="Editar producto" aria-label="Editar producto" onClick={() => startEditProduct(p)}>✎</button>}
                        </div></td>
                      </tr>
                    </React.Fragment>)}</tbody>
                  </table>
                </div>
              ) : (
                <div className="product-list product-list-cards">{filteredProducts.map((p) => {
  const productVariants = variantsByProduct[p.id] || [];
  return <article className="product-card panel product-card-wa" key={p.id}>
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
    <div className="product-card-actions">
      <div className="product-card-variants"><div><span>Variantes</span><strong>{productVariants.length} {productVariants.length === 1 ? "variante" : "variantes"}</strong></div><button type="button" className="text-button" onClick={() => openProductVariants(p)}>Ver variantes</button></div>
      <div className="product-card-action-buttons">{canManageProducts && <button type="button" className="icon-action-button" title="Editar producto" aria-label="Editar producto" onClick={() => startEditProduct(p)}>✎</button>}{canManageProducts && <button type="button" className="text-button" disabled={busy} onClick={() => archiveProduct(p)}>{p.archived_at ? "Restaurar" : "Archivar"}</button>}</div>
    </div>
  </article>;
})}</div>
              )
            ) : <div className="empty-state"><span className="empty-icon">▦</span><h3>{search ? "No encontramos coincidencias" : "Todavía no hay productos"}</h3><p>{search ? "Prueba con otro nombre." : "Añade tu primer producto. Solo mostraremos lo que guardes de verdad."}</p>{!search && <button className="primary-button" onClick={() => setShowProductForm(true)}>+ Crear primer producto</button>}</div>}

            {!productsLoading && productsCount > 0 && <div className="pagination-bar">
              <label className="page-size-control">Mostrar
                <select value={productPageSize} onChange={(e) => { setProductPageSize(Number(e.target.value)); setProductPage(1); }}>
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
        ) : screen === "settings" ? (
          <section className="settings-page">
            <div className="settings-intro"><h2>Configura tu negocio</h2><p>Estas preferencias se guardan para que el sistema las use en las demás pantallas.</p></div>
            <form className="settings-card panel" onSubmit={saveSettings}>
              <div className="settings-icon">¤</div>
              <h3>Moneda del negocio</h3>
              <p>Los precios, costos y reportes usarán la moneda que elijas.</p>
              {settingsChecking ? <p className="helper-text">Comprobando si ya hay importes guardados…</p> : <>
                <label className="settings-field">Moneda principal<select value={settingsCurrency} disabled={settingsHasData || activeBusiness?.role !== "owner"} onChange={(e) => setSettingsCurrency(e.target.value)}>{currencyOptions.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}</select></label>
                {settingsHasData ? <p className="helper-text">Ya existen productos u operaciones con importes. Para evitar alterar tus registros, no permitimos cambiar la moneda sin una herramienta de conversión.</p> : <p className="helper-text">Elige la moneda antes de registrar productos o movimientos de dinero. Podrás definir otros ajustes aquí más adelante.</p>}
                {activeBusiness?.role !== "owner" && <p className="helper-text">Solo el propietario puede cambiar esta opción.</p>}
                <div className="form-actions"><button className="primary-button" disabled={busy || settingsChecking || activeBusiness?.role !== "owner" || (settingsHasData && settingsCurrency === currencyCode)}>{busy ? "Guardando…" : "Guardar configuración"}</button></div>
              </>}
            </form>
            <p className="settings-footnote">Negocio: <strong>{activeBusiness?.name}</strong> · Zona horaria: America/Bogota</p>
          </section>
        ) : screen === "home" ? <>
          <section className="welcome-card"><div><p className="eyebrow">BIENVENIDO A TREINTAYUNO</p><h2>Vamos a poner tu negocio en orden.</h2><p>Tu espacio privado ya existe. Productos, ventas, compras, gastos y rentabilidad se conectan con tus registros reales.</p><button className="primary-button" onClick={() => navigate("products")}>Ir a productos</button></div><div className="welcome-symbol">31</div></section>
          <div className="section-title-row"><div><h2>Tu negocio, por partes</h2><p>Todo estará en su lugar y con permisos claros.</p></div><span className="count-label">{visibleAreas.length} áreas</span></div>
          <section className="area-grid">{visibleAreas.map((area, index) => { const ready = area.screen === "products" || area.screen === "sales" || area.screen === "customers" || area.screen === "purchases" || area.screen === "profitability" || area.screen === "catalog" || area.screen === "team"; return <button className="area-card area-card-button" key={area.title} onClick={() => navigate(area.screen)}><div className="area-card-top"><span className="area-icon">{area.icon}</span><span className="area-number">{String(index + 1).padStart(2,"0")}</span></div><h3>{area.title}</h3><p>{area.description}</p><span className={ready ? "coming-soon ready-label" : "coming-soon"}>{ready ? "Disponible" : "En preparación"}</span></button>; })}</section>
        </> : <section className="empty-state"><span className="empty-icon">{areas.find((a) => a.screen === screen)?.icon || "⌘"}</span><h3>{areas.find((a) => a.screen === screen)?.title || "Sección"}</h3><p>Estamos construyendo esta parte sobre la misma base segura. Tus datos no se simulan ni se inventan.</p><button className="secondary-button" onClick={() => navigate("home")}>Volver al resumen</button></section>}
        <footer className="app-footer"><span>Treintayuno · En construcción</span><span>Los datos se separan por negocio.</span></footer>
      </section>
    </main>
  );
}
