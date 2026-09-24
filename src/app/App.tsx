import React from "react";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "./AppProvider";
import { AppRoutes } from "./AppRoutes";
import { BrowserRouter } from "react-router-dom";

const toastOptions = {
  duration: 3500,
  style: {
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: 500,
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    boxShadow:
      "0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
    padding: "10px 14px",
  },
  success: {
    iconTheme: {
      primary: "#059669",
      secondary: "#ffffff",
    },
  },
  error: {
    iconTheme: {
      primary: "#e11d48",
      secondary: "#ffffff",
    },
  },
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />

        {/* Default toasts (top-right) */}
        <Toaster position="top-right" toastOptions={toastOptions} />

        {/* Optional: alternate positions, same styling */}
        <Toaster
          position="top-left"
          toasterId="left"
          toastOptions={toastOptions}
        />
        <Toaster
          position="top-center"
          toasterId="center"
          toastOptions={toastOptions}
        />
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;
