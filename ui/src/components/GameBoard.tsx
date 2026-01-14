import type { BoardSquare, Position } from "../types/game.ts";
import { GamePiece } from "./GamePiece";
import "./GameBoard.css";

interface GameBoardProps {
  board: BoardSquare[][];
  currentPlayer: 1 | 2;
  onSquareClick: (row: number, col: number) => void;
  lastOpponentMove: { from: Position; to: Position } | null;
}

export const GameBoard = ({
  board,
  onSquareClick,
  lastOpponentMove,
}: GameBoardProps) => {
  // Calculate arrow direction and rotation
  const getArrowRotation = (from: Position, to: Position): number => {
    const rowDiff = to.row - from.row;
    const colDiff = to.col - from.col;

    if (rowDiff < 0) return 0; // up
    if (rowDiff > 0) return 180; // down
    if (colDiff > 0) return 90; // right
    return 270; // left
  };
  const columns = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const rows = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]; // Top to bottom

  return (
    <div className="game-board-container">
      <div className="game-board-wrapper">
        {/* Top column labels */}
        <div className="board-labels-top">
          <div className="corner-space"></div>
          {columns.map((col) => (
            <div key={col} className="column-label">
              {col}
            </div>
          ))}
        </div>

        <div className="board-with-rows">
          {/* Row labels on the left */}
          <div className="row-labels-left">
            {rows.map((row) => (
              <div key={row} className="row-label">
                {row}
              </div>
            ))}
          </div>

          {/* The actual game board */}
          <div className="game-board">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="board-row">
                {row.map((square, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`board-square ${square.isLake ? "lake" : ""} ${
                      square.isHighlighted ? "highlighted" : ""
                    } ${
                      lastOpponentMove &&
                      lastOpponentMove.from.row === rowIndex &&
                      lastOpponentMove.from.col === colIndex
                        ? "has-arrow"
                        : ""
                    }`}
                    onClick={() =>
                      !square.isLake && onSquareClick(rowIndex, colIndex)
                    }
                  >
                    {square.isLake ? (
                      <div className="lake-content">🌊</div>
                    ) : (
                      <>
                        {square.piece && (
                          <GamePiece
                            piece={square.piece}
                            isCurrentPlayer={square.piece.player === 1}
                          />
                        )}
                        {lastOpponentMove &&
                          lastOpponentMove.from.row === rowIndex &&
                          lastOpponentMove.from.col === colIndex && (
                            <div
                              className="move-arrow"
                              style={{
                                transform: `rotate(${getArrowRotation(
                                  lastOpponentMove.from,
                                  lastOpponentMove.to
                                )}deg)`,
                              }}
                            >
                              ↑
                            </div>
                          )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
