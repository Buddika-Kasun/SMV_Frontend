import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  FileCheck,
  Banknote,
  Zap,
  Users,
  Building2,
  BarChart3,
  UserCheck,
} from "lucide-react";
import { TabType } from "../types";
import { User } from "../api";

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingApprovalsCount: number;
  pendingKycCount: number;
  overdueCount: number;
  activeConsultancyCount?: number;
  currentUser: User;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  pendingApprovalsCount,
  pendingKycCount,
  overdueCount,
  currentUser,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isManagerOrAdmin =
    currentUser.role === "admin" || currentUser.role === "manager";

  const allTabs = [
    // Micro Finance Dashboard (Only accessible by Managers and Admin)
    ...(isManagerOrAdmin
      ? [
          {
            id: "dashboard" as TabType,
            label: "Micro Finance",
            icon: LayoutDashboard,
            path: "/dashboard",
            badge:
              overdueCount > 0
                ? { count: overdueCount, color: "bg-amber-100 text-amber-800" }
                : undefined,
          },
        ]
      : []),

    // Operational Modules (Accessible by Staff, Managers, and Admin)
    {
      id: "applications" as TabType,
      label: isManagerOrAdmin ? "Loan Approvals" : "Loan Applications",
      icon: FileText,
      path: "/applications",
      badge:
        pendingApprovalsCount > 0
          ? { count: pendingApprovalsCount, color: "bg-blue-100 text-blue-800" }
          : undefined,
    },
    {
      id: "kyc" as TabType,
      label: "KYC Repository",
      icon: FileCheck,
      path: "/kyc",
      badge:
        pendingKycCount > 0
          ? { count: pendingKycCount, color: "bg-purple-100 text-purple-800" }
          : undefined,
    },
    {
      id: "payments" as TabType,
      label: "Payments Studio",
      icon: Banknote,
      path: "/payments",
      badge:
        overdueCount > 0
          ? { count: overdueCount, color: "bg-purple-100 text-purple-800" }
          : undefined,
    },
    {
      id: "settlement" as TabType,
      label: "Early Settlement",
      icon: Zap,
      path: "/settlement",
    },
    {
      id: "customers" as TabType,
      label: "Customers",
      icon: Users,
      path: "/customers",
    },

    // User Management (Only accessible by Managers and Admin)
    ...(isManagerOrAdmin
      ? [
          {
            id: "users" as TabType,
            label: "User Management",
            icon: UserCheck,
            path: "/users",
          },
        ]
      : []),

    // Reports Studio (Only accessible by Managers and Admin)
    ...(isManagerOrAdmin
      ? [
          {
            id: "reports" as TabType,
            label: "Essential Reports",
            icon: BarChart3,
            path: "/reports",
          },
        ]
      : []),
  ];

  const handleTabClick = (tab: (typeof allTabs)[0]) => {
    // Update the tab state
    onTabChange(tab.id);
    // Navigate to the path
    navigate(tab.path);
  };

  return (
    <aside className="w-full md:w-56 bg-white text-slate-800 flex flex-col shrink-0 border-r border-slate-200/80">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-xs">
          <Building2 className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <span className="font-extrabold text-slate-900 tracking-tight text-sm block">
            SMV Holdings
          </span>
          <span className="text-[10px] text-blue-600 font-semibold block">
            Micro Finance Enterprise
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-x-auto md:overflow-y-auto flex md:flex-col scrollbar-none">
        {allTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id || location.pathname === tab.path;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white font-medium shadow-xs"
                  : "hover:bg-blue-50/80 text-slate-600 hover:text-blue-700 font-medium"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`}
                />
                <span className="whitespace-nowrap">{tab.label}</span>
              </div>

              {tab.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tab.badge.color}`}
                >
                  {tab.badge.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Minimal User Role Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 text-[10px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span className="font-medium truncate capitalize">
            {currentUser.role} Session
          </span>
        </div>
        <span className="text-[9px] uppercase font-bold text-slate-400">
          v1.0
        </span>
      </div>
    </aside>
  );
};
