import "./Header.css";

interface HeaderProps {
  difficulty: "easy" | "medium" | "hard";
  onDifficultyChange: (difficulty: "easy" | "medium" | "hard") => void;
  gamePhase: "setup" | "playing" | "finished";
}

export const Header = ({
  difficulty,
  onDifficultyChange,
  gamePhase,
}: HeaderProps) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="subtitle-section">
          <p className="subtitle">
            A strategic battle of baseball's greatest teams.
          </p>
          <p className="subtitle">...and everyone else.</p>
        </div>
        <div className="title-section">
          <h1>⚾ Baseball Strategery ⚾</h1>
        </div>

        <div className="difficulty-selector">
          <label htmlFor="difficulty">AI Difficulty: </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) =>
              onDifficultyChange(e.target.value as "easy" | "medium" | "hard")
            }
            disabled={gamePhase === "playing"}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>
    </header>
  );
};
