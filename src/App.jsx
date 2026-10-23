import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "./lib/supabase.js";

const areas = [
  { icon: "▦", title: "Productos e inventario", description: "Productos, fotos, precios y existencias.", screen: "products" },
  { icon: "↗", title: "Ventas y clientes", description: "Ventas, clientes y pagos registrados.", screen: "sales" },
  { icon: "◷", title: "Costos y rentabilidad", description: "Costos, margen y utilidad de tu negocio.", screen: "profitability" },
  { icon: "▤", title: "Compras y gastos", description: "Compras, proveedores y gastos.", screen: "purchases" },
  { icon: "◎", title: "Catálogo para compartir", description: "Un catálogo público para tus clientes.", screen: "catalog" },
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
  const [viewMode, setViewMode] = useState("rows");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState(blankProduct);
  const [stagedImages, setStagedImages] = useState([]);
  const [productImageUrls, setProductImageUrls] = useState({});
  const [openProductGalleries, setOpenProductGalleries] = useState({});
  const [galleryLoadingFor, setGalleryLoadingFor] = useState(null);
  const [uploadingImagesFor, setUploadingImagesFor] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [salesTab, setSalesTab] = useState("sales");
  const [salesData, setSalesData] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [saleProducts, setSaleProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerDraft, setCustomerDraft] = useState({ full_name: "", email: "", phone: "" });
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleCustomerId, setSaleCustomerId] = useState("");
  const [saleProductChoice, setSaleProductChoice] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [saleItems, setSaleItems] = useState([]);
  const [salePayment, setSalePayment] = useState("");
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
      .select("business_id, role, businesses(id, name, logo_path, theme, currency_code)")
      .eq("user_id", userId);
    if (queryError) throw queryError;
    const list = (data || []).map((row) => ({ ...row.businesses, role: row.role })).filter((b) => b?.id);
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
        .select("id,business_id,category_id,sku,slug,name,description,commercial_presentation,product_type,unit_name,sale_price_minor,cost_price_minor,stock_on_hand,low_stock_threshold,track_inventory,is_sellable,is_published,image_paths,created_at", { count: "exact" })
        .eq("business_id", activeBusiness.id).order("name").range(from, to);
      if (search.trim()) productsQuery = productsQuery.ilike("name", "%" + search.trim() + "%");
      const [productResult, categoryResult] = await Promise.all([
        productsQuery,
        supabase.from("product_categories").select("id,name,description,sort_order").eq("business_id", activeBusiness.id).order("name")
      ]);
      if (productResult.error) throw productResult.error;
      if (categoryResult.error) throw categoryResult.error;
      setProducts(productResult.data || []);
      setProductsCount(productResult.count || 0);
      setCategories(categoryResult.data || []);
    } catch (e) { setError(friendlyError(e)); }
    finally { setProductsLoading(false); }
  }, [activeBusiness?.id, productPage, productPageSize, search]);

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
        setProductForm(blankProduct); setShowProductForm(false); setEditingProductId(null);
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

  async function loadSalesModuleData() {
    if (!activeBusiness?.id || screen !== "sales") return;
    setSalesLoading(true);
    setError("");
    try {
      if (salesTab === "customers") {
        let query = supabase.from("customers").select("id,full_name,email,phone,created_at", { count: "exact" })
          .eq("business_id", activeBusiness.id).order("full_name").limit(200);
        if (customerSearch.trim()) query = query.ilike("full_name", "%" + customerSearch.trim() + "%");
        const result = await query;
        if (result.error) throw result.error;
        setCustomers(result.data || []);
      } else {
        const [salesResult, productsResult, customersResult] = await Promise.all([
          supabase.from("sales").select("id,business_id,customer_id,sale_number,status,currency_code,total_minor,amount_paid_minor,notes,sold_at,created_at")
            .eq("business_id", activeBusiness.id).order("created_at", { ascending: false }).limit(100),
          supabase.from("products").select("id,name,sale_price_minor,cost_price_minor,unit_name,stock_on_hand,track_inventory,is_sellable")
            .eq("business_id", activeBusiness.id).eq("is_sellable", true).order("name").limit(500),
          supabase.from("customers").select("id,full_name,email,phone").eq("business_id", activeBusiness.id).order("full_name").limit(500)
        ]);
        if (salesResult.error) throw salesResult.error;
        if (productsResult.error) throw productsResult.error;
        setSaleProducts(productsResult.data || []);
        const salesRows = salesResult.data || [];
        const customersById = Object.fromEntries((customersResult.data || []).map((customer) => [customer.id, customer]));
        const itemsBySale = {};
        if (salesRows.length) {
          const itemsResult = await supabase.from("sale_items").select("id,sale_id,item_name,quantity,unit_price_minor,line_total_minor")
            .eq("business_id", activeBusiness.id).in("sale_id", salesRows.map((sale) => sale.id)).order("created_at");
          if (itemsResult.error) throw itemsResult.error;
          for (const item of itemsResult.data || []) {
            if (!itemsBySale[item.sale_id]) itemsBySale[item.sale_id] = [];
            itemsBySale[item.sale_id].push(item);
          }
        }
        setCustomers(customersResult.data || []);
        setSalesData(salesRows.map((sale) => ({ ...sale,
          customer_name: customersById[sale.customer_id]?.full_name || (sale.customer_id ? "Cliente registrado" : "Venta sin cliente"),
          items: itemsBySale[sale.id] || []
        })));
      }
    } catch (e) {
      setError(friendlyError(e));
      if (salesTab === "customers") setCustomers([]);
      else { setSalesData([]); setSaleProducts([]); }
    } finally { setSalesLoading(false); }
  }

  useEffect(() => {
    if (screen === "sales" && activeBusiness?.id) loadSalesModuleData();
  }, [screen, activeBusiness?.id, salesTab, customerSearch]);

  async function addCustomer(event) {
    event.preventDefault();
    if (!activeBusiness?.id || !customerDraft.full_name.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { data, error: insertError } = await supabase.from("customers").insert({
        business_id: activeBusiness.id,
        full_name: customerDraft.full_name.trim(),
        email: customerDraft.email.trim() || null,
        phone: customerDraft.phone.trim() || null
      }).select("id,full_name,email,phone,created_at").single();
      if (insertError) throw insertError;
      setCustomerDraft({ full_name: "", email: "", phone: "" });
      setShowCustomerForm(false);
      setNotice("Cliente guardado: " + data.full_name + ".");
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
        p_amount_paid_minor: payment, p_notes: saleNotes.trim() || null
      });
      if (saleError) throw saleError;
      const sale = Array.isArray(data) ? data[0] : data;
      setShowSaleForm(false); setSaleCustomerId(""); setSaleProductChoice(""); setSaleQuantity("1");
      setSaleItems([]); setSalePayment(""); setSaleNotes("");
      setNotice("Venta " + (sale?.sale_number || "registrada") + " guardada. El inventario se actualizó.");
      await loadSalesModuleData();
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  function clearSaleDraft() {
    setShowSaleForm(false); setSaleCustomerId(""); setSaleProductChoice(""); setSaleQuantity("1");
    setSaleItems([]); setSalePayment(""); setSaleNotes(""); setError("");
  }

  function saleStatusLabel(status) {
    return ({ paid: "Pagada", partially_paid: "Con abono", pending: "Por cobrar", draft: "Borrador", canceled: "Anulada", refunded: "Devuelta" })[status] || status || "—";
  }

  const filteredProducts = products;
  const totalProductPages = Math.max(1, Math.ceil(productsCount / productPageSize));

  function navigate(next) {
    setScreen(next); setError(""); setNotice(""); setShowProductForm(false);
    if (next !== "products") { setAdjustingId(null); }
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
          {areas.map((area) => <button key={area.title} className={screen === area.screen ? "nav-item active" : "nav-item"} onClick={() => navigate(area.screen)}><span>{area.icon}</span>{area.title}</button>)}
          <button className={screen === "settings" ? "nav-item active" : "nav-item"} onClick={() => navigate("settings")}><span>⚙</span> Configuración</button>
        </nav>
        <div className="sidebar-bottom"><div className="user-chip"><span className="user-avatar">{(session.user.email || "U").slice(0,1).toUpperCase()}</span><span className="user-email">{session.user.email}</span></div><button className="logout-button" onClick={signOut} disabled={busy}>Cerrar sesión</button></div>
      </aside>
      <section className="main-content">
        <header className="main-header"><div><p className="eyebrow">TU ESPACIO DE TRABAJO</p><h1>{screen === "products" ? "Productos e inventario" : screen === "settings" ? "Configuración" : screen === "home" ? (activeBusiness?.name || "Mi negocio") : areas.find((a) => a.screen === screen)?.title || "Tu negocio"}</h1></div><span className="role-pill">{activeBusiness?.role === "owner" ? "Propietario" : activeBusiness?.role === "admin" ? "Administrador" : "Empleado"}</span></header>
        {error && <p className="message error" role="alert">{error}</p>}
        {notice && <p className="message success" role="status">{notice}<button className="dismiss-button" onClick={() => setNotice("")}>Cerrar</button></p>}
        {screen === "sales" ? (
          <section className="sales-page">
            <div className="products-intro"><div><h2>Ventas y clientes</h2><p>Registra lo que vendes y quién te compra.</p></div></div>
            <div className="sales-tabs" role="tablist" aria-label="Ventas y clientes">
              <button type="button" role="tab" aria-selected={salesTab === "sales"} className={salesTab === "sales" ? "sales-tab active" : "sales-tab"} onClick={() => { setSalesTab("sales"); setError(""); setNotice(""); }}>Ventas</button>
              <button type="button" role="tab" aria-selected={salesTab === "customers"} className={salesTab === "customers" ? "sales-tab active" : "sales-tab"} onClick={() => { setSalesTab("customers"); setCustomerSearch(""); setError(""); setNotice(""); }}>Clientes</button>
            </div>
            {salesTab === "sales" ? <>
              <div className="sales-toolbar"><span>{salesData.length} ventas recientes</span><button type="button" className="primary-button compact-button" onClick={() => { if (showSaleForm) clearSaleDraft(); else { setShowSaleForm(true); setError(""); setNotice(""); } }}>{showSaleForm ? "Cancelar venta" : "+ Nueva venta"}</button></div>
              {showSaleForm && <form className="sale-form panel" onSubmit={createSale}>
                <h3>Nueva venta</h3>
                <div className="sale-builder">
                  <label>Cliente (opcional)<select value={saleCustomerId} onChange={(e) => setSaleCustomerId(e.target.value)}><option value="">Venta sin cliente</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name}{customer.phone ? " · " + customer.phone : ""}</option>)}</select></label>
                  <label>Producto<select value={saleProductChoice} onChange={(e) => setSaleProductChoice(e.target.value)}><option value="">Elige un producto…</option>{saleProducts.map((product) => <option key={product.id} value={product.id}>{product.name} · {money(product.sale_price_minor, currencyCode)}{product.track_inventory ? " · Stock " + Number(product.stock_on_hand).toLocaleString("es-CO") : ""}</option>)}</select></label>
                  <label>Cantidad<input type="number" min="0.001" step="0.001" value={saleQuantity} onChange={(e) => setSaleQuantity(e.target.value)} /></label>
                  <button type="button" className="secondary-button sale-add-button" onClick={addSaleLine}>+ Agregar</button>
                </div>
                {!saleProducts.length && <p className="helper-text">No hay productos activos disponibles para vender. Registra o activa un producto primero.</p>}
                {saleItems.length > 0 && <div className="sale-cart">
                  <div className="sale-cart-heading"><strong>Artículos de la venta</strong><span>{saleItems.length} productos</span></div>
                  {saleItems.map((item) => <div className="sale-cart-row" key={item.product_id}>
                    <div className="sale-cart-name"><strong>{item.name}</strong><span>{money(item.unit_price_minor, currencyCode)} por {item.unit_name}</span></div>
                    <label>Cantidad<input type="number" min="0.001" step="0.001" value={item.quantity} onChange={(e) => setSaleItems((current) => current.map((line) => line.product_id === item.product_id ? { ...line, quantity: e.target.value } : line))} /></label>
                    <strong className="sale-line-total">{money(Math.round(item.unit_price_minor * Number(item.quantity || 0)), currencyCode)}</strong>
                    <button type="button" className="text-button danger-text" aria-label={"Quitar " + item.name} onClick={() => setSaleItems((current) => current.filter((line) => line.product_id !== item.product_id))}>Quitar</button>
                  </div>)}
                  <div className="sale-total-line"><span>Total</span><strong>{money(saleItems.reduce((sum, item) => sum + Math.round(item.unit_price_minor * Number(item.quantity || 0)), 0), currencyCode)}</strong></div>
                </div>}
                <div className="sale-bottom-fields">
                  <label>Abono recibido ({currencyCode})<input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={salePayment} onChange={(e) => setSalePayment(e.target.value)} placeholder="0" /></label>
                  <label>Nota (opcional)<input value={saleNotes} onChange={(e) => setSaleNotes(e.target.value)} maxLength={1000} placeholder="Ej. entrega el viernes" /></label>
                </div>
                <p className="helper-text">Se usará el precio actual del producto. La venta y la salida de inventario se guardan juntas. Si no hay unidades suficientes, no se guardará.</p>
                <div className="form-actions"><button type="button" className="secondary-button" onClick={clearSaleDraft}>Cancelar</button><button type="submit" className="primary-button" disabled={busy || !saleItems.length}>{busy ? "Guardando…" : "Guardar venta"}</button></div>
              </form>}
              {salesLoading ? <div className="empty-state">Cargando ventas…</div> : salesData.length ? <div className="sales-list">
                {salesData.map((sale) => <article className="sale-record panel" key={sale.id}>
                  <div className="sale-record-top"><div><strong>{sale.sale_number}</strong><span>{new Date(sale.sold_at || sale.created_at).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}</span></div><span className={"status-pill " + (sale.status === "paid" ? "status-active" : sale.status === "canceled" || sale.status === "refunded" ? "status-inactive" : "status-unpublished")}>{saleStatusLabel(sale.status)}</span></div>
                  <div className="sale-record-customer">{sale.customer_name}</div>
                  {sale.items.length > 0 && <div className="sale-record-items">{sale.items.map((item) => <div key={item.id}><span>{item.item_name} × {Number(item.quantity).toLocaleString("es-CO")}</span><strong>{money(item.line_total_minor, sale.currency_code || currencyCode)}</strong></div>)}</div>}
                  <div className="sale-record-bottom"><div><span>Total</span><strong>{money(sale.total_minor, sale.currency_code || currencyCode)}</strong></div><div><span>Abonado</span><strong>{money(sale.amount_paid_minor, sale.currency_code || currencyCode)}</strong></div><div><span>Pendiente</span><strong>{money(Math.max(0, Number(sale.total_minor) - Number(sale.amount_paid_minor)), sale.currency_code || currencyCode)}</strong></div></div>
                  {sale.notes && <p className="sale-record-note">{sale.notes}</p>}
                </article>)}
              </div> : <div className="empty-state"><span className="empty-icon">↗</span><h3>Todavía no hay ventas</h3><p>Cuando registres la primera, aparecerá aquí. No mostramos ventas de ejemplo.</p><button className="primary-button" onClick={() => { setShowSaleForm(true); setError(""); }}>+ Registrar primera venta</button></div>}
            </> : <>
              <div className="customer-toolbar"><label className="search-box"><span>⌕</span><input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Buscar cliente por nombre…" /></label><button type="button" className="primary-button compact-button" onClick={() => { setShowCustomerForm((open) => !open); setError(""); setNotice(""); }}>{showCustomerForm ? "Cancelar" : "+ Nuevo cliente"}</button></div>
              {showCustomerForm && <form className="customer-form panel" onSubmit={addCustomer}>
                <h3>Nuevo cliente</h3>
                <div className="customer-form-grid">
                  <label>Nombre completo *<input value={customerDraft.full_name} onChange={(e) => setCustomerDraft((current) => ({ ...current, full_name: e.target.value }))} maxLength={160} required placeholder="Nombre del cliente" /></label>
                  <label>Teléfono<input value={customerDraft.phone} onChange={(e) => setCustomerDraft((current) => ({ ...current, phone: e.target.value }))} maxLength={60} placeholder="Número de contacto" /></label>
                  <label>Correo electrónico<input type="email" value={customerDraft.email} onChange={(e) => setCustomerDraft((current) => ({ ...current, email: e.target.value }))} maxLength={254} placeholder="cliente@correo.com" /></label>
                </div>
                <div className="form-actions"><button type="button" className="secondary-button" onClick={() => { setShowCustomerForm(false); setCustomerDraft({ full_name: "", email: "", phone: "" }); }}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar cliente"}</button></div>
              </form>}
              {salesLoading ? <div className="empty-state">Cargando clientes…</div> : customers.length ? <div className="customer-list panel">
                <div className="customer-list-heading"><span>Cliente</span><span>Contacto</span></div>
                {customers.map((customer) => <article className="customer-row" key={customer.id}><div><strong>{customer.full_name}</strong><span>{customer.email || "Sin correo"}</span></div><span>{customer.phone || "Sin teléfono"}</span></article>)}
              </div> : <div className="empty-state"><span className="empty-icon">◎</span><h3>No hay clientes registrados</h3><p>Guarda los datos básicos de tus clientes para usarlos al registrar una venta.</p><button className="primary-button" onClick={() => setShowCustomerForm(true)}>+ Añadir cliente</button></div>}
            </>}
          </section>
        ) : screen === "products" ? (

          <section className="products-page">
            <div className="products-intro"><div><h2>Tus productos, sin enredos</h2><p>Guarda el nombre, la categoría, los precios y las existencias reales.</p></div><button className="primary-button compact-button" onClick={() => { if (showProductForm) cancelProductForm(); else { setShowProductForm(true); setEditingProductId(null); setProductForm(blankProduct); setError(""); } }}>{showProductForm ? (editingProductId ? "Cancelar edición" : "Cancelar") : "+ Nuevo producto"}</button></div>
            <div className="category-manager">
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
            </div>
            {showProductForm && <form className="product-form panel" onSubmit={addProduct}>
              <h3>{editingProductId ? "Editar producto" : "Datos del producto"}</h3>
              <div className="form-grid">
                <label>Nombre *<input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} maxLength={160} required placeholder="Ej. Camiseta blanca" /></label>
                <label>Categoría<select value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })} disabled={!categories.length}><option value="">{categories.length ? "Sin categoría" : "Primero crea una categoría"}</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                <label>Tipo<select value={productForm.product_type} disabled={!!editingProductId} onChange={(e) => setProductForm({ ...productForm, product_type: e.target.value, stock: e.target.value === "physical" ? productForm.stock : "0" })}><option value="physical">Producto físico</option><option value="service">Servicio</option><option value="digital">Producto digital</option></select></label>
                <label>Precio de venta ({currencyCode})<input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={productForm.sale_price} onChange={(e) => setProductForm({ ...productForm, sale_price: e.target.value })} required placeholder={currencyDigits(currencyCode) === 0 ? "0" : "0.00"} /></label>
                <label>Costo por unidad ({currencyCode})<input type="number" min="0" step={currencyDigits(currencyCode) === 0 ? "1" : "0.01"} value={productForm.cost_price} onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })} required placeholder={currencyDigits(currencyCode) === 0 ? "0" : "0.00"} /></label>
                <label>Unidad<select value={productForm.unit_name} onChange={(e) => setProductForm({ ...productForm, unit_name: e.target.value })} required>{unitOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label>Presentación comercial<input value={productForm.commercial_presentation} onChange={(e) => setProductForm({ ...productForm, commercial_presentation: e.target.value })} maxLength={120} placeholder="Ej. 80 g, caja x 12, 500 ml" /></label>
                {productForm.unit_name === "personalizada" && <label>Nombre de la unidad<input value={productForm.unit_custom} onChange={(e) => setProductForm({ ...productForm, unit_custom: e.target.value })} maxLength={30} required placeholder="Ej. lámina, rollo, sesión" /></label>}
                {productForm.product_type === "physical" && <><label>{editingProductId ? "Existencias actuales" : "Existencias iniciales"}<input type="number" min="0" step="0.001" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} readOnly={!!editingProductId} required /></label><label>Avisarme cuando queden<input type="number" min="0" step="0.001" value={productForm.low_stock} onChange={(e) => setProductForm({ ...productForm, low_stock: e.target.value })} placeholder="Ej. 3" /></label></>}
                {!editingProductId && <label className="product-photo-picker full-span">Fotos del producto (máximo 3)
                  <span className="photo-help">JPG, PNG o WebP. Máximo 5 MB al cargarla; se convierte a WebP de máximo 1,5 MB antes de guardarse.</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || stagedImages.length >= 3} onChange={chooseNewProductImages} />
                </label>}
                {stagedImages.length > 0 && <div className="staged-image-grid full-span">{stagedImages.map((image, index) => <figure className="staged-image" key={image.preview}><img src={image.preview} alt={image.name} /><figcaption>{image.name}</figcaption><button type="button" className="text-button danger-text" onClick={() => { URL.revokeObjectURL(image.preview); setStagedImages((current) => current.filter((_, i) => i !== index)); }}>Quitar foto</button></figure>)}</div>}
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
                <div className="view-switch" role="group" aria-label="Vista de productos">
                  <button type="button" className={viewMode === "rows" ? "view-option active" : "view-option"} onClick={() => setViewMode("rows")} aria-pressed={viewMode === "rows"}><span>☷</span> Filas</button>
                  <button type="button" className={viewMode === "cards" ? "view-option active" : "view-option"} onClick={() => setViewMode("cards")} aria-pressed={viewMode === "cards"}><span>▦</span> Tarjetas</button>
                </div>
                <span className="count-label">{productsCount} {productsCount === 1 ? "producto" : "productos"}</span>
              </div>
            </div>
            {productsLoading ? <div className="empty-state">Cargando tus productos…</div> : filteredProducts.length ? (
              viewMode === "rows" ? (
                <div className="product-table-wrap panel">
                  <table className="product-table">
                    <thead><tr>
                      <th>Producto</th><th>Unidad</th><th>Precio {currencyCode}</th><th>Otras monedas</th><th>Presentación</th><th>Existencias</th><th>Estado</th><th>Catálogo</th><th>Acciones</th>
                    </tr></thead>
                    <tbody>{filteredProducts.map((p) => <React.Fragment key={p.id}>
                      <tr className="product-table-row">
                        <td className="product-table-name"><div className="product-cell">
                          <div className="product-symbol product-thumb">{p.image_paths?.[0] && productImageUrls[p.id + "|" + p.image_paths[0]] ? <img src={productImageUrls[p.id + "|" + p.image_paths[0]]} alt={"Foto de " + p.name} onError={() => handleProductImageError(p.id, p.image_paths[0])} /> : <span>{p.product_type === "service" ? "◷" : p.product_type === "digital" ? "◇" : "▦"}</span>}</div>
                          <div className="product-cell-copy"><strong>{p.name}</strong><span>{categories.find((cat) => cat.id === p.category_id)?.name || "Sin categoría"} · {p.product_type === "physical" ? "Producto físico" : p.product_type === "service" ? "Servicio" : "Digital"}</span></div>
                        </div></td>
                        <td>{p.unit_name || "unidad"}</td>
                        <td className="product-table-price"><strong>{money(p.sale_price_minor, currencyCode)}</strong><small>Costo {money(p.cost_price_minor, currencyCode)}</small></td>
                        <td><span className="muted-value">—</span></td>
                        <td>{p.commercial_presentation || <span className="muted-value">—</span>}</td>
                        <td><div className="product-table-stock"><strong>{p.track_inventory ? Number(p.stock_on_hand).toLocaleString("es-CO") : "No aplica"}</strong>{p.track_inventory && <small>{p.unit_name || "unidades"}</small>}{p.track_inventory && p.low_stock_threshold !== null && Number(p.stock_on_hand) <= Number(p.low_stock_threshold) && <span className="stock-alert">Pocas existencias</span>}</div></td>
                        <td><span className={p.is_sellable ? "status-pill status-active" : "status-pill status-inactive"}>{p.is_sellable ? "Activo" : "Inactivo"}</span></td>
                        <td><div className="catalog-cell"><span className={p.is_published ? "status-pill status-published" : "status-pill status-unpublished"}>{p.is_published ? "Publicado" : "No publicado"}</span></div></td>
                        <td><div className="product-row-actions">
                          <button type="button" className="secondary-button action-small" onClick={() => startEditProduct(p)}>Editar</button>
                        </div></td>
                      </tr>
                    </React.Fragment>)}</tbody>
                  </table>
                </div>
              ) : (
                <div className="product-list product-list-cards">{filteredProducts.map((p) => <article className="product-card panel" key={p.id}>
                  <div className="product-card-heading">
                    <div className="product-symbol product-thumb">{p.image_paths?.[0] && productImageUrls[p.id + "|" + p.image_paths[0]] ? <img src={productImageUrls[p.id + "|" + p.image_paths[0]]} alt={"Foto de " + p.name} onError={() => handleProductImageError(p.id, p.image_paths[0])} /> : <span>{p.product_type === "service" ? "◷" : p.product_type === "digital" ? "◇" : "▦"}</span>}</div>
                    <div className="product-main"><h3>{p.name}</h3><p>{categories.find((cat) => cat.id === p.category_id)?.name || "Sin categoría"} · {p.product_type === "physical" ? "Producto físico" : p.product_type === "service" ? "Servicio" : "Digital"}</p></div>
                  </div>
                  <div className="product-card-data">
                    <div><span>Unidad</span><strong>{p.unit_name || "unidad"}</strong></div>
                    <div><span>Precio {currencyCode}</span><strong>{money(p.sale_price_minor, currencyCode)}</strong><small>Costo {money(p.cost_price_minor, currencyCode)}</small></div>
                    <div><span>Otras monedas</span><strong>—</strong></div>
                    <div><span>Presentación comercial</span><strong>{p.commercial_presentation || "—"}</strong></div>
                    <div><span>Existencias</span><strong>{p.track_inventory ? Number(p.stock_on_hand).toLocaleString("es-CO") + " " + (p.unit_name || "unidades") : "No aplica"}</strong></div>
                    <div><span>Estado</span><strong><span className={p.is_sellable ? "status-pill status-active" : "status-pill status-inactive"}>{p.is_sellable ? "Activo" : "Inactivo"}</span></strong></div>
                    <div><span>Catálogo</span><strong><span className={p.is_published ? "status-pill status-published" : "status-pill status-unpublished"}>{p.is_published ? "Publicado" : "No publicado"}</span></strong><small>Publicación disponible cuando se active el catálogo público.</small></div>
                  </div>
                  <div className="product-row-actions product-card-actions">
                    <button type="button" className="secondary-button action-small" onClick={() => startEditProduct(p)}>Editar</button>
                  </div>
                </article>)}</div>
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
          <section className="welcome-card"><div><p className="eyebrow">BIENVENIDO A TREINTAYUNO</p><h2>Vamos a poner tu negocio en orden.</h2><p>Tu espacio privado ya existe. Empieza por registrar los productos que realmente tienes; después conectaremos ventas, compras y rentabilidad.</p><button className="primary-button" onClick={() => navigate("products")}>Ir a productos</button></div><div className="welcome-symbol">31</div></section>
          <div className="section-title-row"><div><h2>Tu negocio, por partes</h2><p>Todo estará en su lugar y con permisos claros.</p></div><span className="count-label">6 áreas</span></div>
          <section className="area-grid">{areas.map((area, index) => { const ready = area.screen === "products" || area.screen === "sales"; return <button className="area-card area-card-button" key={area.title} onClick={() => navigate(area.screen)}><div className="area-card-top"><span className="area-icon">{area.icon}</span><span className="area-number">{String(index + 1).padStart(2,"0")}</span></div><h3>{area.title}</h3><p>{area.description}</p><span className={ready ? "coming-soon ready-label" : "coming-soon"}>{ready ? "Disponible" : "En preparación"}</span></button>; })}</section>
        </> : <section className="empty-state"><span className="empty-icon">{areas.find((a) => a.screen === screen)?.icon || "⌘"}</span><h3>{areas.find((a) => a.screen === screen)?.title || "Sección"}</h3><p>Estamos construyendo esta parte sobre la misma base segura. Tus datos no se simulan ni se inventan.</p><button className="secondary-button" onClick={() => navigate("home")}>Volver al resumen</button></section>}
        <footer className="app-footer"><span>Treintayuno · En construcción</span><span>Los datos se separan por negocio.</span></footer>
      </section>
    </main>
  );
}
