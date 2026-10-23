function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ status: "ok", app: "treintayuno", timestamp: new Date().toISOString() });
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Endpoint not found" }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
