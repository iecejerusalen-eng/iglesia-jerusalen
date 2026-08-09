-- Public birthday directory with explicit member consent.
-- The public API deliberately omits birth year, age, phone and all CRM-only fields.

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS birthday_public boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.members.birthday_public IS
  'Explicit consent to publish name, photo, birthday day/month and ministry on the public birthday page.';

CREATE OR REPLACE FUNCTION public.get_public_birthdays()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  photo_url text,
  birth_month integer,
  birth_day integer,
  ministry_name text,
  dedicated_verse text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    member.id,
    member.first_name,
    member.last_name,
    member.photo_url,
    EXTRACT(MONTH FROM member.birth_date)::integer AS birth_month,
    EXTRACT(DAY FROM member.birth_date)::integer AS birth_day,
    ministry.name AS ministry_name,
    member.dedicated_verse
  FROM public.members AS member
  LEFT JOIN public.ministries AS ministry ON ministry.id = member.ministry_id
  WHERE member.deleted_at IS NULL
    AND member.birth_date IS NOT NULL
    AND member.birthday_public = true
  ORDER BY birth_month, birth_day, member.first_name, member.last_name;
$$;

REVOKE ALL ON FUNCTION public.get_public_birthdays() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_birthdays() TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_birthdays() IS
  'Privacy-safe public projection of consented CRM birthday records; never returns birth year, age or contact details.';
