import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App.tsx";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Leaderboards } from "./pages/Leaderboards";
import { Profile } from "./pages/Profile";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="leaderboards" element={<Leaderboards />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
