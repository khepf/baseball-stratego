import type { BoardSquare } from "../types/game.ts";
import { GamePiece } from "./GamePiece";
import "./GameBoard.css";

interface GameBoardProps {
  board: BoardSquare[][];
  currentPlayer: 1 | 2;
  onSquareClick: (row: number, col: number) => void;
}

export const GameBoard = ({
  board,
  currentPlayer,
  onSquareClick,
}: GameBoardProps) => {
  return (
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
                    isCurrentPlayer={square.piece.player === currentPlayer}
                  />
                )
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
