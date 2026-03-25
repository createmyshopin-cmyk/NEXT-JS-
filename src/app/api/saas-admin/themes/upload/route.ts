import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import { ALLOWED_LANDING_THEME_VARS } from "@/lib/marketplace-theme";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_ZIP_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = [".ts", ".tsx", ".js", ".css", ".json", ".png", ".jpg", ".svg", ".webp"];
const BLOCKED_EXTENSIONS = [".php", ".exe", ".sh", ".bash"];

function getExtension(filename: string) {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : "";
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");
    
    // Verify admin locally or using jwt (Assuming the route is protected by middleware, but we double-check)
    const { data: userDat, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !userDat.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_ZIP_SIZE) return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Find the root folder name to handle "theme-name/theme.json" or just "theme.json"
    const files = Object.keys(zip.files);
    const rootFolders = files.filter(f => f.indexOf("/") === f.length - 1 && f.split("/").length === 2);
    
    let rootPrefix = "";
    if (rootFolders.length === 1 && !files.some(f => f.indexOf("/") === -1)) {
      rootPrefix = rootFolders[0];
    }

    // Validation Flags
    let hasThemeJson = false;
    let hasPreviewPng = false;
    let hasLayouts = false;
    let hasComponents = false;
    let hasSections = false;
    let hasTokens = false;

    let themeManifest: any = null;

    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;

      const relativePath = filename.substring(rootPrefix.length);
      const ext = getExtension(relativePath);

      if (BLOCKED_EXTENSIONS.includes(ext)) {
        return NextResponse.json({ error: `Blocked file type detected: ${relativePath}` }, { status: 400 });
      }
      
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json({ error: `Disallowed file type: ${relativePath}` }, { status: 400 });
      }

      if (relativePath === "theme.json") {
        hasThemeJson = true;
        const text = await zipEntry.async("string");
        try {
          themeManifest = JSON.parse(text);
          const requiredKeys = ["name", "slug", "version", "author"];
          for (const key of requiredKeys) {
            if (!themeManifest[key]) {
               return NextResponse.json({ error: `theme.json missing required key: ${key}` }, { status: 400 });
            }
          }
        } catch (e) {
          return NextResponse.json({ error: "theme.json is not valid JSON" }, { status: 400 });
        }
      } else if (relativePath === "preview.png" || relativePath === "preview.jpg") {
        hasPreviewPng = true;
      } else if (relativePath.startsWith("layouts/")) {
        hasLayouts = true;
      } else if (relativePath.startsWith("components/")) {
        hasComponents = true;
      } else if (relativePath.startsWith("sections/")) {
        hasSections = true;
      } else if (relativePath === "styles/tokens.json") {
        hasTokens = true;
        const text = await zipEntry.async("string");
        try {
          const tokens = JSON.parse(text);
          const allowedSet = new Set(ALLOWED_LANDING_THEME_VARS);
          for (const key of Object.keys(tokens)) {
            if (!allowedSet.has(`--${key}` as any)) {
               return NextResponse.json({ error: `Invalid token key in styles/tokens.json: ${key}` }, { status: 400 });
            }
          }
        } catch(e) {
          return NextResponse.json({ error: "styles/tokens.json is not valid JSON" }, { status: 400 });
        }
      }
    }

    if (!hasThemeJson) return NextResponse.json({ error: "Missing theme.json" }, { status: 400 });
    if (!hasPreviewPng) return NextResponse.json({ error: "Missing preview image (preview.png)" }, { status: 400 });
    if (!hasLayouts) return NextResponse.json({ error: "Missing layouts/ directory with files" }, { status: 400 });
    if (!hasComponents) return NextResponse.json({ error: "Missing components/ directory with files" }, { status: 400 });
    if (!hasSections) return NextResponse.json({ error: "Missing sections/ directory with files" }, { status: 400 });
    if (!hasTokens) return NextResponse.json({ error: "Missing styles/tokens.json" }, { status: 400 });

    const themeSlug = themeManifest.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");

    // Check if theme slug exists
    const { data: existingTheme } = await supabaseAdmin
      .from("themes")
      .select("id")
      .eq("slug", themeSlug)
      .maybeSingle();

    if (existingTheme) {
      return NextResponse.json({ error: "A theme with this slug already exists" }, { status: 400 });
    }

    // Upload files to Supabase Storage
    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      
      const relativePath = filename.substring(rootPrefix.length);
      const filePath = `${themeSlug}/${relativePath}`;
      const fileData = await zipEntry.async("nodebuffer");
      
      let contentType = "application/octet-stream";
      const ext = getExtension(relativePath);
      if (ext === ".css") contentType = "text/css";
      else if (ext === ".json") contentType = "application/json";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".svg") contentType = "image/svg+xml";
      else if (ext === ".ts" || ext === ".tsx") contentType = "application/typescript";
      else if (ext === ".js") contentType = "application/javascript";
      else if (ext === ".webp") contentType = "image/webp";

      const { error: uploadError } = await supabaseAdmin.storage
        .from("themes")
        .upload(filePath, fileData, {
          contentType,
          upsert: true
        });

      if (uploadError) {
        console.error(`Failed to upload ${filePath}:`, uploadError);
        return NextResponse.json({ error: `Failed to upload ${relativePath}` }, { status: 500 });
      }
    }

    // Register theme in database
    const { data: publicPreviewUrl } = supabaseAdmin.storage
      .from("themes")
      .getPublicUrl(`${themeSlug}/${themeManifest.preview}`);

    const { error: dbError } = await supabaseAdmin
      .from("themes")
      .insert({
        name: themeManifest.name,
        slug: themeSlug,
        version: themeManifest.version,
        author: themeManifest.author,
        description: themeManifest.description || "",
        preview: publicPreviewUrl.publicUrl,
        theme_path: themeSlug,
      });

    if (dbError) {
       console.error("Database insert error:", dbError);
       return NextResponse.json({ error: "Failed to save theme to database" }, { status: 500 });
    }

    return NextResponse.json({ success: true, theme: themeSlug });

  } catch (err: any) {
    console.error("Theme upload error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
