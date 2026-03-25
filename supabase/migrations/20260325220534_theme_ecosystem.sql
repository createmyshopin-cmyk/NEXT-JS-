CREATE TABLE IF NOT EXISTS public.themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    version TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    preview TEXT,
    theme_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenant_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    theme_slug TEXT NOT NULL REFERENCES public.themes(slug) ON DELETE CASCADE,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, theme_slug)
);

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone can view themes" 
ON public.themes FOR SELECT 
USING (true);

CREATE POLICY "tenants can view their themes" 
ON public.tenant_themes FOR SELECT 
USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenants can manage their themes" 
ON public.tenant_themes FOR ALL 
USING (tenant_id = get_my_tenant_id());

-- Create themes storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('themes', 'themes', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies for themes bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'themes');

CREATE POLICY "Auth Insert" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'themes' AND auth.role() = 'authenticated');
