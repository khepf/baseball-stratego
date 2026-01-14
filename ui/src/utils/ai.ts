import { type GameState, type GamePiece, type Position } from "../types/game.ts";

interface MoveOption {
  piece: GamePiece;
  from: Position;
  to: Position;
  score: number;
}

export class StrategoAI {
  private getValidMovesForPiece(
    piece: GamePiece,
    position: Position,
    gameState: GameState
  ): Position[] {
    const validMoves: Position[] = [];

    if (piece.rank === "Flag" || piece.rank === "Bomb") return validMoves;

    const directions = [
      { row: -1, col: 0 }, // up
      { row: 1, col: 0 }, // down
      { row: 0, col: -1 }, // left
      { row: 0, col: 1 }, // right
    ];

    const maxDistance = piece.rank === "Scout" ? 10 : 1;

    for (const dir of directions) {
      for (let distance = 1; distance <= maxDistance; distance++) {
        const newRow = position.row + dir.row * distance;
        const newCol = position.col + dir.col * distance;

        if (newRow < 0 || newRow >= 10 || newCol < 0 || newCol >= 10) break;

        const targetSquare = gameState.board[newRow][newCol];

        if (targetSquare.isLake) break;

        if (targetSquare.piece) {
          if (targetSquare.piece.player !== piece.player) {
            validMoves.push({ row: newRow, col: newCol });
          }
          break;
        }

        validMoves.push({ row: newRow, col: newCol });
      }
    }

    return validMoves;
  }

  private getAllPossibleMoves(
    gameState: GameState,
    player: 1 | 2
  ): MoveOption[] {
    const moves: MoveOption[] = [];

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const piece = gameState.board[row][col].piece;
        if (piece && piece.player === player && !piece.isCaptured) {
          const validMoves = this.getValidMovesForPiece(
            piece,
            { row, col },
            gameState
          );
          for (const move of validMoves) {
            moves.push({
              piece,
              from: { row, col },
              to: move,
              score: 0,
            });
          }
        }
      }
    }

    return moves;
  }

  private scoreMoveOption(move: MoveOption, gameState: GameState): number {
    let score = Math.random() * 10; // Base randomness

    const targetSquare = gameState.board[move.to.row][move.to.col];
    const targetPiece = targetSquare.piece;

    // Don't move Flag or Bomb (shouldn't happen, but safety check)
    if (move.piece.rank === "Flag" || move.piece.rank === "Bomb") {
      return -1000;
    }

    // If attacking an enemy piece
    if (targetPiece && targetPiece.player !== move.piece.player) {
      // Don't attack unknown pieces with valuable pieces (unless Spy or Miner)
      if (!targetPiece.isRevealed) {
        if (
          move.piece.rankValue >= 7 &&
          move.piece.rank !== "Spy" &&
          move.piece.rank !== "Miner"
        ) {
          score -= 15; // Risky to attack with high-value pieces
        } else if (move.piece.rank === "Scout") {
          score += 20; // Scouts are good for exploring
        } else if (move.piece.rank === "Miner") {
          score += 5; // Miners might find bombs
        }
      } else {
        // Target is revealed - calculate if we can win
        if (move.piece.rank === "Spy" && targetPiece.rank === "Marshal") {
          score += 100; // Special win!
        } else if (move.piece.rank === "Miner" && targetPiece.rank === "Bomb") {
          score += 50; // Defuse bomb
        } else if (targetPiece.rank === "Bomb") {
          score -= 100; // Don't attack bombs unless we're a Miner
        } else if (targetPiece.rank === "Flag") {
          score += 1000; // WIN!
        } else if (move.piece.rankValue > targetPiece.rankValue) {
          score += 30 + (move.piece.rankValue - targetPiece.rankValue) * 5; // We win
        } else if (move.piece.rankValue < targetPiece.rankValue) {
          score -= 40; // We lose
        } else {
          score += 5; // Tie - remove both pieces
        }
      }
    } else {
      // Moving to empty square

      // Move forward (toward opponent)
      if (move.to.row < move.from.row) {
        score += 3;
      }

      // Scouts like to explore
      if (move.piece.rank === "Scout") {
        const distance =
          Math.abs(move.to.row - move.from.row) +
          Math.abs(move.to.col - move.from.col);
        score += distance * 2;
      }

      // Keep valuable pieces back
      if (move.piece.rankValue >= 8) {
        if (move.to.row > 5) {
          // Stay in back half
          score += 10;
        } else {
          score -= 5;
        }
      }

      // Spread out - avoid clustering
      let adjacentAllies = 0;
      const adjacentPositions = [
        { row: move.to.row - 1, col: move.to.col },
        { row: move.to.row + 1, col: move.to.col },
        { row: move.to.row, col: move.to.col - 1 },
        { row: move.to.row, col: move.to.col + 1 },
      ];

      for (const pos of adjacentPositions) {
        if (pos.row >= 0 && pos.row < 10 && pos.col >= 0 && pos.col < 10) {
          const adjPiece = gameState.board[pos.row][pos.col].piece;
          if (adjPiece && adjPiece.player === move.piece.player) {
            adjacentAllies++;
          }
        }
      }

      if (adjacentAllies > 2) {
        score -= 5; // Too clustered
      }
    }

    return score;
  }

  public getBestMove(
    gameState: GameState
  ): { from: Position; to: Position } | null {
    const allMoves = this.getAllPossibleMoves(gameState, 2); // AI is player 2

    if (allMoves.length === 0) return null;

    // Score all moves
    for (const move of allMoves) {
      move.score = this.scoreMoveOption(move, gameState);
    }

    // Sort by score (highest first)
    allMoves.sort((a, b) => b.score - a.score);

    // Take top 5 moves and randomly pick one (adds unpredictability)
    const topMoves = allMoves.slice(0, Math.min(5, allMoves.length));
    const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];

    return {
      from: selectedMove.from,
      to: selectedMove.to,
    };
  }
}
