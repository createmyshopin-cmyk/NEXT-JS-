"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import type { Json } from "@/integrations/supabase/types";
import {
  LANDING_THEME_PRESET_CLASS,
  mergePresetAndDbTokens,
  normalizeThemeTokens,
  type LandingThemePreset,
} from "@/lib/marketplace-theme";
import { cn } from "@/lib/utils";

const ROOT_CLASS_PREFIX = "landing-preset-";

type Props = {
  landingThemeSlug: LandingThemePreset;
  themeTokens: Record<string, string> | Json | null | undefined;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * Applies the same token merge + preset classes as LandingThemeProvider, but scoped to a wrapper
 * (for admin previews without mutating document.documentElement).
 */
export function LandingThemeScope({ landingThemeSlug, themeTokens, className, style, children }: Props) {
  const dbTokens = useMemo(() => normalizeThemeTokens(themeTokens as Json), [themeTokens]);
  const merged = useMemo(() => mergePresetAndDbTokens(landingThemeSlug, dbTokens), [landingThemeSlug, dbTokens]);

  const varStyle = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(merged)) {
      out[k] = v;
    }
    return out as CSSProperties;
  }, [merged]);

  const presetClass = LANDING_THEME_PRESET_CLASS[landingThemeSlug];

  return (
    <div
      className={cn(
        "text-foreground bg-background antialiased",
        ROOT_CLASS_PREFIX + landingThemeSlug,
        presetClass,
        className
      )}
      style={{ ...varStyle, ...style }}
    >
      {children}
    </div>
  );
}
