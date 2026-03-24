# TravelVoo — Full UI Prompt (Detailed, Production-Grade)

> **Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion · Supabase · TanStack Query  
> **Architecture:** Multi-tenant SaaS. Every page scoped to a `tenant_id`. Public routes live under `src/app/(public)/`. All data comes from Supabase via typed client at `@/integrations/supabase/client`.

---

## 0. Global Design Tokens & Contexts

### CSS Variables (used everywhere via `hsl(var(--token))`)
| Token | Purpose |
|---|---|
| `--primary` | Brand accent (buttons, icons, active states) |
| `--primary-foreground` | Text on primary bg |
| `--background` | Page background |
| `--foreground` | Default text |
| `--card` / `--card-foreground` | Card surfaces |
| `--muted` / `--muted-foreground` | Input backgrounds, secondary text |
| `--border` | Dividers, outline inputs |
| `--savings` | Green savings badge color |
| `--destructive` | Error red |
| `--star-rating` | Star fill color |
| `--badge-orange/purple/pink/red` | Category badge colors |

### Global Contexts (wrap entire app in `AppProviders`)
```ts
// WishlistContext — persisted in localStorage
{ ids: string[], count: number, isWishlisted(id), toggleWishlist(id) }

// CurrencyContext
{ format(amount: number): string }  // e.g. "₹3,500"

// useSiteSettings() hook → Supabase table: site_settings
{ whatsapp_number, auto_generate_invoice, sticky_menu_enabled, ... }
```

---

## 1. LANDING PAGE

**Route:** `/` → `src/app/(public)/page.tsx`  
**Shell:** `PublicMaintenanceGate` wraps the entire public layout — if `site_settings.maintenance_mode = true`, show blurred overlay modal instead of content.

### 1.1 Sticky Header (`StickyHeader.tsx`)
```
[Logo / Brand Name]          [Nav Links]          [Currency Picker] [WhatsApp CTA]
```
- Transparent on top, becomes `bg-background/95 backdrop-blur-md` on scroll (`scrollY > 40`)
- Logo: fetched from `site_settings.logo_url`; fallback to text brand name
- Nav links: Home · Stays · Trips · Reels (configurable via `site_settings`)
- **Mobile:** Hidden; replaced by `StickyBottomNav`

### 1.2 Announcement Banner (`AnnouncementBanner.tsx`)
- Supabase: `SELECT message, is_active FROM announcements WHERE is_active = true LIMIT 1`
- Renders a full-width marquee/banner above hero only when active
- Dismissable (stores dismissed state in `sessionStorage`)

### 1.3 Hero Banner (`HeroBanner.tsx`)
```
Supabase table: banners
  WHERE type = 'hero' AND is_active = true
  ORDER BY sort_order ASC

Slide shape: { id, image_url, title, subtitle, cta_text, cta_link }
Fallback: 3 static local images (hero-1.jpg, hero-2.jpg, hero-3.jpg)
```
**Layout:**
- Mobile: `h-[220px]`, `px-4` inset, `rounded-2xl`, `shadow-card`
- Desktop: `h-[400px]–[480px]`, full-bleed, no border radius
- Auto-cycles every **4 seconds** via `setInterval`
- Touch swipe support: `onTouchStart` / `onTouchEnd` (threshold 50px)
- Keyboard: left/right arrow keys
- Bottom-left: `<h2>` title + subtitle + CTA button with `ChevronRight`
- Bottom-right: dot indicators (active dot widens to `w-5`)
- Transition: Framer Motion `AnimatePresence` with `opacity` fade (0.4s)

### 1.4 Search Bar (`SearchBar.tsx`)
```tsx
<SearchBar />  // sticky search pill below hero on mobile
```
- Input triggers AI search via `supabase.functions.invoke('ai-search', { query })`
- Debounced 400ms
- Shows filter chips, AI summary, and result list in a dropdown panel
- Voice search: `useVoiceSearch` hook → Web Speech API → auto-fills query

### 1.5 Category Tabs (`CategoryTabs.tsx`)
```
Supabase table: categories (or site_settings.category_tabs JSON)
Renders: [All] [Couples] [Family] [Budget] [Luxury] [Treehouse] …
```
- Horizontal scroll, `snap-x`
- Active tab = `bg-primary text-primary-foreground`
- Clicking a tab filters `StayCarousel` below

### 1.6 Stay Carousel (`StayCarousel.tsx` → renders `StayCard.tsx`)
```
Supabase table: stays
  SELECT id, stay_id, name, location, price, original_price,
         rating, reviews, images, category, badges
  WHERE tenant_id = <tenant>
  AND   is_active = true
  ORDER BY sort_order ASC
```
**StayCard anatomy:**
```
┌─────────────────────────────────────────┐
│  [Image Slider]              [♥ Wishlist]│
│  [Category Badge]                        │
│  [Dot indicators]                        │
├─────────────────────────────────────────┤
│  Stay Name (bold, truncate)              │
│  ⭐ 4.8  (312 reviews)                  │
│  📍 Wayanad, Kerala                      │
│  ~~₹4,500~~  From ₹3,200   [Book →]    │
└─────────────────────────────────────────┘
```
- Card width: `w-[220px] md:w-[300px]`
- Image auto-slides every `5000 + index * 700` ms (staggered)
- Swipe images on touch (threshold 40px)
- Wishlist button: `Heart` icon, `fill-primary` when wishlisted, animated scale pulse
- On card click → navigate to `/stay/[stay_id]`
- Book button → navigate to `/stay/[stay_id]` (not direct booking)

### 1.7 Promo Banners (`PromoBanners.tsx`)
```
Supabase table: banners WHERE type = 'promo' AND is_active = true
```
- Grid of promotional image cards with optional CTA link
- Admin sets image_url, title, link, sort_order

### 1.8 Best Features (`BestFeatures.tsx`)
- Static or CMS-driven section: "Why Book With Us?"
- 3-4 feature cards with icon + heading + description
- `site_settings.features_section` JSON array

### 1.9 Resort Stories / Reels Preview (`ResortStories.tsx`)
```
Supabase table: reels
  SELECT id, title, video_url, thumbnail_url
  WHERE is_active = true LIMIT 8
```
- Horizontal row of circular story bubbles
- Click opens fullscreen Reel player

### 1.10 Customer Reviews (`CustomerReviews.tsx`)
```
Supabase table: reviews
  SELECT guest_name, rating, comment, stay_name, created_at
  WHERE is_public = true ORDER BY created_at DESC LIMIT 12
```
- Horizontal scroll cards
- Star rating display, truncated comment, guest avatar initials

### 1.11 Near By Destinations (`NearbyDestinations.tsx`)
- Static card grid: "Explore Near By"
- Each destination card: image, location name, distance

### 1.12 Footer (`Footer.tsx`)
```
Supabase: site_settings.footer_links JSON
```
- Brand name + tagline
- Quick links: About · Contact · Privacy Policy · Terms
- Social icons: Instagram · WhatsApp · Facebook
- WhatsApp floating button (`FloatingWhatsApp.tsx`) — fixed bottom-right on desktop

---

## 2. STAY DETAIL PAGE

**Route:** `/stay/[id]` → `src/app/(public)/stay/[id]/page.tsx`  
**URL param:** `id` = either the DB `id` (UUID) or the public `stay_id` slug  
**Slug resolution:** Try `WHERE stay_id = param` first, fallback `WHERE id = param`

### 2.1 Data Fetching
```ts
// Primary query
const stay = await supabase
  .from('stays')
  .select(`
    id, stay_id, name, location, description, price, original_price,
    rating, reviews, images, category, badges, amenities,
    max_adults, max_children, max_pets,
    latitude, longitude,
    seo_title, seo_description,
    tenant_id
  `)
  .or(`stay_id.eq.${slug},id.eq.${slug}`)
  .single()

// Room categories
const rooms = await supabase
  .from('room_categories')
  .select('id, name, images, max_guests, available, amenities, price, original_price')
  .eq('stay_id', stay.id)

// Add-ons
const addons = await supabase
  .from('stay_addons')
  .select('id, name, price, optional')
  .eq('stay_id', stay.id)
  .order('sort_order')

// Active coupon
const coupon = await supabase
  .from('coupons')
  .select('code, type, value, label')
  .eq('stay_id', stay.id)
  .eq('active', true)
  .lte('starts_at', now)
  .gte('expires_at', now)
  .maybeSingle()
```

### 2.2 Page Layout (Mobile-First)

```
┌─────────────────────────────────────────┐
│  [Back Arrow]     Stay Name    [♥] [Share]│  ← Sticky top bar
├─────────────────────────────────────────┤
│  [Full-width Image Gallery]              │  h-[280px] md:h-[420px]
│  [Dot indicators]  [Photo counter N/M]   │
├─────────────────────────────────────────┤
│  Category Badge   ⭐ 4.8 (312 reviews)  │
│  Stay Name (h1, bold large)              │
│  📍 Location                             │
├─────────────────────────────────────────┤
│  [Amenities horizontal chips]            │
│  WiFi · Pool · AC · Parking · Bonfire…  │
├─────────────────────────────────────────┤
│  About                                   │
│  [Description text, expandable]          │
├─────────────────────────────────────────┤
│  [CouponBanner] — if active coupon       │
├─────────────────────────────────────────┤
│  Choose Your Room                        │
│  [RoomCategories horizontal scroll]      │
├─────────────────────────────────────────┤
│  Price & Booking sticky bottom bar       │
│  From ₹3,200/night   [Book Now →]       │
└─────────────────────────────────────────┘
```

### 2.3 Image Gallery
- Full-width swipeable gallery with `AnimatePresence`
- Tap image → open lightbox (fullscreen overlay with close X)
- `images[]` array from `stays.images` (Supabase storage URLs)
- `fetchPriority="high"` on first image for LCP
- Bottom overlay: gradient + stay name + location

### 2.4 Amenities
```tsx
// stays.amenities: string[] e.g. ["WiFi", "Pool", "AC", "Pet Friendly"]
<div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
  {amenities.map(a => <Chip key={a}>{a}</Chip>)}
</div>
```

### 2.5 Coupon Banner (`CouponBanner.tsx`)
```
Supabase: coupons WHERE stay_id = ? AND active = true
```
- Shows: "🏷 Use code SUMMER20 – Save ₹500"
- Tap to copy code to clipboard
- Auto-applies code when user opens BookingFormModal

### 2.6 Room Categories (`RoomCategories.tsx`)
Horizontal scroll cards. Each `RoomCard`:
```
┌───────────────────────────────┐
│ [Room Image slider]  [✓ sel] │  h-[120px]
│ [N left] badge               │  if available ≤ 2
├───────────────────────────────┤
│ Room Name            Selected │
│ 👥 Max 4  •  2 left           │
│ [amenity chip] [amenity chip] │
│ ~~₹4,500~~  ₹3,200 /night ✨ │
│ [+ Add Room] | [- 1  + count] │
└───────────────────────────────┘
```
- Card width: `min-w-[65%]` for horizontal peek
- Selected state: `border-savings bg-savings/5`, elevated shadow
- Quantity stepper appears on selection via AnimatePresence height animation

### 2.7 Sticky Booking Bar (bottom of detail page)
```
┌──────────────────────────────────────────┐
│  From ₹3,200/night        [Book Now →]  │
└──────────────────────────────────────────┘
```
- Fixed to bottom on mobile
- Pressing "Book Now" → opens `BookingFormModal` with preselected rooms

### 2.8 Nearby / Related Stays
- Below main content
- Query: `stays WHERE location ILIKE '%wayanad%' AND id != current_id LIMIT 4`
- Renders as `StayCard` horizontal scroll

---

## 3. BOOKING FORM MODAL (`BookingFormModal.tsx`)

**Trigger:** "Book Now" button on Stay Detail page  
**Component:** `<Dialog>` from shadcn, `max-w-[420px]`, `max-h-[90vh]`, scrollable  

### 3.1 Form State
```ts
// User inputs
name: string                    // required
phone: string                   // required, digits only
phoneCountryCode: string        // default from COUNTRY_CODES (e.g. "91")
email: string                   // optional, validated if provided
soloTraveller: boolean
groupBooking: boolean
groupName: string               // visible only if groupBooking
specialRequests: string         // visible only if groupBooking
guests: number                  // adults, default 2, min 1
children: number                // default 0
pets: number

// Dates
checkIn: Date | undefined
checkOut: Date | undefined
dateRanges: { checkIn: Date, checkOut: Date }[]   // supports multi-trip

// Rooms
roomSelections: RoomSelection[]
// RoomSelection: { name, price, originalPrice, count, selected }

// Add-ons
selectedAddOns: string[]        // add-on label names

// Coupon
couponCode: string
appliedCoupon: { code, type, value, max_discount, min_purchase, label } | null

// Pricing (computed)
roomTotal: number               // per-night calendar price × nights × room count
addOnTotal: number
subtotal: number
couponDiscount: number
grandTotal: number              // max(0, subtotal - couponDiscount)

// UI states
calendarExpanded: boolean
showConfirmation: boolean       // post-submit success screen
bookingId: string               // e.g. "#4821"
submitting: boolean
```

### 3.2 Form Sections (in order)
```
1.  Name field
2.  WhatsApp Number (country code picker + number input)
3.  Email (optional)
4.  [Solo Traveller] checkbox toggle
5.  [Group Booking] checkbox toggle
    └─ if group: Group Name + Special Requests textarea (animated height)
6.  Guests (Adults stepper, Children stepper) — hidden if soloTraveller
7.  Pets stepper
8.  BookingCalendar (date range picker)
    ├─ Shows unavailable/booked dates (from DB)
    ├─ Minimum nights enforcement
    ├─ Calendar price legend (₹/day from admin calendar)
    └─ "Add Date" button for multi-date bookings
9.  Date range chips (added dates, removable with ×)
10. Choose Rooms section (RoomCategories scroll)
11. Add-ons section (optional & mandatory separated)
12. Coupon input + Apply button
13. Price Breakdown:
    ├─ Rooms: ₹X × N nights × M rooms = ₹Y
    ├─ Add-ons: ₹Z
    ├─ Coupon: -₹D  (green)
    └─ Total: ₹G  (bold)
14. [Send Enquiry] primary button (full-width, 52px height)
```

### 3.3 Calendar & Pricing Logic (`useCalendarPricing`)
```ts
// Supabase tables consumed:
// calendar_pricing: { stay_id, room_category_id, date, price, min_nights }
// bookings: { stay_id, checkin, checkout, status }  → unavailable dates

// Price resolution order (per date per room):
// 1. Room-specific calendar override
// 2. Global (all-rooms) calendar override
// 3. room_categories.price (base)

// Cooldown: if last booking ended < cooldown_minutes ago → date blocked
```

### 3.4 Validation Rules
| Field | Rule |
|---|---|
| `name` | Required, non-empty |
| `phone` | Min digits per country (e.g. 10 for India) |
| `email` | Valid email format if provided |
| `rooms` | At least 1 room selected |
| `dates` | At least 1 date range added |
| `min_nights` | Each range must meet `calendar_pricing.min_nights` |

### 3.5 Submit Flow (`handleSubmit`)
```
1. Validate → show inline field errors if invalid
2. For each dateRange: check Supabase for booking overlaps
   → if conflict: show error banner, abort
3. Generate bookingId = "#XXXX" (random 4-digit)
4. Call Supabase RPC: create_booking_enquiry(...)
5. If site_settings.auto_generate_invoice → insert into invoices table
6. If coupon applied → call RPC: increment_coupon_usage(code)
7. Build WhatsApp message string with all booking details
8. Show confirmation screen (showConfirmation = true)
```

### 3.6 Confirmation Screen
```
┌────────────────────────────────────────┐
│  🎉  Booking Enquiry Sent!             │
│                                        │
│  Booking ID: #4821   [Copy]            │
│                                        │
│  [Open WhatsApp to Confirm →]          │
│                                        │
│  [Close]                               │
└────────────────────────────────────────┘
```
- Confetti animation via `ConfettiCelebration.tsx`
- WhatsApp URL: `https://wa.me/91XXXXXXXXXX?text={encoded_message}`
- Message includes: Booking ID, Stay name, Stay URL, Guest details, Dates, Rooms, Add-ons, Coupon, Total

---

## 4. WISHLIST PAGE

**Route:** `/wishlist` → `src/app/(public)/wishlist/page.tsx`

### 4.1 Data Source (`WishlistContext`)
```ts
// context/WishlistContext.tsx
// Persisted in localStorage key: "travelvoo_wishlist"
// Shape: string[] of stay IDs

const { ids, count, isWishlisted, toggleWishlist } = useWishlist();
```

### 4.2 Page Layout
```
Header: "Your Wishlist" + count badge

if (ids.length === 0):
  ┌────────────────────────────────────┐
  │   💔  No wishlisted stays yet      │
  │   [Explore Stays →]                │
  └────────────────────────────────────┘

else:
  Query: supabase.from('stays')
    .select('id, stay_id, name, location, price, original_price, rating, reviews, images, category')
    .in('id', ids)

  Renders: Responsive grid of StayCards
  ├─ Mobile: 1 column
  ├─ Tablet: 2 columns
  └─ Desktop: 3-4 columns

  Each card: same StayCard component with filled heart
  Removing from wishlist: animated exit (scale 0 + opacity 0)
```

### 4.3 Wishlist → Booking Flow
- From wishlist: tap card → go to Stay Detail → tap "Book Now" → opens BookingFormModal
- No direct booking from wishlist page

---

## 5. NAVIGATION SYSTEM

### 5.1 Sticky Bottom Nav (`StickyBottomNav.tsx`)
**Visible:** Mobile only (`md:hidden`), fixed bottom, `z-[80]`

```
┌──────────────────────────────────────────────────────┐
│  🏠 Home   🧭 Explore  ✨ AI  ♥ Wishlist  🎬 Reels  │
│                          ⬆️ elevated pill button      │
└──────────────────────────────────────────────────────┘
```

Config from `site_settings`:
```ts
sticky_menu_enabled: boolean
sticky_menu_show_ai: boolean
sticky_menu_show_wishlist: boolean
sticky_menu_show_explore: boolean
sticky_menu_show_reels: boolean
```

Tab → Route mapping:
```ts
"home"     → "/"
"explore"  → "/stays"
"ai"       → opens AI Search fullscreen modal (no route change)
"wishlist" → "/wishlist"  + badge showing count
"reels"    → "/reels"
```

AI Search Fullscreen (`searchOpen = true`):
```
┌──────────────────────────────────────────┐
│  [← Back]  [🔍 Search input ...]  [🎤]  │
│  ──────────────────────────────────────  │
│  [AI Summary bar if results]             │
│  [Filter chip badges]                    │
│  ──────────────────────────────────────  │
│  Result 1: [img] Name · Location · ₹    │
│  Result 2: [img] Name · Location · ₹    │
│  ...                                     │
│  ──────────────────────────────────────  │
│  Popular: [Couple Friendly] [Pool] ...   │
│  Try: "romantic stay with pool"          │
└──────────────────────────────────────────┘
```
Voice search: pulsing mic animation when `isListening`, audio waveform bars

### 5.2 Route Structure (all public pages)
```
/                     → Landing page
/stays                → All stays browse/filter
/stay/[id]            → Stay detail (id = stay_id slug or UUID)
/wishlist             → Saved stays
/reels                → Vertical video reels (TikTok-style)
/category/[slug]      → Category filtered stays
/trips                → Trip packages listing
/trip/[id]            → Trip detail
/login                → Auth
/create-account       → Registration
/privacy-policy       → Legal
/terms-of-service     → Legal
```

---

## 6. DATA SCHEMA QUICK REFERENCE

### Supabase Tables Used by Public Pages
| Table | Key Columns | Used By |
|---|---|---|
| `stays` | `id, stay_id, name, location, price, original_price, rating, reviews, images[], amenities[], category, max_adults, max_children, max_pets, tenant_id, is_active` | All pages |
| `room_categories` | `id, stay_id, name, images[], price, original_price, max_guests, available, amenities[]` | Stay Detail, Booking |
| `stay_addons` | `id, stay_id, name, price, optional, sort_order` | Booking Form |
| `banners` | `id, type, title, subtitle, cta_text, cta_link, image_url, sort_order, is_active` | Landing Hero, Promos |
| `coupons` | `code, type, value, max_discount, min_purchase, active, starts_at, expires_at, usage_limit, usage_count, stay_id` | Booking Form |
| `bookings` | `booking_id, stay_id, guest_name, phone, email, checkin, checkout, rooms[], addons[], total_price, status, adults, children, pets` | Booking Submit, Calendar |
| `calendar_pricing` | `stay_id, room_category_id, date, price, min_nights` | Booking Calendar |
| `reels` | `id, title, video_url, thumbnail_url, stay_id, is_active` | Reels, Stories |
| `reviews` | `stay_id, guest_name, rating, comment, is_public, created_at` | Landing Reviews |
| `site_settings` | `logo_url, whatsapp_number, maintenance_mode, sticky_menu_*`, `footer_links`, `auto_generate_invoice` | Global |
| `invoices` | `invoice_id, booking_id, guest_name, stay_id, rooms[], total_price, payment_status` | Post-booking |
| `announcements` | `message, is_active` | Top banner |

### Key Supabase Functions (RPC)
```sql
create_booking_enquiry(p_booking_id, p_guest_name, p_phone, p_email, 
  p_stay_id, p_checkin, p_checkout, p_rooms, p_addons, 
  p_total_price, p_coupon_code, p_special_requests,
  p_adults, p_children, p_pets, p_solo_traveller, p_group_booking, p_group_name)

increment_coupon_usage(coupon_code_input)
```

### Supabase Edge Functions
```
ai-search: { query: string } → { stays[], filters[], summary }
```

---

## 7. ANIMATION CONVENTIONS (Framer Motion)

```ts
// Fade in on scroll (used on StayCard, sections)
initial={{ opacity: 0, y: 16 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ delay: index * 0.05 }}

// Modal open/close
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.95 }}

// Expand/collapse (form fields, banners)
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: "auto" }}
exit={{ opacity: 0, height: 0 }}

// Image slide in carousel
animate={{ x: `${(i - current) * 100}%` }}
transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
```

**Always wrap conditional renders in `<AnimatePresence>`.**  
**Always use `useReducedMotion()` guard for a11y.**

---

## 8. COMPONENT FILE MAP

```
src/
├── app/(public)/
│   ├── page.tsx                    ← Landing page
│   ├── stay/[id]/page.tsx          ← Stay detail
│   ├── stays/page.tsx              ← Browse all stays
│   ├── wishlist/page.tsx           ← Wishlist
│   ├── reels/page.tsx              ← Reels
│   └── layout.tsx                  ← PublicMaintenanceGate wrapper
│
├── components/
│   ├── HeroBanner.tsx
│   ├── StayCard.tsx
│   ├── StayCarousel.tsx
│   ├── BookingFormModal.tsx        ← Booking form (giant, ~1300 lines)
│   ├── BookingCalendar.tsx         ← Date picker with pricing overlay
│   ├── RoomCategories.tsx          ← Room selection UI
│   ├── StickyBottomNav.tsx         ← Mobile bottom nav + AI search
│   ├── StickyHeader.tsx
│   ├── SearchBar.tsx
│   ├── CategoryTabs.tsx
│   ├── CouponBanner.tsx
│   ├── PromoBanners.tsx
│   ├── CustomerReviews.tsx
│   ├── ResortStories.tsx
│   ├── ResortReels.tsx
│   ├── NearbyDestinations.tsx
│   ├── BestFeatures.tsx
│   ├── Footer.tsx
│   ├── FloatingWhatsApp.tsx
│   ├── AnnouncementBanner.tsx
│   ├── MaintenancePage.tsx         ← Overlay modal for maintenance mode
│   ├── PublicMaintenanceGate.tsx
│   └── ConfettiCelebration.tsx
│
├── context/
│   ├── WishlistContext.tsx
│   └── CurrencyContext.tsx
│
├── hooks/
│   ├── useCalendarPricing.ts       ← Real-time calendar + unavailable dates
│   ├── useSiteSettings.ts
│   ├── useVoiceSearch.ts
│   └── useReels.ts
│
└── lib/
    ├── stayPublicUrl.ts            ← stayPublicPath(stay), stayPathFromIds(stay)
    ├── countryCodes.ts
    └── utils.ts                    ← cn() helper
```

---

## 9. KEY PATTERNS TO FOLLOW

1. **Multi-tenant isolation:** Always filter by `tenant_id` in all Supabase queries on server. On client, Supabase RLS enforces this automatically.

2. **Slug resolution for Stay:** `stayPublicPath(stay)` returns `/stay/${stay.stay_id || stay.id}`. Always use this helper, never hardcode.

3. **Price display:** Always use `const { format } = useCurrency()` → `format(amount)`. Never use raw `₹` string.

4. **Wishlist persistence:** `localStorage` key `travelvoo_wishlist`. `WishlistContext` hydrates on mount.

5. **Error boundaries:** Wrap SPA page sections in `<ErrorBoundary>` with friendly fallback.

6. **Image priority:** First image in any gallery/slider → `fetchPriority="high"` or `loading="eager"`. Rest → `loading="lazy"`.

7. **Mobile touch targets:** All interactive elements min `44×44px` (use `min-h-[44px]`).

8. **Booking ID format:** `#` + 4-digit random number. Generated client-side only for display; actual DB `id` is UUID.
