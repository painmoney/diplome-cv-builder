import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeModeProvider } from "./context/ThemeModeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import AppRoutes from "./routes.jsx";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeModeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeModeProvider>
    </ErrorBoundary>
  );
}
