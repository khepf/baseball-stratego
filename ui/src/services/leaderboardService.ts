import {
  collection,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { GameResult } from "../types/leaderboard";

export async function saveGameResult(result: GameResult): Promise<void> {
  try {
    // Save to general game results collection
    await addDoc(collection(db, "gameResults"), {
      userId: result.userId,
      username: result.username,
      won: result.won,
      moves: result.moves,
      difficulty: result.difficulty,
      timestamp: serverTimestamp(),
    });

    // If the player won, update the leaderboard
    if (result.won) {
      const leaderboardPath = `leaderboards/fastestCapture/${result.difficulty}`;
      const entryRef = doc(collection(db, leaderboardPath));

      await setDoc(entryRef, {
        userId: result.userId,
        username: result.username,
        moves: result.moves,
        difficulty: result.difficulty,
        timestamp: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error saving game result:", error);
    throw error;
  }
}
