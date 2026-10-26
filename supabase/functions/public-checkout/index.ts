import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-wompi-event-checksum",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });
const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (value: string) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const apiBase = (environment: string) => environment === "production" ? "https://production.wompi.co/v1" : "https://sandbox.wompi.co/v1";

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Falta configurar el acceso seguro a la base de datos.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
async function authenticatedUser(req: Request) {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authorization = req.headers.get("Authorization");
  if (!url || !anonKey || !authorization) return null;
  const client = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}
async function getIntegration(supabase: ReturnType<typeof createClient>, businessId: string) {
  const { data, error } = await supabase.from("business_payment_integrations")
    .select("business_id,provider,environment,public_key,private_key,integrity_secret,events_secret,enabled")
    .eq("business_id", businessId).maybeSingle();
  if (error) throw error;
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Método no permitido." }, 405);
  if (!/^application\/json(?:;|$)/i.test(req.headers.get("content-type") || "")) return reply({ error: "Envía la solicitud en formato JSON." }, 415);
  const declaredLength = Number(req.headers.get("content-length") || 0);
  if (declaredLength > 16384) return reply({ error: "La solicitud es demasiado grande." }, 413);
  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 16384) return reply({ error: "La solicitud es demasiado grande." }, 413);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return reply({ error: "Solicitud inválida." }, 400);
    body = parsed as Record<string, unknown>;
  } catch { return reply({ error: "Solicitud inválida." }, 400); }

  const action = String(body.action || "");
  const supabase = serviceClient();

  if (action === "status") {
    const businessId = String(body.business_id || "");
    if (!uuidPattern.test(businessId)) return reply({ error: "Negocio no válido." }, 400);
    try {
      const integration = await getIntegration(supabase, businessId);
      const configured = Boolean(integration?.public_key && integration?.private_key && integration?.integrity_secret && integration?.events_secret);
      return reply({ enabled: Boolean(integration?.enabled && configured), configured, provider: "wompi", environment: integration?.environment || null });
    } catch {
      return reply({ enabled: false, configured: false, provider: "wompi" }, 200);
    }
  }

  if (action === "configure") {
    const user = await authenticatedUser(req);
    if (!user) return reply({ error: "Inicia sesión para configurar los pagos." }, 401);
    const businessId = String(body.business_id || "");
    const environment = String(body.environment || "sandbox");
    if (!uuidPattern.test(businessId) || !["sandbox", "production"].includes(environment)) return reply({ error: "Revisa el negocio y el entorno de Wompi." }, 400);
    const { data: membership, error: membershipError } = await supabase.from("business_members")
      .select("role").eq("business_id", businessId).eq("user_id", user.id).maybeSingle();
    if (membershipError || !membership || !["owner", "admin"].includes(String(membership.role))) return reply({ error: "Solo el propietario o un administrador puede configurar los cobros." }, 403);
    const { data: current, error: currentError } = await supabase.from("business_payment_integrations")
      .select("public_key,private_key,integrity_secret,events_secret").eq("business_id", businessId).maybeSingle();
    if (currentError) return reply({ error: "No se pudo consultar la configuración actual." }, 500);
    const value = (key: string) => String(body[key] || "").trim() || current?.[key] || "";
    const publicKey = value("public_key");
    const privateKey = value("private_key");
    const integritySecret = value("integrity_secret");
    const eventsSecret = value("events_secret");
    if (!publicKey || !privateKey || !integritySecret || !eventsSecret) {
      return reply({ error: "Para activar los cobros necesitas las cuatro credenciales de Wompi: llave pública, llave privada, secreto de integridad y secreto de eventos." }, 400);
    }
    if (publicKey.length > 500 || privateKey.length > 1000 || integritySecret.length > 1000 || eventsSecret.length > 1000) {
      return reply({ error: "Una de las credenciales excede la longitud permitida." }, 400);
    }
    const enabled = body.enabled !== false;
    const { error: saveError } = await supabase.from("business_payment_integrations").upsert({
      business_id: businessId, provider: "wompi", environment, public_key: publicKey,
      private_key: privateKey, integrity_secret: integritySecret, events_secret: eventsSecret,
      enabled, updated_at: new Date().toISOString()
    }, { onConflict: "business_id" });
    if (saveError) return reply({ error: "No se pudo guardar la configuración de pagos." }, 500);
    return reply({ saved: true, enabled, environment });
  }

  if (action === "create") {
    const orderId = String(body.order_id || "");
    const token = String(body.checkout_token || "");
    if (!uuidPattern.test(orderId) || !uuidPattern.test(token)) return reply({ error: "No se pudo validar el pedido." }, 400);
    try {
      const { data: order, error } = await supabase.from("public_store_orders")
        .select("id,business_id,order_reference,checkout_token,total_minor,currency_code,customer_name,customer_email,customer_phone")
        .eq("id", orderId).eq("checkout_token", token).eq("payment_status", "pending").maybeSingle();
      if (error || !order) return reply({ error: "El pedido no existe o ya fue procesado." }, 404);
      const integration = await getIntegration(supabase, order.business_id);
      if (!integration?.enabled || !integration.public_key || !integration.integrity_secret || !integration.private_key || !integration.events_secret) {
        return reply({ error: "Este negocio aún no tiene configurados los cobros verificados. El pedido no se ha cobrado." }, 503);
      }
      if (order.currency_code !== "COP") return reply({ error: "Wompi está habilitado para pedidos en COP." }, 400);
      const amountInCents = Number(order.total_minor) * 100;
      if (!Number.isSafeInteger(amountInCents) || amountInCents < 1) return reply({ error: "El valor del pedido no es válido." }, 400);
      const signature = await sha256(order.order_reference + amountInCents + order.currency_code + integration.integrity_secret);
      const configuredBase = Deno.env.get("APP_BASE_URL") || "https://treintayuno.com";
      let origin: string;
      try {
        const base = new URL(configuredBase);
        if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash) throw new Error("invalid public base URL");
        origin = base.origin;
      } catch {
        return reply({ error: "La dirección pública del catálogo no está configurada correctamente." }, 503);
      }
      const checkout = new URL("https://checkout.wompi.co/p/");
      checkout.searchParams.set("public-key", integration.public_key);
      checkout.searchParams.set("currency", order.currency_code);
      checkout.searchParams.set("amount-in-cents", String(amountInCents));
      checkout.searchParams.set("reference", order.order_reference);
      checkout.searchParams.set("signature:integrity", signature);
      checkout.searchParams.set("redirect-url", origin + "/?catalog=" + order.business_id + "&order=" + encodeURIComponent(order.order_reference));
      if (order.customer_email) checkout.searchParams.set("customer-data:email", order.customer_email);
      checkout.searchParams.set("customer-data:full-name", order.customer_name);
      checkout.searchParams.set("customer-data:phone-number", order.customer_phone);
      return reply({ checkout_url: checkout.toString(), order_reference: order.order_reference });
    } catch {
      return reply({ error: "No se pudo iniciar el pago seguro. Inténtalo de nuevo." }, 500);
    }
  }

  if (action === "webhook" || (body.signature && body.data && typeof body.data === "object" && (body.data as Record<string, unknown>).transaction)) {
    const event = body;
    const signature = event.signature as { properties?: string[]; checksum?: string } | undefined;
    const timestamp = String(event.timestamp ?? "");
    const properties = Array.isArray(signature?.properties) ? signature.properties : [];
    const data = event.data as Record<string, unknown> | undefined;
    const transaction = data?.transaction as Record<string, unknown> | undefined;
    if (!transaction || typeof transaction.id !== "string" || !signature?.checksum || !timestamp || properties.length === 0) {
      return reply({ error: "Firma de evento inválida." }, 400);
    }
    const reference = String(transaction.reference || "");
    if (!reference) return reply({ error: "Evento sin referencia de pedido." }, 400);
    try {
      const { data: order, error: orderError } = await supabase.from("public_store_orders")
        .select("id,business_id,order_reference,total_minor,currency_code,payment_status")
        .eq("order_reference", reference).maybeSingle();
      if (orderError || !order) return reply({ received: true, ignored: true });
      const integration = await getIntegration(supabase, order.business_id);
      if (!integration?.enabled || !integration.private_key || !integration.events_secret) return reply({ error: "Integración de pagos no configurada." }, 503);
      const valueAt = (path: string): string => {
        let value: unknown = event;
        for (const part of path.split(".")) value = value && typeof value === "object" ? (value as Record<string, unknown>)[part] : undefined;
        return value == null ? "" : String(value);
      };
      const expected = await sha256(properties.map(valueAt).join("") + timestamp + integration.events_secret);
      if (expected.toLowerCase() !== String(signature.checksum).toLowerCase()) return reply({ error: "La firma del evento no coincide." }, 401);
      const transactionResponse = await fetch(apiBase(integration.environment) + "/transactions/" + encodeURIComponent(transaction.id), {
        headers: { Authorization: "Bearer " + integration.private_key }
      });
      if (!transactionResponse.ok) return reply({ error: "No se pudo verificar la transacción con Wompi." }, 502);
      const verifiedPayload = await transactionResponse.json();
      const verified = verifiedPayload?.data;
      if (!verified || verified.id !== transaction.id || String(verified.reference || "") !== reference) return reply({ error: "Transacción no verificable." }, 400);
      if (Number(verified.amount_in_cents) !== Number(order.total_minor) * 100 || verified.currency !== order.currency_code) return reply({ error: "El monto o la moneda no coinciden con el pedido." }, 400);
      if (verified.status === "APPROVED" && order.payment_status === "pending") {
        const { data: confirmation, error: confirmError } = await supabase.rpc("confirm_public_store_order_payment", {
          p_order_reference: reference, p_transaction_id: String(verified.id),
          p_amount_minor: Number(order.total_minor), p_currency_code: String(verified.currency), p_provider_status: String(verified.status)
        });
        if (confirmError) return reply({ error: "No se pudo registrar la confirmación del pago." }, 500);
        return reply({ received: true, confirmation });
      }
      if (["DECLINED", "VOIDED", "ERROR"].includes(String(verified.status)) && order.payment_status === "pending") {
        await supabase.from("public_store_orders").update({
          payment_status: String(verified.status) === "DECLINED" ? "declined" : "voided",
          provider_status: String(verified.status), provider_transaction_id: String(verified.id), updated_at: new Date().toISOString()
        }).eq("id", order.id).eq("payment_status", "pending");
      }
      return reply({ received: true });
    } catch {
      return reply({ error: "Error verificando el pago." }, 500);
    }
  }
  return reply({ error: "Acción no reconocida." }, 400);
});
