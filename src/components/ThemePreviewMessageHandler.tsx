"use client";

import { useEffect } from "react";
import { ALLOWED_LANDING_THEME_VARS } from "@/lib/marketplace-theme";

const ALLOWED_SET = new Set<string>(ALLOWED_LANDING_THEME_VARS);

/**
 * Listens for THEME_PREVIEW_TOKENS postMessages from a parent frame (theme editor).
 * Applies the received CSS variables directly to :root for instant live preview.
 * Only runs when the page is embedded in an iframe — no-op on direct visits.
 */
export function ThemePreviewMessageHandler() {
  useEffect(() => {
    // Only active when inside an iframe
    if (typeof window === "undefined" || window.self === window.top) return;

    const handler = (event: MessageEvent) => {
      if (!event.data || event.data.type !== "THEME_PREVIEW_TOKENS") return;

      const tokens: Record<string, string> = event.data.tokens ?? {};
      const root = document.documentElement;

      // Apply only allowlisted CSS vars to prevent arbitrary style injection
      for (const [key, value] of Object.entries(tokens)) {
        const cssKey = key.startsWith("--") ? key : `--${key}`;
        if (ALLOWED_SET.has(cssKey as any) && typeof value === "string") {
          root.style.setProperty(cssKey, value);
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return null;
}
