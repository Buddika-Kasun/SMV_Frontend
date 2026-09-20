import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import { useUI } from "../contexts/UIContext";
import { Layout } from "../components/Layout/Layout";
import { MainContent } from "../components/MainContent";
import { Modals } from "../components/Modals/Modals";
import { LoginScreen } from "../components/screens/LoginScreen";

const getDefaultRoute = (role?: string): string => {
  return role === "staff" ? "/applications" : "/dashboard";
};

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading, currentUser } = useAuth();
  const ui = useUI();

  const defaultRoute = getDefaultRoute(currentUser?.role);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        {/* Login + root → role-aware default */}
        <Route path="/login" element={<Navigate to={defaultRoute} replace />} />
        <Route path="/" element={<Navigate to={defaultRoute} replace />} />

        {/* Dashboard — admin/manager only */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole={["admin", "manager"]}>
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

        {/* Applications — everyone */}
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

        {/* KYC — everyone */}
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

        {/* Payments — everyone */}
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

        {/* Settlement — everyone */}
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

        {/* Customers — everyone */}
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

        {/* Users — admin/manager only */}
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredRole={["admin", "manager"]}>
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

        {/* Reports — admin/manager only */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute requiredRole={["admin", "manager"]}>
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

        {/* Catch-all → role-aware default */}
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>

      <Modals />
    </>
  );
};
