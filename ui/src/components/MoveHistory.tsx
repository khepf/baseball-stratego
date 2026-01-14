import type { Move } from "../types/game";
import "./MoveHistory.css";

interface MoveHistoryProps {
  moves: Move[];
}

export const MoveHistory = ({ moves }: MoveHistoryProps) => {
  const formatPosition = (pos: { row: number; col: number }) => {
    const col = String.fromCharCode(65 + pos.col); // A-J
    const row = 10 - pos.row; // 1-10 from bottom
    return `${col}${row}`;
  };

  const formatMove = (move: Move) => {
    const player = move.piece.player === 1 ? "P1" : "P2";
    const fromPos = formatPosition(move.from);
    const toPos = formatPosition(move.to);

    // If there's a battle, always reveal both pieces
    // Otherwise, only show rank for Player 1 or already revealed pieces
    const isBattle = !!move.capturedPiece;
    const showMovingPieceRank =
      isBattle || move.piece.player === 1 || move.piece.isRevealed;
    const movingPieceRank = showMovingPieceRank ? move.piece.rank : "???";

    let moveText = `${player}: ${movingPieceRank} ${fromPos}→${toPos}`;

    if (move.capturedPiece) {
      // Always show captured piece rank in battles
      const capturedPieceRank = move.capturedPiece.rank;

      if (move.battleResult === "defender-wins") {
        moveText += ` (captured by ${capturedPieceRank})`;
      } else if (move.battleResult === "tie") {
        moveText += ` (tied with ${capturedPieceRank})`;
      } else {
        moveText += ` (captured ${capturedPieceRank})`;
      }
    }

    return moveText;
  };

  // Show only the last 5 moves
  const recentMoves = moves.slice(-5);

  return (
    <div className="move-history">
      <h3>Move History</h3>
      <div className="move-list">
        {moves.length === 0 ? (
          <p className="no-moves">No moves yet</p>
        ) : (
          recentMoves.map((move, index) => {
            const actualMoveNumber = moves.length - recentMoves.length + index + 1;
            return (
              <div key={actualMoveNumber} className={`move-item player${move.piece.player}`}>
                <span className="move-number">{actualMoveNumber}.</span>
                <span className="move-text">{formatMove(move)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
