-- Demo stays (60) + room_categories (3 tiers per stay = 180 rows for full demo) for demo@demo.com — no banners.
-- Images use HTTPS placeholder URLs (picsum.photos seed = stable per image).
-- Home page carousels use exact category labels from Index.tsx.
-- Stay detail pages: room_categories, longer descriptions, approved reviews, nearby_destinations, stay_reels (see useStayDetail).
--
-- Prerequisites: tenant for demo@demo.com (manual_link_demo_tenant_demo_at_demo_com.sql).
-- Idempotent: inserts demo-001..060 when demo-001 missing; if demo-030 exists but not demo-031, inserts 031..060;
--             if demo-015 exists but not demo-016, inserts 016..060; room categories for any demo stay with no rows yet;
--             then per-stay detail copy, reviews, nearby rows, one reel each (skipped if already present).
--
-- Run in Supabase SQL Editor after seed_demo_tenant_full_options.sql (order optional).

DO $$
DECLARE
  tid uuid;
  room_ins bigint;
BEGIN
  SELECT t.id INTO tid
  FROM public.tenants t
  WHERE lower(t.email) = lower('demo@demo.com')
  LIMIT 1;

  IF tid IS NULL THEN
    RAISE EXCEPTION 'No tenant for demo@demo.com. Run supabase/manual_link_demo_tenant_demo_at_demo_com.sql first.';
  END IF;

  ---------------------------------------------------------------------------
  -- Stays: 60 active properties (full seed when demo-001 not present)
  ---------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stays' AND column_name = 'tenant_id')
     AND NOT EXISTS (SELECT 1 FROM public.stays s WHERE s.tenant_id = tid AND s.stay_id = 'demo-001') THEN
    INSERT INTO public.stays (
      tenant_id,
      stay_id,
      name,
      location,
      category,
      description,
      price,
      original_price,
      rating,
      reviews_count,
      amenities,
      images,
      status,
      cooldown_minutes
    ) VALUES
      (tid, 'demo-001', 'Misty Peaks Cottage', 'Wayanad, Kerala', 'Couple Friendly',
       'Private deck, mountain views, and fireplace. Perfect for two.', 6499, 7999, 4.8, 124,
       ARRAY['WiFi', 'Breakfast', 'Parking', 'Mountain view']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800', 'https://picsum.photos/seed/demo-gallery-2/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-002', 'Lagoon Hideaway', 'Alleppey, Kerala', 'Couple Friendly',
       'Overwater-inspired suite with canoe breakfast.', 8999, 10999, 4.7, 89,
       ARRAY['WiFi', 'Lake access', 'AC', 'Room service']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-003', 'Candlelight Cabin', 'Munnar, Kerala', 'Couple Friendly',
       'Forest-edge cabin with stargazing roof.', 5499, 6999, 4.6, 56,
       ARRAY['WiFi', 'Fireplace', 'Tea estate walk']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800', 'https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-004', 'Family Fun Resort', 'Ooty, Tamil Nadu', 'Family Stay',
       'Kids club, game room, and interconnecting rooms.', 7999, 9999, 4.5, 210,
       ARRAY['WiFi', 'Pool', 'Kids play', 'Restaurant']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-005', 'Beachside Bungalow', 'Varkala, Kerala', 'Family Stay',
       'Sleeps six — kitchenette and lawn games.', 6999, 8499, 4.4, 98,
       ARRAY['WiFi', 'Beach access', 'Kitchenette']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800', 'https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-006', 'Hillside Family Suites', 'Coorg, Karnataka', 'Family Stay',
       'Two-bedroom suites with jungle safari desk.', 7499, 9200, 4.6, 76,
       ARRAY['WiFi', 'Safari desk', 'Breakfast']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-007', 'Royal Palm Villa', 'Udaipur, Rajasthan', 'Luxury Resort',
       'Butler service, private pool, palace views.', 24999, 29999, 4.9, 312,
       ARRAY['WiFi', 'Private pool', 'Butler', 'Spa']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-2/1200/800', 'https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-008', 'Cliff Infinity Resort', 'Vagator, Goa', 'Luxury Resort',
       'Ocean-facing infinity pool and chef''s table.', 18999, 22999, 4.8, 201,
       ARRAY['WiFi', 'Infinity pool', 'Fine dining']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-009', 'Tea Estate Manor', 'Darjeeling, WB', 'Luxury Resort',
       'Heritage suites with estate tours and tasting.', 15999, 18999, 4.7, 167,
       ARRAY['WiFi', 'Heritage tour', 'Tea tasting']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-5/1200/800', 'https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-010', 'Backpacker Hub', 'Fort Kochi, Kerala', 'Budget Rooms',
       'Clean dorms and private rooms near cafes.', 1299, 1599, 4.2, 445,
       ARRAY['WiFi', 'Shared kitchen', 'Lockers']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-011', 'City Express Inn', 'Bangalore, Karnataka', 'Budget Rooms',
       'Metro-near, compact rooms with hot shower.', 1999, 2499, 4.3, 892,
       ARRAY['WiFi', 'AC', '24h desk']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-012', 'Azure Pool Villa', 'North Goa', 'Pool Villas',
       'Private plunge pool and outdoor shower.', 12999, 15499, 4.8, 143,
       ARRAY['WiFi', 'Private pool', 'Garden']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800', 'https://picsum.photos/seed/demo-gallery-2/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-013', 'Palm Lagoon Villa', 'Kumarakom, Kerala', 'Pool Villas',
       'Lagoon-edge pool and kayak at sunrise.', 11999, 13999, 4.7, 98,
       ARRAY['WiFi', 'Kayaks', 'Pool']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-014', 'Canopy Tree House', 'Wayanad, Kerala', 'Tree Houses',
       'Elevated deck among teak trees — birdsong mornings.', 8999, 10999, 4.6, 67,
       ARRAY['WiFi', 'Breakfast', 'Nature walk']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800', 'https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-015', 'Sky Nest Tree Lodge', 'Sakleshpur, Karnataka', 'Tree Houses',
       'Glass-front tree pod with valley sunrise.', 9499, 11499, 4.7, 54,
       ARRAY['WiFi', 'Balcony', 'Bonfire night']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-016', 'Sunset Cliff Suite', 'Kovalam, Kerala', 'Couple Friendly',
       'Rooftop lounge and lighthouse views — couples only wing.', 7299, 8999, 4.7, 91,
       ARRAY['WiFi', 'Sea view', 'Breakfast']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800', 'https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-017', 'Mangrove Kayak Retreat', 'Chidambaram, TN', 'Couple Friendly',
       'Quiet mangrove-facing rooms with guided kayak dusk tours.', 6599, 7999, 4.5, 48,
       ARRAY['WiFi', 'Kayak', 'Veg meals']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-018', 'Heritage Haveli Room', 'Jaipur, Rajasthan', 'Couple Friendly',
       'Courtyard suite with folk music evenings.', 8199, 9999, 4.8, 203,
       ARRAY['WiFi', 'Heritage walk', 'Rooftop dining']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-2/1200/800', 'https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-019', 'Splash Kids Water Park Inn', 'Mahabalipuram, TN', 'Family Stay',
       'Water slides on-site and family buffet — interconnecting rooms.', 8999, 10999, 4.4, 312,
       ARRAY['WiFi', 'Water park', 'Kids buffet']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-020', 'Lakeview Caravan Park', 'Pondicherry', 'Family Stay',
       'Cottages around a lawn — cycling and board games included.', 6299, 7699, 4.3, 156,
       ARRAY['WiFi', 'Cycles', 'Garden']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-5/1200/800', 'https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-021', 'Snowline Family Chalet', 'Manali, HP', 'Family Stay',
       'Heated floors, sled hire, and hot chocolate bar.', 11299, 13499, 4.6, 178,
       ARRAY['WiFi', 'Heating', 'Sled desk']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-022', 'Marble Palace Suite', 'Jodhpur, Rajasthan', 'Luxury Resort',
       'Blue-city views, thali tasting menu, and spa credits.', 21999, 25999, 4.9, 241,
       ARRAY['WiFi', 'Spa', 'Fine dining']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-8/1200/800', 'https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-023', 'Backwater Royal Barge', 'Kuttanad, Kerala', 'Luxury Resort',
       'Two-night slow cruise with private chef on select dates.', 27999, 32999, 4.8, 88,
       ARRAY['WiFi', 'Chef', 'Cruise']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-2/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-024', 'Desert Star Camp', 'Jaisalmer, Rajasthan', 'Luxury Resort',
       'Glamping with camel safari and folk fire circle.', 16999, 19999, 4.7, 134,
       ARRAY['WiFi', 'Safari', 'Campfire']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-3/1200/800', 'https://picsum.photos/seed/demo-gallery-4/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-025', 'Metro Pod Hostel', 'Chennai, TN', 'Budget Rooms',
       'Capsule pods near airport express — laundry and lockers.', 1499, 1899, 4.1, 667,
       ARRAY['WiFi', 'Lockers', 'Laundry']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-026', 'Backpackers Ghat View', 'Rishikesh, Uttarakhand', 'Budget Rooms',
       'Riverside dorm and private rooms — yoga deck at dawn.', 1199, 1499, 4.3, 512,
       ARRAY['WiFi', 'Yoga deck', 'Cafe']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-027', 'Sapphire Plunge Villa', 'South Goa', 'Pool Villas',
       'Tropical garden pool and outdoor tub — two-bedroom.', 13999, 16999, 4.8, 119,
       ARRAY['WiFi', 'Private pool', 'BBQ']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800', 'https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-028', 'Emerald Rice Paddy Villa', 'Hampi, Karnataka', 'Pool Villas',
       'Stone heritage vibe with private pool facing boulder hills.', 10999, 12999, 4.6, 72,
       ARRAY['WiFi', 'Pool', 'Heritage tour']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-029', 'Treetop Canopy Suite', 'Athirappilly, Kerala', 'Tree Houses',
       'Waterfall mist mornings and suspension bridge access.', 10299, 12499, 4.7, 61,
       ARRAY['WiFi', 'Waterfall view', 'Guided trek']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-2/1200/800', 'https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-030', 'Cloud Forest Pod', 'Chikmagalur, Karnataka', 'Tree Houses',
       'Minimal glass pod above coffee estates — stargazing deck.', 9899, 11999, 4.8, 43,
       ARRAY['WiFi', 'Coffee tour', 'Deck']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800', 'https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-031', 'Coral Reef Cottage', 'Havelock, Andaman', 'Couple Friendly',
       'Beach cabana with reef walks and glass-bottom kayak.', 11299, 13499, 4.7, 112,
       ARRAY['WiFi', 'Beach', 'Kayak']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800', 'https://picsum.photos/seed/demo-gallery-7/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-032', 'Spice Route Inn', 'Thekkady, Kerala', 'Couple Friendly',
       'Cardamom hills view and plantation walks.', 6899, 8299, 4.6, 73,
       ARRAY['WiFi', 'Plantation walk', 'Breakfast']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-033', 'Moonlit Lake House', 'Nainital, Uttarakhand', 'Couple Friendly',
       'Lake-facing deck with rowboat mornings.', 7799, 9499, 4.8, 156,
       ARRAY['WiFi', 'Lake', 'Fireplace']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800', 'https://picsum.photos/seed/demo-gallery-2/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-034', 'Jungle Book Resort', 'Pench, MP', 'Family Stay',
       'Safari packages and nature guides for kids.', 9299, 11299, 4.5, 189,
       ARRAY['WiFi', 'Safari', 'Kids zone']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-035', 'River Raft Lodge', 'Rishikesh, Uttarakhand', 'Family Stay',
       'Ganga-facing rooms with rafting desk on site.', 7499, 8999, 4.4, 267,
       ARRAY['WiFi', 'Rafting', 'Yoga']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800', 'https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-036', 'Island Hop Villas', 'Port Blair, Andaman', 'Family Stay',
       'Interconnecting villas near cellular jetty tours.', 10299, 12499, 4.6, 98,
       ARRAY['WiFi', 'Tours', 'Kitchen']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-037', 'Gold Leaf Palace', 'Hyderabad, Telangana', 'Luxury Resort',
       'Nizam-inspired suites with pearl spa rituals.', 22999, 26999, 4.9, 198,
       ARRAY['WiFi', 'Spa', 'Butler']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800', 'https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-038', 'Monsoon Bay Resort', 'Ratnagiri, Maharashtra', 'Luxury Resort',
       'Cliff pool and Konkan seafood tasting menu.', 19999, 23999, 4.8, 145,
       ARRAY['WiFi', 'Infinity pool', 'Fine dining']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-039', 'Silk Route Heritage', 'Varanasi, UP', 'Luxury Resort',
       'Ghat-facing heritage wing with sitar evenings.', 17999, 21499, 4.7, 221,
       ARRAY['WiFi', 'Ghat view', 'Cultural show']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-2/1200/800', 'https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-040', 'Transit Sleep Pods', 'Hyderabad Airport', 'Budget Rooms',
       'Hourly and overnight pods with shower blocks.', 899, 1199, 4.0, 1204,
       ARRAY['WiFi', 'Shower', '24h']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-041', 'Hill Station Hostel', 'Kodaikanal, TN', 'Budget Rooms',
       'Dorms and private rooms near lake promenade.', 1399, 1699, 4.2, 534,
       ARRAY['WiFi', 'Cafe', 'Heater']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-042', 'Infinity Edge Pool Villa', 'Anjuna, Goa', 'Pool Villas',
       'Sunset pool bar and in-villa BBQ setup.', 14999, 17999, 4.8, 167,
       ARRAY['WiFi', 'Private pool', 'BBQ']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800', 'https://picsum.photos/seed/demo-gallery-7/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-043', 'Lotus Backwater Villa', 'Ashtamudi, Kerala', 'Pool Villas',
       'Pool facing the backwater channels.', 12499, 14999, 4.7, 88,
       ARRAY['WiFi', 'Pool', 'Canoe']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-044', 'Bamboo Sky Nest', 'Mawlynnong, Meghalaya', 'Tree Houses',
       'Living root bridge treks and cloud-line deck.', 10999, 12999, 4.8, 41,
       ARRAY['WiFi', 'Trek', 'Village breakfast']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800', 'https://picsum.photos/seed/demo-gallery-2/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-045', 'Redwood Tree Lodge', 'Shillong, Meghalaya', 'Tree Houses',
       'Pine forest tree cabins with bonfire nights.', 9999, 11999, 4.6, 52,
       ARRAY['WiFi', 'Bonfire', 'Music']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-046', 'Velvet Dunes Camp', 'Jodhpur outskirts', 'Couple Friendly',
       'Desert glamping with camel sunset rides.', 8599, 10499, 4.7, 94,
       ARRAY['WiFi', 'Camel', 'Dinner']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800', 'https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-047', 'Blue Lagoon Suite', 'Gokarna, Karnataka', 'Couple Friendly',
       'Cliff cottages with Kudle beach access path.', 7199, 8699, 4.5, 81,
       ARRAY['WiFi', 'Beach path', 'Hammock']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-048', 'Wildlife Family Camp', 'Bandipur, Karnataka', 'Family Stay',
       'Safari jeep bookings and kids nature lab.', 8899, 10699, 4.5, 143,
       ARRAY['WiFi', 'Safari', 'Kids lab']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800', 'https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-049', 'Coastal Kids Resort', 'Mangalore, Karnataka', 'Family Stay',
       'Splash pad and kids cinema on weekends.', 7999, 9599, 4.3, 201,
       ARRAY['WiFi', 'Pool', 'Kids cinema']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-050', 'Crystal Spa Resort', 'Lonavala, Maharashtra', 'Luxury Resort',
       'Monsoon spa suites overlooking valleys.', 20999, 24999, 4.9, 276,
       ARRAY['WiFi', 'Spa', 'Valley view']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-2/1200/800', 'https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-051', 'Royal Houseboat', 'Srinagar, J&K', 'Luxury Resort',
       'Dal Lake houseboat with shikara breakfast.', 24999, 29999, 4.8, 154,
       ARRAY['WiFi', 'Houseboat', 'Heating']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-052', 'City Bunk Hostel', 'Mumbai, Maharashtra', 'Budget Rooms',
       'Colaba-near pods and female-only dorms.', 1799, 2199, 4.1, 892,
       ARRAY['WiFi', 'Lockers', 'Cafe']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-053', 'Himalayan Base Camp Inn', 'Kasol, HP', 'Budget Rooms',
       'Riverside rooms with treks to Kheerganga.', 1599, 1899, 4.4, 623,
       ARRAY['WiFi', 'Cafe', 'Trek info']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-054', 'Tropical Pool Estate', 'Calangute, Goa', 'Pool Villas',
       'Four-bedroom pool villa for groups.', 15999, 18999, 4.7, 101,
       ARRAY['WiFi', 'Private pool', 'Parking']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800', 'https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-055', 'Paddy Field Villa', 'Alleppey backwaters', 'Pool Villas',
       'Pool amid paddy fields and duck farm breakfast.', 11899, 13999, 4.6, 76,
       ARRAY['WiFi', 'Pool', 'Farm breakfast']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-056', 'Eagle Nest Tree Camp', 'Wayanad, Kerala', 'Tree Houses',
       'Watchtower tree rooms facing forest edge.', 9599, 11499, 4.7, 58,
       ARRAY['WiFi', 'Watchtower', 'Trek']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-2/1200/800', 'https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-057', 'Starlight Tree Dome', 'Coorg, Karnataka', 'Tree Houses',
       'Geodesic dome with telescope on deck.', 10199, 12199, 4.8, 47,
       ARRAY['WiFi', 'Telescope', 'Deck']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800']::text[],
       'active', 1440),

      (tid, 'demo-058', 'Heritage Courtyard Inn', 'Agra, UP', 'Couple Friendly',
       'Taj-distance boutique rooms with rooftop dine.', 6999, 8499, 4.4, 312,
       ARRAY['WiFi', 'Rooftop', 'Tours']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-5/1200/800', 'https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-059', 'Surf & Sand Lodge', 'Mulki, Karnataka', 'Family Stay',
       'Surf school partner and estuary kayaking.', 8299, 9999, 4.5, 134,
       ARRAY['WiFi', 'Surf', 'Kayak']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-060', 'Summit Alpine Retreat', 'Gulmarg, J&K', 'Luxury Resort',
       'Ski concierge and heated chalet suites.', 28999, 33999, 4.9, 167,
       ARRAY['WiFi', 'Ski desk', 'Heating']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-8/1200/800', 'https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440);

    RAISE NOTICE 'Inserted 60 demo stays for tenant %.', tid;

  ---------------------------------------------------------------------------
  -- Stays 31–60 only: tenant already had demo-001..030
  ---------------------------------------------------------------------------
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stays' AND column_name = 'tenant_id')
     AND EXISTS (SELECT 1 FROM public.stays s WHERE s.tenant_id = tid AND s.stay_id = 'demo-030')
     AND NOT EXISTS (SELECT 1 FROM public.stays s WHERE s.tenant_id = tid AND s.stay_id = 'demo-031') THEN
    INSERT INTO public.stays (
      tenant_id,
      stay_id,
      name,
      location,
      category,
      description,
      price,
      original_price,
      rating,
      reviews_count,
      amenities,
      images,
      status,
      cooldown_minutes
    ) VALUES
      (tid, 'demo-031', 'Coral Reef Cottage', 'Havelock, Andaman', 'Couple Friendly',
       'Beach cabana with reef walks and glass-bottom kayak.', 11299, 13499, 4.7, 112,
       ARRAY['WiFi', 'Beach', 'Kayak']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800', 'https://picsum.photos/seed/demo-gallery-7/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-032', 'Spice Route Inn', 'Thekkady, Kerala', 'Couple Friendly',
       'Cardamom hills view and plantation walks.', 6899, 8299, 4.6, 73,
       ARRAY['WiFi', 'Plantation walk', 'Breakfast']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-033', 'Moonlit Lake House', 'Nainital, Uttarakhand', 'Couple Friendly',
       'Lake-facing deck with rowboat mornings.', 7799, 9499, 4.8, 156,
       ARRAY['WiFi', 'Lake', 'Fireplace']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800', 'https://picsum.photos/seed/demo-gallery-2/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-034', 'Jungle Book Resort', 'Pench, MP', 'Family Stay',
       'Safari packages and nature guides for kids.', 9299, 11299, 4.5, 189,
       ARRAY['WiFi', 'Safari', 'Kids zone']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-035', 'River Raft Lodge', 'Rishikesh, Uttarakhand', 'Family Stay',
       'Ganga-facing rooms with rafting desk on site.', 7499, 8999, 4.4, 267,
       ARRAY['WiFi', 'Rafting', 'Yoga']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800', 'https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-036', 'Island Hop Villas', 'Port Blair, Andaman', 'Family Stay',
       'Interconnecting villas near cellular jetty tours.', 10299, 12499, 4.6, 98,
       ARRAY['WiFi', 'Tours', 'Kitchen']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-037', 'Gold Leaf Palace', 'Hyderabad, Telangana', 'Luxury Resort',
       'Nizam-inspired suites with pearl spa rituals.', 22999, 26999, 4.9, 198,
       ARRAY['WiFi', 'Spa', 'Butler']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800', 'https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-038', 'Monsoon Bay Resort', 'Ratnagiri, Maharashtra', 'Luxury Resort',
       'Cliff pool and Konkan seafood tasting menu.', 19999, 23999, 4.8, 145,
       ARRAY['WiFi', 'Infinity pool', 'Fine dining']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-039', 'Silk Route Heritage', 'Varanasi, UP', 'Luxury Resort',
       'Ghat-facing heritage wing with sitar evenings.', 17999, 21499, 4.7, 221,
       ARRAY['WiFi', 'Ghat view', 'Cultural show']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-2/1200/800', 'https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-040', 'Transit Sleep Pods', 'Hyderabad Airport', 'Budget Rooms',
       'Hourly and overnight pods with shower blocks.', 899, 1199, 4.0, 1204,
       ARRAY['WiFi', 'Shower', '24h']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-041', 'Hill Station Hostel', 'Kodaikanal, TN', 'Budget Rooms',
       'Dorms and private rooms near lake promenade.', 1399, 1699, 4.2, 534,
       ARRAY['WiFi', 'Cafe', 'Heater']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-042', 'Infinity Edge Pool Villa', 'Anjuna, Goa', 'Pool Villas',
       'Sunset pool bar and in-villa BBQ setup.', 14999, 17999, 4.8, 167,
       ARRAY['WiFi', 'Private pool', 'BBQ']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800', 'https://picsum.photos/seed/demo-gallery-7/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-043', 'Lotus Backwater Villa', 'Ashtamudi, Kerala', 'Pool Villas',
       'Pool facing the backwater channels.', 12499, 14999, 4.7, 88,
       ARRAY['WiFi', 'Pool', 'Canoe']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-044', 'Bamboo Sky Nest', 'Mawlynnong, Meghalaya', 'Tree Houses',
       'Living root bridge treks and cloud-line deck.', 10999, 12999, 4.8, 41,
       ARRAY['WiFi', 'Trek', 'Village breakfast']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800', 'https://picsum.photos/seed/demo-gallery-2/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-045', 'Redwood Tree Lodge', 'Shillong, Meghalaya', 'Tree Houses',
       'Pine forest tree cabins with bonfire nights.', 9999, 11999, 4.6, 52,
       ARRAY['WiFi', 'Bonfire', 'Music']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-046', 'Velvet Dunes Camp', 'Jodhpur outskirts', 'Couple Friendly',
       'Desert glamping with camel sunset rides.', 8599, 10499, 4.7, 94,
       ARRAY['WiFi', 'Camel', 'Dinner']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800', 'https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-047', 'Blue Lagoon Suite', 'Gokarna, Karnataka', 'Couple Friendly',
       'Cliff cottages with Kudle beach access path.', 7199, 8699, 4.5, 81,
       ARRAY['WiFi', 'Beach path', 'Hammock']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-048', 'Wildlife Family Camp', 'Bandipur, Karnataka', 'Family Stay',
       'Safari jeep bookings and kids nature lab.', 8899, 10699, 4.5, 143,
       ARRAY['WiFi', 'Safari', 'Kids lab']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800', 'https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-049', 'Coastal Kids Resort', 'Mangalore, Karnataka', 'Family Stay',
       'Splash pad and kids cinema on weekends.', 7999, 9599, 4.3, 201,
       ARRAY['WiFi', 'Pool', 'Kids cinema']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-050', 'Crystal Spa Resort', 'Lonavala, Maharashtra', 'Luxury Resort',
       'Monsoon spa suites overlooking valleys.', 20999, 24999, 4.9, 276,
       ARRAY['WiFi', 'Spa', 'Valley view']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-2/1200/800', 'https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-051', 'Royal Houseboat', 'Srinagar, J&K', 'Luxury Resort',
       'Dal Lake houseboat with shikara breakfast.', 24999, 29999, 4.8, 154,
       ARRAY['WiFi', 'Houseboat', 'Heating']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-052', 'City Bunk Hostel', 'Mumbai, Maharashtra', 'Budget Rooms',
       'Colaba-near pods and female-only dorms.', 1799, 2199, 4.1, 892,
       ARRAY['WiFi', 'Lockers', 'Cafe']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-053', 'Himalayan Base Camp Inn', 'Kasol, HP', 'Budget Rooms',
       'Riverside rooms with treks to Kheerganga.', 1599, 1899, 4.4, 623,
       ARRAY['WiFi', 'Cafe', 'Trek info']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-054', 'Tropical Pool Estate', 'Calangute, Goa', 'Pool Villas',
       'Four-bedroom pool villa for groups.', 15999, 18999, 4.7, 101,
       ARRAY['WiFi', 'Private pool', 'Parking']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800', 'https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-055', 'Paddy Field Villa', 'Alleppey backwaters', 'Pool Villas',
       'Pool amid paddy fields and duck farm breakfast.', 11899, 13999, 4.6, 76,
       ARRAY['WiFi', 'Pool', 'Farm breakfast']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-056', 'Eagle Nest Tree Camp', 'Wayanad, Kerala', 'Tree Houses',
       'Watchtower tree rooms facing forest edge.', 9599, 11499, 4.7, 58,
       ARRAY['WiFi', 'Watchtower', 'Trek']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-2/1200/800', 'https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-057', 'Starlight Tree Dome', 'Coorg, Karnataka', 'Tree Houses',
       'Geodesic dome with telescope on deck.', 10199, 12199, 4.8, 47,
       ARRAY['WiFi', 'Telescope', 'Deck']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-058', 'Heritage Courtyard Inn', 'Agra, UP', 'Couple Friendly',
       'Taj-distance boutique rooms with rooftop dine.', 6999, 8499, 4.4, 312,
       ARRAY['WiFi', 'Rooftop', 'Tours']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-5/1200/800', 'https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-059', 'Surf & Sand Lodge', 'Mulki, Karnataka', 'Family Stay',
       'Surf school partner and estuary kayaking.', 8299, 9999, 4.5, 134,
       ARRAY['WiFi', 'Surf', 'Kayak']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-060', 'Summit Alpine Retreat', 'Gulmarg, J&K', 'Luxury Resort',
       'Ski concierge and heated chalet suites.', 28999, 33999, 4.9, 167,
       ARRAY['WiFi', 'Ski desk', 'Heating']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-8/1200/800', 'https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440);

    RAISE NOTICE 'Inserted demo stays demo-031..060 for tenant %.', tid;

  ---------------------------------------------------------------------------
  -- Stays 16–60: tenant had demo-001..015 only (older seed)
  ---------------------------------------------------------------------------
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stays' AND column_name = 'tenant_id')
     AND EXISTS (SELECT 1 FROM public.stays s WHERE s.tenant_id = tid AND s.stay_id = 'demo-015')
     AND NOT EXISTS (SELECT 1 FROM public.stays s WHERE s.tenant_id = tid AND s.stay_id = 'demo-016') THEN
    INSERT INTO public.stays (
      tenant_id,
      stay_id,
      name,
      location,
      category,
      description,
      price,
      original_price,
      rating,
      reviews_count,
      amenities,
      images,
      status,
      cooldown_minutes
    ) VALUES
      (tid, 'demo-016', 'Sunset Cliff Suite', 'Kovalam, Kerala', 'Couple Friendly',
       'Rooftop lounge and lighthouse views — couples only wing.', 7299, 8999, 4.7, 91,
       ARRAY['WiFi', 'Sea view', 'Breakfast']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800', 'https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-017', 'Mangrove Kayak Retreat', 'Chidambaram, TN', 'Couple Friendly',
       'Quiet mangrove-facing rooms with guided kayak dusk tours.', 6599, 7999, 4.5, 48,
       ARRAY['WiFi', 'Kayak', 'Veg meals']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-018', 'Heritage Haveli Room', 'Jaipur, Rajasthan', 'Couple Friendly',
       'Courtyard suite with folk music evenings.', 8199, 9999, 4.8, 203,
       ARRAY['WiFi', 'Heritage walk', 'Rooftop dining']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-2/1200/800', 'https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-019', 'Splash Kids Water Park Inn', 'Mahabalipuram, TN', 'Family Stay',
       'Water slides on-site and family buffet — interconnecting rooms.', 8999, 10999, 4.4, 312,
       ARRAY['WiFi', 'Water park', 'Kids buffet']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-020', 'Lakeview Caravan Park', 'Pondicherry', 'Family Stay',
       'Cottages around a lawn — cycling and board games included.', 6299, 7699, 4.3, 156,
       ARRAY['WiFi', 'Cycles', 'Garden']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-5/1200/800', 'https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-021', 'Snowline Family Chalet', 'Manali, HP', 'Family Stay',
       'Heated floors, sled hire, and hot chocolate bar.', 11299, 13499, 4.6, 178,
       ARRAY['WiFi', 'Heating', 'Sled desk']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-022', 'Marble Palace Suite', 'Jodhpur, Rajasthan', 'Luxury Resort',
       'Blue-city views, thali tasting menu, and spa credits.', 21999, 25999, 4.9, 241,
       ARRAY['WiFi', 'Spa', 'Fine dining']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-8/1200/800', 'https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-023', 'Backwater Royal Barge', 'Kuttanad, Kerala', 'Luxury Resort',
       'Two-night slow cruise with private chef on select dates.', 27999, 32999, 4.8, 88,
       ARRAY['WiFi', 'Chef', 'Cruise']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-2/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-024', 'Desert Star Camp', 'Jaisalmer, Rajasthan', 'Luxury Resort',
       'Glamping with camel safari and folk fire circle.', 16999, 19999, 4.7, 134,
       ARRAY['WiFi', 'Safari', 'Campfire']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-3/1200/800', 'https://picsum.photos/seed/demo-gallery-4/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-025', 'Metro Pod Hostel', 'Chennai, TN', 'Budget Rooms',
       'Capsule pods near airport express — laundry and lockers.', 1499, 1899, 4.1, 667,
       ARRAY['WiFi', 'Lockers', 'Laundry']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-026', 'Backpackers Ghat View', 'Rishikesh, Uttarakhand', 'Budget Rooms',
       'Riverside dorm and private rooms — yoga deck at dawn.', 1199, 1499, 4.3, 512,
       ARRAY['WiFi', 'Yoga deck', 'Cafe']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-027', 'Sapphire Plunge Villa', 'South Goa', 'Pool Villas',
       'Tropical garden pool and outdoor tub — two-bedroom.', 13999, 16999, 4.8, 119,
       ARRAY['WiFi', 'Private pool', 'BBQ']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800', 'https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-028', 'Emerald Rice Paddy Villa', 'Hampi, Karnataka', 'Pool Villas',
       'Stone heritage vibe with private pool facing boulder hills.', 10999, 12999, 4.6, 72,
       ARRAY['WiFi', 'Pool', 'Heritage tour']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-029', 'Treetop Canopy Suite', 'Athirappilly, Kerala', 'Tree Houses',
       'Waterfall mist mornings and suspension bridge access.', 10299, 12499, 4.7, 61,
       ARRAY['WiFi', 'Waterfall view', 'Guided trek']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-2/1200/800', 'https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-030', 'Cloud Forest Pod', 'Chikmagalur, Karnataka', 'Tree Houses',
       'Minimal glass pod above coffee estates — stargazing deck.', 9899, 11999, 4.8, 43,
       ARRAY['WiFi', 'Coffee tour', 'Deck']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800', 'https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-031', 'Coral Reef Cottage', 'Havelock, Andaman', 'Couple Friendly',
       'Beach cabana with reef walks and glass-bottom kayak.', 11299, 13499, 4.7, 112,
       ARRAY['WiFi', 'Beach', 'Kayak']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800', 'https://picsum.photos/seed/demo-gallery-7/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-032', 'Spice Route Inn', 'Thekkady, Kerala', 'Couple Friendly',
       'Cardamom hills view and plantation walks.', 6899, 8299, 4.6, 73,
       ARRAY['WiFi', 'Plantation walk', 'Breakfast']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-033', 'Moonlit Lake House', 'Nainital, Uttarakhand', 'Couple Friendly',
       'Lake-facing deck with rowboat mornings.', 7799, 9499, 4.8, 156,
       ARRAY['WiFi', 'Lake', 'Fireplace']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800', 'https://picsum.photos/seed/demo-gallery-2/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-034', 'Jungle Book Resort', 'Pench, MP', 'Family Stay',
       'Safari packages and nature guides for kids.', 9299, 11299, 4.5, 189,
       ARRAY['WiFi', 'Safari', 'Kids zone']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-035', 'River Raft Lodge', 'Rishikesh, Uttarakhand', 'Family Stay',
       'Ganga-facing rooms with rafting desk on site.', 7499, 8999, 4.4, 267,
       ARRAY['WiFi', 'Rafting', 'Yoga']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800', 'https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-036', 'Island Hop Villas', 'Port Blair, Andaman', 'Family Stay',
       'Interconnecting villas near cellular jetty tours.', 10299, 12499, 4.6, 98,
       ARRAY['WiFi', 'Tours', 'Kitchen']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-037', 'Gold Leaf Palace', 'Hyderabad, Telangana', 'Luxury Resort',
       'Nizam-inspired suites with pearl spa rituals.', 22999, 26999, 4.9, 198,
       ARRAY['WiFi', 'Spa', 'Butler']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800', 'https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-038', 'Monsoon Bay Resort', 'Ratnagiri, Maharashtra', 'Luxury Resort',
       'Cliff pool and Konkan seafood tasting menu.', 19999, 23999, 4.8, 145,
       ARRAY['WiFi', 'Infinity pool', 'Fine dining']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-039', 'Silk Route Heritage', 'Varanasi, UP', 'Luxury Resort',
       'Ghat-facing heritage wing with sitar evenings.', 17999, 21499, 4.7, 221,
       ARRAY['WiFi', 'Ghat view', 'Cultural show']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-2/1200/800', 'https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-040', 'Transit Sleep Pods', 'Hyderabad Airport', 'Budget Rooms',
       'Hourly and overnight pods with shower blocks.', 899, 1199, 4.0, 1204,
       ARRAY['WiFi', 'Shower', '24h']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-041', 'Hill Station Hostel', 'Kodaikanal, TN', 'Budget Rooms',
       'Dorms and private rooms near lake promenade.', 1399, 1699, 4.2, 534,
       ARRAY['WiFi', 'Cafe', 'Heater']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-042', 'Infinity Edge Pool Villa', 'Anjuna, Goa', 'Pool Villas',
       'Sunset pool bar and in-villa BBQ setup.', 14999, 17999, 4.8, 167,
       ARRAY['WiFi', 'Private pool', 'BBQ']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800', 'https://picsum.photos/seed/demo-gallery-7/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-043', 'Lotus Backwater Villa', 'Ashtamudi, Kerala', 'Pool Villas',
       'Pool facing the backwater channels.', 12499, 14999, 4.7, 88,
       ARRAY['WiFi', 'Pool', 'Canoe']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-044', 'Bamboo Sky Nest', 'Mawlynnong, Meghalaya', 'Tree Houses',
       'Living root bridge treks and cloud-line deck.', 10999, 12999, 4.8, 41,
       ARRAY['WiFi', 'Trek', 'Village breakfast']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800', 'https://picsum.photos/seed/demo-gallery-2/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-045', 'Redwood Tree Lodge', 'Shillong, Meghalaya', 'Tree Houses',
       'Pine forest tree cabins with bonfire nights.', 9999, 11999, 4.6, 52,
       ARRAY['WiFi', 'Bonfire', 'Music']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-046', 'Velvet Dunes Camp', 'Jodhpur outskirts', 'Couple Friendly',
       'Desert glamping with camel sunset rides.', 8599, 10499, 4.7, 94,
       ARRAY['WiFi', 'Camel', 'Dinner']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800', 'https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-047', 'Blue Lagoon Suite', 'Gokarna, Karnataka', 'Couple Friendly',
       'Cliff cottages with Kudle beach access path.', 7199, 8699, 4.5, 81,
       ARRAY['WiFi', 'Beach path', 'Hammock']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-048', 'Wildlife Family Camp', 'Bandipur, Karnataka', 'Family Stay',
       'Safari jeep bookings and kids nature lab.', 8899, 10699, 4.5, 143,
       ARRAY['WiFi', 'Safari', 'Kids lab']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800', 'https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-049', 'Coastal Kids Resort', 'Mangalore, Karnataka', 'Family Stay',
       'Splash pad and kids cinema on weekends.', 7999, 9599, 4.3, 201,
       ARRAY['WiFi', 'Pool', 'Kids cinema']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-050', 'Crystal Spa Resort', 'Lonavala, Maharashtra', 'Luxury Resort',
       'Monsoon spa suites overlooking valleys.', 20999, 24999, 4.9, 276,
       ARRAY['WiFi', 'Spa', 'Valley view']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-2/1200/800', 'https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-051', 'Royal Houseboat', 'Srinagar, J&K', 'Luxury Resort',
       'Dal Lake houseboat with shikara breakfast.', 24999, 29999, 4.8, 154,
       ARRAY['WiFi', 'Houseboat', 'Heating']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-052', 'City Bunk Hostel', 'Mumbai, Maharashtra', 'Budget Rooms',
       'Colaba-near pods and female-only dorms.', 1799, 2199, 4.1, 892,
       ARRAY['WiFi', 'Lockers', 'Cafe']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-5/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-053', 'Himalayan Base Camp Inn', 'Kasol, HP', 'Budget Rooms',
       'Riverside rooms with treks to Kheerganga.', 1599, 1899, 4.4, 623,
       ARRAY['WiFi', 'Cafe', 'Trek info']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-054', 'Tropical Pool Estate', 'Calangute, Goa', 'Pool Villas',
       'Four-bedroom pool villa for groups.', 15999, 18999, 4.7, 101,
       ARRAY['WiFi', 'Private pool', 'Parking']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800', 'https://picsum.photos/seed/demo-gallery-8/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-055', 'Paddy Field Villa', 'Alleppey backwaters', 'Pool Villas',
       'Pool amid paddy fields and duck farm breakfast.', 11899, 13999, 4.6, 76,
       ARRAY['WiFi', 'Pool', 'Farm breakfast']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-056', 'Eagle Nest Tree Camp', 'Wayanad, Kerala', 'Tree Houses',
       'Watchtower tree rooms facing forest edge.', 9599, 11499, 4.7, 58,
       ARRAY['WiFi', 'Watchtower', 'Trek']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-2/1200/800', 'https://picsum.photos/seed/demo-gallery-3/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-057', 'Starlight Tree Dome', 'Coorg, Karnataka', 'Tree Houses',
       'Geodesic dome with telescope on deck.', 10199, 12199, 4.8, 47,
       ARRAY['WiFi', 'Telescope', 'Deck']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-4/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-058', 'Heritage Courtyard Inn', 'Agra, UP', 'Couple Friendly',
       'Taj-distance boutique rooms with rooftop dine.', 6999, 8499, 4.4, 312,
       ARRAY['WiFi', 'Rooftop', 'Tours']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-5/1200/800', 'https://picsum.photos/seed/demo-gallery-6/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-059', 'Surf & Sand Lodge', 'Mulki, Karnataka', 'Family Stay',
       'Surf school partner and estuary kayaking.', 8299, 9999, 4.5, 134,
       ARRAY['WiFi', 'Surf', 'Kayak']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-7/1200/800']::text[],
       'active', 1440),
      (tid, 'demo-060', 'Summit Alpine Retreat', 'Gulmarg, J&K', 'Luxury Resort',
       'Ski concierge and heated chalet suites.', 28999, 33999, 4.9, 167,
       ARRAY['WiFi', 'Ski desk', 'Heating']::text[],
       ARRAY['https://picsum.photos/seed/demo-gallery-8/1200/800', 'https://picsum.photos/seed/demo-gallery-1/1200/800']::text[],
       'active', 1440);

    RAISE NOTICE 'Inserted demo stays demo-016..060 for tenant %.', tid;
  ELSE
    RAISE NOTICE 'Skipped stays seed: tenant already has full demo range (demo-001..060), or stays.tenant_id missing.';
  END IF;

  ---------------------------------------------------------------------------
  -- Per-stay unique gallery image URLs (HTTPS, one or two photos per property)
  ---------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stays' AND column_name = 'images') THEN
    UPDATE public.stays s SET images = m.imgs
    FROM (
      VALUES
        ('demo-001', ARRAY['https://picsum.photos/seed/demo-001-img1/1200/800', 'https://picsum.photos/seed/demo-001-img2/1200/800']::text[]),
        ('demo-002', ARRAY['https://picsum.photos/seed/demo-002-img1/1200/800']::text[]),
        ('demo-003', ARRAY['https://picsum.photos/seed/demo-003-img1/1200/800', 'https://picsum.photos/seed/demo-003-img2/1200/800']::text[]),
        ('demo-004', ARRAY['https://picsum.photos/seed/demo-004-img1/1200/800']::text[]),
        ('demo-005', ARRAY['https://picsum.photos/seed/demo-005-img1/1200/800', 'https://picsum.photos/seed/demo-005-img2/1200/800']::text[]),
        ('demo-006', ARRAY['https://picsum.photos/seed/demo-006-img1/1200/800']::text[]),
        ('demo-007', ARRAY['https://picsum.photos/seed/demo-007-img1/1200/800', 'https://picsum.photos/seed/demo-007-img2/1200/800']::text[]),
        ('demo-008', ARRAY['https://picsum.photos/seed/demo-008-img1/1200/800']::text[]),
        ('demo-009', ARRAY['https://picsum.photos/seed/demo-009-img1/1200/800', 'https://picsum.photos/seed/demo-009-img2/1200/800']::text[]),
        ('demo-010', ARRAY['https://picsum.photos/seed/demo-010-img1/1200/800']::text[]),
        ('demo-011', ARRAY['https://picsum.photos/seed/demo-011-img1/1200/800']::text[]),
        ('demo-012', ARRAY['https://picsum.photos/seed/demo-012-img1/1200/800', 'https://picsum.photos/seed/demo-012-img2/1200/800']::text[]),
        ('demo-013', ARRAY['https://picsum.photos/seed/demo-013-img1/1200/800']::text[]),
        ('demo-014', ARRAY['https://picsum.photos/seed/demo-014-img1/1200/800', 'https://picsum.photos/seed/demo-014-img2/1200/800']::text[]),
        ('demo-015', ARRAY['https://picsum.photos/seed/demo-015-img1/1200/800']::text[]),
        ('demo-016', ARRAY['https://picsum.photos/seed/demo-016-img1/1200/800', 'https://picsum.photos/seed/demo-016-img2/1200/800']::text[]),
        ('demo-017', ARRAY['https://picsum.photos/seed/demo-017-img1/1200/800']::text[]),
        ('demo-018', ARRAY['https://picsum.photos/seed/demo-018-img1/1200/800', 'https://picsum.photos/seed/demo-018-img2/1200/800']::text[]),
        ('demo-019', ARRAY['https://picsum.photos/seed/demo-019-img1/1200/800']::text[]),
        ('demo-020', ARRAY['https://picsum.photos/seed/demo-020-img1/1200/800', 'https://picsum.photos/seed/demo-020-img2/1200/800']::text[]),
        ('demo-021', ARRAY['https://picsum.photos/seed/demo-021-img1/1200/800']::text[]),
        ('demo-022', ARRAY['https://picsum.photos/seed/demo-022-img1/1200/800', 'https://picsum.photos/seed/demo-022-img2/1200/800']::text[]),
        ('demo-023', ARRAY['https://picsum.photos/seed/demo-023-img1/1200/800']::text[]),
        ('demo-024', ARRAY['https://picsum.photos/seed/demo-024-img1/1200/800', 'https://picsum.photos/seed/demo-024-img2/1200/800']::text[]),
        ('demo-025', ARRAY['https://picsum.photos/seed/demo-025-img1/1200/800']::text[]),
        ('demo-026', ARRAY['https://picsum.photos/seed/demo-026-img1/1200/800']::text[]),
        ('demo-027', ARRAY['https://picsum.photos/seed/demo-027-img1/1200/800', 'https://picsum.photos/seed/demo-027-img2/1200/800']::text[]),
        ('demo-028', ARRAY['https://picsum.photos/seed/demo-028-img1/1200/800']::text[]),
        ('demo-029', ARRAY['https://picsum.photos/seed/demo-029-img1/1200/800', 'https://picsum.photos/seed/demo-029-img2/1200/800']::text[]),
        ('demo-030', ARRAY['https://picsum.photos/seed/demo-030-img1/1200/800', 'https://picsum.photos/seed/demo-030-img2/1200/800']::text[]),
        ('demo-031', ARRAY['https://picsum.photos/seed/demo-031-img1/1200/800', 'https://picsum.photos/seed/demo-031-img2/1200/800']::text[]),
        ('demo-032', ARRAY['https://picsum.photos/seed/demo-032-img1/1200/800']::text[]),
        ('demo-033', ARRAY['https://picsum.photos/seed/demo-033-img1/1200/800', 'https://picsum.photos/seed/demo-033-img2/1200/800']::text[]),
        ('demo-034', ARRAY['https://picsum.photos/seed/demo-034-img1/1200/800']::text[]),
        ('demo-035', ARRAY['https://picsum.photos/seed/demo-035-img1/1200/800', 'https://picsum.photos/seed/demo-035-img2/1200/800']::text[]),
        ('demo-036', ARRAY['https://picsum.photos/seed/demo-036-img1/1200/800']::text[]),
        ('demo-037', ARRAY['https://picsum.photos/seed/demo-037-img1/1200/800', 'https://picsum.photos/seed/demo-037-img2/1200/800']::text[]),
        ('demo-038', ARRAY['https://picsum.photos/seed/demo-038-img1/1200/800']::text[]),
        ('demo-039', ARRAY['https://picsum.photos/seed/demo-039-img1/1200/800', 'https://picsum.photos/seed/demo-039-img2/1200/800']::text[]),
        ('demo-040', ARRAY['https://picsum.photos/seed/demo-040-img1/1200/800']::text[]),
        ('demo-041', ARRAY['https://picsum.photos/seed/demo-041-img1/1200/800']::text[]),
        ('demo-042', ARRAY['https://picsum.photos/seed/demo-042-img1/1200/800', 'https://picsum.photos/seed/demo-042-img2/1200/800']::text[]),
        ('demo-043', ARRAY['https://picsum.photos/seed/demo-043-img1/1200/800']::text[]),
        ('demo-044', ARRAY['https://picsum.photos/seed/demo-044-img1/1200/800', 'https://picsum.photos/seed/demo-044-img2/1200/800']::text[]),
        ('demo-045', ARRAY['https://picsum.photos/seed/demo-045-img1/1200/800']::text[]),
        ('demo-046', ARRAY['https://picsum.photos/seed/demo-046-img1/1200/800', 'https://picsum.photos/seed/demo-046-img2/1200/800']::text[]),
        ('demo-047', ARRAY['https://picsum.photos/seed/demo-047-img1/1200/800']::text[]),
        ('demo-048', ARRAY['https://picsum.photos/seed/demo-048-img1/1200/800', 'https://picsum.photos/seed/demo-048-img2/1200/800']::text[]),
        ('demo-049', ARRAY['https://picsum.photos/seed/demo-049-img1/1200/800']::text[]),
        ('demo-050', ARRAY['https://picsum.photos/seed/demo-050-img1/1200/800', 'https://picsum.photos/seed/demo-050-img2/1200/800']::text[]),
        ('demo-051', ARRAY['https://picsum.photos/seed/demo-051-img1/1200/800']::text[]),
        ('demo-052', ARRAY['https://picsum.photos/seed/demo-052-img1/1200/800']::text[]),
        ('demo-053', ARRAY['https://picsum.photos/seed/demo-053-img1/1200/800']::text[]),
        ('demo-054', ARRAY['https://picsum.photos/seed/demo-054-img1/1200/800', 'https://picsum.photos/seed/demo-054-img2/1200/800']::text[]),
        ('demo-055', ARRAY['https://picsum.photos/seed/demo-055-img1/1200/800']::text[]),
        ('demo-056', ARRAY['https://picsum.photos/seed/demo-056-img1/1200/800', 'https://picsum.photos/seed/demo-056-img2/1200/800']::text[]),
        ('demo-057', ARRAY['https://picsum.photos/seed/demo-057-img1/1200/800']::text[]),
        ('demo-058', ARRAY['https://picsum.photos/seed/demo-058-img1/1200/800', 'https://picsum.photos/seed/demo-058-img2/1200/800']::text[]),
        ('demo-059', ARRAY['https://picsum.photos/seed/demo-059-img1/1200/800']::text[]),
        ('demo-060', ARRAY['https://picsum.photos/seed/demo-060-img1/1200/800', 'https://picsum.photos/seed/demo-060-img2/1200/800']::text[])
    ) AS m(stay_id, imgs)
    WHERE s.tenant_id = tid AND s.stay_id = m.stay_id;
  END IF;

  ---------------------------------------------------------------------------
  -- Room categories: 3 tiers per demo stay (Standard / Deluxe / Suite-style names by category)
  ---------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'room_categories') THEN
    INSERT INTO public.room_categories (tenant_id, stay_id, name, images, max_guests, available, amenities, price, original_price)
    SELECT
      s.tenant_id,
      s.id,
      CASE
        WHEN s.category = 'Budget Rooms' THEN
          CASE r.slot WHEN 1 THEN 'Dorm Bed' WHEN 2 THEN 'Private Room' ELSE 'Twin Room' END
        WHEN s.category = 'Luxury Resort' THEN
          CASE r.slot WHEN 1 THEN 'Deluxe Room' WHEN 2 THEN 'Premier Suite' ELSE 'Presidential Suite' END
        WHEN s.category = 'Family Stay' THEN
          CASE r.slot WHEN 1 THEN 'Family Room' WHEN 2 THEN 'Connecting Family' ELSE 'Grand Suite' END
        WHEN s.category = 'Pool Villas' THEN
          CASE r.slot WHEN 1 THEN 'Garden Pool Villa' WHEN 2 THEN 'Premium Pool Villa' ELSE 'Family Pool Villa' END
        WHEN s.category = 'Tree Houses' THEN
          CASE r.slot WHEN 1 THEN 'Tree Pod' WHEN 2 THEN 'Canopy Suite' ELSE 'Sky Suite' END
        WHEN s.category = 'Couple Friendly' THEN
          CASE r.slot WHEN 1 THEN 'Garden Room' WHEN 2 THEN 'Romantic Deluxe' ELSE 'Honeymoon Suite' END
        ELSE 'Standard Room'
      END,
      r.imgs,
      CASE
        WHEN s.category = 'Budget Rooms' AND r.slot = 1 THEN 1
        WHEN r.slot = 3 THEN 4
        ELSE 2
      END,
      CASE
        WHEN s.category = 'Budget Rooms' AND r.slot = 1 THEN 14
        WHEN r.slot = 1 THEN 5
        WHEN r.slot = 2 THEN 3
        ELSE 2
      END,
      CASE
        WHEN s.category = 'Budget Rooms' AND r.slot = 1 THEN ARRAY['WiFi', 'Shared kitchen', 'Lockers', 'Reading light']::text[]
        WHEN s.category = 'Budget Rooms' AND r.slot = 2 THEN ARRAY['AC', 'WiFi', 'TV', 'Hot water']::text[]
        WHEN s.category = 'Budget Rooms' THEN ARRAY['AC', 'WiFi', 'Twin beds', 'View']::text[]
        WHEN s.category = 'Luxury Resort' AND r.slot = 1 THEN ARRAY['AC', 'WiFi', 'TV', 'Mini bar']::text[]
        WHEN s.category = 'Luxury Resort' AND r.slot = 2 THEN ARRAY['AC', 'Butler', 'Balcony', 'Spa access']::text[]
        WHEN s.category = 'Luxury Resort' THEN ARRAY['AC', 'Private pool', 'Butler', 'Kitchenette', 'WiFi']::text[]
        WHEN r.slot = 1 THEN ARRAY['AC', 'WiFi', 'TV', 'Hot water']::text[]
        WHEN r.slot = 2 THEN ARRAY['AC', 'WiFi', 'Mini fridge', 'View', 'Balcony']::text[]
        ELSE ARRAY['AC', 'Living area', 'Kitchenette', 'WiFi', 'Sofa']::text[]
      END,
      GREATEST(299, (s.price * r.pf)::integer),
      GREATEST(349, (s.original_price * r.pf)::integer)
    FROM public.stays s
    CROSS JOIN LATERAL (
      VALUES
        (1, ARRAY['https://picsum.photos/seed/demo-room-tier-a1/1200/800', 'https://picsum.photos/seed/demo-room-tier-a2/1200/800']::text[], 0.85::numeric),
        (2, ARRAY['https://picsum.photos/seed/demo-room-tier-b1/1200/800', 'https://picsum.photos/seed/demo-room-tier-b2/1200/800']::text[], 1.0::numeric),
        (3, ARRAY['https://picsum.photos/seed/demo-room-tier-c1/1200/800', 'https://picsum.photos/seed/demo-room-tier-c2/1200/800', 'https://picsum.photos/seed/demo-room-tier-c3/1200/800']::text[], 1.28::numeric)
    ) AS r(slot, imgs, pf)
    WHERE s.tenant_id = tid
      AND s.stay_id ~ '^demo-[0-9]{3}$'
      AND NOT EXISTS (SELECT 1 FROM public.room_categories rc WHERE rc.stay_id = s.id);

    GET DIAGNOSTICS room_ins = ROW_COUNT;
    IF room_ins > 0 THEN
      RAISE NOTICE 'Inserted % room_categories rows for demo stays (tenant %).', room_ins, tid;
    END IF;
  END IF;

  ---------------------------------------------------------------------------
  -- Longer "About this stay" body (demo stays only; idempotent)
  ---------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stays' AND column_name = 'description') THEN
    UPDATE public.stays s SET
      description = btrim(s.description) || E'\n\n' ||
        'Welcome to ' || s.name || '. This ' || lower(s.category) || ' property is set in ' || s.location || ', '
        || 'with daily housekeeping, fresh linens, and front-desk support on chat or phone.' || E'\n\n'
        || 'During your stay: climate-controlled rooms where listed, hot water, and in-room dining on request. '
        || 'Enjoy the listed amenities and ask the team for local tips, transfers, and activity bookings.' || E'\n\n'
        || 'House rules: Check-in from 2:00 PM · Check-out by 11:00 AM. '
        || 'Valid government ID required. No smoking inside rooms. '
        || 'Pet policy follows room category and property rules. '
        || 'Cancellation: free until 24 hours before check-in on eligible rates.'
    WHERE s.tenant_id = tid
      AND s.stay_id ~ '^demo-[0-9]{3}$'
      AND position('House rules: Check-in from 2:00 PM' IN s.description) = 0;
  END IF;

  ---------------------------------------------------------------------------
  -- Richer stay details: occupancy + SEO + OG image (demo stays only)
  ---------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stays' AND column_name = 'max_adults') THEN
    UPDATE public.stays s SET
      max_adults = CASE s.category
        WHEN 'Couple Friendly' THEN 2 WHEN 'Family Stay' THEN 8 WHEN 'Luxury Resort' THEN 6
        WHEN 'Budget Rooms' THEN 4 WHEN 'Pool Villas' THEN 6 WHEN 'Tree Houses' THEN 4
        ELSE 4 END,
      max_children = CASE s.category
        WHEN 'Couple Friendly' THEN 0 WHEN 'Family Stay' THEN 3 WHEN 'Luxury Resort' THEN 2
        WHEN 'Budget Rooms' THEN 0 WHEN 'Pool Villas' THEN 2 WHEN 'Tree Houses' THEN 1
        ELSE 1 END,
      max_pets = CASE s.category WHEN 'Family Stay' THEN 2 WHEN 'Pool Villas' THEN 1 ELSE 0 END,
      seo_title = LEFT(s.name || ' — ' || s.location || ' | Book online', 200),
      seo_description = LEFT(
        COALESCE(s.description, '') || ' Multiple room categories, verified photos, and flexible check-in. Book your stay today.',
        500
      ),
      seo_keywords = LEFT(
        lower(replace(s.name || ' ' || s.location || ' ' || s.category, '''', '')) || ', hotel, resort, book online',
        300
      )
    WHERE s.tenant_id = tid AND s.stay_id ~ '^demo-[0-9]{3}$';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stays' AND column_name = 'og_image_url') THEN
    UPDATE public.stays s
    SET og_image_url = s.images[1]
    WHERE s.tenant_id = tid AND s.stay_id ~ '^demo-[0-9]{3}$' AND array_length(s.images, 1) IS NOT NULL AND s.og_image_url IS NULL;
  END IF;

  ---------------------------------------------------------------------------
  -- Stay detail page: approved reviews (3 per demo stay)
  ---------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    INSERT INTO public.reviews (tenant_id, stay_id, guest_name, comment, rating, status, photos, avatar_url)
    SELECT
      s.tenant_id,
      s.id,
      'Guest ' || v.slot || ' · ' || s.stay_id,
      CASE v.slot
        WHEN 1 THEN 'Wonderful stay at ' || s.name || '. ' || s.location || ' was easy to reach and the team was attentive. '
          || 'Highlight: ' || COALESCE(s.amenities[1], 'WiFi') || '.'
        WHEN 2 THEN 'Clean rooms and great value. Booking was smooth and we would happily return.'
        ELSE 'Helpful staff, quick responses, and a memorable experience overall.'
      END,
      CASE WHEN v.slot = 2 THEN 5 ELSE 4 END,
      'approved',
      ARRAY[]::text[],
      'https://i.pravatar.cc/150?u=' || md5(s.stay_id || v.slot::text)
    FROM public.stays s
    CROSS JOIN LATERAL generate_series(1, 3) AS v(slot)
    WHERE s.tenant_id = tid
      AND s.stay_id ~ '^demo-[0-9]{3}$'
      AND NOT EXISTS (
        SELECT 1 FROM public.reviews r
        WHERE r.stay_id = s.id AND r.guest_name = ('Guest ' || v.slot || ' · ' || s.stay_id)
      );
  END IF;

  ---------------------------------------------------------------------------
  -- Stay detail page: nearby attractions (2 per demo stay)
  ---------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nearby_destinations') THEN
    INSERT INTO public.nearby_destinations (tenant_id, stay_id, name, description, distance, image, maps_link, sort_order)
    SELECT
      s.tenant_id,
      s.id,
      CASE v.slot
        WHEN 1 THEN 'Scenic viewpoint & sunset · ' || s.stay_id
        ELSE 'Local dining & market · ' || s.stay_id
      END,
      'Popular with guests in this area — a short hop by car or auto.',
      CASE v.slot WHEN 1 THEN '12 min drive' ELSE '8 min drive' END,
      'https://picsum.photos/seed/nearby-' || s.stay_id || '-' || v.slot::text || '/400/300',
      'https://maps.google.com/',
      v.slot
    FROM public.stays s
    CROSS JOIN (VALUES (1), (2)) AS v(slot)
    WHERE s.tenant_id = tid
      AND s.stay_id ~ '^demo-[0-9]{3}$'
      AND NOT EXISTS (
        SELECT 1 FROM public.nearby_destinations nd
        WHERE nd.stay_id = s.id AND nd.sort_order = v.slot
      );
  END IF;

  ---------------------------------------------------------------------------
  -- Stay detail page: one resort reel per demo stay (YouTube short)
  ---------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stay_reels') THEN
    INSERT INTO public.stay_reels (tenant_id, stay_id, title, url, thumbnail, platform, sort_order)
    SELECT
      s.tenant_id,
      s.id,
      'Property highlights · ' || s.stay_id,
      'https://www.youtube.com/shorts/jNQXAC9IVRw',
      'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg',
      'youtube',
      0
    FROM public.stays s
    WHERE s.tenant_id = tid
      AND s.stay_id ~ '^demo-[0-9]{3}$'
      AND NOT EXISTS (
        SELECT 1 FROM public.stay_reels sr
        WHERE sr.stay_id = s.id AND sr.sort_order = 0
      );
  END IF;

END $$;

SELECT 'demo_stays_count' AS section, count(*)::int AS n
FROM public.stays s
JOIN public.tenants t ON t.id = s.tenant_id
WHERE lower(t.email) = lower('demo@demo.com');

SELECT 'demo_room_categories' AS section, count(*)::int AS n
FROM public.room_categories rc
JOIN public.tenants t ON t.id = rc.tenant_id
WHERE lower(t.email) = lower('demo@demo.com');

SELECT 'demo_reviews' AS section, count(*)::int AS n
FROM public.reviews r
JOIN public.tenants t ON t.id = r.tenant_id
WHERE lower(t.email) = lower('demo@demo.com');

SELECT 'demo_nearby_destinations' AS section, count(*)::int AS n
FROM public.nearby_destinations nd
JOIN public.tenants t ON t.id = nd.tenant_id
WHERE lower(t.email) = lower('demo@demo.com');

SELECT 'demo_stay_reels' AS section, count(*)::int AS n
FROM public.stay_reels sr
JOIN public.tenants t ON t.id = sr.tenant_id
WHERE lower(t.email) = lower('demo@demo.com');
