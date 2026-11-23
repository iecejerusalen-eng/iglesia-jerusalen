import { supabase } from '../../config/supabase';
import type {
  LiveQuizOptionKey,
  LiveQuizPlayer,
  LiveQuizQuestion,
  LiveQuizRoomSummary,
  LiveQuizSnapshot,
  LiveQuizStatus,
  LiveQuizPhase,
  LiveQuizScoreMode,
  LiveQuizTeamScore,
  LiveQuizQuestionReport,
  LiveQuizReflection,
  LiveQuizEditorContent,
  LiveQuizEditorQuestion,
  LiveQuizPresentation,
  LiveQuizQuestionType,
} from './types';

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as JsonRecord;
  throw new Error('El servidor devolvió una respuesta inesperada.');
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function statusValue(value: unknown): LiveQuizStatus {
  return value === 'in_progress' || value === 'finished' || value === 'expired' ? value : 'waiting';
}

function phaseValue(value: unknown): LiveQuizPhase {
  return value === 'question' || value === 'reveal' || value === 'finished' ? value : 'lobby';
}

function optionValue(value: unknown): LiveQuizOptionKey | null {
  return value === 'a' || value === 'b' || value === 'c' || value === 'd' ? value : null;
}

const DEFAULT_PRESENTATION: LiveQuizPresentation = {
  subtitle: 'Descubramos juntos lo que enseñan las Escrituras',
  cover_image_url: '',
  cover_image_alt: '',
  background_color: '#eef2ff',
  accent_color: '#1e3a8a',
};

function questionTypeValue(value: unknown): LiveQuizQuestionType {
  return value === 'true_false' ? 'true_false' : 'multiple_choice';
}

function parseEditorQuestion(value: unknown, index: number): LiveQuizEditorQuestion {
  const item = record(value);
  const options = Array.isArray(item.options) ? item.options.flatMap((rawOption) => {
    if (!rawOption || typeof rawOption !== 'object' || Array.isArray(rawOption)) return [];
    const option = record(rawOption);
    const key = optionValue(option.key);
    return key ? [{ key, text: stringValue(option.text) }] : [];
  }) : [];
  return {
    id: stringValue(item.id, `question-${index + 1}`),
    type: questionTypeValue(item.type),
    text: stringValue(item.text),
    options,
    correct_option: optionValue(item.correct_option) ?? 'a',
    time_seconds: numberValue(item.time_seconds, 20),
    explanation: stringValue(item.explanation),
    bible_reference: stringValue(item.bible_reference),
    image_url: stringValue(item.image_url),
    image_alt: stringValue(item.image_alt),
    color: stringValue(item.color, DEFAULT_PRESENTATION.accent_color),
  };
}

function parsePresentation(value: unknown): LiveQuizPresentation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...DEFAULT_PRESENTATION };
  const item = record(value);
  return {
    subtitle: stringValue(item.subtitle, DEFAULT_PRESENTATION.subtitle),
    cover_image_url: stringValue(item.cover_image_url),
    cover_image_alt: stringValue(item.cover_image_alt),
    background_color: stringValue(item.background_color, DEFAULT_PRESENTATION.background_color),
    accent_color: stringValue(item.accent_color, DEFAULT_PRESENTATION.accent_color),
  };
}

function scoreModeValue(value: unknown): LiveQuizScoreMode {
  return value === 'accuracy' ? 'accuracy' : 'speed';
}

function parsePlayer(value: unknown): LiveQuizPlayer {
  const item = record(value);
  return {
    id: stringValue(item.id),
    nickname: stringValue(item.nickname, 'Participante'),
    score: numberValue(item.score),
    team_name: stringValue(item.team_name) || null,
    answered_current: item.answered_current === true,
  };
}

function parseTeam(value: unknown): LiveQuizTeamScore {
  const item = record(value);
  return {
    name: stringValue(item.name),
    score: numberValue(item.score),
    player_count: numberValue(item.player_count),
  };
}

function parseQuestionReport(value: unknown): LiveQuizQuestionReport {
  const item = record(value);
  return {
    index: numberValue(item.index),
    question: stringValue(item.question),
    correct_option: optionValue(item.correct_option) ?? 'a',
    answers: numberValue(item.answers),
    correct_answers: numberValue(item.correct_answers),
    average_response_ms: numberValue(item.average_response_ms),
  };
}

function parseReflection(value: unknown): LiveQuizReflection {
  const item = record(value);
  return {
    nickname: stringValue(item.nickname, 'Participante'),
    response: stringValue(item.response),
  };
}

function parseQuestion(value: unknown): LiveQuizQuestion | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const item = record(value);
  const rawOptions = Array.isArray(item.options) ? item.options : [];
  const options = rawOptions.flatMap((rawOption) => {
    const candidate = record(rawOption);
    const key = optionValue(candidate.key);
    return key ? [{ key, text: stringValue(candidate.text) }] : [];
  });
  return {
    text: stringValue(item.text),
    type: questionTypeValue(item.type),
    options,
    correct_option: optionValue(item.correct_option),
    explanation: stringValue(item.explanation) || null,
    bible_reference: stringValue(item.bible_reference) || null,
    image_url: stringValue(item.image_url) || null,
    image_alt: stringValue(item.image_alt) || null,
    color: stringValue(item.color) || null,
    index: numberValue(item.index, 1),
    count: numberValue(item.count, options.length),
  };
}

function parseRoomSummary(value: unknown): LiveQuizRoomSummary {
  const item = record(value);
  return {
    id: stringValue(item.id),
    pin: stringValue(item.pin),
    title: stringValue(item.title),
    status: statusValue(item.status),
    phase: phaseValue(item.phase),
    question_count: numberValue(item.question_count),
    team_mode: item.team_mode === true,
    score_mode: scoreModeValue(item.score_mode),
    expires_at: stringValue(item.expires_at),
    created_at: stringValue(item.created_at),
    player_count: numberValue(item.player_count),
  };
}

function parseSnapshot(value: unknown): LiveQuizSnapshot {
  const item = record(value);
  const room = record(item.room);
  return {
    room: {
      id: stringValue(room.id),
      pin: stringValue(room.pin),
      title: stringValue(room.title),
      status: statusValue(room.status),
      phase: phaseValue(room.phase),
      question_index: numberValue(room.question_index, 1),
      question_count: numberValue(room.question_count),
      question_seconds: numberValue(room.question_seconds, 20),
      question_started_at: stringValue(room.question_started_at) || null,
      team_mode: room.team_mode === true,
      team_names: Array.isArray(room.team_names) ? room.team_names.filter((name): name is string => typeof name === 'string') : [],
      score_mode: scoreModeValue(room.score_mode),
      reflection_prompt: stringValue(room.reflection_prompt) || null,
      presentation: parsePresentation(room.presentation),
      expires_at: stringValue(room.expires_at),
      created_at: stringValue(room.created_at),
    },
    is_host: item.is_host === true,
    question: parseQuestion(item.question),
    players: Array.isArray(item.players) ? item.players.map(parsePlayer) : [],
    teams: Array.isArray(item.teams) ? item.teams.map(parseTeam) : [],
    question_report: Array.isArray(item.question_report) ? item.question_report.map(parseQuestionReport) : null,
    reflections: Array.isArray(item.reflections) ? item.reflections.map(parseReflection) : [],
    my_reflection: stringValue(item.my_reflection) || null,
    player_count: numberValue(item.player_count),
    answered_current: item.answered_current === true,
    my_answer: optionValue(item.my_answer),
  };
}

async function rpc(name: string, args?: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data as unknown;
}

export async function createLiveQuizRoom(input: {
  title: string;
  questionCount: number;
  questionSeconds: number;
  lifetimeDays: number;
  teamMode: boolean;
  teamCount: number;
  scoreMode: LiveQuizScoreMode;
  reflectionPrompt: string | null;
}): Promise<{ id: string; pin: string }> {
  const data = record(await rpc('live_quiz_create_room', {
    p_title: input.title,
    p_question_count: input.questionCount,
    p_question_seconds: input.questionSeconds,
    p_lifetime_days: input.lifetimeDays,
    p_team_mode: input.teamMode,
    p_team_count: input.teamCount,
    p_score_mode: input.scoreMode,
    p_reflection_prompt: input.reflectionPrompt,
  }));
  return { id: stringValue(data.id), pin: stringValue(data.pin) };
}

export async function listMyLiveQuizRooms(): Promise<LiveQuizRoomSummary[]> {
  const data = await rpc('live_quiz_list_my_rooms');
  return Array.isArray(data) ? data.map(parseRoomSummary) : [];
}

export async function getLiveQuizEditor(roomId: string): Promise<LiveQuizEditorContent> {
  const data = record(await rpc('live_quiz_get_editor', { p_room_id: roomId }));
  const questions = Array.isArray(data.questions) ? data.questions.map(parseEditorQuestion) : [];
  return {
    title: stringValue(data.title, 'Reto bíblico en vivo'),
    presentation: parsePresentation(data.presentation),
    questions,
  };
}

export async function saveLiveQuizEditor(roomId: string, content: LiveQuizEditorContent): Promise<void> {
  await rpc('live_quiz_save_editor', {
    p_room_id: roomId,
    p_title: content.title,
    p_editor_content: { presentation: content.presentation, questions: content.questions },
  });
}

export async function uploadLiveQuizImage(file: File): Promise<string> {
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!allowedTypes.has(file.type) || file.size > 4 * 1024 * 1024) {
    throw new Error('Usa una imagen JPG, PNG o WebP de hasta 4 MB.');
  }

  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) throw new Error('Inicia sesión como anfitrión para subir imágenes.');

  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const path = `${data.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('live-quiz-media').upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return supabase.storage.from('live-quiz-media').getPublicUrl(path).data.publicUrl;
}

export async function joinLiveQuizRoom(pin: string, nickname: string): Promise<{ id: string; token: string; teamName: string | null }> {
  const data = record(await rpc('live_quiz_join_room', { p_pin: pin, p_nickname: nickname }));
  return { id: stringValue(data.room_id), token: stringValue(data.player_token), teamName: stringValue(data.team_name) || null };
}

export async function getLiveQuizState(pin: string, playerToken: string | null): Promise<LiveQuizSnapshot> {
  return parseSnapshot(await rpc('live_quiz_get_state', { p_pin: pin, p_player_token: playerToken }));
}

export async function submitLiveQuizAnswer(
  pin: string,
  playerToken: string,
  questionIndex: number,
  selectedOption: LiveQuizOptionKey,
): Promise<void> {
  await rpc('live_quiz_submit_answer', {
    p_pin: pin,
    p_player_token: playerToken,
    p_question_index: questionIndex,
    p_selected_option: selectedOption,
  });
}

export async function submitLiveQuizReflection(pin: string, playerToken: string, response: string): Promise<void> {
  await rpc('live_quiz_submit_reflection', {
    p_pin: pin,
    p_player_token: playerToken,
    p_response: response,
  });
}

export async function applyLiveQuizHostAction(roomId: string, action: 'start' | 'reveal' | 'next' | 'finish'): Promise<void> {
  await rpc('live_quiz_host_action', { p_room_id: roomId, p_action: action });
}

