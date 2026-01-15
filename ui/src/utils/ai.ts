import {
  type GameState,
  type GamePiece,
  type Position,
} from "../types/game.ts";

interface MoveOption {
  piece: GamePiece;
  from: Position;
  to: Position;
  score: number;
}

interface EnemyPieceMemory {
  rank?: string;
  rankValue?: number;
  lastSeenPosition: Position;
  moveCount: number; // Track if piece is stationary (bomb/flag suspect)
  turnsStationary: number;
  revealedInBattle: boolean;
}

type Difficulty = "easy" | "medium" | "hard";

export class StrategoAI {
  private difficulty: Difficulty;
  private enemyMemory: Map<string, EnemyPieceMemory>;

  constructor(difficulty: Difficulty = "medium") {
    this.difficulty = difficulty;
    this.enemyMemory = new Map();
  }

  private positionKey(pos: Position): string {
    return `${pos.row}-${pos.col}`;
  }

  private updateMemory(gameState: GameState): void {
    if (this.difficulty === "easy") return; // Easy mode doesn't use memory

    const currentEnemyPositions = new Set<string>();

    // Scan board for enemy pieces (player 1)
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const piece = gameState.board[row][col].piece;
        if (piece && piece.player === 1 && !piece.isCaptured) {
          const pos = { row, col };
          const key = this.positionKey(pos);
          currentEnemyPositions.add(key);

          const existing = this.enemyMemory.get(key);

          if (existing) {
            // Check if piece moved
            if (
              existing.lastSeenPosition.row !== row ||
              existing.lastSeenPosition.col !== col
            ) {
              existing.moveCount++;
              existing.turnsStationary = 0;
            } else {
              existing.turnsStationary++;
            }
            existing.lastSeenPosition = pos;

            // Update revealed information
            if (piece.isRevealed && !existing.revealedInBattle) {
              existing.rank = piece.rank;
              existing.rankValue = piece.rankValue;
              existing.revealedInBattle = true;
            }
          } else {
            // New enemy piece discovered
            this.enemyMemory.set(key, {
              lastSeenPosition: pos,
              moveCount: 0,
              turnsStationary: 0,
              revealedInBattle: piece.isRevealed,
              rank: piece.isRevealed ? piece.rank : undefined,
              rankValue: piece.isRevealed ? piece.rankValue : undefined,
            });
          }
        }
      }
    }

    // Remove captured/moved pieces from memory
    for (const key of this.enemyMemory.keys()) {
      if (!currentEnemyPositions.has(key)) {
        this.enemyMemory.delete(key);
      }
    }
  }

  private getSuspectedImmobilePieces(): Position[] {
    if (this.difficulty === "easy") return [];

    const suspects: Position[] = [];
    for (const [, memory] of this.enemyMemory.entries()) {
      // If piece hasn't moved for 3+ turns, it's likely a Bomb or Flag
      if (memory.turnsStationary >= 3 && !memory.revealedInBattle) {
        suspects.push(memory.lastSeenPosition);
      }
    }
    return suspects;
  }

  private getKnownEnemyInfo(position: Position): EnemyPieceMemory | null {
    if (this.difficulty === "easy") return null;

    const key = this.positionKey(position);
    return this.enemyMemory.get(key) || null;
  }

  private isThreatenedByKnownEnemy(
    position: Position,
    ourPiece: GamePiece,
    gameState: GameState
  ): boolean {
    if (this.difficulty === "easy") return false;

    // Check if any adjacent enemy piece can defeat us
    const adjacentPositions = [
      { row: position.row - 1, col: position.col },
      { row: position.row + 1, col: position.col },
      { row: position.row, col: position.col - 1 },
      { row: position.row, col: position.col + 1 },
    ];

    for (const pos of adjacentPositions) {
      if (pos.row >= 0 && pos.row < 10 && pos.col >= 0 && pos.col < 10) {
        const enemyPiece = gameState.board[pos.row][pos.col].piece;
        if (enemyPiece && enemyPiece.player === 1) {
          const enemyInfo = this.getKnownEnemyInfo(pos);
          if (
            enemyInfo?.revealedInBattle &&
            enemyInfo.rankValue !== undefined
          ) {
            // Check if enemy can defeat us
            if (enemyInfo.rank === "Spy" && ourPiece.rank === "Marshal") {
              return true;
            } else if (
              enemyInfo.rankValue > ourPiece.rankValue &&
              ourPiece.rank !== "Spy"
            ) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  private findOurFlag(gameState: GameState): Position | null {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const piece = gameState.board[row][col].piece;
        if (piece && piece.player === 2 && piece.rank === "Flag") {
          return { row, col };
        }
      }
    }
    return null;
  }

  private getDistanceToPosition(from: Position, to: Position): number {
    return Math.abs(from.row - to.row) + Math.abs(from.col - to.col);
  }

  private isEnemyNearFlag(gameState: GameState): boolean {
    if (this.difficulty === "easy") return false;

    const flagPos = this.findOurFlag(gameState);
    if (!flagPos) return false;

    // Check if any enemy piece is within 2 squares of our flag
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const piece = gameState.board[row][col].piece;
        if (piece && piece.player === 1 && !piece.isCaptured) {
          const distance = this.getDistanceToPosition({ row, col }, flagPos);
          if (distance <= 2) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private getThreatenedPieces(gameState: GameState): Position[] {
    if (this.difficulty === "easy") return [];

    const threatened: Position[] = [];

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const piece = gameState.board[row][col].piece;
        if (
          piece &&
          piece.player === 2 &&
          !piece.isCaptured &&
          piece.rank !== "Bomb" &&
          piece.rank !== "Flag"
        ) {
          const pos = { row, col };
          if (this.isThreatenedByKnownEnemy(pos, piece, gameState)) {
            threatened.push(pos);
          }
        }
      }
    }

    return threatened;
  }

  private canDefendPosition(
    position: Position,
    gameState: GameState
  ): Position[] {
    if (this.difficulty === "easy") return [];

    const defenders: Position[] = [];
    const adjacentPositions = [
      { row: position.row - 1, col: position.col },
      { row: position.row + 1, col: position.col },
      { row: position.row, col: position.col - 1 },
      { row: position.row, col: position.col + 1 },
    ];

    // Find our pieces that can move adjacent to the threatened position
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const piece = gameState.board[row][col].piece;
        if (
          piece &&
          piece.player === 2 &&
          !piece.isCaptured &&
          piece.rank !== "Bomb" &&
          piece.rank !== "Flag"
        ) {
          const validMoves = this.getValidMovesForPiece(
            piece,
            { row, col },
            gameState
          );

          // Check if this piece can move to defend
          for (const move of validMoves) {
            for (const adjPos of adjacentPositions) {
              if (move.row === adjPos.row && move.col === adjPos.col) {
                defenders.push({ row, col });
                break;
              }
            }
          }
        }
      }
    }

    return defenders;
  }

  private getBombClusterAreas(): Position[] {
    if (this.difficulty === "easy") return [];

    const clusters: Position[] = [];
    const suspectedImmobile = this.getSuspectedImmobilePieces();

    // Find areas with multiple stationary pieces nearby (likely bomb clusters)
    for (const pos of suspectedImmobile) {
      let nearbyStationary = 0;

      // Check 2-square radius
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const checkRow = pos.row + dr;
          const checkCol = pos.col + dc;

          if (
            checkRow >= 0 &&
            checkRow < 10 &&
            checkCol >= 0 &&
            checkCol < 10
          ) {
            const otherPos = suspectedImmobile.find(
              (p) => p.row === checkRow && p.col === checkCol
            );
            if (otherPos) nearbyStationary++;
          }
        }
      }

      // If 2+ stationary pieces nearby, this is a bomb cluster area
      if (nearbyStationary >= 2) {
        clusters.push(pos);
      }
    }

    return clusters;
  }

  private evaluateTradeValue(
    ourPiece: GamePiece,
    enemyPiece: GamePiece
  ): number {
    // Positive = good trade for us, Negative = bad trade

    // Special cases
    if (ourPiece.rank === "Spy" && enemyPiece.rank === "Marshal") {
      return 100; // Excellent trade - Spy for Marshal
    }
    if (ourPiece.rank === "Miner" && enemyPiece.rank === "Bomb") {
      return 50; // Good trade - only Miner can remove bombs
    }

    // General value difference
    return enemyPiece.rankValue - ourPiece.rankValue;
  }

  private canFollowUpAttack(position: Position, gameState: GameState): boolean {
    if (this.difficulty === "easy") return false;

    // Check if we have a stronger piece nearby that can attack this position
    const adjacentPositions = [
      { row: position.row - 1, col: position.col },
      { row: position.row + 1, col: position.col },
      { row: position.row, col: position.col - 1 },
      { row: position.row, col: position.col + 1 },
    ];

    for (const adjPos of adjacentPositions) {
      if (
        adjPos.row >= 0 &&
        adjPos.row < 10 &&
        adjPos.col >= 0 &&
        adjPos.col < 10
      ) {
        const piece = gameState.board[adjPos.row][adjPos.col].piece;
        if (piece && piece.player === 2 && piece.rankValue >= 6) {
          // We have a strong piece adjacent that can follow up
          return true;
        }
      }
    }

    return false;
  }

  private shouldProbeUnknown(
    ourPiece: GamePiece,
    targetPosition: Position,
    gameState: GameState
  ): boolean {
    if (this.difficulty === "easy") return false;

    // Low-value pieces are good for probing
    if (ourPiece.rankValue <= 4) {
      // Extra good if we have follow-up attackers nearby
      if (this.canFollowUpAttack(targetPosition, gameState)) {
        return true;
      }
      return true;
    }

    // Scouts are excellent for probing
    if (ourPiece.rank === "Scout") {
      return true;
    }

    // Miners should probe suspected bombs
    if (ourPiece.rank === "Miner") {
      const bombClusters = this.getBombClusterAreas();
      return bombClusters.some(
        (cluster) => this.getDistanceToPosition(cluster, targetPosition) <= 1
      );
    }

    return false;
  }

  // POSITIONAL PLAY: Center control scoring
  private getCenterControlScore(position: Position): number {
    // Center squares (4,4), (4,5), (5,4), (5,5) are most valuable
    const centerSquares = [
      { row: 4, col: 4 },
      { row: 4, col: 5 },
      { row: 5, col: 4 },
      { row: 5, col: 5 },
    ];

    // Check if position is a center square
    if (
      centerSquares.some(
        (c) => c.row === position.row && c.col === position.col
      )
    ) {
      return 15; // Strong bonus for center control
    }

    // Adjacent to center also good
    const distanceToCenter = Math.min(
      ...centerSquares.map((c) => this.getDistanceToPosition(position, c))
    );

    if (distanceToCenter === 1) return 8;
    if (distanceToCenter === 2) return 4;
    return 0;
  }

  // POSITIONAL PLAY: Check if forming defensive formation around flag
  private isDefensiveFormation(
    position: Position,
    gameState: GameState
  ): boolean {
    const flagPos = this.findOurFlag(gameState);
    if (!flagPos) return false;

    const distance = this.getDistanceToPosition(position, flagPos);
    // Defensive ring is 1-2 squares from flag
    return distance >= 1 && distance <= 2;
  }

  // POSITIONAL PLAY: Check if flanking enemy position
  private isFlankingMove(
    moveFrom: Position,
    moveTo: Position,
    gameState: GameState
  ): boolean {
    // Check if we're moving to the side of an enemy piece
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const piece = gameState.board[row][col].piece;
        if (piece && piece.player === 1 && !piece.isCaptured) {
          const enemyPos = { row, col };
          const distanceFrom = this.getDistanceToPosition(moveFrom, enemyPos);
          const distanceTo = this.getDistanceToPosition(moveTo, enemyPos);

          // We're flanking if we move closer and to the side (not directly in front)
          if (distanceTo === 1 && distanceFrom > distanceTo) {
            const rowDiff = Math.abs(moveTo.row - enemyPos.row);
            const colDiff = Math.abs(moveTo.col - enemyPos.col);
            // Flanking = adjacent but not directly above/below or left/right only
            if (
              (rowDiff === 1 && colDiff === 0) ||
              (rowDiff === 0 && colDiff === 1)
            ) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  // SCOUT INTELLIGENCE: Check if scout should retreat after revealing
  private shouldScoutRetreat(
    position: Position,
    gameState: GameState
  ): boolean {
    const piece = gameState.board[position.row][position.col].piece;
    if (!piece || piece.rank !== "Scout") return false;

    // Retreat if in enemy territory (rows 0-3) and surrounded by revealed enemies
    if (position.row <= 3) {
      let nearbyEnemies = 0;
      let revealedEnemies = 0;

      const adjacentPositions = [
        { row: position.row - 1, col: position.col },
        { row: position.row + 1, col: position.col },
        { row: position.row, col: position.col - 1 },
        { row: position.row, col: position.col + 1 },
      ];

      for (const pos of adjacentPositions) {
        if (pos.row >= 0 && pos.row < 10 && pos.col >= 0 && pos.col < 10) {
          const adjPiece = gameState.board[pos.row][pos.col].piece;
          if (adjPiece && adjPiece.player === 1) {
            nearbyEnemies++;
            if (adjPiece.isRevealed) revealedEnemies++;
          }
        }
      }

      // Retreat if 2+ enemies nearby and at least 1 revealed
      return nearbyEnemies >= 2 && revealedEnemies >= 1;
    }

    return false;
  }

  // FLAG HUNTING: Identify heavily protected areas (likely flag location)
  private getProtectedAreas(): Position[] {
    const protectedZones: Position[] = [];
    const immobilePieces = this.getSuspectedImmobilePieces();

    // Look for clusters of immobile pieces in enemy territory (rows 0-3)
    for (const pos of immobilePieces) {
      if (pos.row <= 3) {
        let nearbyImmobile = 0;

        // Count nearby immobile pieces (within 2 squares)
        for (const other of immobilePieces) {
          if (this.getDistanceToPosition(pos, other) <= 2) {
            nearbyImmobile++;
          }
        }

        // 3+ immobile pieces nearby = heavily protected area
        if (nearbyImmobile >= 3) {
          protectedZones.push(pos);
        }
      }
    }

    return protectedZones;
  }

  // MULTI-MOVE PLANNING: Evaluate if move opens up future opportunities
  private evaluateFutureOpportunities(
    move: MoveOption,
    gameState: GameState
  ): number {
    if (this.difficulty !== "hard") return 0;

    let futureScore = 0;

    // Simulate the move
    const afterMove: Position[] = [];

    // Check what positions we could reach next turn
    const nextMoves = this.getValidMovesForPiece(
      move.piece,
      move.to,
      gameState
    );

    for (const nextPos of nextMoves) {
      const targetPiece = gameState.board[nextPos.row][nextPos.col].piece;

      // If we can attack a known weak enemy next turn
      if (targetPiece && targetPiece.player === 1) {
        const enemyInfo = this.getKnownEnemyInfo(nextPos);
        if (enemyInfo?.revealedInBattle && enemyInfo.rankValue !== undefined) {
          if (move.piece.rankValue > enemyInfo.rankValue) {
            futureScore += 20; // Future guaranteed win
          }
        }
      }

      // If we can reach center control next turn
      if (this.getCenterControlScore(nextPos) > 10) {
        futureScore += 10;
      }

      afterMove.push(nextPos);
    }

    // Bonus for moves that increase mobility (more future options)
    if (afterMove.length > 3) {
      futureScore += 5;
    }

    return futureScore;
  }

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

    // MEDIUM/HARD: HIGH PRIORITY - Escape if this piece is threatened
    if (this.difficulty !== "easy") {
      if (this.isThreatenedByKnownEnemy(move.from, move.piece, gameState)) {
        // This piece is in danger! Prioritize moving it to safety
        if (!this.isThreatenedByKnownEnemy(move.to, move.piece, gameState)) {
          score += 60; // Big bonus for escaping danger

          // Extra bonus for high-value pieces escaping
          if (move.piece.rankValue >= 7) {
            score += 30;
          }
        }
      }
    }

    // MEDIUM/HARD: Avoid moving into threats
    if (this.difficulty !== "easy") {
      if (this.isThreatenedByKnownEnemy(move.to, move.piece, gameState)) {
        score -= 50; // Avoid walking into known danger

        // Even bigger penalty for high-value pieces
        if (move.piece.rankValue >= 7) {
          score -= 30;
        }
      }
    }

    // HARD MODE: Coordinate defensive moves
    if (this.difficulty === "hard") {
      const threatenedPieces = this.getThreatenedPieces(gameState);

      // Check if this move helps defend a threatened piece
      for (const threatenedPos of threatenedPieces) {
        const defenders = this.canDefendPosition(threatenedPos, gameState);
        const isDefender = defenders.some(
          (def) => def.row === move.from.row && def.col === move.from.col
        );

        if (isDefender) {
          const distanceToThreatened = this.getDistanceToPosition(
            move.to,
            threatenedPos
          );
          if (distanceToThreatened === 1) {
            score += 35; // Bonus for supporting threatened pieces

            // Extra bonus if we can counter the threat
            const threatenedPiece =
              gameState.board[threatenedPos.row][threatenedPos.col].piece;
            if (
              threatenedPiece &&
              move.piece.rankValue > threatenedPiece.rankValue
            ) {
              score += 20;
            }
          }
        }
      }
    }

    // MEDIUM/HARD: Defend the Flag when enemies are near
    if (this.difficulty !== "easy") {
      const flagPos = this.findOurFlag(gameState);
      if (flagPos && this.isEnemyNearFlag(gameState)) {
        const distanceToFlag = this.getDistanceToPosition(move.to, flagPos);

        // Prioritize moving pieces closer to defend flag
        if (distanceToFlag <= 2) {
          score += 40; // Strong bonus for defending flag

          // Higher-value pieces make better defenders
          if (move.piece.rankValue >= 6) {
            score += 20;
          }
        }
      }
    }

    // MEDIUM/HARD: Target suspected immobile pieces (bombs/flags) with appropriate pieces
    if (this.difficulty !== "easy") {
      const suspectedImmobile = this.getSuspectedImmobilePieces();
      const isSuspectedImmobile = suspectedImmobile.some(
        (pos) => pos.row === move.to.row && pos.col === move.to.col
      );

      if (isSuspectedImmobile) {
        if (move.piece.rank === "Miner") {
          score += 40; // Miners should target suspected bombs

          // HARD: Extra bonus if in bomb cluster area
          if (this.difficulty === "hard") {
            const bombClusters = this.getBombClusterAreas();
            if (
              bombClusters.some(
                (c) => c.row === move.to.row && c.col === move.to.col
              )
            ) {
              score += 25; // Clearing bomb clusters is strategic
            }
          }
        } else if (move.piece.rankValue <= 4) {
          score += 15; // Send low-value pieces to check
        } else {
          score -= 30; // Don't send valuable pieces to suspected bombs
        }
      }

      // FLAG HUNTING: Target heavily protected areas
      const protectedAreas = this.getProtectedAreas();
      const isProtectedArea = protectedAreas.some(
        (pos) => pos.row === move.to.row && pos.col === move.to.col
      );

      if (isProtectedArea) {
        if (move.piece.rank === "Miner") {
          score += 50; // Miners should investigate protected areas (likely flag)
        } else if (move.piece.rankValue >= 7) {
          score += 30; // Strong pieces should approach suspected flag
        } else if (move.piece.rankValue <= 4) {
          score += 20; // Low pieces can probe protected areas
        }
      }
    }

    // POSITIONAL PLAY: Center control (Medium/Hard)
    if (this.difficulty !== "easy" && !targetPiece) {
      const centerScore = this.getCenterControlScore(move.to);
      if (centerScore > 0) {
        // Medium-value pieces (5-7) are best for center control
        if (move.piece.rankValue >= 5 && move.piece.rankValue <= 7) {
          score += centerScore;
        } else {
          score += centerScore / 2; // Smaller bonus for other pieces
        }
      }
    }

    // POSITIONAL PLAY: Defensive formation around flag (Medium/Hard)
    if (this.difficulty !== "easy" && !targetPiece) {
      if (this.isDefensiveFormation(move.to, gameState)) {
        // Stronger pieces make better defenders
        if (move.piece.rankValue >= 6) {
          score += 18;
        } else if (move.piece.rankValue >= 4) {
          score += 12;
        }
      }
    }

    // POSITIONAL PLAY: Flanking maneuvers (Hard mode)
    if (this.difficulty === "hard" && !targetPiece) {
      if (this.isFlankingMove(move.from, move.to, gameState)) {
        score += 22; // Flanking is tactically advantageous
      }
    }

    // MEDIUM/HARD: Block or challenge advancing enemy pieces
    if (this.difficulty !== "easy" && !targetPiece) {
      // Check if we're moving to block an enemy's path
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          const enemyPiece = gameState.board[row][col].piece;
          if (enemyPiece && enemyPiece.player === 1 && !enemyPiece.isCaptured) {
            // If enemy is in our territory (rows 6-9 for AI)
            if (row >= 6) {
              const distance = this.getDistanceToPosition(move.to, {
                row,
                col,
              });
              if (distance === 1) {
                score += 25; // Block enemies in our territory

                // Extra bonus if we can potentially defeat them
                const enemyInfo = this.getKnownEnemyInfo({ row, col });
                if (
                  enemyInfo?.revealedInBattle &&
                  enemyInfo.rankValue !== undefined
                ) {
                  if (move.piece.rankValue > enemyInfo.rankValue) {
                    score += 15; // We threaten them!
                  }
                }
              }
            }
          }
        }
      }
    }

    // If attacking an enemy piece
    if (targetPiece && targetPiece.player !== move.piece.player) {
      // MEDIUM/HARD: Use memory to make better attack decisions
      if (this.difficulty !== "easy") {
        const enemyInfo = this.getKnownEnemyInfo(move.to);
        if (enemyInfo?.revealedInBattle && enemyInfo.rankValue !== undefined) {
          // We know exactly what this piece is - make optimal decision
          if (move.piece.rank === "Spy" && enemyInfo.rank === "Marshal") {
            score += 150; // Spy takes Marshal!
          } else if (move.piece.rank === "Miner" && enemyInfo.rank === "Bomb") {
            score += 80; // Defuse known bomb
          } else if (enemyInfo.rank === "Bomb") {
            score -= 150; // Don't attack known bombs (unless Miner)
          } else if (enemyInfo.rank === "Flag") {
            score += 1000; // WIN!
          } else if (move.piece.rankValue > enemyInfo.rankValue) {
            // Guaranteed win - evaluate trade value
            const tradeValue = this.evaluateTradeValue(move.piece, {
              ...move.piece,
              rank: enemyInfo.rank,
              rankValue: enemyInfo.rankValue,
            } as GamePiece);
            score += 50 + tradeValue * 10; // Better trades get higher scores
          } else if (move.piece.rankValue < enemyInfo.rankValue) {
            score -= 80; // Guaranteed loss - avoid
          } else {
            // Tie - both removed, evaluate if trade is worth it
            score += 10;

            // HARD: Consider trading if it benefits us strategically
            if (this.difficulty === "hard") {
              // Trading away low pieces for enemy low pieces is okay
              if (move.piece.rankValue <= 4) {
                score += 15;
              }
            }
          }
          return score; // Skip further attack logic
        }
      }

      // MEDIUM/HARD: Strategic probing of unknown pieces
      if (!targetPiece.isRevealed) {
        if (this.difficulty !== "easy") {
          // Check if this is a good probe
          if (this.shouldProbeUnknown(move.piece, move.to, gameState)) {
            score += 30; // Bonus for good probing moves

            // Extra bonus if we have follow-up attackers
            if (this.canFollowUpAttack(move.to, gameState)) {
              score += 25; // We can capitalize on revealed info
            }

            // HARD: Strategic sacrifices for information
            if (this.difficulty === "hard" && move.piece.rankValue <= 3) {
              score += 20; // Low pieces are expendable for intel
            }
          } else if (
            move.piece.rankValue >= 7 &&
            move.piece.rank !== "Spy" &&
            move.piece.rank !== "Miner"
          ) {
            score -= 35; // Don't risk high-value pieces on unknowns
          }
        } else {
          // EASY mode: simple logic
          if (
            move.piece.rankValue >= 7 &&
            move.piece.rank !== "Spy" &&
            move.piece.rank !== "Miner"
          ) {
            score -= 15; // Risky to attack with high-value pieces
          }
        }

        // Scouts and Miners are always good attackers
        if (move.piece.rank === "Scout") {
          score += 20; // Scouts are good for exploring
        } else if (move.piece.rank === "Miner") {
          score += 5; // Miners might find bombs
        }
      } else {
        // Target is revealed (from earlier battle) - calculate if we can win
        if (move.piece.rank === "Spy" && targetPiece.rank === "Marshal") {
          score += 100; // Special win!
        } else if (move.piece.rank === "Miner" && targetPiece.rank === "Bomb") {
          score += 50; // Defuse bomb
        } else if (targetPiece.rank === "Bomb") {
          score -= 100; // Don't attack bombs unless we're a Miner
        } else if (targetPiece.rank === "Flag") {
          score += 1000; // WIN!
        } else if (move.piece.rankValue > targetPiece.rankValue) {
          // Evaluate trade value
          const tradeValue = this.evaluateTradeValue(move.piece, targetPiece);
          score += 30 + tradeValue * 5; // Better trades get higher scores
        } else if (move.piece.rankValue < targetPiece.rankValue) {
          score -= 40; // We lose - avoid unless strategic

          // HARD: Sometimes worth sacrificing for position or info
          if (this.difficulty === "hard") {
            if (
              move.piece.rankValue <= 3 &&
              this.canFollowUpAttack(move.to, gameState)
            ) {
              score += 25; // Strategic sacrifice if we have follow-up
            }
          }
        } else {
          score += 5; // Tie - remove both pieces

          // MEDIUM/HARD: Consider if trading equal pieces benefits us
          if (this.difficulty !== "easy") {
            // Trading low for low is fine
            if (move.piece.rankValue <= 4) {
              score += 10;
            }
          }
        }
      }
    } else {
      // Moving to empty square

      // Move forward (toward opponent)
      if (move.to.row < move.from.row) {
        score += 3;
      }

      // SCOUT INTELLIGENCE: Systematic exploration and retreat
      if (move.piece.rank === "Scout") {
        const distance =
          Math.abs(move.to.row - move.from.row) +
          Math.abs(move.to.col - move.from.col);
        score += distance * 2;

        // MEDIUM/HARD: Bonus for exploring enemy territory (rows 0-3)
        if (this.difficulty !== "easy" && move.to.row <= 3) {
          score += 15; // Scouts should probe enemy lines
        }

        // MEDIUM/HARD: Scout retreat logic after revealing
        if (
          this.difficulty !== "easy" &&
          this.shouldScoutRetreat(move.from, gameState)
        ) {
          // Retreat toward our territory (higher rows)
          if (move.to.row > move.from.row) {
            score += 35; // Strong bonus for retreating to safety
          }
        }

        // HARD: Systematic exploration - avoid visited areas
        if (this.difficulty === "hard") {
          // Prefer unexplored enemy territory
          if (move.to.row <= 2) {
            score += 10; // Deep exploration
          }
        }
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

      // HARD: Advanced positioning for offensive pressure
      if (this.difficulty === "hard") {
        // Strong pieces should advance cautiously toward enemy territory
        if (move.piece.rankValue >= 6 && move.piece.rankValue <= 8) {
          if (move.to.row >= 3 && move.to.row <= 5) {
            score += 12; // Middle board control with strong pieces
          }
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

    // MULTI-MOVE PLANNING: Hard mode evaluates future opportunities
    if (this.difficulty === "hard") {
      const futureScore = this.evaluateFutureOpportunities(move, gameState);
      score += futureScore;
    }

    return score;
  }

  public getBestMove(
    gameState: GameState
  ): { from: Position; to: Position } | null {
    // Update memory based on current board state
    this.updateMemory(gameState);

    const allMoves = this.getAllPossibleMoves(gameState, 2); // AI is player 2

    if (allMoves.length === 0) return null;

    // Score all moves
    for (const move of allMoves) {
      move.score = this.scoreMoveOption(move, gameState);
    }

    // Sort by score (highest first)
    allMoves.sort((a, b) => b.score - a.score);

    // Difficulty affects move selection randomness
    let topMovesCount: number;
    if (this.difficulty === "easy") {
      topMovesCount = 10; // More random on easy
    } else if (this.difficulty === "medium") {
      topMovesCount = 5; // Balanced randomness
    } else {
      topMovesCount = 3; // More focused on hard
    }

    const topMoves = allMoves.slice(
      0,
      Math.min(topMovesCount, allMoves.length)
    );
    const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];

    return {
      from: selectedMove.from,
      to: selectedMove.to,
    };
  }
}
