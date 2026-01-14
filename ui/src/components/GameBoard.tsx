import type { BoardSquare } from "../types/game.ts";
import { GamePiece } from "./GamePiece";
import "./GameBoard.css";

interface GameBoardProps {
  board: BoardSquare[][];
  currentPlayer: 1 | 2;
  onSquareClick: (row: number, col: number) => void;
}

export const GameBoard = ({ board, onSquareClick }: GameBoardProps) => {
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
                    }`}
                    onClick={() =>
                      !square.isLake && onSquareClick(rowIndex, colIndex)
                    }
                  >
                    {square.isLake ? (
                      <div className="lake-content">🌊</div>
                    ) : (
                      square.piece && (
                        <GamePiece
                          piece={square.piece}
                          isCurrentPlayer={square.piece.player === 1}
                        />
                      )
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
