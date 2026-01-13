export interface TeamData {
  playerNumber: string;
  pieceRank: string;
  pieceNumberOrLetter: string;
  teamName: string;
  city: string;
  year: number;
  wins: number;
  losses: number;
  winPercentage: number;
}

export interface GamePiece {
  id: string;
  player: 1 | 2;
  rank: string;
  rankValue: number;
  teamData: TeamData;
  isRevealed: boolean;
  isCaptured: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface BoardSquare {
  piece: GamePiece | null;
  isLake: boolean;
  isHighlighted: boolean;
}

export interface GameState {
  board: BoardSquare[][];
  currentPlayer: 1 | 2;
  selectedPiece: { piece: GamePiece; position: Position } | null;
  gamePhase: "setup" | "playing" | "finished";
  winner: 1 | 2 | null;
  capturedPieces: GamePiece[];
  moveHistory: Move[];
}

export interface Move {
  from: Position;
  to: Position;
  piece: GamePiece;
  capturedPiece?: GamePiece;
  timestamp: number;
}

export const RANK_VALUES: Record<string, number> = {
  Flag: 0,
  Spy: 1,
  Scout: 2,
  Miner: 3,
  Sergeant: 4,
  Lieutenant: 5,
  Captain: 6,
  Major: 7,
  Colonel: 8,
  General: 9,
  Marshal: 10,
  Bomb: 11,
};

export const PIECE_COUNTS: Record<string, number> = {
  Flag: 1,
  Spy: 1,
  Scout: 8,
  Miner: 5,
  Sergeant: 4,
  Lieutenant: 4,
  Captain: 4,
  Major: 3,
  Colonel: 2,
  General: 1,
  Marshal: 1,
  Bomb: 6,
};
