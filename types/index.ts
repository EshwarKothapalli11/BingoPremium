export type RoomStatus = "waiting" | "matrix" | "playing" | "finished";

export type GameEventType = "cell_cancelled" | "bingo_letter" | "game_won";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  games_played: number;
  games_won: number;
  total_moves: number;
  created_at: string;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  host_id: string;
  status: RoomStatus;
  max_players: number;
  winner_id: string | null;
  started_at: string | null;
  created_at: string;
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  player_id: string;
  is_ready: boolean;
  board: number[][] | null;
  marked: boolean[][] | null;
  completed_lines: string[];
  bingo_letters: number;
  lines_completed: number;
  moves: number;
  has_submitted_board: boolean;
  joined_at: string;
  profile?: Profile;
}

export interface GameEvent {
  id: string;
  room_id: string;
  player_id: string;
  event_type: GameEventType;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  player_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface HistoryEntry {
  id: string;
  room_id: string;
  winner_id: string;
  moves: number;
  duration: string;
  players_count: number;
  created_at: string;
  winner?: Profile;
}

export type BoardGrid = number[][];
export type MarkedGrid = boolean[][];

export const BINGO_LETTERS = ["B", "I", "N", "G", "O"] as const;
export type BingoLetter = (typeof BINGO_LETTERS)[number];

export interface LineCoord {
  type: "row" | "col" | "diag";
  index: number;
  cells: [number, number][];
}

export interface BingoState {
  completedLines: string[];
  bingoLetters: number;
  linesCompleted: number;
  hasBingo: boolean;
}

export interface WinStats {
  moves: number;
  lines: number;
  duration: string;
}
