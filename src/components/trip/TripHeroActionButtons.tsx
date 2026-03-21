"use client";

import { Download, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

export type TripHeroActionButtonsProps = {
  onGetItinerary: () => void;
  onBookNow: () => void;
  /** Hero row (natural width) vs sticky bar (equal flex columns, touch targets). */
  variant?: "hero" | "sticky";
  className?: string;
};

export function TripHeroActionButtons({
  onGetItinerary,
  onBookNow,
  variant = "hero",
  className,
}: TripHeroActionButtonsProps) {
  const outlineClass =
    "inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary font-semibold text-primary transition-colors hover:bg-primary/5 touch-manipulation";
  const solidClass =
    "inline-flex items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90 touch-manipulation";

  if (variant === "sticky") {
    return (
      <div className={cn("flex w-full items-stretch gap-2 sm:gap-3", className)}>
        <button
          type="button"
          onClick={onGetItinerary}
          className={cn(outlineClass, "min-h-12 flex-1 px-3 py-2.5 text-sm sm:min-h-11 sm:px-4")}
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          Get Itinerary
        </button>
        <button
          type="button"
          onClick={onBookNow}
          className={cn(solidClass, "min-h-12 flex-1 px-3 py-2.5 text-sm sm:min-h-11 sm:px-4")}
        >
          <Ticket className="h-4 w-4 shrink-0" aria-hidden />
          Book Now
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <button
        type="button"
        onClick={onGetItinerary}
        className={cn(outlineClass, "px-5 py-2.5 text-sm")}
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden />
        Get Itinerary
      </button>
      <button type="button" onClick={onBookNow} className={cn(solidClass, "px-5 py-2.5 text-sm")}>
        <Ticket className="h-4 w-4 shrink-0" aria-hidden />
        Book Now
      </button>
    </div>
  );
}
