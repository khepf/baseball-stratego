import type { GamePiece as GamePieceType } from "../types/game.ts";
import { GamePiece } from "./GamePiece";
import "./CapturedPieces.css";

interface CapturedPiecesProps {
  pieces: GamePieceType[];
  player: 1 | 2;
}

export const CapturedPieces = ({ pieces, player }: CapturedPiecesProps) => {
  const playerPieces = pieces.filter((p) => p.player === player);

  return (
    <div className={`captured-pieces player${player}`}>
      <h3>Captured from Player {player}</h3>
      <div className="captured-grid">
        {playerPieces.map((piece, index) => (
          <div key={`${piece.id}-${index}`} className="captured-piece-wrapper">
            <GamePiece
              piece={piece}
              isCurrentPlayer={false}
              isRevealed={true}
            />
          </div>
        ))}
      </div>
      <div className="captured-count">Total: {playerPieces.length}</div>
    </div>
  );
};
