-- Enforce max 100 photos per stay.
ALTER TABLE public.stays
DROP CONSTRAINT IF EXISTS stays_images_max_100;

ALTER TABLE public.stays
ADD CONSTRAINT stays_images_max_100
CHECK (cardinality(images) <= 100);
