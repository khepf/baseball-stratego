import type { Timestamp, FieldValue } from "firebase/firestore";

export interface LeaderboardEntry {
  userId: string;
  username: string;
  moves: number; // Number of moves to capture flag
  difficulty: "easy" | "medium" | "hard";
  timestamp: Timestamp;
}

export interface WinsLeaderboardEntry {
  userId: string;
  username: string;
  wins: number; // Total number of wins
  difficulty: "easy" | "medium" | "hard";
  lastWin: Timestamp;
}

export interface GameResult {
  userId: string;
  username: string;
  won: boolean;
  moves: number; // Number of moves to capture flag
  difficulty: "easy" | "medium" | "hard";
  timestamp: FieldValue; // serverTimestamp() type
}
