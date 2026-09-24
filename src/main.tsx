import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./app/App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

// Only enable StrictMode in production to avoid double calls in development
// const isProduction = import.meta.env?.MODE === "production";
// console.log("IsProd : ", isProduction);

ReactDOM.createRoot(rootElement).render(
    // <React.StrictMode>
      <App />
    // </React.StrictMode>
);
