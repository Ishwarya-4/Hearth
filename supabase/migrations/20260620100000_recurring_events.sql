-- Recurring events support.
-- Adds three columns to events:
--   recurrence         - 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
--   recurrence_until   - optional date the repeat stops on (NULL = forever)
--   recurrence_exdates - occurrence start times that were deleted individually

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS recurrence TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recurrence_exdates TIMESTAMPTZ[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_recurrence_chk'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_recurrence_chk
      CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'yearly'));
  END IF;
END $$;
