import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// @ts-expect-error node builtin types are not included for the Vite config
import { fileURLToPath } from "node:url";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
const resolveEntry = (path: string) => fileURLToPath(new URL(path, import.meta.url));

function apiProxyPlugin() {
  return {
    name: "api-proxy-plugin",
    configureServer(server: any) {
      server.middlewares.use("/api/proxy", (req: any, res: any) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", async () => {
          try {
            const rawBody = Buffer.concat(chunks).toString("utf-8");
            const body = JSON.parse(rawBody);
            const { url, method = "GET", headers = {}, body_base64, timeout_ms } = body;

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
                ? Buffer.from(body_base64, "base64")
                : undefined,
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            const respHeaders: Record<string, string> = {};
            response.headers.forEach((v, k) => {
              respHeaders[k] = v;
            });

            let cookieHeader: string | undefined;
            const getSetCookie = response.headers.getSetCookie?.();
            if (Array.isArray(getSetCookie) && getSetCookie.length > 0) {
              cookieHeader = getSetCookie.join("; ");
            } else if (response.headers.get("set-cookie")) {
              cookieHeader = response.headers.get("set-cookie") || undefined;
            }

            const arrayBuffer = await response.arrayBuffer();
            const respBase64 = Buffer.from(arrayBuffer).toString("base64");

            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                status: response.status,
                headers: respHeaders,
                body_base64: respBase64,
                cookie: cookieHeader,
              }),
            );
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: String(err?.message || err) }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss(), apiProxyPlugin()],
  resolve: {
    alias: {
      "@": resolveEntry("./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolveEntry("./index.html"),
        mini: resolveEntry("./mini.html"),
      },
    },
  },
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
