"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud, FileArchive, CheckCircle2, XCircle } from "lucide-react";

export default function SaasAdminThemeUpload() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Prefetch token to bypass async bugs during upload
  useState(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionToken(data.session?.access_token || null);
    });
  });

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.endsWith(".zip")) {
      toast({ title: "Invalid File", description: "Only .zip theme packages are allowed.", variant: "destructive" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum upload size is 50MB.", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!sessionToken) {
      toast({ title: "Auth Error", description: "Missing session token. Please reload.", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/saas-admin/themes/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      toast({ title: "Theme Uploaded Successfully!", description: `Slug: ${data.theme}`, variant: "default" });
      
      // Delay before routing back
      setTimeout(() => {
        router.push("/saas-admin/themes");
      }, 1500);

    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto px-1">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UploadCloud className="h-7 w-7 text-primary" />
          Upload New Theme
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Deploy a new ecosystem theme via ZIP structure validation.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme Package (.zip)</CardTitle>
          <CardDescription>Drag and drop your `theme-name.zip` file here. Strict architecture validations apply.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
            }`}
          >
            {!selectedFile ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <FileArchive className="h-12 w-12 text-muted-foreground/50" />
                <div className="space-y-1">
                  <p className="font-medium">Click or drag ZIP file to upload</p>
                  <p className="text-sm text-muted-foreground">Max size 50MB</p>
                </div>
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-lg">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedFile(null)} disabled={uploading}>
                    <XCircle className="h-4 w-4 mr-1" /> Remove
                  </Button>
                  <Button onClick={handleUpload} disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extracting & Validating...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4 mr-2" /> Publish to Ecosystem
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".zip"
              onChange={handleFileChange}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Validation Requirements</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Your ZIP file must contain the following exactly:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><code className="bg-muted px-1 rounded text-foreground">theme.json</code> manifest with `name`, `slug`, `version`, `author`</li>
            <li><code className="bg-muted px-1 rounded text-foreground">preview.png</code> root product image</li>
            <li><code className="bg-muted px-1 rounded text-foreground">layouts/</code> directory with template layouts</li>
            <li><code className="bg-muted px-1 rounded text-foreground">components/</code> and <code className="bg-muted px-1 rounded text-foreground">sections/</code> specific modular bricks</li>
            <li><code className="bg-muted px-1 rounded text-foreground">styles/tokens.json</code> mapped perfectly to the platform CSS Variables</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
