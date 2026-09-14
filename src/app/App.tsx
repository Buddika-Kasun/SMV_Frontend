import React from "react";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "./AppProvider";
import { AppRoutes } from "./AppRoutes";
import { BrowserRouter } from "react-router-dom";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
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
          }}
        />
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;
