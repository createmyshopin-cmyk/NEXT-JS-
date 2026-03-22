"use client";

import { motion } from "framer-motion";
import { WrenchIcon, PhoneCall } from "lucide-react";
import { useBranding } from "@/context/BrandingContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const MaintenanceOverlay = () => {
  const { siteName, logoUrl, primaryColor } = useBranding();
  const { settings } = useSiteSettings();
  const phone = settings?.whatsapp_number || settings?.contact_phone;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", background: "rgba(0,0,0,0.45)" }}
    >
      {/* Modal card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 32 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.1 }}
        className="relative bg-background w-full max-w-sm rounded-3xl shadow-2xl px-8 py-10 flex flex-col items-center text-center overflow-hidden"
        role="alertdialog"
        aria-modal="true"
        aria-label="Site under maintenance"
      >
        {/* Glow blob behind the icon */}
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: primaryColor || "hsl(var(--primary))" }}
        />

        {/* Animated icon */}
        <motion.div
          animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
          className="mb-5 p-4 rounded-2xl"
          style={{ background: `${primaryColor || "hsl(var(--primary))"}22` }}
        >
          <WrenchIcon
            className="w-10 h-10"
            style={{ color: primaryColor || "hsl(var(--primary))" }}
          />
        </motion.div>

        {/* Logo / site name */}
        {logoUrl ? (
          <img src={logoUrl} alt={siteName} className="h-7 mx-auto object-contain mb-4" />
        ) : (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            {siteName}
          </p>
        )}

        <h1 className="text-[22px] font-extrabold text-foreground leading-tight">
          We're Under Maintenance
        </h1>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          We are currently <strong className="text-foreground">not accepting new bookings.</strong>
          <br />
          Our team is working hard behind the scenes. We'll be back shortly!
        </p>

        {/* Pulsing dots */}
        <div className="flex items-center gap-2 mt-6">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.4, repeat: Infinity, delay }}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: primaryColor || "hsl(var(--primary))" }}
            />
          ))}
        </div>

        {/* Contact CTA */}
        {phone && (
          <a
            href={`https://wa.me/${phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-full text-white transition-opacity hover:opacity-90 active:scale-95"
            style={{ backgroundColor: primaryColor || "hsl(var(--primary))" }}
          >
            <PhoneCall className="w-4 h-4" />
            Contact Us
          </a>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MaintenanceOverlay;
