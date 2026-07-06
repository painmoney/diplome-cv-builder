import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { AuthProvider } from "./context/AuthContext";
import { ThemeModeProvider } from "./context/ThemeModeContext";
import AppRoutes from "./routes.jsx";

export default function App() {
  return (
    <Sentry.ErrorBoundary>
      <ThemeModeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeModeProvider>
    </Sentry.ErrorBoundary>
  );
}
