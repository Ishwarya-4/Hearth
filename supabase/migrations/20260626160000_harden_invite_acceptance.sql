-- Harden invite acceptance: fall back to auth.users email when profile row is missing/stale.

CREATE OR REPLACE FUNCTION public.accept_pending_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  accepted_count INTEGER := 0;
  inv RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  SELECT lower(trim(COALESCE(
    (SELECT email FROM public.profiles WHERE id = auth.uid()),
    (SELECT email FROM auth.users WHERE id = auth.uid())
  ))) INTO user_email;

  IF user_email IS NULL OR user_email = '' THEN
    RETURN 0;
  END IF;

  FOR inv IN
    SELECT * FROM public.invitations
    WHERE lower(trim(invited_email)) = user_email AND accepted = false
  LOOP
    INSERT INTO public.calendar_members (calendar_id, user_id, role)
    VALUES (inv.calendar_id, auth.uid(), inv.role)
    ON CONFLICT (calendar_id, user_id) DO NOTHING;
    UPDATE public.invitations SET accepted = true WHERE id = inv.id;
    accepted_count := accepted_count + 1;
  END LOOP;

  RETURN accepted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_pending_invitations() TO authenticated;
