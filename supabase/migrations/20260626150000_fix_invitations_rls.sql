-- Fix "permission denied for table users" on invite send.
-- RLS policies must not read auth.users (authenticated role has no access).
-- Also allow calendar owners to UPDATE invitations (needed for upsert re-sends).

DROP POLICY IF EXISTS "invitations_select_owner_or_invited" ON public.invitations;
DROP POLICY IF EXISTS "invitations_update_invited" ON public.invitations;
DROP POLICY IF EXISTS "invitations_update_owner" ON public.invitations;

CREATE POLICY "invitations_select_owner_or_invited" ON public.invitations FOR SELECT TO authenticated
  USING (
    invited_by = auth.uid()
    OR lower(trim(invited_email)) = lower(trim((SELECT email FROM public.profiles WHERE id = auth.uid())))
  );

CREATE POLICY "invitations_update_invited" ON public.invitations FOR UPDATE TO authenticated
  USING (
    lower(trim(invited_email)) = lower(trim((SELECT email FROM public.profiles WHERE id = auth.uid())))
  );

CREATE POLICY "invitations_update_owner" ON public.invitations FOR UPDATE TO authenticated
  USING (invited_by = auth.uid())
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.calendars c WHERE c.id = calendar_id AND c.owner_id = auth.uid())
  );
