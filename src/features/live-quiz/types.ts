export type LiveQuizStatus = 'waiting' | 'in_progress' | 'finished' | 'expired';
export type LiveQuizPhase = 'lobby' | 'question' | 'reveal' | 'finished';
export type LiveQuizOptionKey = 'a' | 'b' | 'c' | 'd';
export type LiveQuizScoreMode = 'speed' | 'accuracy';
export type LiveQuizQuestionType = 'multiple_choice' | 'true_false';

export interface LiveQuizPresentation {
  subtitle: string;
  cover_image_url: string;
  cover_image_alt: string;
  background_color: string;
  accent_color: string;
}

export interface LiveQuizEditorQuestion {
  id: string;
  type: LiveQuizQuestionType;
  text: string;
  options: Array<{ key: LiveQuizOptionKey; text: string }>;
  correct_option: LiveQuizOptionKey;
  time_seconds: number;
  explanation: string;
  bible_reference: string;
  image_url: string;
  image_alt: string;
  color: string;
}

export interface LiveQuizEditorContent {
  title: string;
  presentation: LiveQuizPresentation;
  questions: LiveQuizEditorQuestion[];
}

export interface LiveQuizRoomSummary {
  id: string;
  pin: string;
  title: string;
  status: LiveQuizStatus;
  phase: LiveQuizPhase;
  question_count: number;
  team_mode: boolean;
  score_mode: LiveQuizScoreMode;
  expires_at: string;
  created_at: string;
  player_count: number;
}

export interface LiveQuizQuestion {
  text: string;
  type: LiveQuizQuestionType;
  options: Array<{ key: LiveQuizOptionKey; text: string }>;
  correct_option: LiveQuizOptionKey | null;
  explanation: string | null;
  bible_reference: string | null;
  image_url: string | null;
  image_alt: string | null;
  color: string | null;
  index: number;
  count: number;
}

export interface LiveQuizPlayer {
  id: string;
  nickname: string;
  score: number;
  team_name: string | null;
  answered_current: boolean;
}

export interface LiveQuizTeamScore {
  name: string;
  score: number;
  player_count: number;
}

export interface LiveQuizQuestionReport {
  index: number;
  question: string;
  correct_option: LiveQuizOptionKey;
  answers: number;
  correct_answers: number;
  average_response_ms: number;
}

export interface LiveQuizReflection {
  nickname: string;
  response: string;
}

export interface LiveQuizSnapshot {
  room: {
    id: string;
    pin: string;
    title: string;
    status: LiveQuizStatus;
    phase: LiveQuizPhase;
    question_index: number;
    question_count: number;
    question_seconds: number;
    question_started_at: string | null;
    team_mode: boolean;
    team_names: string[];
    score_mode: LiveQuizScoreMode;
    reflection_prompt: string | null;
    expires_at: string;
    created_at: string;
    presentation: LiveQuizPresentation;
  };
  is_host: boolean;
  question: LiveQuizQuestion | null;
  players: LiveQuizPlayer[];
  teams: LiveQuizTeamScore[];
  question_report: LiveQuizQuestionReport[] | null;
  reflections: LiveQuizReflection[];
  my_reflection: string | null;
  player_count: number;
  answered_current: boolean;
  my_answer: LiveQuizOptionKey | null;
}

export interface LiveQuizSession {
  pin: string;
  roomId: string;
  playerToken: string | null;
}
