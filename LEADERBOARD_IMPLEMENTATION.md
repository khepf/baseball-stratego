# Leaderboard System Implementation

## Overview

The Baseball Stratego leaderboard tracks the **fewest number of moves** required to capture the opponent's flag. Only registered users appear on the leaderboard.

## Features

### Leaderboard Categories

- **Fastest Flag Capture**: Tracks the minimum number of moves needed to win, separated by difficulty (easy, medium, hard)

### Key Components

1. **Leaderboard Page** ([Leaderboards.tsx](ui/src/pages/Leaderboards.tsx))

   - Displays top 10 players per difficulty
   - Shows rank, username, move count, team, and date
   - Gold/silver/bronze medals for top 3
   - Highlights current user's entries
   - Difficulty tabs for easy/medium/hard

2. **Leaderboard Service** ([leaderboardService.ts](ui/src/services/leaderboardService.ts))

   - `saveGameResult()`: Saves game outcomes to Firestore
   - Stores results in `gameResults` collection
   - Adds winning games to `leaderboards/fastestCapture/{difficulty}` subcollection

3. **Game Logic Integration** ([useGameLogic.ts](ui/src/hooks/useGameLogic.ts))

   - Tracks player 1 move count with `player1Moves` ref
   - Increments counter on each player 1 move
   - Submits to leaderboard when registered user captures flag
   - Includes player's team name in submission

4. **TypeScript Types** ([leaderboard.ts](ui/src/types/leaderboard.ts))
   - `LeaderboardEntry`: Leaderboard display data
   - `GameResult`: Game outcome submission data

## Firestore Structure

```
gameResults/ (collection)
  └── {resultId} (auto-generated)
      ├── userId: string
      ├── username: string
      ├── moves: number
      ├── difficulty: "easy" | "medium" | "hard"
      ├── won: boolean
      ├── timestamp: Timestamp
      └── playerTeam: string (optional)

leaderboards/ (collection)
  └── fastestCapture/ (document)
      └── {difficulty}/ (subcollection: easy, medium, hard)
          └── {entryId} (auto-generated)
              ├── userId: string
              ├── username: string
              ├── moves: number
              ├── difficulty: string
              ├── timestamp: Timestamp
              └── playerTeam: string (optional)
```

## Security Rules

The `firestore.rules` file ensures:

- Anyone can read leaderboards
- Only authenticated users can create entries
- Users can only submit their own results (userId matches auth.uid)
- Leaderboard entries are immutable (no updates/deletes)

To deploy security rules:

```bash
firebase deploy --only firestore:rules
```

## How It Works

### Move Tracking

1. Game starts → `player1Moves` ref is reset to 0
2. Each player 1 move → `player1Moves.current++`
3. Flag captured → move count recorded

### Leaderboard Submission

When a registered user (player 1) wins:

1. Check if `currentUser` (Firebase auth user) exists
2. Get player's team name from `teamData`
3. Call `saveGameResult()` with:
   - userId
   - username (from Firebase displayName)
   - move count
   - difficulty level
   - timestamp
   - team name
4. Service saves to both collections

### Display

1. User navigates to `/leaderboards`
2. Fetches top 10 entries for selected difficulty
3. Queries `leaderboards/fastestCapture/{difficulty}`
4. Sorts by `moves` ascending (fewest first)
5. Displays with rank, medals, and user highlighting

## Guest Users

- Can play the game normally
- Move tracking still occurs
- Results are NOT saved to leaderboard
- See prompt to register/login on leaderboard page

## Navigation

- Leaderboards link added to Header (gold trophy emoji)
- Back link on leaderboards page returns to game
- Route: `/leaderboards`

## Styling

- Gold/silver/bronze medals for top 3
- Current user row highlighted in blue
- Responsive design for mobile/tablet/desktop
- Purple gradient theme matching auth pages
- Loading spinner and error states

## Future Enhancements

Potential additional leaderboard categories:

- Most pieces captured
- Highest difficulty win streak
- Fastest time (actual game duration)
- Most efficient wins (fewest battles)
- Specific piece achievements (Scout captures, Miner defuses, etc.)
