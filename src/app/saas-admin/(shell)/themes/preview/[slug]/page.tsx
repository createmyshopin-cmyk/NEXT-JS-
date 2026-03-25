"use client";

import SaasAdminThemePreview from "@/spa-pages/saas-admin/SaasAdminThemePreview";

export default function Page({ params }: { params: { slug: string } }) {
  return <SaasAdminThemePreview params={params} />;
}
