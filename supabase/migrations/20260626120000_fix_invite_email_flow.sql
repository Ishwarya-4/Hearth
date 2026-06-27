-- Fix invite flow: case-insensitive email matching + accept pending invites on login
-- (not only at signup).

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

  SELECT email INTO user_email FROM public.profiles WHERE id = auth.uid();
  IF user_email IS NULL OR user_email = '' THEN
    RETURN 0;
  END IF;

  user_email := lower(trim(user_email));

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

-- Signup hook: match invitations case-insensitively
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_cal_id UUID;
  default_color TEXT;
  inv RECORD;
BEGIN
  default_color := (ARRAY['#f97316','#ef4444','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899'])[1 + (abs(hashtext(NEW.id::text)) % 8)];

  INSERT INTO public.profiles (id, email, full_name, avatar_url, color)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    default_color
  );

  INSERT INTO public.calendars (name, color, is_personal, owner_id)
  VALUES ('My Calendar', default_color, true, NEW.id)
  RETURNING id INTO new_cal_id;

  INSERT INTO public.calendar_members (calendar_id, user_id, role)
  VALUES (new_cal_id, NEW.id, 'owner')
  ON CONFLICT (calendar_id, user_id) DO NOTHING;

  FOR inv IN
    SELECT * FROM public.invitations
    WHERE lower(trim(invited_email)) = lower(trim(NEW.email)) AND accepted = false
  LOOP
    INSERT INTO public.calendar_members (calendar_id, user_id, role)
    VALUES (inv.calendar_id, NEW.id, inv.role)
    ON CONFLICT (calendar_id, user_id) DO NOTHING;
    UPDATE public.invitations SET accepted = true WHERE id = inv.id;
  END LOOP;

  RETURN NEW;
END; $$;
