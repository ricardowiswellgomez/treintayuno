const JSON_HEADERS = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" };
const IMAGE_LIMIT = 5 * 1024 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function tokenFrom(request) {
  const value = request.headers.get("Authorization") || "";
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

function supabaseHeaders(env, token, extra = {}) {
  return { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: "Bearer " + token, ...extra };
}

async function validateSession(env, token) {
  const response = await fetch(env.SUPABASE_URL + "/auth/v1/user", {
    headers: supabaseHeaders(env, token)
  });
  if (!response.ok) return null;
  return response.json();
}

async function getProductForUser(env, token, productId) {
  const url = env.SUPABASE_URL + "/rest/v1/products?id=eq." + encodeURIComponent(productId) + "&select=id,business_id,image_paths";
  const response = await fetch(url, { headers: supabaseHeaders(env, token) });
  if (!response.ok) throw new Error("No pudimos comprobar el acceso a este producto.");
  const products = await response.json();
  return Array.isArray(products) ? products[0] || null : null;
}

async function readLimitedBody(request, maxBytes) {
  if (!request.body) return new ArrayBuffer(0);
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new RangeError("La foto optimizada debe pesar 5 MB o menos.");
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return merged.buffer;
}

async function callImageRpc(env, token, functionName, data) {

  const response = await fetch(env.SUPABASE_URL + "/rest/v1/rpc/" + functionName, {
    method: "POST",
    headers: supabaseHeaders(env, token, { "Content-Type": "application/json" }),
    body: JSON.stringify(data)
  });
  const text = await response.text();
  if (!response.ok) {
    let message = text;
    try { message = JSON.parse(text).message || text; } catch {}
    throw new Error(message || "No pudimos actualizar las fotos del producto.");
  }
  try { return JSON.parse(text); } catch { return []; }
}

async function handleProductImages(request, env, url) {
  if (!env.PRODUCT_IMAGES) {
    return json({ error: "El almacenamiento seguro de fotos todavía no está activado en Cloudflare R2." }, 503);
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
    return json({ error: "Falta configurar el servicio de autenticación para las fotos." }, 503);
  }
  const token = tokenFrom(request);
  if (!token) return json({ error: "Inicia sesión para administrar fotos." }, 401);
  const user = await validateSession(env, token);
  if (!user?.id) return json({ error: "Tu sesión venció. Inicia sesión de nuevo." }, 401);

  if (request.method === "GET") {
    const productId = url.searchParams.get("productId");
    const key = url.searchParams.get("key");
    if (!productId || !UUID_RE.test(productId) || !key) return json({ error: "Faltan los datos de la foto." }, 400);
    const product = await getProductForUser(env, token, productId);
    if (!product || !(product.image_paths || []).includes(key)) return json({ error: "Foto no encontrada o sin permiso." }, 404);
    if (!key.startsWith(product.business_id + "/" + product.id + "/") || !key.endsWith(".webp")) return json({ error: "Referencia de foto no válida." }, 400);
    const object = await env.PRODUCT_IMAGES.get(key);
    if (!object) return json({ error: "No encontramos el archivo de esta foto." }, 404);
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Content-Type", "image/webp");
    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(object.body, { status: 200, headers });
  }

  if (request.method === "POST") {
    const productId = url.searchParams.get("productId");
    if (!productId || !UUID_RE.test(productId)) return json({ error: "Identificador de producto no válido." }, 400);
    const contentType = (request.headers.get("Content-Type") || "").toLowerCase().split(";")[0].trim();
    if (contentType !== "image/webp") return json({ error: "Las fotos deben convertirse a formato WebP antes de subirlas." }, 415);
    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > IMAGE_LIMIT) return json({ error: "Cada foto optimizada debe pesar 5 MB o menos." }, 413);
    const product = await getProductForUser(env, token, productId);
    if (!product) return json({ error: "Producto no encontrado o sin permiso." }, 404);
    const images = product.image_paths || [];
    if (images.length >= 3) return json({ error: "Cada producto admite un máximo de tres fotos." }, 409);

    let bytes;
    try { bytes = await readLimitedBody(request, IMAGE_LIMIT); }
    catch (error) { return json({ error: error?.message || "La foto supera los 5 MB permitidos." }, 413); }
    if (bytes.byteLength === 0) return json({ error: "La foto está vacía." }, 400);
    const view = new Uint8Array(bytes);
    const isWebp = view.length >= 12 &&
      String.fromCharCode(...view.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...view.slice(8, 12)) === "WEBP";
    if (!isWebp) return json({ error: "El archivo no parece ser una imagen WebP válida." }, 415);

    const key = product.business_id + "/" + product.id + "/" + crypto.randomUUID() + ".webp";
    await env.PRODUCT_IMAGES.put(key, bytes, {
      httpMetadata: { contentType: "image/webp", cacheControl: "private, no-store" },
      customMetadata: { product_id: product.id, business_id: product.business_id, uploaded_by: user.id }
    });
    try {
      const updated = await callImageRpc(env, token, "add_product_image", {
        p_business_id: product.business_id, p_product_id: product.id, p_image_key: key
      });
      return json({ key, image_paths: updated }, 201);
    } catch (error) {
      await env.PRODUCT_IMAGES.delete(key);
      const message = error?.message || "No pudimos guardar la referencia de la foto.";
      return json({ error: message }, /máximo tres|maximum of three/i.test(message) ? 409 : 400);
    }
  }

  if (request.method === "DELETE") {
    let payload;
    try { payload = await request.json(); } catch { return json({ error: "La solicitud de eliminación no es válida." }, 400); }
    const productId = payload?.productId;
    const key = payload?.imageKey;
    if (!productId || !UUID_RE.test(productId) || typeof key !== "string") return json({ error: "Faltan los datos de la foto." }, 400);
    const product = await getProductForUser(env, token, productId);
    if (!product || !(product.image_paths || []).includes(key)) return json({ error: "Foto no encontrada o sin permiso." }, 404);
    if (!key.startsWith(product.business_id + "/" + product.id + "/") || !key.endsWith(".webp")) return json({ error: "Referencia de foto no válida." }, 400);
    const updated = await callImageRpc(env, token, "remove_product_image", {
      p_business_id: product.business_id, p_product_id: product.id, p_image_key: key
    });
    await env.PRODUCT_IMAGES.delete(key);
    return json({ image_paths: updated });
  }

  return json({ error: "Método no permitido." }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ status: "ok", app: "treintayuno", timestamp: new Date().toISOString() });
    }

    if (url.pathname === "/api/product-images") {
      try {
        return await handleProductImages(request, env, url);
      } catch (error) {
        return json({ error: error?.message || "No se pudo procesar la foto." }, 500);
      }
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Endpoint not found" }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
