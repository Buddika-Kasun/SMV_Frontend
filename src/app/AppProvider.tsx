import React from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { LoanProvider } from "../contexts/LoanContext";
// import { ConsultancyProvider } from "../contexts/ConsultancyContext";
import { UIProvider } from "../contexts/UIContext";

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <AuthProvider>
      <LoanProvider>
        {/* <ConsultancyProvider> */}
          <UIProvider>{children}</UIProvider>
        {/* </ConsultancyProvider> */}
      </LoanProvider>
    </AuthProvider>
  );
};
