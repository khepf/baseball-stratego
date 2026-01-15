import { useState, useEffect, useCallback } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import type { LeaderboardEntry } from "../types/leaderboard";
import "./Leaderboards.css";

export function Leaderboards() {
  const { currentUser } = useAuth();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const leaderboardRef = collection(
        db,
        "leaderboards",
        "fastestCapture",
        difficulty
      );
      const q = query(leaderboardRef, orderBy("moves", "asc"), limit(10));

      const querySnapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = [];

      querySnapshot.forEach((doc) => {
        entries.push(doc.data() as LeaderboardEntry);
      });

      setLeaderboard(entries);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Failed to load leaderboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  function formatDate(timestamp: unknown): string {
    if (!timestamp) return "N/A";

    try {
      // Firebase Timestamp has a toDate() method
      const date =
        typeof timestamp === "object" &&
        timestamp !== null &&
        "toDate" in timestamp
          ? (timestamp as { toDate: () => Date }).toDate()
          : new Date(timestamp as string);
      return date.toLocaleDateString();
    } catch {
      return "N/A";
    }
  }

  function getMedalEmoji(rank: number): string {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "";
    }
  }

  return (
    <div className="leaderboards-page">
      <div className="leaderboards-header">
        <h1>🏆 Fastest Flag Capture</h1>
        <p>Top players who captured the flag with the fewest moves</p>
        <Link to="/" className="back-link">
          ← Back to Game
        </Link>
      </div>

      <div className="difficulty-tabs">
        <button
          className={difficulty === "easy" ? "active" : ""}
          onClick={() => setDifficulty("easy")}
        >
          Easy
        </button>
        <button
          className={difficulty === "medium" ? "active" : ""}
          onClick={() => setDifficulty("medium")}
        >
          Medium
        </button>
        <button
          className={difficulty === "hard" ? "active" : ""}
          onClick={() => setDifficulty("hard")}
        >
          Hard
        </button>
      </div>

      {loading && (
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && leaderboard.length === 0 && (
        <div className="empty-message">
          <p>No entries yet for {difficulty} difficulty.</p>
          <p>Be the first to set a record!</p>
        </div>
      )}

      {!loading && !error && leaderboard.length > 0 && (
        <div className="leaderboard-table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Moves</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr
                  key={index}
                  className={`${index < 3 ? `rank-${index + 1}` : ""} ${
                    currentUser && entry.userId === currentUser.uid
                      ? "current-user"
                      : ""
                  }`}
                >
                  <td className="rank-cell">
                    <span className="rank-number">{index + 1}</span>
                    {getMedalEmoji(index + 1)}
                  </td>
                  <td className="username-cell">
                    {entry.username}
                    {currentUser && entry.userId === currentUser.uid && (
                      <span className="you-badge">You</span>
                    )}
                  </td>
                  <td className="moves-cell">
                    <strong>{entry.moves}</strong> moves
                  </td>
                  <td className="date-cell">{formatDate(entry.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!currentUser && (
        <div className="login-prompt">
          <p>
            🔒 <Link to="/login">Log in</Link> or{" "}
            <Link to="/register">create an account</Link> to compete on the
            leaderboards!
          </p>
        </div>
      )}
    </div>
  );
}
