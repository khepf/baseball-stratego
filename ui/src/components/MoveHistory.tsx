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

  const formatMove = (move: Move, index: number) => {
    const player = move.piece.player === 1 ? "P1" : "P2";
    const fromPos = formatPosition(move.from);
    const toPos = formatPosition(move.to);

    let moveText = `${player}: ${move.piece.rank} ${fromPos}→${toPos}`;

    if (move.capturedPiece) {
      moveText += ` (captured ${move.capturedPiece.rank})`;
    }

    return moveText;
  };

  return (
    <div className="move-history">
      <h3>Move History</h3>
      <div className="move-list">
        {moves.length === 0 ? (
          <p className="no-moves">No moves yet</p>
        ) : (
          moves.map((move, index) => (
            <div key={index} className={`move-item player${move.piece.player}`}>
              <span className="move-number">{index + 1}.</span>
              <span className="move-text">{formatMove(move, index)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
