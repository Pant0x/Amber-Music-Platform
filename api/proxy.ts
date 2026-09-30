function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export default async function handler(req: any, res?: any) {
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Web API / Edge runtime mode
  if (!res || typeof res.status !== "function") {
    const webReq = req as Request;
    if (webReq.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (webReq.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const data = await webReq.json();
      const { url, method = "GET", headers = {}, body_base64, timeout_ms } = data;

      if (!url) {
        return new Response(JSON.stringify({ error: "Missing URL parameter" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const forwardHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(headers)) {
        const lower = k.toLowerCase();
        if (lower !== "host" && lower !== "content-length" && lower !== "connection") {
          forwardHeaders[k] = v as string;
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout_ms || 25000);

      const response = await fetch(url, {
        method,
        headers: forwardHeaders,
        body: method !== "GET" && method !== "HEAD" && body_base64
          ? fromBase64(body_base64)
          : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const respHeaders: Record<string, string> = {};
      response.headers.forEach((v, k) => {
        respHeaders[k] = v;
      });

      let cookieHeader: string | undefined;
      const getSetCookie = (response.headers as any).getSetCookie?.();
      if (Array.isArray(getSetCookie) && getSetCookie.length > 0) {
        cookieHeader = getSetCookie.join("; ");
      } else if (response.headers.get("set-cookie")) {
        cookieHeader = response.headers.get("set-cookie") || undefined;
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      const payload = {
        status: response.status,
        headers: respHeaders,
        body_base64: toBase64(bytes),
        cookie: cookieHeader,
      };

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: String(err?.message || err) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Node.js Serverless runtime mode
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const { url, method = "GET", headers = {}, body_base64, timeout_ms } = req.body || {};

    if (!url) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing URL parameter" }));
      return;
    }

    const forwardHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      const lower = k.toLowerCase();
      if (lower !== "host" && lower !== "content-length" && lower !== "connection") {
        forwardHeaders[k] = v as string;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout_ms || 25000);

    const response = await fetch(url, {
      method,
      headers: forwardHeaders,
      body: method !== "GET" && method !== "HEAD" && body_base64
        ? fromBase64(body_base64)
        : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const respHeaders: Record<string, string> = {};
    response.headers.forEach((v, k) => {
      respHeaders[k] = v;
    });

    let cookieHeader: string | undefined;
    const getSetCookie = (response.headers as any).getSetCookie?.();
    if (Array.isArray(getSetCookie) && getSetCookie.length > 0) {
      cookieHeader = getSetCookie.join("; ");
    } else if (response.headers.get("set-cookie")) {
      cookieHeader = response.headers.get("set-cookie") || undefined;
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    const payload = {
      status: response.status,
      headers: respHeaders,
      body_base64: toBase64(bytes),
      cookie: cookieHeader,
    };

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(payload));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: String(err?.message || err) }));
  }
}
