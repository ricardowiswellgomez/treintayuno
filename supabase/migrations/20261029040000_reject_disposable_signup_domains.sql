-- Reject known disposable email providers at the authentication storage boundary.
-- This trigger applies to direct Auth API calls as well as the app's guarded signup route.
BEGIN;

CREATE OR REPLACE FUNCTION public.reject_disposable_signup_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  domain_name text;
  blocked_domains text[] := ARRAY[
    '37xiao.com',
    'temp-mail.org', 'temp-mail.io', 'tempmail.com', 'tempmail.net',
    '10minutemail.com', '10minutemail.net',
    'guerrillamail.com', 'guerrillamail.net',
    'mailinator.com', 'yopmail.com', 'yopmail.fr',
    'dispostable.com', 'maildrop.cc', 'getnada.com',
    'trashmail.com', 'trashmail.net', 'sharklasers.com', 'grr.la',
    'fakeinbox.com', 'mohmal.com', 'emailondeck.com',
    'throwawaymail.com', 'mintemail.com', 'tempr.email',
    'inboxkitten.com', 'discard.email', 'crazymailing.com',
    'burnermail.io', 'mailnesia.com', 'tempail.com',
    'mailcatch.com', 'mytemp.email', 'tempmailo.com'
  ];
BEGIN
  IF NEW.email IS NULL OR position('@' IN NEW.email) = 0 THEN
    RETURN NEW;
  END IF;

  domain_name := lower(rtrim(split_part(btrim(NEW.email), '@', 2), '.'));
  IF EXISTS (
    SELECT 1
    FROM unnest(blocked_domains) AS d(domain)
    WHERE domain_name = d.domain
       OR domain_name LIKE '%.' || d.domain
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'Use a permanent email address to create an account.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_disposable_signup_email() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reject_disposable_signup_email ON auth.users;
CREATE TRIGGER reject_disposable_signup_email
  BEFORE INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_disposable_signup_email();

COMMIT;
