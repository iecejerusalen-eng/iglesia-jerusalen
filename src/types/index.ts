export type UserRole = 'admin' | 'pastor' | 'editor' | 'secretary' | 'secretaria' | 'leader' | 'member' | 'guest' | 'apoyo' | 'multimedia' | 'maestro' | 'docente' | 'estudiante' | 'student' | 'musico';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  roles?: UserRole[] | null;
  ministry_id?: string | null;
  allowed_ministries?: string[] | null;
  email?: string | null;
  permissions_override?: Record<string, { view: boolean; edit: boolean }> | null;
  photo_url?: string | null;
  member_id?: string | null;
  member?: { id: string; first_name: string; last_name: string } | null;
  created_at: string;
  updated_at: string;
  banned?: boolean;
}

export interface PetitionCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface Petition {
  id: string;
  user_id: string;
  category_id: string | null;
  content: string;
  status: 'pendiente' | 'en_oracion' | 'respondida';
  created_at: string;
  profiles?: { first_name: string | null; last_name: string | null; email?: string | null } | null;
  petition_categories?: { name: string } | null;
}

export type ProductType = 'physical' | 'digital';
export type OrderStatus = 'pending_payment' | 'paid' | 'ready_for_pickup' | 'completed' | 'cancelled';

export interface ProductVariant {
  id: string;
  product_id: string;
  color_name: string | null;
  color_hex: string | null;
  size: string | null;
  cloudinary_image_url: string | null;
  stock: number;
  price_adjustment: number;
  created_at?: string;
}

export interface ProductDigitalAsset {
  id: string;
  product_id: string;
  drive_link: string;
  instructions: string | null;
  created_at?: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  goal_amount: number | null;
  current_amount: number | null;
  image_url: string | null;
  status: 'active' | 'completed' | 'paused';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface VolunteerShift {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  ministry_id: string | null;
  required_volunteers: number;
  created_at: string;
  ministries?: { name: string; theme_color?: string } | null;
}

export interface VolunteerAssignment {
  id: string;
  shift_id: string;
  member_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  created_at: string;
  volunteer_shifts?: VolunteerShift | null;
  members?: Member | null;
}

export interface Space {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  features: string[] | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SpaceBooking {
  id: string;
  space_id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
  spaces?: Space | null;
  users?: { id: string; email: string } | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_price?: number | null;
  promo_tag?: string | null;
  image_url: string | null;
  stock: number;
  category: string;
  type?: ProductType;
  ecommerce_product_type?: 'physical' | 'digital';
  digital_file_url?: string | null;
  features?: unknown; // JSONB array of features/specs
  cover_image_url?: string | null;
  deleted_at?: string | null;
  created_at: string;
  product_variants?: ProductVariant[];
  product_digital_assets?: ProductDigitalAsset | null;
}

export interface DonationCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Donation {
  id: string;
  donor_name: string | null;
  donor_email: string;
  amount: number;
  category_id: string | null;
  category_name_backup: string | null;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  donation_categories?: DonationCategory | null;
}

export type EcommercePaymentMethod = 'payphone' | 'de_una' | 'transfer' | string;
export type EcommercePaymentStatus = 'pending' | 'paid' | 'verifying' | 'failed' | string;
export type EcommerceFulfillmentStatus = 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | string;

export interface Order {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  subtotal?: number;
  payment_fee?: number;
  total: number;
  status: OrderStatus;
  payment_method?: string;
  payment_voucher_url?: string | null;
  ecommerce_payment_method?: EcommercePaymentMethod;
  ecommerce_payment_status?: EcommercePaymentStatus;
  ecommerce_fulfillment_status?: EcommerceFulfillmentStatus;
  payment_receipt_url?: string | null;
  refund_status?: string;
  refunded_amount?: number;
  refund_reason?: string | null;
  shipping_recipient_name?: string | null;
  shipping_phone?: string | null;
  shipping_override_address?: string | null;
  shipping_status_notes?: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  price: number;
  products?: Product;
  product_variants?: ProductVariant | null;
}

export interface Sermon {
  id: string;
  title: string;
  content: string;
  youtube_url: string | null;
  pastor_name: string;
  description?: string | null;
  date?: string;
  created_at: string;
  thumbnail_url?: string | null;
  video_url?: string | null;
}

export interface Schedule {
  id: string;
  day: string;
  title: string;
  time_range: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface CatalogRole {
  id: string;
  name: string;
  category: 'Roles' | 'Talentos' | 'Dones' | 'Área de Servicios';
  created_at?: string;
}

export interface Cell {
  id: string;
  name: string;
  leader_id: string | null;
  sector: string | null;
  latitude: number;
  longitude: number;
  deleted_at?: string | null;
  created_at: string;
  profiles?: { first_name: string | null; last_name: string | null } | null;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  is_recurring: boolean;
  recurrence_type?: 'diario' | 'semanal' | 'anual' | null;
  recurrence_days?: number[] | null;
  cover_image_url?: string | null;
  emoji?: string | null;
  ministry_id: string | null;
  leaders_in_charge: string[];
  is_public?: boolean;
  created_at: string;
  ministries?: { name: string; slug: string; theme_color?: string } | null;
}

export interface Career {
  id: string;
  name: string;
  created_at?: string;
}

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  birth_date: string | null;
  conversion_date: string | null;
  baptism_date: string | null;
  phone: string | null;
  dni: string | null;
  address: string | null;
  maps_link: string | null;
  is_leader: boolean;
  leadership_role: string | null;
  ministry_id: string | null;
  role_id: string | null;
  latitude?: number | null;
  longitude?: number | null;
  gender?: 'Masculino' | 'Femenino' | 'Otro' | null;
  education_level?: string | null;
  career_id?: string | null;
  is_studying?: boolean | null;
  studying_career_id?: string | null;
  deleted_at?: string | null;
  tithes_sum: number;
  phone_country_code?: string | null;
  dedicated_verse?: string | null;
  created_at: string;
  member_emails?: { email: string }[];
  member_service_areas?: { catalog_roles: CatalogRole }[];
  member_talents?: { catalog_roles: CatalogRole }[];
  member_spiritual_gifts?: { catalog_roles: CatalogRole }[];
  ministries?: { name: string } | null;
  catalog_roles?: CatalogRole | null;
  profiles?: Profile[];
  careers?: Career | null;
  studying_careers?: Career | null;
}

export interface FormResponse {
  id: string;
  block_id: string;
  page_id: string;
  user_id: string | null;
  member_name: string | null;
  member_email: string | null;
  answers: Record<string, unknown>;
  score: number;
  max_score: number;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  type: 'whatsapp' | 'push';
  title: string;
  message: string;
  recipient_group: string;
  status: 'enviado' | 'fallido' | 'programado';
  created_at: string;
  category?: 'general' | 'cumpleanos' | 'aniversario' | 'reunion' | 'evento' | null;
  scheduled_at?: string | null;
  sender_id?: string | null;
  target_ministry_id?: string | null;
}

export interface CloudinaryAsset {
  public_id: string;
  secure_url: string;
  resource_type: 'image' | 'video' | 'raw';
  format: string;
}

export interface SongType {
  id: string;
  name: string;
  created_at: string;
}

export interface SongStyle {
  id: string;
  name: string;
  created_at: string;
}

export interface SongResourceLink {
  id: string;
  instrument: 'General' | 'Batería' | 'Piano' | 'Guitarra' | 'Bajo' | 'Voz' | 'Viento' | 'Otro';
  url: string;
  comment: string | null;
}

export interface SongStructureBlock {
  id: string;
  type: 'intro' | 'estrofa' | 'coro' | 'puente' | 'outro' | 'melodia' | 'otro';
  label: string;
  lyrics: string;
  melody: string | null;
}

export interface Song {
  id: string;
  title: string;
  artist: string | null;
  bpm: number | null;
  type_id: string | null;
  style_id: string | null;
  lyrics: string;
  has_chords: boolean;
  drum_style?: string | null;
  resource_links?: SongResourceLink[] | null;
  structure_blocks?: SongStructureBlock[] | null;
  created_at: string;
  song_types?: SongType | null;
  song_styles?: SongStyle | null;
}

export interface ProgramModule {
  id: string;
  program_id: string;
  title: string;
  description: string | null;
  order: number;
  created_at: string;
  program_lessons?: ProgramLesson[];
}

export interface Program {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  created_at: string;
  program_lessons?: ProgramLesson[];
  program_modules?: ProgramModule[];
}

export interface ProgramLesson {
  id: string;
  program_id: string;
  module_id?: string | null;
  title: string;
  public_content: string;
  teacher_content: string;
  order: number;
  created_at: string;
}

export interface Ministry {
  id: string;
  name: string;
  slug: string;
  category: 'departamento' | 'servicio';
  description: string | null;
  leader_name: string | null;
  schedule: string | null;
  image_url: string | null;
  theme_color: string;
  anniversary_date: string | null;
  created_at: string;
}

export interface MinistryMember {
  id: string;
  ministry_id: string;
  member_id: string | null;
  member_name: string | null;
  role: string;
  created_at: string;
  members?: Member | null;
  ministries?: Ministry | null;
}

export interface MemberAvailability {
  id: string;
  member_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
  members?: Member | null;
}

export interface MinistryMeetingNote {
  id: string;
  ministry_id: string;
  event_id?: string | null;
  date: string;
  content: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  events?: Event | null;
  profiles?: Profile | null;
}

export type LogoVariant = 'cuadrado' | 'circular' | 'vertical' | 'horizontal';
export type LogoColorMode = 'color' | 'blanco_y_negro' | 'blanco_solido' | 'negro_solido';

export interface Logo {
  id: string;
  ministry_id: string | null;
  variant: LogoVariant;
  color_mode: LogoColorMode;
  format: string;
  storage_path: string;
  created_at: string;
  ministries?: { name: string } | null;
}

export interface ReadingPlan {
  id: string;
  title: string;
  description: string | null;
  total_chapters: number;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Chat {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at: string;
  participants?: Profile[];
  last_message?: Message | null;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile | null;
}

export interface ChatParticipant {
  chat_id: string;
  user_id: string;
  joined_at: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category_id: string | null;
  photo_url: string | null;
  video_url: string | null;
  purchase_date: string | null;
  product_link: string | null;
  price: number;
  status: 'buen_estado' | 'reparacion' | 'critico';
  quantity: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  inventory_categories?: { name: string } | null;
}

export interface LMSCourse {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  format: 'weekly' | 'topics';
  grading_scale: string;
  is_published: boolean;
  capacity?: number;
  start_date?: string;
  duration?: string;
  schedule?: string;
  category_id?: string;
  created_at: string;
  updated_at: string;
  lms_sections?: LMSSection[];
  lms_subjects?: LMSSubject[];
  lms_course_categories?: { name: string } | null;
}

export interface LMSSubject {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  lms_modules?: LMSModule[];
}

export interface LMSModule {
  id: string;
  subject_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  lms_lessons?: LMSLesson[];
}

export interface LMSLesson {
  id: string;
  module_id: string;
  title: string;
  type: 'document' | 'video' | 'quiz' | 'forum' | 'h5p' | 'assignment' | 'video_link' | 'resource' | 'h5p_embed';
  content: string | null;
  description: string | null;
  settings?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface LMSLessonCompletion {
  id: string;
  lesson_id: string;
  student_id: string;
  is_completed: boolean;
  completed_at: string;
}

export interface LMSLessonSubmission {
  id: string;
  lesson_id: string;
  student_id: string;
  file_url: string | null;
  text_content: string | null;
  grade: string | null;
  teacher_feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
}

export interface LMSLessonForumPost {
  id: string;
  lesson_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
  replies?: LMSLessonForumPost[];
}

export interface StoreCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface StoreSupplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: 'pending' | 'active' | 'inactive';
  kyc_tax_id_status: 'pending' | 'approved' | 'rejected';
  kyc_bank_status: 'pending' | 'approved' | 'rejected';
  kyc_agreement_status: 'pending' | 'approved' | 'rejected';
  kyc_notes: string | null;
  created_at: string;
}

export interface StoreDispute {
  id: string;
  order_id: string;
  user_id: string | null;
  type: 'fraud_suspicion' | 'broken_item' | 'wrong_item' | 'not_received' | 'other';
  description: string;
  status: 'open' | 'under_investigation' | 'resolved' | 'dismissed';
  resolution_notes: string | null;
  created_at: string;
  profiles?: Profile | null;
  orders?: Order | null;
}

export interface LMSSection {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  is_presentation_block: boolean;
  order_index: number;
  created_at: string;
  lms_activities?: LMSActivity[];
}

export interface LMSActivity {
  id: string;
  section_id: string;
  title: string;
  type: 'resource' | 'forum' | 'assignment' | 'quiz' | 'h5p_embed' | 'video_link' | 'document' | 'video' | 'h5p';
  content: string | null;
  teacher_content: string | null;
  settings: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
  description?: string | null;
  requires_completion_of: string | null;
  weighting: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface LMSEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  role: 'student' | 'teacher' | 'admin';
  created_at: string;
  lms_courses?: LMSCourse;
}

export interface LMSActivityCompletion {
  id: string;
  activity_id: string;
  student_id: string;
  is_completed: boolean;
  completed_at: string;
}

export interface LMSAssignmentSubmission {
  id: string;
  activity_id: string;
  student_id: string;
  file_url: string | null;
  text_content: string | null;
  grade: string | null;
  teacher_feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
}

export interface LMSForumPost {
  id: string;
  activity_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
  replies?: LMSForumPost[];
}

export interface OpenResource {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  open_sections?: OpenSection[];
}

export interface OpenSection {
  id: string;
  resource_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  open_activities?: OpenActivity[];
}

export interface OpenActivity {
  id: string;
  section_id: string;
  title: string;
  type: string;
  content: string | null;
  settings: Record<string, unknown>;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Study {
  id: string;
  title: string;
  description: string | null;
  category: 'Damas' | 'Caballeros' | 'Jóvenes' | 'Generales';
  cover_image_url: string | null;
  pdf_url: string | null;
  video_url: string | null;
  read_now_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface StorePaymentMethod {
  id: string;
  name: string;
  active: boolean;
  fee_percent: number;
}

export interface StoreShippingMethod {
  id: string;
  name: string;
  active: boolean;
  base_cost: number;
  description?: string;
}

export interface ChurchSettings {
  id: number;
  phone?: string;
  email?: string;
  address?: string;
  google_maps_url?: string;
  bank_name?: string;
  bank_account?: string;
  ruc?: string;
  facebook_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  chat_retention_days?: number;
  payphone_fee_percent?: number;
  de_una_fee_percent?: number;
  payment_methods?: StorePaymentMethod[];
  shipping_methods?: StoreShippingMethod[];
  created_at?: string;
  updated_at?: string;
}
