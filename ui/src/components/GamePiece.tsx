import type { GamePiece as GamePieceType } from "../types/game.ts";
import "./GamePiece.css";

interface GamePieceProps {
  piece: GamePieceType | null;
  isCurrentPlayer: boolean;
  isRevealed?: boolean;
}

export const GamePiece = ({
  piece,
  isCurrentPlayer,
  isRevealed = false,
}: GamePieceProps) => {
  if (!piece) return null;

  const shouldReveal = isCurrentPlayer || piece.isRevealed || isRevealed;
  const playerClass = piece.player === 1 ? "player1" : "player2";

  return (
    <div
      className={`game-piece ${playerClass} ${
        shouldReveal ? "revealed" : "hidden"
      }`}
    >
      {shouldReveal ? (
        <>
          <div className="piece-number-bg">
            {piece.teamData.pieceNumberOrLetter === "B"
              ? "💣"
              : piece.teamData.pieceNumberOrLetter === "F"
              ? "🚩"
              : piece.teamData.pieceNumberOrLetter}
          </div>
          <div className="piece-content">
            {piece.rank !== "Bomb" && piece.rank !== "Flag" && (
              <div className="piece-rank">{piece.rank}</div>
            )}
            {piece.teamData.teamName && (
              <>
                <div className="piece-year">{piece.teamData.year}</div>
                <div className="piece-team">{piece.teamData.teamName}</div>
                <div className="piece-record">
                  {piece.teamData.wins}-{piece.teamData.losses}
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="piece-content hidden-content">
          <div className="piece-back">?</div>
        </div>
      )}
    </div>
  );
};
