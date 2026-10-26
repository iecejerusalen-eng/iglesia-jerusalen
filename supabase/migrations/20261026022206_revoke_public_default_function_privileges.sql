-- PostgreSQL grants EXECUTE to PUBLIC for new functions globally unless revoked.
-- Remove that built-in grant so functions created by future migrations must be
-- explicitly opened to the API roles that need them.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
