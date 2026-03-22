-- Wipe all application data for demo@demo.com (tenant-scoped rows + optional tenants row).
-- Safe order respects public FKs (see src/integrations/supabase/types.ts).
--
-- Prerequisites: run as postgres / service role in Supabase SQL Editor.
-- Afterward: re-run supabase/manual_link_demo_tenant_demo_at_demo_com.sql if you removed the tenant row,
--            then seed scripts as needed.
--
-- Set remove_tenant_row := false to keep the public.tenants shell (faster re-seed of stays/settings only).

DO $$
DECLARE
  tid uuid;
  remove_tenant_row boolean := true;
BEGIN
  SELECT t.id INTO tid
  FROM public.tenants t
  WHERE lower(t.email) = lower('demo@demo.com')
  LIMIT 1;

  IF tid IS NULL THEN
    RAISE NOTICE 'No tenant row for demo@demo.com — nothing deleted.';
    RETURN;
  END IF;

  -- Bookings / finance
  DELETE FROM public.accounting_transactions WHERE tenant_id = tid;
  DELETE FROM public.booking_timeline WHERE tenant_id = tid;
  DELETE FROM public.booking_ledger_entries WHERE tenant_id = tid;
  DELETE FROM public.invoices WHERE tenant_id = tid;
  DELETE FROM public.bookings WHERE tenant_id = tid;
  DELETE FROM public.quotations WHERE tenant_id = tid;

  -- Stays subtree
  DELETE FROM public.calendar_pricing WHERE tenant_id = tid;
  DELETE FROM public.add_ons WHERE tenant_id = tid;
  DELETE FROM public.guest_wishlist WHERE tenant_id = tid;
  DELETE FROM public.media
  WHERE tenant_id = tid
     OR stay_id IN (SELECT id FROM public.stays WHERE tenant_id = tid);
  DELETE FROM public.reviews WHERE tenant_id = tid;
  DELETE FROM public.nearby_destinations WHERE tenant_id = tid;
  DELETE FROM public.stay_reels WHERE tenant_id = tid;
  DELETE FROM public.room_categories WHERE tenant_id = tid;
  DELETE FROM public.stay_addons WHERE stay_id IN (SELECT id FROM public.stays WHERE tenant_id = tid);
  DELETE FROM public.stays WHERE tenant_id = tid;

  -- Trips subtree (FK to trips)
  DELETE FROM public.trip_dates WHERE trip_id IN (SELECT id FROM public.trips WHERE tenant_id = tid);
  DELETE FROM public.trip_inclusions WHERE trip_id IN (SELECT id FROM public.trips WHERE tenant_id = tid);
  DELETE FROM public.trip_itinerary_days WHERE trip_id IN (SELECT id FROM public.trips WHERE tenant_id = tid);
  DELETE FROM public.trip_other_info WHERE trip_id IN (SELECT id FROM public.trips WHERE tenant_id = tid);
  DELETE FROM public.trip_reviews WHERE trip_id IN (SELECT id FROM public.trips WHERE tenant_id = tid);
  DELETE FROM public.trip_videos WHERE trip_id IN (SELECT id FROM public.trips WHERE tenant_id = tid);
  DELETE FROM public.trips WHERE tenant_id = tid;

  -- Instagram automation (executions reference flows)
  DELETE FROM public.instagram_flow_executions WHERE tenant_id = tid;
  DELETE FROM public.instagram_channel_activity WHERE tenant_id = tid;
  DELETE FROM public.instagram_webhook_events WHERE tenant_id = tid;
  DELETE FROM public.instagram_follower_cache WHERE tenant_id = tid;
  DELETE FROM public.instagram_automation_schedules WHERE tenant_id = tid;
  DELETE FROM public.instagram_automation_media_targets WHERE tenant_id = tid;
  DELETE FROM public.instagram_automation_keyword_rules WHERE tenant_id = tid;
  DELETE FROM public.instagram_automation_flows WHERE tenant_id = tid;
  DELETE FROM public.instagram_automation_config WHERE tenant_id = tid;

  -- Billing
  DELETE FROM public.transactions WHERE tenant_id = tid;
  DELETE FROM public.subscriptions WHERE tenant_id = tid;

  -- Tenant satellite tables
  DELETE FROM public.tenant_marketplace_installs WHERE tenant_id = tid;
  DELETE FROM public.tenant_registrar_keys WHERE tenant_id = tid;
  DELETE FROM public.tenant_domains WHERE tenant_id = tid;
  DELETE FROM public.tenant_instagram_connections WHERE tenant_id = tid;
  DELETE FROM public.tenant_usage WHERE tenant_id = tid;

  -- Content & settings
  DELETE FROM public.coupons WHERE tenant_id = tid;
  DELETE FROM public.banners WHERE tenant_id = tid;
  DELETE FROM public.menu_items WHERE tenant_id = tid;
  DELETE FROM public.popup_settings WHERE tenant_id = tid;
  DELETE FROM public.property_features WHERE tenant_id = tid;
  DELETE FROM public.site_settings WHERE tenant_id = tid;
  DELETE FROM public.stay_categories WHERE tenant_id = tid;
  DELETE FROM public.leads WHERE tenant_id = tid;
  DELETE FROM public.notifications WHERE tenant_id = tid;
  DELETE FROM public.ai_search_logs WHERE tenant_id = tid;

  IF remove_tenant_row THEN
    DELETE FROM public.tenants WHERE id = tid;
    RAISE NOTICE 'Removed tenant row for demo@demo.com. Re-run supabase/manual_link_demo_tenant_demo_at_demo_com.sql before seeding again.';
  ELSE
    RAISE NOTICE 'Cleared data for tenant % (demo@demo.com); tenants row kept.', tid;
  END IF;
END $$;
