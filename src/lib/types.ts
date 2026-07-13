export interface DBModule {
  id: string;
  title: string;
  description: string | null;
  duration: string | null;
  order_index: number;
  level: string | null;
  color: string | null;
  icon: string | null;
  tag_id: string | null;
  price: number | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface QuizQuestion {
  question: string;
  options: string[];  // always 4 options
  correct: number;    // 0-3 index
  explanation?: string;
}

export interface DBLesson {
  id: string;
  module_id: string;
  title: string;
  type: 'video' | 'lectura' | 'practica' | 'evaluacion' | 'material';
  duration: string | null;
  video_url: string | null;
  file_url: string | null;
  content: string | null;
  description: string | null;
  order_index: number;
  is_free: boolean | null;
  tag_id: string | null;
  questions: QuizQuestion[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DBLessonTag {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string | null;
  created_at?: string | null;
}

export interface DBStudentProgress {
  id?: string;
  student_id: string;
  lesson_id: string;
  module_id: string;
  completed: boolean;
  completed_at?: string | null;
  created_at?: string | null;
}

export interface DBService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  service_type: string;
  active: boolean;
  reward_points: number;
  order_index: number;
  guarantee_window_days: number;
  guarantee_duration_minutes: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DBBooking {
  id: string;
  user_id: string | null;
  client_name: string;
  client_email: string;
  client_phone: string;
  booking_date: string;
  booking_time: string;
  total_duration_minutes: number;
  total_price: number;
  deposit_amount: number;
  deposit_paid: boolean;
  stripe_session_id?: string | null;
  professional_id?: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string | null;
  is_guarantee: boolean;
  guarantee_original_booking_id?: string | null;
  guarantee_original_professional_id?: string | null;
  guarantee_reason?: string | null;
  google_event_id?: string | null;
  booking_source?: 'web' | 'bot' | 'admin' | null;
  created_at?: string | null;
  updated_at?: string | null;
  payment_method?: string | null;
  booking_services?: DBBookingService[];
}

export interface DBBookingService {
  id: string;
  booking_id: string;
  service_id: string | null;
  service_name: string;
  price_at_booking: number;
  created_at?: string | null;
}

export interface DBProfessionalService {
  id: string;
  profile_id: string;
  service_id: string;
  created_at?: string | null;
}
