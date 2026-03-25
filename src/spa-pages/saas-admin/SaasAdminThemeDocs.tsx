"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BookOpen, Fingerprint, FileCode2, LayoutTemplate } from "lucide-react";

export default function SaasAdminThemeDocs() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto px-1 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Theme Developer Docs</h1>
          <p className="text-muted-foreground mt-2">
            Complete API reference and structure requirements for building unified marketplace themes.
          </p>
        </div>
        <Button onClick={() => window.open("/api/saas-admin/themes/starter", "_blank")} className="shrink-0 gap-2">
          <Download className="w-4 h-4" /> Download Starter Theme
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-primary" />
              Theme Anatomy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Every theme uploaded to the marketplace must adhere to a strict structural manifest. If any required folders or files are missing, the zip validation engine will automatically reject it.
            </p>
            <div className="bg-muted p-4 rounded-md font-mono text-xs overflow-x-auto">
{`theme-name/
├── theme.json
├── preview.png
├── layouts/
│   ├── landing.tsx
│   └── destination.tsx
├── components/
│   ├── navbar.tsx
│   └── footer.tsx
├── sections/
│   ├── hero.tsx
│   └── gallery.tsx
├── styles/
│   ├── tokens.json
│   └── theme.css
└── assets/
    ├── images/
    └── icons/`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-primary" />
              Manifest Validation (theme.json)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Your <code className="bg-muted px-1">theme.json</code> is the heartbeat of your template. It declares available layouts and metadata.
            </p>
            <div className="bg-muted p-4 rounded-md font-mono text-xs overflow-x-auto">
{`{
  "name": "Voyago Travel",
  "slug": "voyago",
  "version": "1.0",
  "author": "ThemeLab",
  "description": "Modern travel theme",
  "preview": "preview.png",
  "layouts": ["landing", "destination"],
  "sections": ["hero", "gallery"]
}`}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-primary" />
            Tokens & Colors mapping
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          <p className="text-muted-foreground">
            The ecosystem leverages an overriding hierarchy mechanism via <code className="bg-muted px-1">tokens.json</code>. Database tokens set by the Tenant will always override your Theme defaults. You must declare raw HSL values to enable Tailwind CSS opacity handling.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Rule #1: HSL Space syntax</h3>
              <p className="text-muted-foreground mb-3">You cannot wrap variables in <code className="bg-muted px-1">#HEX</code>, <code className="bg-muted px-1">rgb()</code>, or <code className="bg-muted px-1">hsl()</code> functions.</p>
              <div className="space-y-2">
                <div className="border border-green-500/20 bg-green-500/10 p-2 rounded">
                  <span className="text-green-600 font-medium">Valid:</span> <code className="text-foreground">"primary": "210 90% 50%"</code>
                </div>
                <div className="border border-red-500/20 bg-red-500/10 p-2 rounded">
                  <span className="text-red-600 font-medium">Invalid:</span> <code className="text-foreground">"primary": "hsl(210, 90%, 50%)"</code>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Rule #2: Strict Key constraints</h3>
              <p className="text-muted-foreground mb-3">You may only define variables that the platform supports map. Custom arbitrary properties will be rejected by the validation pipeline.</p>
              <div className="bg-muted p-3 rounded font-mono text-xs grid grid-cols-2 gap-2">
                <span>primary</span>
                <span>secondary</span>
                <span>background</span>
                <span>foreground</span>
                <span>muted</span>
                <span>accent</span>
                <span>radius</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Rendering Hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-4">
          <p className="text-muted-foreground">
            Once a tenant activates a theme, the layout resolution process executes:
          </p>
          <ol className="list-decimal pl-5 space-y-3 text-foreground">
            <li>
              <strong>Resolution:</strong> The Engine maps the tenant's <code className="bg-muted px-1 text-xs">site_settings.landing_theme_slug</code>.
            </li>
            <li>
              <strong>Aggregation:</strong> It merges Database tokens atop Theme tokens.
            </li>
            <li>
              <strong>Injection:</strong> HTML classes and style variables are applied onto the <code className="bg-muted px-1 text-xs">{`<body>`}</code> tag (e.g., <code className="bg-muted px-1 text-xs">--primary: 210 90% 50%</code>).
            </li>
            <li>
              <strong>Compilation:</strong> Theme component files in <code className="bg-muted px-1 text-xs">/layouts</code> utilize your mapped classes like <code className="bg-muted px-1 text-xs">bg-primary</code> safely.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
