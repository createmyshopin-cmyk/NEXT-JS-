-- Wipe all tenant-scoped data except selected tenants (destructive).
-- This migration keeps ONLY:
-- - tenants.is_platform = true
-- - tenants.email in the keep list below

-- Keep list (case-insensitive)
CREATE TEMP TABLE _keep_tenants AS
SELECT id
FROM public.tenants
WHERE
  COALESCE(is_platform, false)
  OR lower(email) IN (
    'kk@kk.com',
    'easystaywayanad@gmail.com',
    'thelakehousekarapuzha1@gmail.com',
    'enquirywildvillstays@gmail.com'
  );

-- Tenants to delete
CREATE TEMP TABLE _wipe_tenants AS
SELECT id
FROM public.tenants
WHERE id NOT IN (SELECT id FROM _keep_tenants);

-- Bookings / finance
DELETE FROM public.accounting_transactions WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.booking_timeline WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.booking_ledger_entries WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.invoices WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.bookings WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.quotations WHERE tenant_id IN (SELECT id FROM _wipe_tenants);

-- Stays subtree
DELETE FROM public.calendar_pricing WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.add_ons WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.guest_wishlist WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.media
WHERE tenant_id IN (SELECT id FROM _wipe_tenants)
   OR stay_id IN (SELECT id FROM public.stays WHERE tenant_id IN (SELECT id FROM _wipe_tenants));
DELETE FROM public.reviews WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.nearby_destinations WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.stay_reels WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.room_categories WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.stay_addons WHERE stay_id IN (SELECT id FROM public.stays WHERE tenant_id IN (SELECT id FROM _wipe_tenants));
DELETE FROM public.stays WHERE tenant_id IN (SELECT id FROM _wipe_tenants);

-- Trips
DELETE FROM public.trip_dates WHERE trip_id IN (SELECT id FROM public.trips WHERE tenant_id IN (SELECT id FROM _wipe_tenants));
DELETE FROM public.trip_inclusions WHERE trip_id IN (SELECT id FROM public.trips WHERE tenant_id IN (SELECT id FROM _wipe_tenants));
DELETE FROM public.trip_itinerary_days WHERE trip_id IN (SELECT id FROM public.trips WHERE tenant_id IN (SELECT id FROM _wipe_tenants));
DELETE FROM public.trip_other_info WHERE trip_id IN (SELECT id FROM public.trips WHERE tenant_id IN (SELECT id FROM _wipe_tenants));
DELETE FROM public.trip_reviews WHERE trip_id IN (SELECT id FROM public.trips WHERE tenant_id IN (SELECT id FROM _wipe_tenants));
DELETE FROM public.trip_videos WHERE trip_id IN (SELECT id FROM public.trips WHERE tenant_id IN (SELECT id FROM _wipe_tenants));
DELETE FROM public.trips WHERE tenant_id IN (SELECT id FROM _wipe_tenants);

-- Instagram / automation
DELETE FROM public.instagram_flow_executions WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.instagram_channel_activity WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.instagram_webhook_events WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.instagram_follower_cache WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.instagram_automation_schedules WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.instagram_automation_media_targets WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.instagram_automation_keyword_rules WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.instagram_automation_flows WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.instagram_automation_config WHERE tenant_id IN (SELECT id FROM _wipe_tenants);

-- Billing
DELETE FROM public.transactions WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.subscriptions WHERE tenant_id IN (SELECT id FROM _wipe_tenants);

-- Tenant satellite
DELETE FROM public.tenant_marketplace_installs WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.tenant_registrar_keys WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.tenant_domains WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.tenant_instagram_connections WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.tenant_usage WHERE tenant_id IN (SELECT id FROM _wipe_tenants);

-- Content & settings
DELETE FROM public.coupons WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.banners WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.menu_items WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.popup_settings WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.property_features WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.site_settings WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.stay_categories WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.leads WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.notifications WHERE tenant_id IN (SELECT id FROM _wipe_tenants);
DELETE FROM public.ai_search_logs WHERE tenant_id IN (SELECT id FROM _wipe_tenants);

-- Tenant root (keeps platform + keep-list)
DELETE FROM public.tenants WHERE id IN (SELECT id FROM _wipe_tenants);

