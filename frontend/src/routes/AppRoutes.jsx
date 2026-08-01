import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Shell from "../layouts/Shell";
import SearchPage from "../pages/SearchPage";
import LibraryPage from "../pages/LibraryPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import AuthPage from "../pages/AuthPage";

function Protected({ children }) {
  return localStorage.getItem("token") ? (
    <Shell>{children}</Shell>
  ) : (
    <Navigate to="/login" replace />
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/search" replace />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage register />} />
      <Route path="/search" element={<Protected><SearchPage /></Protected>} />
      <Route path="/library" element={<Protected><LibraryPage /></Protected>} />
      <Route path="/analytics" element={<Protected><AnalyticsPage /></Protected>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
