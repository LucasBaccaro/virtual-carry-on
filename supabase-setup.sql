-- SmartFit Supabase Database Setup
-- Execute these scripts in your Supabase SQL Editor

-- ============================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_body_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. OUTFIT CATEGORIES TABLE
-- ============================================
CREATE TABLE outfit_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE outfit_categories ENABLE ROW LEVEL SECURITY;

-- Policies for outfit_categories
CREATE POLICY "Users can view own categories" 
    ON outfit_categories FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" 
    ON outfit_categories FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" 
    ON outfit_categories FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" 
    ON outfit_categories FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================
-- 3. GARMENTS TABLE
-- ============================================
CREATE TABLE garments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('upper', 'lower', 'footwear', 'one-piece')),
    type TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE garments ENABLE ROW LEVEL SECURITY;

-- Policies for garments
CREATE POLICY "Users can view own garments" 
    ON garments FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own garments" 
    ON garments FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own garments" 
    ON garments FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own garments" 
    ON garments FOR DELETE 
    USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX garments_user_id_idx ON garments(user_id);
CREATE INDEX garments_category_idx ON garments(category);

-- ============================================
-- 4. SAVED OUTFITS TABLE
-- ============================================
CREATE TABLE saved_outfits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    model_used TEXT NOT NULL CHECK (model_used IN ('gemini-3-pro', 'gemini-2.5-flash')),
    category_id UUID REFERENCES outfit_categories(id) ON DELETE SET NULL,
    garment_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE saved_outfits ENABLE ROW LEVEL SECURITY;

-- Policies for saved_outfits
CREATE POLICY "Users can view own outfits" 
    ON saved_outfits FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfits" 
    ON saved_outfits FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outfits" 
    ON saved_outfits FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own outfits" 
    ON saved_outfits FOR DELETE 
    USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX saved_outfits_user_id_idx ON saved_outfits(user_id);
CREATE INDEX saved_outfits_category_id_idx ON saved_outfits(category_id);

-- ============================================
-- 5. STORAGE BUCKETS SETUP (via Dashboard)
-- ============================================
-- You need to create these buckets in the Supabase Dashboard > Storage:

-- Bucket: profile-photos
-- Public: Yes
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Bucket: garment-images
-- Public: Yes
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Bucket: generated-outfits
-- Public: Yes
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- ============================================
-- 6. STORAGE POLICIES (run after creating buckets)
-- ============================================

-- Profile Photos Policies
CREATE POLICY "Users can upload own profile photo"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'profile-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own profile photo"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'profile-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own profile photo"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'profile-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Garment Images Policies
CREATE POLICY "Users can upload own garment images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'garment-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own garment images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'garment-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view garment images"
ON storage.objects FOR SELECT
USING (bucket_id = 'garment-images');

-- Generated Outfits Policies
CREATE POLICY "Users can upload own generated outfits"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'generated-outfits' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own generated outfits"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'generated-outfits' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view generated outfits"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-outfits');
