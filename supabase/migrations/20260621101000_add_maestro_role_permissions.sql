-- Migration: Add default permissions for the 'maestro' role
-- Ensure it aligns with the 'docente' role permissions

INSERT INTO public.role_permissions (role, permissions) VALUES
  ('maestro', '{
    "dashboard": {"view": true, "edit": false},
    "analytics": {"view": false, "edit": false},
    "notifications": {"view": false, "edit": false},
    "sermons": {"view": true, "edit": false},
    "members": {"view": false, "edit": false},
    "map": {"view": false, "edit": false},
    "events": {"view": true, "edit": false},
    "ministries": {"view": true, "edit": false},
    "finances": {"view": false, "edit": false},
    "products": {"view": false, "edit": false},
    "pages": {"view": false, "edit": false},
    "users": {"view": false, "edit": false},
    "songs": {"view": true, "edit": false},
    "programs": {"view": true, "edit": false},
    "courses": {"view": true, "edit": true},
    "lms": {"view": true, "edit": true},
    "announcements": {"view": true, "edit": false},
    "chat": {"view": true, "edit": true}
  }'::jsonb)
ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions;
