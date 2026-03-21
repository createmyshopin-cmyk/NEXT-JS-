"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { slugify } from "@/lib/slugify";

interface AdminPackageCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const defaultImages = ["/assets/stay-1.jpg"];

export function AdminPackageCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: AdminPackageCreateDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [durationNights, setDurationNights] = useState("1");
  const [durationDays, setDurationDays] = useState("2");
  const [pickup, setPickup] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountLabel, setDiscountLabel] = useState("");
  const [status, setStatus] = useState<"active" | "draft" | "archived">("active");
  const [imagesText, setImagesText] = useState("");

  useEffect(() => {
    if (!open) return;
    setSlugTouched(false);
  }, [open]);

  useEffect(() => {
    if (!slugTouched && name) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  const reset = () => {
    setName("");
    setSlug("");
    setSlugTouched(false);
    setDescription("");
    setDurationNights("1");
    setDurationDays("2");
    setPickup("");
    setStartingPrice("");
    setOriginalPrice("");
    setDiscountLabel("");
    setStatus("active");
    setImagesText("");
  };

  const parseImages = (): string[] => {
    const raw = imagesText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return raw.length > 0 ? raw : defaultImages;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slugFinal = slugify(slug.trim() || name);
    if (!name.trim() || !slugFinal) {
      toast({ title: "Name and slug are required", variant: "destructive" });
      return;
    }
    const start = parseFloat(startingPrice);
    if (Number.isNaN(start) || start < 0) {
      toast({ title: "Enter a valid starting price", variant: "destructive" });
      return;
    }
    const orig = originalPrice.trim() === "" ? start : parseFloat(originalPrice);
    if (Number.isNaN(orig) || orig < 0) {
      toast({ title: "Enter a valid original price", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data: tenantId } = await supabase.rpc("get_my_tenant_id");

    const row: Record<string, unknown> = {
      slug: slugFinal,
      name: name.trim(),
      description: description.trim(),
      duration_nights: Math.max(0, parseInt(durationNights, 10) || 1),
      duration_days: Math.max(1, parseInt(durationDays, 10) || 2),
      pickup_drop_location: pickup.trim(),
      images: parseImages(),
      starting_price: start,
      original_price: orig,
      discount_label: discountLabel.trim() || null,
      cancellation_policy: [],
      status,
    };
    if (tenantId != null) {
      row.tenant_id = tenantId;
    } else {
      row.tenant_id = null;
    }

    const { error } = await (supabase.from("trips") as any).insert(row).select("id").single();

    setSaving(false);

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Slug already exists",
          description: "Choose a different package name or edit the slug.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Could not create package",
          description: error.message,
          variant: "destructive",
        });
      }
      return;
    }

    toast({ title: "Package created", description: `/${slugFinal} is ready.` });
    reset();
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create package</DialogTitle>
          <DialogDescription>
            Adds a row to <code className="text-xs">trips</code>. It will appear on{" "}
            <code className="text-xs">/trips</code> and <code className="text-xs">/trip/[slug]</code>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pkg-name">Package name *</Label>
            <Input
              id="pkg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Coorg Weekend Escape"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pkg-slug">URL slug *</Label>
            <Input
              id="pkg-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="coorg-weekend-escape"
              className="font-mono text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pkg-desc">Description</Label>
            <Textarea
              id="pkg-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Short summary for listings and SEO"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pkg-nights">Nights</Label>
              <Input
                id="pkg-nights"
                type="number"
                min={0}
                value={durationNights}
                onChange={(e) => setDurationNights(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-days">Days</Label>
              <Input
                id="pkg-days"
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pkg-pickup">Pickup &amp; drop</Label>
            <Input
              id="pkg-pickup"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="e.g. Bangalore"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pkg-start">Starting price *</Label>
              <Input
                id="pkg-start"
                type="number"
                min={0}
                step="1"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                placeholder="4599"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-orig">Original price</Label>
              <Input
                id="pkg-orig"
                type="number"
                min={0}
                step="1"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="Same as starting if empty"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pkg-discount">Discount label</Label>
            <Input
              id="pkg-discount"
              value={discountLabel}
              onChange={(e) => setDiscountLabel(e.target.value)}
              placeholder='e.g. Save ₹600'
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as "active" | "draft" | "archived")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pkg-images">Image URLs (optional)</Label>
            <Textarea
              id="pkg-images"
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              rows={2}
              placeholder={"One per line or comma-separated. Leave empty to use a default placeholder image."}
              className="font-mono text-xs"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create package
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
