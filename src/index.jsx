import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { initSentry } from "./config/sentry";
import App from "./App";
import "./styles.css";

initSentry();

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);