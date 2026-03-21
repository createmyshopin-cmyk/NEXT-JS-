-- Instagram App ID (Meta → Instagram product) for Instagram Business Login OAuth; optional alongside Facebook App ID.
ALTER TABLE saas_meta_platform_config
  ADD COLUMN IF NOT EXISTS instagram_app_id text NOT NULL DEFAULT '';

COMMENT ON COLUMN saas_meta_platform_config.instagram_app_id IS 'Instagram app ID from Meta App Dashboard (Instagram product). Used for www.instagram.com/oauth/authorize when set.';
