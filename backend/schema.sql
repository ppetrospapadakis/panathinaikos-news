-- Database Schema for Panathinaikos News (Supabase PostgreSQL)

-- 1. Create articles table
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    source_url TEXT UNIQUE NOT NULL,
    image_url TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    group_id UUID,
    bullets TEXT[]
);

-- Ensure columns exist (for migrating existing database tables)
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS group_id UUID;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS bullets TEXT[];

-- 2. Create indices for optimized query performance
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_group_id ON public.articles(group_id);
CREATE INDEX IF NOT EXISTS idx_articles_category_created_at ON public.articles(category, created_at DESC);

-- 3. Automatic updated_at trigger helper function
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to run before updates
CREATE OR REPLACE TRIGGER set_articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Allow anyone (public, anonymous, authenticated) to read articles
DROP POLICY IF EXISTS "Allow public read access to articles" ON public.articles;
CREATE POLICY "Allow public read access to articles" 
    ON public.articles 
    FOR SELECT 
    USING (true);

-- Only service role or authenticated roles can write/insert/update articles
DROP POLICY IF EXISTS "Allow service role write access to articles" ON public.articles;
CREATE POLICY "Allow service role write access to articles" 
    ON public.articles 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Allow anonymous key write access to articles (necessary for scraper using anon key)
DROP POLICY IF EXISTS "Allow anon write access to articles" ON public.articles;
CREATE POLICY "Allow anon write access to articles" 
    ON public.articles 
    FOR ALL 
    TO anon 
    USING (true) 
    WITH CHECK (true);
