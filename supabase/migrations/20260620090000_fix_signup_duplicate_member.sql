-- Fix: signup fails with 500 "duplicate key value violates unique constraint
-- calendar_members_calendar_id_user_id_key".
--
-- Cause: on signup, handle_new_user() inserts the personal calendar, which fires
-- the on_calendar_created trigger -> add_owner_as_member() and adds the owner
-- membership. handle_new_user() then tried to insert the SAME membership again
-- with a plain INSERT, hitting the unique constraint and aborting the whole
-- signup transaction.
--
-- Fix: make handle_new_user()'s membership insert idempotent with
-- ON CONFLICT DO NOTHING (the trigger already guarantees the owner membership).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_cal_id UUID;
  default_color TEXT;
  inv RECORD;
BEGIN
  -- pick a color from a palette based on user id hash
  default_color := (ARRAY['#f97316','#ef4444','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899'])[1 + (abs(hashtext(NEW.id::text)) % 8)];

  INSERT INTO public.profiles (id, email, full_name, avatar_url, color)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    default_color
  );

  -- personal calendar (the on_calendar_created trigger adds the owner membership)
  INSERT INTO public.calendars (name, color, is_personal, owner_id)
  VALUES ('My Calendar', default_color, true, NEW.id)
  RETURNING id INTO new_cal_id;

  -- idempotent: owner membership may already exist from add_owner_as_member()
  INSERT INTO public.calendar_members (calendar_id, user_id, role)
  VALUES (new_cal_id, NEW.id, 'owner')
  ON CONFLICT (calendar_id, user_id) DO NOTHING;

  -- auto-accept any pending invitations for this email
  FOR inv IN SELECT * FROM public.invitations WHERE invited_email = NEW.email AND accepted = false LOOP
    INSERT INTO public.calendar_members (calendar_id, user_id, role)
    VALUES (inv.calendar_id, NEW.id, inv.role)
    ON CONFLICT DO NOTHING;
    UPDATE public.invitations SET accepted = true WHERE id = inv.id;
  END LOOP;

  RETURN NEW;
END; $$;
