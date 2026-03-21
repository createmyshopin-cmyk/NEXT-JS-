import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTripDetail } from "@/hooks/useTrips";
import TripHero from "@/components/trip/TripHero";
import TripGallery from "@/components/trip/TripGallery";
import TripTabs from "@/components/trip/TripTabs";
import TripSidebar from "@/components/trip/TripSidebar";
import TripVideos from "@/components/trip/TripVideos";
import TripReviews from "@/components/trip/TripReviews";
import TripCancellationPolicy from "@/components/trip/TripCancellationPolicy";
import TripCTA from "@/components/trip/TripCTA";
import TripEnquiryModal from "@/components/trip/TripEnquiryModal";
import TripBookingModal from "@/components/trip/TripBookingModal";
import { TripHeroActionButtons } from "@/components/trip/TripHeroActionButtons";
import StickyHeader from "@/components/StickyHeader";
import Footer from "@/components/Footer";

const TripDetails = () => {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { trip, itineraryDays, dates, inclusions, otherInfo, videos, reviews, loading } =
    useTripDetail(slug);

  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingInitialDateId, setBookingInitialDateId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <StickyHeader />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <StickyHeader />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Trip not found</h1>
          <p className="text-muted-foreground mb-6">
            The trip you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/trips")}
            className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Browse Trips
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const scrollToSidebar = () => {
    const el = document.getElementById("trip-sidebar");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
      <StickyHeader />

      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <TripHero
        trip={trip}
        dates={dates}
        onGetItinerary={() => setEnquiryOpen(true)}
        onBookNow={() => {
          setBookingInitialDateId(null);
          setBookingOpen(true);
        }}
      />

      <TripGallery images={trip.images} name={trip.name} />

      {/* Two-column layout: content + sticky sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Content column */}
          <div className="flex-1 min-w-0">
            <TripTabs
              days={itineraryDays}
              dates={dates}
              inclusions={inclusions}
              otherInfo={otherInfo}
              customTabs={trip.customTabs}
              onBookFromDates={(d) => {
                setBookingInitialDateId(d.id);
                setBookingOpen(true);
              }}
            />
          </div>

          {/* Sidebar column */}
          <div className="w-full lg:w-[380px] shrink-0" id="trip-sidebar">
            <TripSidebar trip={trip} />
          </div>
        </div>
      </div>

      <TripVideos videos={videos} />

      <TripReviews reviews={reviews} />

      <TripCancellationPolicy policy={trip.cancellationPolicy} />

      <TripCTA
        heading={trip.ctaHeading}
        subheading={trip.ctaSubheading}
        imageUrl={trip.ctaImageUrl}
        onCallback={scrollToSidebar}
      />

      <TripBookingModal
        open={bookingOpen}
        onOpenChange={(open) => {
          setBookingOpen(open);
          if (!open) setBookingInitialDateId(null);
        }}
        trip={trip}
        dates={dates}
        initialTripDateId={bookingInitialDateId}
      />

      <TripEnquiryModal
        open={enquiryOpen}
        onOpenChange={setEnquiryOpen}
        tripName={trip.name}
      />

      {/* Mobile & tablet: sticky CTA bar (hidden on lg+ where hero buttons show) */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-background/90 dark:shadow-[0_-8px_30px_rgba(0,0,0,0.35) lg:hidden"
        role="navigation"
        aria-label="Trip booking actions"
      >
        <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-4 sm:pt-3">
          <TripHeroActionButtons
            variant="sticky"
            onGetItinerary={() => setEnquiryOpen(true)}
            onBookNow={() => {
              setBookingInitialDateId(null);
              setBookingOpen(true);
            }}
          />
        </div>
        <div
          className="h-[max(0.5rem,env(safe-area-inset-bottom))] shrink-0 sm:h-[max(0.75rem,env(safe-area-inset-bottom))]"
          aria-hidden
        />
      </div>

      <Footer />
    </div>
  );
};

export default TripDetails;
