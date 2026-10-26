-- Default-deny access for future browser-facing relations in the exposed public schema.
-- Existing tables, views, policies, and grants are unchanged.
-- New migrations must grant only the operations required by their RLS policies.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;