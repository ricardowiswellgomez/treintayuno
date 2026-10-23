const SUPABASE_URL = "https://maogebecfottfvlrjbho.supabase.co";

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") return json({ status: "ok", app: "treintayuno", timestamp: new Date().toISOString() });

    if (url.pathname === "/api/ai/chat") {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      if (!env.AI) return json({ error: "El servicio de IA todavía no está habilitado en este despliegue." }, 503);
      const token = (request.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
      const publishableKey = request.headers.get("apikey") || "";
      if (!token || !publishableKey) return json({ error: "Inicia sesión para usar el asistente." }, 401);
      try {
        const identity = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: publishableKey, Authorization: `Bearer ${token}` } });
        if (!identity.ok) return json({ error: "Tu sesión venció. Inicia sesión de nuevo." }, 401);
        const body = await request.json();
        const question = typeof body?.message === "string" ? body.message.trim() : "";
        if (!question || question.length > 1500) return json({ error: "Escribe una pregunta de hasta 1.500 caracteres." }, 400);
        const history = Array.isArray(body.history) ? body.history.slice(-6).map((item) => ({ role: item?.role === "assistant" ? "assistant" : "user", content: String(item?.content || "").slice(0, 1200) })) : [];
        const context = typeof body.context === "string" ? body.context.slice(0, 3000) : "";
        const messages = [
          { role: "system", content: "Eres el asistente inteligente de Treintayuno, una aplicación de gestión para pequeños negocios. Responde en español claro, práctico y breve. Ayuda a interpretar procesos y a tomar decisiones. Nunca inventes ventas, clientes, inventario, importes ni cifras del negocio: si no aparecen en el contexto, explica que no tienes esos datos conectados. No afirmes haber ejecutado cambios ni transacciones. No solicites contraseñas, tokens ni datos sensibles. Distingue sugerencias de datos verificados." },
          ...(context ? [{ role: "system", content: "Contexto visible proporcionado por la aplicación (puede estar incompleto):\n" + context }] : []),
          ...history,
          { role: "user", content: question }
        ];
        const result = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", { messages, max_tokens: 650, temperature: 0.25 });
        const answer = typeof result?.response === "string" ? result.response.trim() : "";
        return answer ? json({ answer }) : json({ error: "La IA no devolvió una respuesta. Inténtalo de nuevo." }, 502);
      } catch {
        return json({ error: "No pudimos completar la consulta de IA. Inténtalo de nuevo." }, 502);
      }
    }
    if (url.pathname.startsWith("/api/")) return json({ error: "Endpoint not found" }, 404);
    return env.ASSETS.fetch(request);
  }
};