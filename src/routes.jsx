import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ResumePreview from "./pages/ResumePreview";
import ResumeEditor from "./components/ResumeBuilder/ResumeEditor";

import ProtectedRoute from "./components/ProtectedRoute";
import LayoutWrapper from "./components/layout/LayoutWrapper";

export default function AppRoutes() {
  return (
    <LayoutWrapper>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resume-editor"
          element={
            <ProtectedRoute>
              <ResumeEditor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resume-preview"
          element={
            <ProtectedRoute>
              <ResumePreview />
            </ProtectedRoute>
          }
        />
      </Routes>
    </LayoutWrapper>
  );
}
