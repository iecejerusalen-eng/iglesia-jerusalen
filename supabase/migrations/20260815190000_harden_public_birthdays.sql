-- Birthday privacy hardening and public projection reliability.
-- Existing values are intentionally preserved so current public records do not
-- disappear during deployment. New member records are private by default.

ALTER TABLE public.members
  ALTER COLUMN birthday_public SET DEFAULT false;

COMMENT ON COLUMN public.members.birthday_public IS
  'Controls explicit authorization to publish name, photo, birthday day/month, ministry and dedicated verse on the public birthday page. New members are private by default.';

CREATE INDEX IF NOT EXISTS members_public_birthdays_date_idx
  ON public.members (birth_date, first_name, last_name)
  WHERE deleted_at IS NULL
    AND birth_date IS NOT NULL
    AND birthday_public = true;

-- The members table is protected by CRM RLS. This narrowly scoped projection
-- is intentionally SECURITY DEFINER so anonymous visitors can read only the
-- consented public fields, never the CRM table itself.
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
    AND member.birthday_public IS TRUE
  ORDER BY birth_month, birth_day, member.first_name, member.last_name;
$$;

REVOKE ALL ON FUNCTION public.get_public_birthdays() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_birthdays() TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_birthdays() IS
  'Privacy-safe public projection of consented CRM birthday records; never returns birth year, age, phone or private CRM fields.';
