-- Follow-up: tenant_id NOT NULL on remaining tables referencing public.tenants.
-- (Core tables were constrained in 20260324150000_platform_tenant_no_null_tenant_id.sql)

DO $$
DECLARE
  pid uuid;
BEGIN
  SELECT id INTO pid FROM public.tenants WHERE is_platform = true LIMIT 1;
  IF pid IS NULL THEN
    RAISE EXCEPTION 'platform tenant missing (run 20260324150000_platform_tenant_no_null_tenant_id.sql first)';
  END IF;

  UPDATE public.accounting_transactions SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.add_ons SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.ai_search_logs SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.booking_ledger_entries SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.booking_timeline SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.bookings SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.calendar_pricing SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.coupons SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.guest_wishlist SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.invoices SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.leads SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.media SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.menu_items SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.nearby_destinations SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.popup_settings SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.property_features SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.quotations SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.reviews SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.room_categories SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.site_settings SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.stay_categories SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.stay_reels SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.stays SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.subscriptions SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.tenant_domains SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.tenant_instagram_connections SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.tenant_marketplace_installs SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.tenant_registrar_keys SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.tenant_usage SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.transactions SET tenant_id = pid WHERE tenant_id IS NULL;
  UPDATE public.trips SET tenant_id = pid WHERE tenant_id IS NULL;
END $$;

-- Bookings / finance: match booking’s tenant
UPDATE public.bookings b
SET tenant_id = s.tenant_id
FROM public.stays s
WHERE b.stay_id = s.id
  AND b.tenant_id IS DISTINCT FROM s.tenant_id;

UPDATE public.booking_ledger_entries ble
SET tenant_id = b.tenant_id
FROM public.bookings b
WHERE ble.booking_id = b.id
  AND ble.tenant_id IS DISTINCT FROM b.tenant_id;

UPDATE public.booking_timeline bt
SET tenant_id = b.tenant_id
FROM public.bookings b
WHERE bt.booking_id = b.id
  AND bt.tenant_id IS DISTINCT FROM b.tenant_id;

UPDATE public.accounting_transactions at
SET tenant_id = b.tenant_id
FROM public.bookings b
WHERE at.booking_id = b.id
  AND at.booking_id IS NOT NULL
  AND at.tenant_id IS DISTINCT FROM b.tenant_id;

UPDATE public.invoices inv
SET tenant_id = b.tenant_id
FROM public.bookings b
WHERE inv.booking_id = b.id
  AND inv.booking_id IS NOT NULL
  AND inv.tenant_id IS DISTINCT FROM b.tenant_id;

UPDATE public.invoices inv
SET tenant_id = s.tenant_id
FROM public.stays s
WHERE inv.stay_id = s.id
  AND inv.stay_id IS NOT NULL
  AND inv.tenant_id IS DISTINCT FROM s.tenant_id;

-- Stays subtree
UPDATE public.reviews r
SET tenant_id = s.tenant_id
FROM public.stays s
WHERE r.stay_id = s.id
  AND r.tenant_id IS DISTINCT FROM s.tenant_id;

UPDATE public.guest_wishlist gw
SET tenant_id = s.tenant_id
FROM public.stays s
WHERE gw.stay_id = s.id
  AND gw.tenant_id IS DISTINCT FROM s.tenant_id;

UPDATE public.stay_reels sr
SET tenant_id = s.tenant_id
FROM public.stays s
WHERE sr.stay_id = s.id
  AND sr.tenant_id IS DISTINCT FROM s.tenant_id;

UPDATE public.room_categories rc
SET tenant_id = s.tenant_id
FROM public.stays s
WHERE rc.stay_id = s.id
  AND rc.tenant_id IS DISTINCT FROM s.tenant_id;

UPDATE public.nearby_destinations nd
SET tenant_id = s.tenant_id
FROM public.stays s
WHERE nd.stay_id = s.id
  AND nd.tenant_id IS DISTINCT FROM s.tenant_id;

UPDATE public.media m
SET tenant_id = s.tenant_id
FROM public.stays s
WHERE m.stay_id = s.id
  AND m.tenant_id IS DISTINCT FROM s.tenant_id;

UPDATE public.quotations q
SET tenant_id = s.tenant_id
FROM public.stays s
WHERE q.stay_id = s.id
  AND q.stay_id IS NOT NULL
  AND q.tenant_id IS DISTINCT FROM s.tenant_id;

UPDATE public.calendar_pricing cp
SET tenant_id = s.tenant_id
FROM public.stays s
WHERE cp.stay_id = s.id
  AND cp.tenant_id IS DISTINCT FROM s.tenant_id;

UPDATE public.add_ons ao
SET tenant_id = s.tenant_id
FROM public.stays s
WHERE ao.stay_id = s.id
  AND ao.tenant_id IS DISTINCT FROM s.tenant_id;

-- NOT NULL: tables not already constrained in 20260324150000 (site_settings, stays, bookings, trips, notifications, banners)
ALTER TABLE public.accounting_transactions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.add_ons ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.ai_search_logs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.booking_ledger_entries ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.booking_timeline ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.calendar_pricing ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.coupons ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.guest_wishlist ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.media ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.menu_items ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.nearby_destinations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.popup_settings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.property_features ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.quotations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.room_categories ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.stay_categories ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.stay_reels ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.subscriptions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.tenant_domains ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.tenant_instagram_connections ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.tenant_marketplace_installs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.tenant_registrar_keys ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.tenant_usage ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN tenant_id SET NOT NULL;

COMMENT ON COLUMN public.quotations.tenant_id IS 'Owning tenant; required for every row.';
