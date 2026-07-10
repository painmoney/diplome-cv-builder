import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import LayoutWrapper from "./components/layout/LayoutWrapper";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ResumePreview = lazy(() => import("./pages/ResumePreview"));
const ResumeEditor = lazy(() => import("./components/ResumeBuilder/ResumeEditor"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

export default function AppRoutes() {
  return (
    <LayoutWrapper>
      <Suspense fallback={null}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected — dynamic resume by ID */}
          <Route
            path="/resume-editor/:resumeId"
            element={
              <ProtectedRoute>
                <ResumeEditor />
              </ProtectedRoute>
            }
          />

          <Route
            path="/resume-preview/:resumeId"
            element={
              <ProtectedRoute>
                <ResumePreview />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </LayoutWrapper>
  );
}
