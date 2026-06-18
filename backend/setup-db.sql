-- ═══════════════════════════════════════════════════════════
-- DevTools Pro — Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- Create the submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  selected_plan TEXT NOT NULL,
  utr_id TEXT NOT NULL UNIQUE,
  submission_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscription_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscription_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Cancelled')),
  meet_link TEXT,
  meet_scheduled BOOLEAN DEFAULT FALSE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast UTR lookups (duplicate checking)
CREATE INDEX IF NOT EXISTS idx_submissions_utr_id ON submissions (LOWER(utr_id));

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions (status);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions (LOWER(email));

-- Enable Row Level Security (RLS)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow inserts from the API (anon key)
CREATE POLICY "Allow inserts" ON submissions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow reads from the API (anon key)
CREATE POLICY "Allow reads" ON submissions
  FOR SELECT
  USING (true);

-- Policy: Allow updates from the API (anon key)
CREATE POLICY "Allow updates" ON submissions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- DONE! Your table is ready.
-- Now go to Settings → API and copy:
--   1. Project URL → SUPABASE_URL
--   2. anon public key → SUPABASE_KEY
-- ═══════════════════════════════════════════════════════════
