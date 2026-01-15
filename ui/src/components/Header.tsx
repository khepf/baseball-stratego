import { Link } from "react-router-dom";
import type { User } from "../types/auth";
import "./Header.css";

interface HeaderProps {
  gamePhase: "setup" | "playing" | "finished";
  currentUser: User | null;
  onLogout: () => void;
}

export const Header = ({ gamePhase, currentUser, onLogout }: HeaderProps) => {
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

        <div className="user-info-section">
          {currentUser ? (
            <div className="user-logged-in">
              <span className="user-greeting">
                Welcome, <strong>{currentUser.username}</strong>!
              </span>
              <button onClick={onLogout} className="logout-button">
                Logout
              </button>
            </div>
          ) : (
            <div className="user-guest">
              <span className="guest-message">Playing as guest</span>
              <div className="auth-buttons">
                <Link to="/login" className="auth-nav-button">
                  Login
                </Link>
                <Link to="/register" className="auth-nav-button primary">
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
