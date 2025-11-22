-- SmartFit ML Recommendations Migration
-- Execute this in your Supabase SQL Editor

-- ============================================
-- 1. ADD METADATA COLUMNS TO GARMENTS TABLE
-- ============================================

-- Add metadata column (JSONB for flexible structure)
ALTER TABLE garments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add AI analysis column
ALTER TABLE garments ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}';

-- Add usage tracking columns
ALTER TABLE garments ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE garments ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS garments_metadata_idx ON garments USING GIN (metadata);
CREATE INDEX IF NOT EXISTS garments_ai_analysis_idx ON garments USING GIN (ai_analysis);
CREATE INDEX IF NOT EXISTS garments_usage_count_idx ON garments(usage_count DESC);
CREATE INDEX IF NOT EXISTS garments_last_used_idx ON garments(last_used_at DESC NULLS LAST);

-- ============================================
-- 2. ADD COLUMNS TO SAVED_OUTFITS TABLE
-- ============================================

-- Track outfit views
ALTER TABLE saved_outfits ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;
ALTER TABLE saved_outfits ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- ============================================
-- 3. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to increment garment usage
CREATE OR REPLACE FUNCTION increment_garment_usage(garment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE garments 
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = garment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get garment by ID (helper for recommendations)
CREATE OR REPLACE FUNCTION get_garment_by_id(garment_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  category TEXT,
  type TEXT,
  description TEXT,
  image_url TEXT,
  metadata JSONB,
  ai_analysis JSONB,
  usage_count INTEGER,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.user_id,
    g.category,
    g.type,
    g.description,
    g.image_url,
    g.metadata,
    g.ai_analysis,
    g.usage_count,
    g.last_used_at,
    g.created_at
  FROM garments g
  WHERE g.id = garment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN garments.metadata IS 'Structured metadata extracted by AI: colors, style, occasion, season, pattern, material';
COMMENT ON COLUMN garments.ai_analysis IS 'AI-generated analysis: detailed description, suggested pairings, formality, versatility';
COMMENT ON COLUMN garments.usage_count IS 'Number of times this garment has been used in outfits';
COMMENT ON COLUMN garments.last_used_at IS 'Timestamp of last time this garment was used';

-- ============================================
-- 5. SAMPLE DATA STRUCTURE (FOR REFERENCE)
-- ============================================

/*
Example metadata structure:
{
  "colors": ["negro", "gris"],
  "primaryColor": "negro",
  "style": "casual",
  "occasion": ["diario", "trabajo"],
  "season": ["otoño", "invierno", "primavera"],
  "pattern": "liso",
  "material": "algodón",
  "formality": "casual",
  "versatility": 9
}

Example ai_analysis structure:
{
  "detailedDescription": "Remera negra básica de algodón con cuello redondo...",
  "suggestedPairings": ["jeans", "pantalones chinos", "joggers"],
  "formality": "casual",
  "versatility": 10,
  "analyzedAt": "2025-11-22T10:00:00Z"
}
*/
