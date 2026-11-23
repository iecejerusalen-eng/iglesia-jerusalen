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
    options,
    correct_option: optionValue(item.correct_option),
    explanation: stringValue(item.explanation) || null,
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


