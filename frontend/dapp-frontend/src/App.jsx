import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/DashboardPage";
import AdminPanel from "./pages/AdminPanel";
import LeaderboardPanel from "./pages/LeaderboardPanel";
import "./App.css";

const App = () => {
  const cursorRef = useRef(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateCursor = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateCursor);
    return () => window.removeEventListener("mousemove", updateCursor);
  }, []);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/leaderboard" element={<LeaderboardPanel />} />
        </Routes>
      </Router>
      <div
        className="custom-cursor"
        ref={cursorRef}
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      />
    </>
  );
};

export default App;
