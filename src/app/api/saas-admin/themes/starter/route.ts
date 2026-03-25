import { NextResponse } from "next/server";
import JSZip from "jszip";

export async function GET() {
  try {
    const zip = new JSZip();

    // theme.json
    zip.file(
      "theme.json",
      JSON.stringify({
        name: "Starter Travel Theme",
        slug: "starter-travel",
        version: "1.0.0",
        author: "Acme Agency",
        description: "A comprehensive baseline theme for travel directories.",
        preview: "preview.png",
        layouts: ["landing"],
        sections: ["hero"]
      }, null, 2)
    );

    // Placeholder preview image (a valid minimal png base64)
    const emptyPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    zip.file("preview.png", emptyPng, { base64: true });

    // layouts/landing.tsx
    zip.file(
      "layouts/landing.tsx",
      `import { Hero } from "../components/hero";\n\nexport default function LandingLayout() {\n  return (\n    <main className="min-h-screen bg-background text-foreground">\n      <Hero />\n    </main>\n  );\n}\n`
    );

    // components/hero.tsx
    zip.file(
      "components/hero.tsx",
      `export function Hero() {\n  return (\n    <div className="bg-primary text-primary-foreground py-20 px-8 text-center">\n      <h1 className="text-4xl font-bold">Welcome to Travel</h1>\n    </div>\n  );\n}\n`
    );

    // sections/hero.tsx (just a wrapper or variant for demonstration)
    zip.file(
      "sections/hero.tsx",
      `import { Hero as HeroComponent } from "../components/hero";\nexport const HeroSection = () => <HeroComponent />;\n`
    );

    // styles/tokens.json
    zip.file(
      "styles/tokens.json",
      JSON.stringify({
        primary: "210 90% 50%",
        "primary-foreground": "0 0% 100%",
        secondary: "210 40% 95%",
        "secondary-foreground": "222 47% 11%",
        background: "0 0% 100%",
        foreground: "222 47% 11%",
        muted: "210 40% 96%",
        "muted-foreground": "215 16% 47%",
        accent: "210 40% 90%",
        "accent-foreground": "222 47% 11%",
        radius: "0.5rem"
      }, null, 2)
    );

    // Generate buffer
    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=starter-theme.zip",
      },
    });
  } catch (error) {
    console.error("Generate template error:", error);
    return NextResponse.json({ error: "Failed to generate starter template" }, { status: 500 });
  }
}
