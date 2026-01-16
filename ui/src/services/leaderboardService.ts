import {
  collection,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  getDoc,
  increment,
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

    // If the player won, update the leaderboards
    if (result.won) {
      // Update fastest capture leaderboard
      const fastestCaptureRef = doc(
        collection(db, `leaderboards/fastestCapture/${result.difficulty}`)
      );
      await setDoc(fastestCaptureRef, {
        userId: result.userId,
        username: result.username,
        moves: result.moves,
        difficulty: result.difficulty,
        timestamp: serverTimestamp(),
      });

      // Update most wins leaderboard
      const winsDocRef = doc(
        db,
        `leaderboards/mostWins/${result.difficulty}`,
        result.userId
      );
      const winsDoc = await getDoc(winsDocRef);

      if (winsDoc.exists()) {
        // Increment existing wins count
        await setDoc(
          winsDocRef,
          {
            wins: increment(1),
            lastWin: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        // Create new wins entry
        await setDoc(winsDocRef, {
          userId: result.userId,
          username: result.username,
          wins: 1,
          difficulty: result.difficulty,
          lastWin: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.error("Error saving game result:", error);
    throw error;
  }
}
