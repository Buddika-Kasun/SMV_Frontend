import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import { useUI } from "../contexts/UIContext";
import { Layout } from "../components/Layout/Layout";
import { MainContent } from "../components/MainContent";
import { Modals } from "../components/Modals/Modals";
import { LoginScreen } from "../components/screens/LoginScreen";

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const ui = useUI();

  // console.log(
  //   "AppRoutes - loading:",
  //   loading,
  //   "isAuthenticated:",
  //   isAuthenticated,
  // );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, only show login
  if (!isAuthenticated) {
    return (
      // <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      // </BrowserRouter>
    );
  }

  // If authenticated, show all routes
  return (
    <>
      {/* <BrowserRouter> */}
      <Routes>
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout
                activeTab={ui.activeTab}
                openNewLoanModal={ui.openNewLoanModal}
                openLoanDetails={ui.openLoanDetails}
              >
                <MainContent
                  activeTab="dashboard"
                  setActiveTab={ui.setActiveTab}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Applications Route */}
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <Layout
                activeTab="applications"
                openNewLoanModal={ui.openNewLoanModal}
                openLoanDetails={ui.openLoanDetails}
              >
                <MainContent
                  activeTab="applications"
                  setActiveTab={ui.setActiveTab}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* KYC Route */}
        <Route
          path="/kyc"
          element={
            <ProtectedRoute>
              <Layout
                activeTab="kyc"
                openNewLoanModal={ui.openNewLoanModal}
                openLoanDetails={ui.openLoanDetails}
              >
                <MainContent activeTab="kyc" setActiveTab={ui.setActiveTab} />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Payments Route */}
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Layout
                activeTab="payments"
                openNewLoanModal={ui.openNewLoanModal}
                openLoanDetails={ui.openLoanDetails}
              >
                <MainContent
                  activeTab="payments"
                  setActiveTab={ui.setActiveTab}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Settlement Route */}
        <Route
          path="/settlement"
          element={
            <ProtectedRoute>
              <Layout
                activeTab="settlement"
                openNewLoanModal={ui.openNewLoanModal}
                openLoanDetails={ui.openLoanDetails}
              >
                <MainContent
                  activeTab="settlement"
                  setActiveTab={ui.setActiveTab}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Customers Route */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Layout
                activeTab="customers"
                openNewLoanModal={ui.openNewLoanModal}
                openLoanDetails={ui.openLoanDetails}
              >
                <MainContent
                  activeTab="customers"
                  setActiveTab={ui.setActiveTab}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Users Route */}
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout
                activeTab="users"
                openNewLoanModal={ui.openNewLoanModal}
                openLoanDetails={ui.openLoanDetails}
              >
                <MainContent activeTab="users" setActiveTab={ui.setActiveTab} />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Reports Route */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout
                activeTab="reports"
                openNewLoanModal={ui.openNewLoanModal}
                openLoanDetails={ui.openLoanDetails}
              >
                <MainContent
                  activeTab="reports"
                  setActiveTab={ui.setActiveTab}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Modals - rendered outside Routes but inside Router */}
      <Modals />
      {/* </BrowserRouter> */}
    </>
  );
};
