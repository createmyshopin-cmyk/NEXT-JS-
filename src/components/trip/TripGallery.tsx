"use client";

import { Fragment, useState, useEffect, useRef, useCallback } from "react";
import { Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface TripGalleryProps {
  images: string[];
  name: string;
}

export default function TripGallery({ images, name }: TripGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lightboxApi, setLightboxApi] = useState<CarouselApi>();
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const count = images.length;
  const loop = count > 1;

  /** Highlight the step most visible in the horizontal timeline strip. */
  const rebindTimelineObserver = useCallback(() => {
    const root = scrollRef.current;
    if (!root || count === 0) return;

    const tiles = root.querySelectorAll("[data-timeline-tile]");
    if (tiles.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio > 0)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const best = visible[0];
        if (best?.target instanceof HTMLElement) {
          const idx = Number(best.target.dataset.index);
          if (!Number.isNaN(idx)) setActiveIndex(idx);
        }
      },
      {
        root,
        rootMargin: "0px -12% 0px -12%",
        threshold: [0.2, 0.35, 0.5, 0.65, 0.8],
      }
    );

    tiles.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [count]);

  useEffect(() => {
    const cleanup = rebindTimelineObserver();
    return cleanup;
  }, [rebindTimelineObserver, images]);

  useEffect(() => {
    if (!lightboxApi) return;
    const onSelect = () => setLightboxIndex(lightboxApi.selectedScrollSnap());
    setLightboxIndex(lightboxApi.selectedScrollSnap());
    lightboxApi.on("select", onSelect);
    return () => {
      lightboxApi.off("select", onSelect);
    };
  }, [lightboxApi]);

  useEffect(() => {
    if (!lightboxOpen || !lightboxApi) return;
    const id = requestAnimationFrame(() => {
      lightboxApi.scrollTo(lightboxStartIndex, true);
    });
    return () => cancelAnimationFrame(id);
  }, [lightboxOpen, lightboxApi, lightboxStartIndex]);

  const openLightbox = (index: number) => {
    setLightboxStartIndex(index);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const scrollToIndex = (i: number) => {
    const root = scrollRef.current;
    const tile = root?.querySelector<HTMLElement>(`[data-timeline-tile][data-index="${i}"]`);
    tile?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  if (count === 0) return null;

  const navBtnClass =
    "border-0 bg-background/90 text-foreground shadow-md backdrop-blur-sm hover:bg-background disabled:opacity-40";

  return (
    <section className="w-full overflow-hidden" aria-label={`${name} photo gallery`}>
      <div className="relative mx-auto max-w-7xl">
        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Gallery
        </p>

        <div className="relative">
          {/* Edge fades — hint that the row scrolls */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent sm:w-12"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent sm:w-12"
            aria-hidden
          />

          <div
            ref={scrollRef}
            className={cn(
              "flex w-full overflow-x-auto overflow-y-visible overscroll-x-contain scroll-smooth",
              "snap-x snap-mandatory [-webkit-overflow-scrolling:touch]",
              "px-4 pb-3 pt-1"
            )}
            tabIndex={0}
            role="region"
            aria-roledescription="timeline"
            aria-label={`Scroll horizontally through ${count} photos. Photo ${activeIndex + 1} is most visible.`}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                scrollToIndex(Math.min(count - 1, activeIndex + 1));
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                scrollToIndex(Math.max(0, activeIndex - 1));
              }
            }}
          >
            <div className="flex w-max min-w-0 items-start gap-0 pr-2 sm:pr-6">
              {images.map((img, i) => (
                <Fragment key={`timeline-${i}`}>
                  {i > 0 ? (
                    <div
                      aria-hidden
                      className="mt-[15px] h-0.5 w-2 shrink-0 rounded-full bg-gradient-to-r from-primary/45 to-border sm:mt-[15px] sm:w-3 md:w-5"
                    />
                  ) : null}

                  <div
                    data-timeline-tile
                    data-index={i}
                    className={cn(
                      "flex w-[min(76vw,17.5rem)] shrink-0 snap-center flex-col items-center px-1.5 sm:w-56 sm:px-2 md:w-60 lg:w-64"
                    )}
                  >
                    {/* Step node */}
                    <div
                      className={cn(
                        "relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold shadow-sm transition-all duration-300 sm:h-9 sm:w-9",
                        activeIndex === i
                          ? "scale-110 border-primary bg-primary text-primary-foreground ring-4 ring-primary/15"
                          : "border-border/90 bg-card text-muted-foreground ring-0"
                      )}
                    >
                      {i + 1}
                    </div>

                    {/* Vertical stem: timeline down to the photo */}
                    <div
                      aria-hidden
                      className={cn(
                        "my-1 h-2.5 w-px shrink-0 rounded-full sm:my-1.5 sm:h-3",
                        activeIndex === i ? "bg-primary/75" : "bg-border"
                      )}
                    />

                    <button
                      type="button"
                      onClick={() => openLightbox(i)}
                      className="group relative w-full overflow-hidden rounded-xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`View larger: ${name} photo ${i + 1} of ${count}`}
                    >
                      <div className="relative aspect-[5/4] w-full overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-sm">
                        <img
                          src={img}
                          alt={`${name} — ${i + 1} of ${count}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] group-active:scale-[0.99]"
                          draggable={false}
                        />
                        <span
                          className="pointer-events-none absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                          aria-hidden
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </button>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>

          {loop ? (
            <div className="flex justify-center gap-1.5 px-4 pb-1" role="tablist" aria-label="Jump to photo">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === activeIndex}
                  aria-label={`Go to photo ${i + 1}`}
                  onClick={() => scrollToIndex(i)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-200 touch-manipulation",
                    i === activeIndex
                      ? "w-6 bg-primary"
                      : "w-2 bg-muted-foreground/35 hover:bg-muted-foreground/55"
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <Dialog
        open={lightboxOpen}
        onOpenChange={(open) => {
          setLightboxOpen(open);
          if (!open) setLightboxStartIndex(0);
        }}
      >
        <DialogContent
          className={cn(
            "fixed inset-0 left-0 top-0 z-50 flex h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 border-0 bg-black/95 p-0 shadow-none sm:rounded-none",
            "[&>button]:right-3 [&>button]:top-[max(0.75rem,env(safe-area-inset-top))] [&>button]:text-white [&>button]:hover:bg-white/10 [&>button]:hover:text-white"
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">
            {name} — photo {lightboxIndex + 1} of {count}
          </DialogTitle>

          <div className="flex min-h-[min(100dvh,100svh)] flex-col justify-center px-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10 sm:px-6 sm:pt-12">
            <Carousel
              setApi={setLightboxApi}
              opts={{
                align: "center",
                loop,
              }}
              className="w-full"
            >
              <CarouselContent>
                {images.map((img, i) => (
                  <CarouselItem key={`lb-${img}-${i}`} className="basis-full">
                    <div className="flex min-h-[50dvh] items-center justify-center px-1 sm:min-h-[60dvh]">
                      <img
                        src={img}
                        alt={`${name} — ${i + 1} of ${count}`}
                        className="max-h-[min(78dvh,78svh)] w-auto max-w-full object-contain"
                        draggable={false}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {loop ? (
                <>
                  <CarouselPrevious
                    className={cn(
                      navBtnClass,
                      "left-1 top-1/2 h-10 w-10 -translate-y-1/2 text-foreground sm:left-3 sm:h-11 sm:w-11"
                    )}
                  />
                  <CarouselNext
                    className={cn(
                      navBtnClass,
                      "right-1 top-1/2 h-10 w-10 -translate-y-1/2 text-foreground sm:right-3 sm:h-11 sm:w-11"
                    )}
                  />
                </>
              ) : null}
            </Carousel>

            <p className="mt-3 text-center text-xs font-medium text-white/80">
              {lightboxIndex + 1} / {count}
              <span className="mx-2 text-white/40">·</span>
              <span className="text-white/60">Swipe or use arrows</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
