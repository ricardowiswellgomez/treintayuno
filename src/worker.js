export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json(
        {
          status: "ok",
          app: "treintayuno",
          timestamp: new Date().toISOString()
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json(
        { error: "Endpoint not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return env.ASSETS.fetch(request);
  }
};
