import { WebviewWindow, getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { supabase } from "./supabaseClient";

export const OAUTH_POPUP_LABEL = "opentune_oauth_popup";
const OAUTH_BROADCAST_CHANNEL = "opentune_oauth_channel";

export function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
}

export function isOAuthPopup(): boolean {
  if (typeof window === "undefined") return false;
  if (window.name === OAUTH_POPUP_LABEL) return true;
  if (window.opener && (window.location.hash.includes("access_token=") || window.location.search.includes("code="))) {
    return true;
  }

  // 1. Direct Tauri internals metadata check
  try {
    const internals = (window as unknown as {
      __TAURI_INTERNALS__?: {
        metadata?: {
          currentWindow?: { label?: string };
          currentWebview?: { label?: string };
        };
      };
    }).__TAURI_INTERNALS__;
    const winLabel = internals?.metadata?.currentWindow?.label;
    const webviewLabel = internals?.metadata?.currentWebview?.label;
    if (winLabel === OAUTH_POPUP_LABEL || webviewLabel === OAUTH_POPUP_LABEL) {
      return true;
    }
  } catch {}

  // 2. Tauri API check
  if (isTauriEnvironment()) {
    try {
      const currentWin = getCurrentWebviewWindow();
      if (currentWin.label === OAUTH_POPUP_LABEL) return true;
    } catch {}
  }

  // 3. URL contains oauth tokens/code
  if (
    typeof window !== "undefined" &&
    (window.location.hash.includes("access_token=") ||
      window.location.search.includes("code="))
  ) {
    if (isTauriEnvironment()) {
      try {
        const currentWin = getCurrentWebviewWindow();
        if (currentWin.label !== "main") {
          return true;
        }
      } catch {}
      try {
        const internals = (window as unknown as {
          __TAURI_INTERNALS__?: {
            metadata?: {
              currentWindow?: { label?: string };
            };
          };
        }).__TAURI_INTERNALS__;
        const winLabel = internals?.metadata?.currentWindow?.label;
        if (winLabel && winLabel !== "main") {
          return true;
        }
      } catch {}
    } else {
      // In web, any page landing with access_token or code is the OAuth redirect target
      return true;
    }
  }

  return false;
}

/**
 * Checks if the current window is an OAuth popup and handles closing after receiving tokens.
 */
export async function handleOAuthPopupRedirect(): Promise<boolean> {
  const isPopup = isOAuthPopup();
  if (!isPopup) return false;

  try {
    const hash = window.location.hash;
    const search = window.location.search;

    // Direct session hydration in popup (shared storage across WebViews of same origin)
    if (hash && hash.includes("access_token=") && supabase) {
      try {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }
      } catch (err) {
        console.error("Popup setSession error:", err);
      }
    } else if (search && search.includes("code=") && supabase) {
      try {
        const params = new URLSearchParams(search);
        const code = params.get("code");
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
      } catch (err) {
        console.error("Popup exchangeCodeForSession error:", err);
      }
    }

    // Broadcast completion to the main window
    try {
      const bc = new BroadcastChannel(OAUTH_BROADCAST_CHANNEL);
      bc.postMessage({ type: "OAUTH_SUCCESS", hash, search });
      // Keep channel open briefly so message can be consumed before context termination
      setTimeout(() => {
        try { bc.close(); } catch {}
      }, 3000);
    } catch {}

    // Fallback: window.opener postMessage if available
    try {
      if (window.opener && typeof window.opener.postMessage === "function") {
        window.opener.postMessage({ type: "OAUTH_SUCCESS", hash, search }, "*");
      }
    } catch {}

    const hasTokensOrCode =
      hash.includes("access_token=") ||
      search.includes("code=") ||
      hash.includes("error=") ||
      search.includes("error=");

    setTimeout(async () => {
      try {
        const currentWin = getCurrentWebviewWindow();
        await currentWin.destroy();
      } catch {
        try {
          const currentWin = getCurrentWebviewWindow();
          await currentWin.close();
        } catch {
          window.close();
          // Fallback if window.close was ignored by browser (e.g. full-page redirect)
          setTimeout(() => {
            if (typeof window !== "undefined" && !window.closed) {
              window.location.replace(window.location.origin);
            }
          }, 600);
        }
      }
    }, hasTokensOrCode ? 400 : 600);

    return true;
  } catch {
    window.close();
    return true;
  }
}

/**
 * Initiates an OAuth sign-in flow (Discord or Google) inside a dedicated popup window,
 * keeping the main OpenTune application window intact without external navigation.
 */
export async function signInWithOAuthPopup(provider: "google" | "discord"): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client is not configured.");
  }

  const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      scopes: provider === "discord" ? "identify email" : undefined,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error("Could not retrieve authentication URL.");

  if (isTauriEnvironment()) {
    try {
      const existing = await WebviewWindow.getByLabel(OAUTH_POPUP_LABEL);
      if (existing) {
        await existing.close();
      }
    } catch {}

    const title =
      provider === "discord"
        ? "Sign in with Discord - OpenTune"
        : "Sign in with Google - OpenTune";

    const popup = new WebviewWindow(OAUTH_POPUP_LABEL, {
      url: data.url,
      title,
      width: 520,
      height: 720,
      center: true,
      resizable: true,
      focus: true,
    });

    await new Promise<void>((resolve) => {
      let resolved = false;

      const finish = async (hash?: string, search?: string) => {
        if (resolved) return;
        resolved = true;
        try {
          await popup.destroy();
        } catch {
          try {
            await popup.close();
          } catch {}
        }
        if (supabase) {
          try {
            if (hash && hash.includes("access_token=")) {
              const params = new URLSearchParams(hash.replace(/^#/, ""));
              const access_token = params.get("access_token");
              const refresh_token = params.get("refresh_token");
              if (access_token && refresh_token) {
                await supabase.auth.setSession({ access_token, refresh_token });
              }
            } else if (search && search.includes("code=")) {
              const params = new URLSearchParams(search);
              const code = params.get("code");
              if (code) {
                await supabase.auth.exchangeCodeForSession(code);
              }
            }
          } catch {}
          try {
            await supabase.auth.getSession();
          } catch {}
        }
        resolve();
      };

      // 1. Listen via BroadcastChannel from the popup window
      let bc: BroadcastChannel | null = null;
      try {
        bc = new BroadcastChannel(OAUTH_BROADCAST_CHANNEL);
        bc.onmessage = async (event) => {
          if (event.data?.type === "OAUTH_SUCCESS") {
            const hash = event.data.hash as string | undefined;
            const search = event.data.search as string | undefined;
            await finish(hash, search);
          }
        };
      } catch {}

      // 2. Listen to Supabase auth state change in main window
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          subscription.unsubscribe();
          void finish();
        }
      });

      // 3. Fallback when popup is closed or destroyed by user
      void popup.once("tauri://destroyed", () => {
        subscription.unsubscribe();
        if (bc) try { bc.close(); } catch {}
        if (!resolved) {
          resolve();
        }
      });

      // 4. Timeout after 5 minutes
      setTimeout(() => {
        subscription.unsubscribe();
        if (bc) try { bc.close(); } catch {}
        if (!resolved) {
          resolve();
        }
      }, 300_000);
    });
  } else {
    const popup = window.open(
      data.url,
      OAUTH_POPUP_LABEL,
      "width=520,height=720,status=no,toolbar=no,menubar=no",
    );

    if (!popup) {
      window.location.href = data.url;
      return;
    }

    await new Promise<void>((resolve) => {
      let resolved = false;

      const finish = async (hash?: string, search?: string) => {
        if (resolved) return;
        resolved = true;
        try {
          if (!popup.closed) popup.close();
        } catch {}
        if (supabase) {
          try {
            if (hash && hash.includes("access_token=")) {
              const params = new URLSearchParams(hash.replace(/^#/, ""));
              const access_token = params.get("access_token");
              const refresh_token = params.get("refresh_token");
              if (access_token && refresh_token) {
                await supabase.auth.setSession({ access_token, refresh_token });
              }
            } else if (search && search.includes("code=")) {
              const params = new URLSearchParams(search);
              const code = params.get("code");
              if (code) {
                await supabase.auth.exchangeCodeForSession(code);
              }
            }
          } catch {}
          try {
            await supabase.auth.getSession();
          } catch {}
        }
        resolve();
      };

      // 1. Listen via BroadcastChannel
      let bc: BroadcastChannel | null = null;
      try {
        bc = new BroadcastChannel(OAUTH_BROADCAST_CHANNEL);
        bc.onmessage = async (event) => {
          if (event.data?.type === "OAUTH_SUCCESS") {
            const hash = event.data.hash as string | undefined;
            const search = event.data.search as string | undefined;
            await finish(hash, search);
          }
        };
      } catch {}

      // 2. Listen via window postMessage (window.opener fallback)
      const handleWindowMessage = async (event: MessageEvent) => {
        if (event.data?.type === "OAUTH_SUCCESS") {
          const hash = event.data.hash as string | undefined;
          const search = event.data.search as string | undefined;
          await finish(hash, search);
        }
      };
      window.addEventListener("message", handleWindowMessage);

      // 3. Listen to Supabase auth state change
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          subscription.unsubscribe();
          void finish();
        }
      });

      // 4. Check for popup closed by user or window.close()
      const checkInterval = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(checkInterval);
            window.removeEventListener("message", handleWindowMessage);
            subscription.unsubscribe();
            if (bc) try { bc.close(); } catch {}

            // Give a tiny moment for storage sync if popup hydrated session
            if (!resolved) {
              if (supabase) {
                try {
                  const { data } = await supabase.auth.getSession();
                  if (data?.session) {
                    resolved = true;
                    resolve();
                    return;
                  }
                } catch {}
              }
              resolved = true;
              resolve();
            }
          }
        } catch {
          clearInterval(checkInterval);
        }
      }, 500);

      // 5. Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        window.removeEventListener("message", handleWindowMessage);
        subscription.unsubscribe();
        if (bc) try { bc.close(); } catch {}
        if (!resolved) {
          resolved = true;
          resolve();
        }
      }, 300_000);
    });
  }
}

