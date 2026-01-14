import { useState, useCallback, useEffect } from "react";
import type {
  GameState,
  GamePiece,
  Position,
  BoardSquare,
  TeamData,
} from "../types/game.ts";
import { RANK_VALUES } from "../types/game.ts";
import { StrategoAI } from "../utils/ai";

import bombSoundFile from "../assets/sounds/bomb.mp3";
import winSoundFile from "../assets/sounds/whip-win.mp3";
import loseSoundFile from "../assets/sounds/zeus-lose.mp3";
import pieceMoveFile from "../assets/sounds/piece-move.wav";
import gameWinFile from "../assets/sounds/game-win.mp3";

const BOARD_SIZE = 10;

// Lake positions in classic Stratego (4,2), (4,3), (5,2), (5,3), (4,6), (4,7), (5,6), (5,7)
const LAKE_POSITIONS = [
  { row: 4, col: 2 },
  { row: 4, col: 3 },
  { row: 5, col: 2 },
  { row: 5, col: 3 },
  { row: 4, col: 6 },
  { row: 4, col: 7 },
  { row: 5, col: 6 },
  { row: 5, col: 7 },
];

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: initializeBoard(),
    currentPlayer: 1,
    selectedPiece: null,
    gamePhase: "setup",
    winner: null,
    capturedPieces: [],
    moveHistory: [],
    lastOpponentMove: null,
  });

  const [teamData, setTeamData] = useState<TeamData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ai] = useState(() => new StrategoAI());
  const [battlePosition, setBattlePosition] = useState<{
    position: Position;
    winner: 1 | 2 | null;
  } | null>(null);

  function initializeBoard(): BoardSquare[][] {
    const board: BoardSquare[][] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      board[row] = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        const isLake = LAKE_POSITIONS.some(
          (lake) => lake.row === row && lake.col === col
        );
        board[row][col] = {
          piece: null,
          isLake,
          isHighlighted: false,
        };
      }
    }
    return board;
  }

  const fetchTeamData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/teams/random`);
      if (!response.ok) {
        throw new Error("Failed to fetch team data");
      }
      const data: TeamData[] = await response.json();
      setTeamData(data);
      setupPieces(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setupPieces = (data: TeamData[]) => {
    const newBoard = initializeBoard();

    // Shuffle function
    const shuffle = <T>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const player1Pieces = shuffle(data.filter((d) => d.playerNumber === "1"));
    const player2Pieces = shuffle(data.filter((d) => d.playerNumber === "2"));

    // Place Player 1 pieces (bottom 4 rows, rows 6-9)
    let pieceIndex = 0;
    for (let row = 6; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (pieceIndex < player1Pieces.length && !newBoard[row][col].isLake) {
          newBoard[row][col].piece = createGamePiece(
            player1Pieces[pieceIndex],
            1,
            pieceIndex
          );
          pieceIndex++;
        }
      }
    }

    // Place Player 2 pieces (top 4 rows, rows 0-3)
    pieceIndex = 0;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (pieceIndex < player2Pieces.length && !newBoard[row][col].isLake) {
          newBoard[row][col].piece = createGamePiece(
            player2Pieces[pieceIndex],
            2,
            pieceIndex
          );
          pieceIndex++;
        }
      }
    }

    setGameState((prev) => ({
      ...prev,
      board: newBoard,
      gamePhase: "playing",
      lastOpponentMove: null,
    }));
  };

  const createGamePiece = (
    teamData: TeamData,
    player: 1 | 2,
    index: number
  ): GamePiece => {
    return {
      id: `${player}-${index}`,
      player,
      rank: teamData.pieceRank,
      rankValue: RANK_VALUES[teamData.pieceRank] || 0,
      teamData,
      isRevealed: false,
      isCaptured: false,
    };
  };

  const selectPiece = useCallback(
    (row: number, col: number) => {
      const piece = gameState.board[row][col].piece;

      if (gameState.gamePhase !== "playing") return;

      // If clicking on empty square or enemy piece while having a piece selected - try to move
      if (gameState.selectedPiece) {
        const validMoves = getValidMoves(gameState.selectedPiece.position);
        const targetPos = { row, col };

        if (validMoves.some((move) => move.row === row && move.col === col)) {
          movePiece(gameState.selectedPiece.position, targetPos);
        } else {
          // Deselect if clicking invalid square
          clearHighlights();
          setGameState((prev) => ({ ...prev, selectedPiece: null }));
        }
        return;
      }

      // Select piece if it belongs to current player and can move
      if (
        piece &&
        piece.player === gameState.currentPlayer &&
        canPieceMove(piece)
      ) {
        const validMoves = getValidMoves({ row, col });
        const newBoard = gameState.board.map((r) =>
          r.map((s) => ({ ...s, isHighlighted: false }))
        );

        validMoves.forEach((move) => {
          newBoard[move.row][move.col].isHighlighted = true;
        });

        setGameState((prev) => ({
          ...prev,
          selectedPiece: { piece, position: { row, col } },
          board: newBoard,
        }));
      }
    },
    [gameState]
  );

  const canPieceMove = (piece: GamePiece): boolean => {
    return piece.rank !== "Flag" && piece.rank !== "Bomb";
  };

  const getValidMoves = (position: Position): Position[] => {
    const validMoves: Position[] = [];
    const piece = gameState.board[position.row][position.col].piece;

    if (!piece || !canPieceMove(piece)) return validMoves;

    const directions = [
      { row: -1, col: 0 }, // up
      { row: 1, col: 0 }, // down
      { row: 0, col: -1 }, // left
      { row: 0, col: 1 }, // right
    ];

    // Scout can move multiple squares
    const maxDistance = piece.rank === "Scout" ? BOARD_SIZE : 1;

    for (const dir of directions) {
      for (let distance = 1; distance <= maxDistance; distance++) {
        const newRow = position.row + dir.row * distance;
        const newCol = position.col + dir.col * distance;

        if (
          newRow < 0 ||
          newRow >= BOARD_SIZE ||
          newCol < 0 ||
          newCol >= BOARD_SIZE
        )
          break;

        const targetSquare = gameState.board[newRow][newCol];

        if (targetSquare.isLake) break;

        if (targetSquare.piece) {
          if (targetSquare.piece.player !== piece.player) {
            validMoves.push({ row: newRow, col: newCol });
          }
          break; // Can't move past any piece
        }

        validMoves.push({ row: newRow, col: newCol });
      }
    }

    return validMoves;
  };

  const movePiece = useCallback((from: Position, to: Position) => {
    setGameState((prev) => {
      const newBoard = prev.board.map((row) =>
        row.map((square) => ({ ...square, isHighlighted: false }))
      );
      const movingPiece = newBoard[from.row][from.col].piece!;
      const targetPiece = newBoard[to.row][to.col].piece;

      const capturedPieces = [...prev.capturedPieces];
      let battleResult: "attacker-wins" | "defender-wins" | "tie" | undefined;

      if (targetPiece) {
        // Battle!
        const result = resolveBattle(movingPiece, targetPiece);
        battleResult = result;

        // Play sound effects based on battle outcome
        // Check if defender is a bomb
        if (targetPiece.rank === "Bomb") {
          const bombSound = new Audio(bombSoundFile);
          bombSound.volume = 0.5;
          bombSound
            .play()
            .catch((err) => console.log("Audio play failed:", err));
        } else if (result === "attacker-wins" && movingPiece.player === 1) {
          // P1 wins
          const winSound = new Audio(winSoundFile);
          winSound.volume = 0.5;
          winSound
            .play()
            .catch((err) => console.log("Audio play failed:", err));
        } else if (result === "defender-wins" && targetPiece.player === 2) {
          // P2 wins (defender is P2)
          const loseSound = new Audio(loseSoundFile);
          loseSound.volume = 0.5;
          loseSound
            .play()
            .catch((err) => console.log("Audio play failed:", err));
        } else if (result === "attacker-wins" && movingPiece.player === 2) {
          // P2 wins (attacker is P2)
          const loseSound = new Audio(loseSoundFile);
          loseSound.volume = 0.5;
          loseSound
            .play()
            .catch((err) => console.log("Audio play failed:", err));
        } else if (result === "defender-wins" && targetPiece.player === 1) {
          // P1 wins (defender is P1)
          const winSound = new Audio(winSoundFile);
          winSound.volume = 0.5;
          winSound
            .play()
            .catch((err) => console.log("Audio play failed:", err));
        }

        // Determine who won for explosion color
        let battleWinner: 1 | 2 | null = null;
        if (result === "attacker-wins") {
          battleWinner = movingPiece.player;
        } else if (result === "defender-wins") {
          battleWinner = targetPiece.player;
        }
        // For tie, leave as null

        // Show explosion at battle location with winner color
        setBattlePosition({ position: to, winner: battleWinner });
        setTimeout(() => setBattlePosition(null), 1500);

        if (result === "attacker-wins") {
          newBoard[to.row][to.col].piece = { ...movingPiece, isRevealed: true };
          newBoard[from.row][from.col].piece = null;
          capturedPieces.push({ ...targetPiece, isCaptured: true });
        } else if (result === "defender-wins") {
          newBoard[from.row][from.col].piece = null;
          newBoard[to.row][to.col].piece = { ...targetPiece, isRevealed: true };
          capturedPieces.push({ ...movingPiece, isCaptured: true });
        } else {
          // Both pieces removed
          newBoard[from.row][from.col].piece = null;
          newBoard[to.row][to.col].piece = null;
          capturedPieces.push({ ...movingPiece, isCaptured: true });
          capturedPieces.push({ ...targetPiece, isCaptured: true });
        }

        // Check for flag capture
        if (targetPiece.rank === "Flag") {
          // Play game win sound if player 1 wins
          if (movingPiece.player === 1) {
            const gameWinSound = new Audio(gameWinFile);
            gameWinSound.volume = 0.6;
            gameWinSound
              .play()
              .catch((err) => console.log("Audio play failed:", err));
          }

          return {
            ...prev,
            board: newBoard,
            selectedPiece: null,
            gamePhase: "finished" as const,
            winner: movingPiece.player,
            capturedPieces,
          };
        }
      } else {
        // Simple move
        newBoard[to.row][to.col].piece = movingPiece;
        newBoard[from.row][from.col].piece = null;

        // Play piece move sound for non-battle moves
        const moveSound = new Audio(pieceMoveFile);
        moveSound.volume = 0.3;
        moveSound.play().catch((err) => console.log("Audio play failed:", err));
      }

      // Create move history entry
      const move = {
        from,
        to,
        piece: movingPiece,
        capturedPiece: targetPiece || undefined,
        battleResult,
        timestamp: Date.now(),
      };

      const nextPlayer = prev.currentPlayer === 1 ? 2 : (1 as 1 | 2);

      return {
        ...prev,
        board: newBoard,
        selectedPiece: null,
        currentPlayer: nextPlayer,
        capturedPieces,
        moveHistory: [...prev.moveHistory, move],
        // Only track Player 2 moves to show arrow to Player 1
        lastOpponentMove: movingPiece.player === 2 ? { from, to } : null,
      };
    });
  }, []);

  const resolveBattle = (
    attacker: GamePiece,
    defender: GamePiece
  ): "attacker-wins" | "defender-wins" | "tie" => {
    // Special cases
    if (attacker.rank === "Spy" && defender.rank === "Marshal") {
      return "attacker-wins";
    }
    if (attacker.rank === "Miner" && defender.rank === "Bomb") {
      return "attacker-wins";
    }
    if (defender.rank === "Bomb") {
      return "defender-wins";
    }

    // Normal comparison
    if (attacker.rankValue > defender.rankValue) {
      return "attacker-wins";
    } else if (attacker.rankValue < defender.rankValue) {
      return "defender-wins";
    } else {
      return "tie";
    }
  };

  const clearHighlights = () => {
    setGameState((prev) => ({
      ...prev,
      board: prev.board.map((row) =>
        row.map((square) => ({ ...square, isHighlighted: false }))
      ),
    }));
  };

  // AI move logic - triggers when it's AI's turn
  useEffect(() => {
    if (
      gameState.currentPlayer === 2 &&
      gameState.gamePhase === "playing" &&
      !gameState.winner
    ) {
      const timer = setTimeout(() => {
        const aiMove = ai.getBestMove(gameState);
        if (aiMove) {
          movePiece(aiMove.from, aiMove.to);
        }
      }, 1500); // 1.5s delay so human can see what's happening

      return () => clearTimeout(timer);
    }
  }, [
    gameState.currentPlayer,
    gameState.gamePhase,
    gameState.winner,
    gameState,
    ai,
    movePiece,
  ]);

  const resetGame = useCallback(() => {
    setGameState({
      board: initializeBoard(),
      currentPlayer: 1,
      selectedPiece: null,
      gamePhase: "setup",
      winner: null,
      capturedPieces: [],
      moveHistory: [],
      lastOpponentMove: null,
    });
    setTeamData(null);
  }, []);

  return {
    gameState,
    teamData,
    isLoading,
    error,
    fetchTeamData,
    selectPiece,
    resetGame,
    battlePosition,
  };
};
