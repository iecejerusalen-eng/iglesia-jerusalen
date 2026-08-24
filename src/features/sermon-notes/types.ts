export interface SermonBlankPrompt {
  id: string;
  question: string;
  hint?: string;
}

export interface SermonNoteTemplate {
  id: string;
  sermon_id: string;
  title: string;
  blanks_json: SermonBlankPrompt[];
  created_at?: string;
}

export interface UserSermonNote {
  id: string;
  user_id: string;
  sermon_id: string;
  filled_answers: Record<string, string>;
  personal_notes?: string;
  updated_at: string;
}
