/**
 * Same-origin proxy to the Laravel console.
 *
 * The studio calls `/api/v1/...` on its own domain and this forwards it, so the
 * backend host lives in one environment variable instead of in every visitor's
 * network tab and in the JavaScript bundle.
 *
 * To be plain about what this is and is not: it hides *where* the API lives, it
 * does not protect it. Anything the page can call, a visitor can still call
 * through this path. The wins are that the origin can change without a rebuild,
 * and that same-origin requests need no CORS preflight — which also removes a
 * round trip from every call.
 */

export const config = { runtime: "edge" };

/** Set in the hosting environment. Never inlined into the client bundle. */
const API_ORIGIN = process.env.API_ORIGIN ?? process.env.VITE_API_URL ?? "";

/** Hop-by-hop and host-specific headers that must not be forwarded. */
const STRIPPED = new Set([
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "content-length",
]);

export default async function handler(request: Request): Promise<Response> {
  if (!API_ORIGIN) {
    return Response.json(
      { success: false, message: "API origin is not configured.", code: "API_ORIGIN_MISSING", data: [] },
      { status: 503 },
    );
  }

  const incoming = new URL(request.url);
  const target = new URL(
    `${API_ORIGIN.replace(/\/+$/, "")}${incoming.pathname}${incoming.search}`,
  );

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIPPED.has(key.toLowerCase())) headers.set(key, value);
  });
  // The console should see who it is really answering, not the edge node.
  headers.set("X-Forwarded-Host", incoming.host);

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "manual",
      // Required by the Fetch standard when streaming a request body.
      ...(request.body ? { duplex: "half" } : {}),
    } as RequestInit);

    const responseHeaders = new Headers(upstream.headers);
    // Same-origin now, so any CORS headers from upstream are noise.
    responseHeaders.delete("access-control-allow-origin");
    responseHeaders.delete("access-control-allow-credentials");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { success: false, message: "Could not reach the API.", code: "API_UNREACHABLE", data: [] },
      { status: 502 },
    );
  }
}
