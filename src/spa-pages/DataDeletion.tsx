"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StickyHeader from "@/components/StickyHeader";
import Footer from "@/components/Footer";
import { useBranding } from "@/context/BrandingContext";
import { supabase } from "@/integrations/supabase/client";

/** Instructions for users to request deletion of their data (Meta Developer / GDPR-style). */
export default function DataDeletion() {
  const { siteName } = useBranding();
  const [contactEmail, setContactEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("site_settings").select("contact_email").limit(1).maybeSingle();
      if (!cancelled && data && (data as { contact_email?: string }).contact_email) {
        setContactEmail((data as { contact_email: string }).contact_email);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StickyHeader />
      <main className="flex-1 px-4 md:px-6 lg:px-8 py-8 max-w-3xl mx-auto w-full">
        <Link href="/" className="text-sm text-primary hover:underline mb-6 inline-block">
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">User data deletion</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-8">
          Last updated: March 21, 2026 · {siteName}
        </p>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Your choices</h2>
            <p>
              You can ask us to delete personal information we hold about you, subject to legal exceptions (for example
              records we must keep for tax, fraud prevention, or unresolved disputes). This page explains how to submit
              a request.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">What we may delete</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Account profile and login identifiers associated with your email or phone;</li>
              <li>Booking and enquiry history tied to your account, where retention is not required by law;</li>
              <li>Marketing preferences and optional profile fields;</li>
              <li>
                Where applicable, connection data for optional integrations (for example if you connected Instagram or
                other channels through our platform—disconnecting or removing your account may remove associated tokens
                on our side; Meta/Facebook may retain data under their own policies).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">How to request deletion</h2>
            <p className="mb-3">Send an email from the address registered on your account to our privacy inbox:</p>
            {contactEmail ? (
              <p className="rounded-lg border border-border bg-muted/40 px-4 py-3">
                <a href={`mailto:${contactEmail}?subject=Data%20deletion%20request`} className="font-mono text-sm text-primary break-all hover:underline">
                  {contactEmail}
                </a>
              </p>
            ) : (
              <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-foreground text-sm">
                Use the contact email shown in the footer of this website, or the address you used when booking with us.
              </p>
            )}
            <p className="mt-3">
              If you no longer have access to your registered email, explain that in your message and we will suggest a
              safe way to verify your identity.
            </p>
            <p className="mt-3 font-medium text-foreground">Include in your email:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Subject line: <span className="font-mono text-xs">Data deletion request</span>;</li>
              <li>The email address or phone number associated with your account;</li>
              <li>Whether you want full account deletion or only certain data removed;</li>
              <li>Any relevant booking or reference numbers (optional but helps us locate your records).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Verification</h2>
            <p>
              To protect your privacy, we may ask you to confirm ownership of the account (for example by replying from
              the registered email or completing a short verification step). We will not complete deletion for requests
              we cannot verify.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Timing</h2>
            <p>
              We aim to acknowledge requests within a few business days and complete deletion or anonymisation within
              approximately thirty (30) days unless a longer period is required by law or for legitimate ongoing purposes
              (such as an open booking or chargeback).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Business accounts and tenants</h2>
            <p>
              If you use our platform as a business (tenant admin), deleting your organisation’s data may require
              separate steps and may affect your customers’ data according to your role as data controller—contact us
              with your tenant or business name so we can guide you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">More information</h2>
            <p>
              For how we process personal data generally, see our{" "}
              <Link href="/privacy-policy" className="text-primary underline hover:no-underline">
                Privacy Policy
              </Link>
              . For terms of use, see our{" "}
              <Link href="/terms-of-service" className="text-primary underline hover:no-underline">
                Terms of Service
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
