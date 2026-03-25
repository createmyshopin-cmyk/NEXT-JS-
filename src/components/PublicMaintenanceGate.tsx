"use client";

import MaintenanceOverlay from "@/components/MaintenancePage";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { LandingThemeProvider } from "@/components/LandingThemeProvider";
import { ThemePreviewMessageHandler } from "@/components/ThemePreviewMessageHandler";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const PageLoader = () => (
  <div style={{ minHeight: "100vh", background: "hsl(var(--background))" }} />
);

/** Public routes only — admin / saas-admin are outside this layout. */
export function PublicMaintenanceGate({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useSiteSettings();
  if (loading) return <PageLoader />;
  
  const inMaintenance = !!settings?.maintenance_mode;

  return (
    <LandingThemeProvider landingThemeSlug={settings?.landing_theme_slug} themeTokens={settings?.theme_tokens ?? undefined}>
      {/* Listens for postMessage from the theme editor iframe */}
      <ThemePreviewMessageHandler />
      {/* Page content — blurred and non-interactive during maintenance */}
      <div
        style={inMaintenance ? {
          filter: "blur(5px)",
          pointerEvents: "none",
          userSelect: "none",
          overflow: "hidden",
          maxHeight: "100vh",
        } : undefined}
      >
        {children}
        {!inMaintenance && <FloatingWhatsApp />}
      </div>

      {/* Maintenance overlay rendered on top */}
      {inMaintenance && <MaintenanceOverlay />}
    </LandingThemeProvider>
  );
}
