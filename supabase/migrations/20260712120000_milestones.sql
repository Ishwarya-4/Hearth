-- =====================================================================
-- Hearth — first-class milestones (Pillar A: Look forward together).
--
-- Milestones (anniversaries, birthdays, "firsts") were only ever *implicit*:
-- any all-day + yearly event was treated as one. This makes them explicit so
-- the couple's love story has real objects on the timeline — and so Today can
-- count down to them and say "3 years together" rather than just repeating a
-- date every year.
--
-- A milestone is still an ordinary event (it reuses the whole recurrence /
-- RSVP / colour machinery). It just carries a type, and its `start_at` is the
-- ORIGINAL date — the wedding, the birth, the first date — so that
-- (occurrence year − start year) is the number of years.
--
-- Run once in the Supabase SQL Editor.
-- =====================================================================

-- Ensure recurrence columns exist (from 20260620100000). Safe if already applied.
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

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS milestone TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_milestone_chk'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_milestone_chk
      CHECK (milestone IS NULL OR milestone IN ('anniversary', 'birthday', 'first', 'other'));
  END IF;
END $$;

-- Upgrade the events that were already behaving like milestones (all-day +
-- yearly), guessing the type from the title. Anything unrecognised becomes a
-- generic milestone rather than being silently dropped.
UPDATE public.events
SET milestone = CASE
  WHEN title ILIKE '%anniversar%' THEN 'anniversary'
  WHEN title ILIKE '%birthday%' OR title ILIKE '%bday%' THEN 'birthday'
  ELSE 'other'
END
WHERE milestone IS NULL
  AND all_day = TRUE
  AND recurrence = 'yearly';

-- Today's milestone rail reads "the next few, soonest first" on every load.
CREATE INDEX IF NOT EXISTS events_milestone_idx
  ON public.events (calendar_id, milestone)
  WHERE milestone IS NOT NULL;
