-- migration_add_indexes.sql
-- Add missing indexes to foreign keys and heavily queried columns to improve query performance

-- Orders and Order Items
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);

-- Donations
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON public.donations(campaign_id);

-- Events and Attendance
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);

-- Members
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_member_id ON public.profiles(member_id);

-- LMS
CREATE INDEX IF NOT EXISTS idx_lms_sections_course_id ON public.lms_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_activities_section_id ON public.lms_activities(section_id);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_course_id ON public.lms_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_user_id ON public.lms_enrollments(user_id);

-- Chats
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON public.chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
