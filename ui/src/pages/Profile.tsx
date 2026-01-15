import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../hooks/useAuth";
import "./Profile.css";

export function Profile() {
  const { currentUser, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(currentUser?.username || "");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect if not logged in
  if (!currentUser || !firebaseUser) {
    navigate("/login");
    return null;
  }

  const validateUsername = (name: string): string | null => {
    if (name.length < 3 || name.length > 20) {
      return "Username must be between 3 and 20 characters";
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return "Username can only contain letters, numbers, hyphens, and underscores";
    }
    return null;
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check if username actually changed
    if (username === currentUser.username) {
      setError("This is already your current username");
      return;
    }

    try {
      setLoading(true);

      // Update Firebase Auth displayName
      await updateProfile(firebaseUser, {
        displayName: username,
      });

      // Update Firestore user document
      const userRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userRef, {
        username: username,
        displayName: username,
      });

      setSuccess("Username updated successfully!");
      setIsEditing(false);

      // Reload page to refresh auth context
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Error updating username:", err);
      setError("Failed to update username. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUsername(currentUser.username);
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Profile Settings</h1>
          <Link to="/" className="back-link">
            ← Back to Game
          </Link>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h2>Account Information</h2>

            <div className="profile-field">
              <label>Email</label>
              <p className="field-value">{currentUser.email}</p>
              <span className="field-note">Email cannot be changed</span>
            </div>

            <div className="profile-field">
              <label>Username</label>
              {!isEditing ? (
                <div className="username-display">
                  <p className="field-value">{currentUser.username}</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUpdateUsername} className="username-form">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter new username"
                    disabled={loading}
                    autoFocus
                  />
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="save-button"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="cancel-button"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {error && (
              <div className="message error-message">
                <span className="message-icon">⚠️</span>
                {error}
              </div>
            )}

            {success && (
              <div className="message success-message">
                <span className="message-icon">✓</span>
                {success}
              </div>
            )}
          </div>

          <div className="profile-section">
            <h2>Game Stats</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">User ID</p>
                <p className="stat-value">
                  {currentUser.uid.substring(0, 8)}...
                </p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Account Type</p>
                <p className="stat-value">
                  {currentUser.photoURL ? "Google" : "Email"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
