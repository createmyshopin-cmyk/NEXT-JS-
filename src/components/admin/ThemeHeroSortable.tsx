"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroBanner } from "./theme-editor-hero-types";

function SortableHeroRow({
  banner,
  onEdit,
  onDelete,
  disabled,
}: {
  banner: HeroBanner;
  onEdit: (b: HeroBanner) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: banner.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border overflow-hidden flex gap-0 bg-card",
        !banner.is_active && "opacity-50",
        isDragging && "opacity-40 ring-2 ring-primary/30 z-10"
      )}
    >
      <button
        type="button"
        className={cn(
          "shrink-0 w-10 flex items-center justify-center border-r bg-muted/40 text-muted-foreground hover:bg-muted/70 cursor-grab active:cursor-grabbing",
          disabled && "pointer-events-none opacity-50"
        )}
        aria-label={`Drag to reorder slide: ${banner.title || "Untitled"}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex flex-1 min-w-0 flex-col sm:flex-row">
        <div className="relative h-24 sm:h-auto sm:w-32 shrink-0 bg-muted">
          {banner.image_url ? (
            <img src={banner.image_url} alt="" className="w-full h-full object-cover sm:min-h-[88px]" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-xs px-2 text-center">No image</div>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col gap-2 min-w-0">
          <p className="font-medium text-sm line-clamp-2">{banner.title || "Untitled"}</p>
          <div className="flex gap-1 mt-auto">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(banner)} type="button">
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => onDelete(banner.id)} type="button">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroRowStatic({
  banner,
  onEdit,
  onDelete,
}: {
  banner: HeroBanner;
  onEdit: (b: HeroBanner) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden flex gap-0 bg-card shadow-lg",
        !banner.is_active && "opacity-50"
      )}
    >
      <div className="shrink-0 w-10 flex items-center justify-center border-r bg-muted/40">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex flex-1 min-w-0 flex-col sm:flex-row">
        <div className="relative h-24 sm:h-auto sm:w-32 shrink-0 bg-muted">
          {banner.image_url ? (
            <img src={banner.image_url} alt="" className="w-full h-full object-cover sm:min-h-[88px]" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-xs px-2 text-center">No image</div>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col gap-2 min-w-0">
          <p className="font-medium text-sm line-clamp-2">{banner.title || "Untitled"}</p>
          <div className="flex gap-1 mt-auto">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(banner)} type="button">
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => onDelete(banner.id)} type="button">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type Props = {
  banners: HeroBanner[];
  reordering: boolean;
  reorderHeroBanners: (activeId: string, overId: string | null) => void | Promise<void>;
  openEdit: (b: HeroBanner) => void;
  setDeleteId: (id: string | null) => void;
};

export function ThemeHeroSortable({
  banners,
  reordering,
  reorderHeroBanners,
  openEdit,
  setDeleteId,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = useMemo(() => banners.map((b) => b.id), [banners]);

  const activeBanner = useMemo(
    () => (activeId ? banners.find((b) => b.id === activeId) : null),
    [activeId, banners]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    void reorderHeroBanners(String(active.id), String(over.id));
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy} disabled={reordering}>
        <div className={cn("flex flex-col gap-3", reordering && "pointer-events-none opacity-70")}>
          {banners.map((b) => (
            <SortableHeroRow
              key={b.id}
              banner={b}
              onEdit={openEdit}
              onDelete={setDeleteId}
              disabled={reordering}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeBanner ? <HeroRowStatic banner={activeBanner} onEdit={openEdit} onDelete={setDeleteId} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
