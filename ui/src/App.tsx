import { useGameLogic } from "./hooks/useGameLogic";
import { GameBoard } from "./components/GameBoard";
import { CapturedPieces } from "./components/CapturedPieces";
import { Header } from "./components/Header";
import { MoveHistory } from "./components/MoveHistory";
import "./App.css";

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}

function App() {
  const {
    gameState,
    isLoading,
    error,
    fetchTeamData,
    selectPiece,
    resetGame,
    setDifficulty,
    battlePosition,
  } = useGameLogic();

  const handleStartNewGame = () => {
    // Track the event in Google Analytics
    if (window.gtag) {
      window.gtag("event", "start_new_game", {
        event_category: "game",
        event_label: "Start New Game Button",
      });
    }
    fetchTeamData();
  };

  return (
    <div className="app">
      <Header
        difficulty={gameState.aiDifficulty}
        onDifficultyChange={setDifficulty}
        gamePhase={gameState.gamePhase}
      />

      <main className="app-main">
        {gameState.gamePhase === "setup" && (
          <div className="setup-screen">
            <h2>Welcome to Baseball Strategery!</h2>
            <p>
              Click below to fetch random baseball teams and start the game.
            </p>
            <button
              onClick={handleStartNewGame}
              disabled={isLoading}
              className={`start-button ${isLoading ? "loading" : ""}`}
            >
              {isLoading && <span className="spinner"></span>}
              {isLoading ? "Loading Teams..." : "Start New Game"}
            </button>
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <div>
                  <strong>Error:</strong> {error}
                  <p className="error-hint">
                    Please check your API connection and try again.
                  </p>
                </div>
              </div>
            )}

            <div className="rules">
              <h3>How to Play:</h3>
              <ul>
                <li>
                  You control 40 historical baseball team pieces ranked by win
                  percentage
                </li>
                <li>
                  Click a piece to select it, then click a highlighted square to
                  move
                </li>
                <li>Higher-ranked teams defeat lower-ranked teams in battle</li>
                <li>
                  Special rules: Spy (lowest) can capture Marshal (highest) when
                  attacking
                </li>
                <li>
                  Miners can defuse Bombs, Scouts can move multiple squares
                </li>
                <li>Capture the opponent's Flag to win!</li>
              </ul>
            </div>
          </div>
        )}

        {gameState.gamePhase === "playing" && (
          <div className="game-screen">
            <div className="game-info">
              <div className="current-player">
                <h2>Current Turn: Player {gameState.currentPlayer}</h2>
                <div
                  className={`player-indicator player${gameState.currentPlayer}`}
                ></div>
              </div>

              <div className="selected-piece-info">
                {gameState.selectedPiece ? (
                  <>
                    <h3>Selected Piece:</h3>
                    <p>
                      <strong>{gameState.selectedPiece.piece.rank}</strong>
                    </p>
                    <p>{gameState.selectedPiece.piece.teamData.teamName}</p>
                    <p>
                      {gameState.selectedPiece.piece.teamData.year} (
                      {gameState.selectedPiece.piece.teamData.wins}-
                      {gameState.selectedPiece.piece.teamData.losses})
                    </p>
                  </>
                ) : (
                  <div className="placeholder">&nbsp;</div>
                )}
              </div>
            </div>

            <MoveHistory moves={gameState.moveHistory} />

            <GameBoard
              board={gameState.board}
              currentPlayer={gameState.currentPlayer}
              onSquareClick={selectPiece}
              lastOpponentMove={gameState.lastOpponentMove}
              battlePosition={battlePosition}
            />

            <div className="sidebar">
              <button onClick={resetGame} className="reset-button">
                Main Menu
              </button>

              <CapturedPieces pieces={gameState.capturedPieces} player={1} />
              <CapturedPieces pieces={gameState.capturedPieces} player={2} />
            </div>
          </div>
        )}

        {gameState.gamePhase === "finished" && (
          <div className="game-over-screen">
            <h2>🎉 Game Over! 🎉</h2>
            <h1 className={`winner player${gameState.winner}`}>
              Player {gameState.winner} Wins!
            </h1>
            <button onClick={resetGame} className="play-again-button">
              Main Menu
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
