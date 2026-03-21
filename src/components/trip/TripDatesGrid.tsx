import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/context/CurrencyContext";
import type { TripDate } from "@/types/trip";

interface TripDatesGridProps {
  dates: TripDate[];
  /** Opens booking with this date batch pre-selected (e.g. tap “Starting price”). */
  onBookDate?: (date: TripDate) => void;
}

const statusConfig: Record<
  TripDate["status"],
  { label: string; badge: string }
> = {
  available: {
    label: "Available",
    badge:
      "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800/60",
  },
  few_left: {
    label: "Few left",
    badge:
      "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/50",
  },
  sold_out: {
    label: "Sold out",
    badge:
      "bg-rose-50 text-rose-800 ring-1 ring-rose-200/80 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-800/50",
  },
};

export default function TripDatesGrid({ dates, onBookDate }: TripDatesGridProps) {
  const { format: fmt } = useCurrency();

  if (dates.length === 0) {
    return <p className="text-sm text-muted-foreground">No upcoming dates available.</p>;
  }

  return (
    <div className="w-full">
      <h2 className="mb-5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">Dates</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dates.map((d) => {
          const cfg = statusConfig[d.status] ?? statusConfig.available;
          const soldOut = d.status === "sold_out";
          return (
            <div
              key={d.id}
              className={cn(
                "flex min-h-[168px] flex-col rounded-xl border border-border/90 bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
                soldOut && "opacity-65"
              )}
            >
              <span
                className={cn(
                  "inline-flex w-fit shrink-0 items-center rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  cfg.badge
                )}
              >
                {cfg.label}
              </span>

              <p
                className={cn(
                  "my-4 flex flex-1 items-center justify-center px-1 text-center text-sm font-bold leading-snug text-foreground sm:text-[15px]",
                  soldOut && "line-through decoration-2 decoration-muted-foreground/50"
                )}
              >
                {format(parseISO(d.startDate), "EEE MMM dd yyyy")}
                <span className="mx-1.5 font-normal text-muted-foreground">–</span>
                {format(parseISO(d.endDate), "EEE MMM dd yyyy")}
              </p>

              {soldOut || !onBookDate ? (
                <div
                  className={cn(
                    "mt-auto w-full rounded-lg border-2 border-violet-200 bg-violet-50/40 px-3 py-2.5 text-center dark:border-violet-500/35 dark:bg-violet-950/25",
                    soldOut && "border-border bg-muted/30 dark:bg-muted/20"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-semibold text-violet-700 dark:text-violet-300",
                      soldOut && "text-muted-foreground line-through"
                    )}
                  >
                    Starting Price: {fmt(d.price)} /-
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onBookDate(d)}
                  className={cn(
                    "mt-auto w-full rounded-lg border-2 border-violet-200 bg-violet-50/40 px-3 py-2.5 text-center transition-colors",
                    "hover:border-violet-400 hover:bg-violet-100/70 active:scale-[0.99]",
                    "dark:border-violet-500/35 dark:bg-violet-950/25 dark:hover:border-violet-400/50 dark:hover:bg-violet-950/40",
                    "touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
                  )}
                >
                  <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                    Starting Price: {fmt(d.price)} /-
                  </span>
                  <span className="mt-1 block text-[11px] font-medium text-violet-600/90 dark:text-violet-300/80">
                    Tap to book
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
