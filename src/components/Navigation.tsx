import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  FileCheck,
  Banknote,
  Zap,
  Users,
  BarChart3,
  UserCheck,
  Download,
  Trash2,
  Check,
  Menu,
  X,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { User } from "../api";

import logoIcon from "@/src/assets/logo2.jpg";
import { TabType } from "../types/app.types";

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingApprovalsCount: number;
  pendingKycCount: number;
  overdueCount: number;
  activeConsultancyCount?: number;
  currentUser: User;
  onLogout?: () => void;
  refresh?: () => void;
}

const INSTALL_FLAG_KEY = "smv_pwa_installed_at";
const INSTALL_FLAG_TTL_DAYS = 30;

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  pendingApprovalsCount,
  pendingKycCount,
  overdueCount,
  currentUser,
  onLogout,
  refresh,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isManagerOrAdmin =
    currentUser.role === "admin" || currentUser.role === "manager";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // ---------------------------------------------------------
  // PWA install / uninstall state
  // ---------------------------------------------------------
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showUninstallGuide, setShowUninstallGuide] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const recomputeInstalledState = useCallback(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const iosStandalone = (navigator as any).standalone === true;
    const standaloneNow = standalone || iosStandalone;
    setIsStandalone(standaloneNow);

    const installedAt = Number(localStorage.getItem(INSTALL_FLAG_KEY) || 0);
    const ttlMs = INSTALL_FLAG_TTL_DAYS * 24 * 60 * 60 * 1000;
    const flagIsFresh = installedAt > 0 && Date.now() - installedAt < ttlMs;

    setIsInstalled(standaloneNow || flagIsFresh);
  }, []);

  useEffect(() => {
    recomputeInstalledState();

    const onInstalled = () => {
      localStorage.setItem(INSTALL_FLAG_KEY, Date.now().toString());
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      const standaloneNow = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      if (!standaloneNow) {
        localStorage.removeItem(INSTALL_FLAG_KEY);
        setIsInstalled(false);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        recomputeInstalledState();
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [recomputeInstalledState]);

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    if (refresh) {
      refresh();
      // spin for a fixed window, then reset (no reload to tear down)
      setTimeout(() => setIsRefreshing(false), 800);
    } else {
      // give the user a moment to see the spin before the page blanks
      setTimeout(() => window.location.reload(), 800);
    }
  };

  // ---------------------------------------------------------
  // Install
  // ---------------------------------------------------------
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      localStorage.setItem(INSTALL_FLAG_KEY, Date.now().toString());
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // ---------------------------------------------------------
  // Uninstall
  // ---------------------------------------------------------
  const handleUninstallClick = () => {
    setShowUninstallGuide(true);
  };

  // ---------------------------------------------------------
  // OS-specific uninstall guide
  // ---------------------------------------------------------
  const uninstallGuide = (() => {
    const ua = navigator.userAgent;
    const isMac = /Mac/i.test(ua);
    const isWindows = /Windows/i.test(ua);
    const isLinux = /Linux/i.test(ua) && !/Android/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    if (isAndroid) {
      return [
        "Close the SMV Finance app",
        "Long-press the SMV Finance icon on your home screen",
        'Tap "Uninstall" (or drag the icon to the trash)',
        "Confirm the removal",
      ];
    }
    if (isIOS) {
      return [
        "Close the SMV Finance app",
        "Long-press the SMV Finance icon on your home screen",
        'Tap "Remove App" then "Delete App"',
        "Confirm the removal",
      ];
    }
    if (isMac) {
      return [
        "Quit the SMV Finance app (Cmd + Q)",
        "Open Finder → Applications",
        "Drag SMV Finance to the Trash",
        "Or right-click the Dock icon → Options → Remove from Dock",
      ];
    }
    if (isWindows) {
      return [
        "Close the SMV Finance app window",
        "Open Start Menu and search for SMV Finance",
        "Right-click the icon → Uninstall",
        "Or: Settings → Apps → Installed apps → SMV Finance → Uninstall",
      ];
    }
    if (isLinux) {
      return [
        "Close the SMV Finance app window",
        "Open chrome://apps (or edge://apps) in your browser",
        "Right-click the SMV Finance icon",
        'Choose "Remove from Chrome/Edge"',
      ];
    }
    return [
      "Close the SMV Finance app window",
      "Open chrome://apps (or edge://apps) in your browser",
      "Right-click the SMV Finance icon",
      'Choose "Remove from Chrome/Edge"',
    ];
  })();

  // ---------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------
  const allTabs = [
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
    onTabChange(tab.id);
    navigate(tab.path);
    setIsMobileMenuOpen(false);
  };

  // ---------------------------------------------------------
  // Shared nav content
  // ---------------------------------------------------------
  const navContent = (
    <>
      {/* Brand Header */}
      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between gap-2.5 shrink-0">
        <div
          className="flex items-center gap-2.5 cursor-pointer min-w-0"
          onClick={() => handleTabClick(allTabs[0])}
        >
          <img
            src={logoIcon}
            alt="SMV Holdings"
            className="w-10 h-10 object-contain rounded-full shrink-0"
          />
          <div className="min-w-0">
            <span className="font-extrabold text-slate-900 tracking-tight text-sm block truncate">
              SMV Holdings
            </span>
            <span className="text-[10px] text-blue-600 font-semibold block truncate">
              Micro Finance Enterprise
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            disabled={isRefreshing}
            className="hidden md:block p-1.5 text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-[spin_0.6s_linear_infinite]" : ""}`}
            />
          </button>
        </div>

        {/* Close button — mobile only */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile-only: username + logout */}
      <div className="md:hidden border-t border-slate-100 bg-slate-50/60 p-3 space-y-2 shrink-0 border-b-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
              currentUser.role === "admin"
                ? "bg-blue-100 text-blue-800"
                : currentUser.role === "manager"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-purple-100 text-purple-800"
            }`}
          >
            {currentUser.fullName.substring(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-xs truncate">
                {currentUser.fullName}
              </span>
              <span
                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                  currentUser.role === "admin"
                    ? "bg-blue-100 text-blue-800"
                    : currentUser.role === "manager"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-purple-100 text-purple-800"
                }`}
              >
                {currentUser.role}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block font-mono truncate">
              @{currentUser.username}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 overflow-y-auto flex flex-col gap-1 scrollbar-none">
        {allTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id || location.pathname === tab.path;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`px-3 py-2 rounded-lg flex items-center justify-between text-xs transition cursor-pointer w-full ${
                isActive
                  ? "bg-blue-600 text-white font-medium shadow-xs"
                  : "hover:bg-blue-50/80 text-slate-600 hover:text-blue-700 font-medium"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
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

        {/* Install App — desktop only */}
        {deferredPrompt && !isInstalled && (
          <div className="hidden md:block mt-auto pt-3">
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-1 rounded-lg shadow-xs transition cursor-pointer"
              title="Install SMV Finance as a desktop app"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
            <p className="text-[9px] text-slate-400 text-center mt-1.5 leading-tight">
              Add SMV Finance to your desktop
            </p>
          </div>
        )}

        {/* Uninstall App — desktop only */}
        {isInstalled && (
          <div className="hidden md:block mt-auto pt-3 space-y-2">
            {!isStandalone && (
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-lg px-2 py-1">
                <Check className="w-3 h-3" />
                <span className="font-medium">App installed</span>
              </div>
            )}

            <button
              onClick={handleUninstallClick}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-semibold text-xs py-1 rounded-lg shadow-2xs transition cursor-pointer"
              title="How to uninstall SMV Finance"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Uninstall App</span>
            </button>
          </div>
        )}
      </nav>

      {onLogout && (
        <div className="md:hidden p-4">
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-semibold text-xs py-2 rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      )}

      {/* Desktop footer */}
      <div className="flex p-3 border-t border-slate-100 bg-slate-50/60 text-[10px] text-slate-500 items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span className="font-medium truncate capitalize">
            {currentUser.role} Session
          </span>
        </div>
        <span className="text-[9px] uppercase font-bold text-slate-400">
          v1.0.0
        </span>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 bg-white text-slate-800 flex-col shrink-0 border-r border-slate-200/80 h-full">
        {navContent}
      </aside>

      {/* Mobile: brand bar with hamburger */}
      <div className="md:hidden w-full bg-white border-b border-slate-200/80 flex items-center justify-between gap-2 px-3 py-2 shrink-0">
        <div
          className="flex items-center gap-2 min-w-0 cursor-pointer"
          onClick={() => handleTabClick(allTabs[0])}
        >
          <img
            src={logoIcon}
            alt="SMV Holdings"
            className="w-8 h-8 object-contain rounded-full shrink-0"
          />
          <div className="min-w-0">
            <span className="font-extrabold text-slate-900 tracking-tight text-xs block truncate">
              SMV Holdings
            </span>
            <span className="text-[9px] text-blue-600 font-semibold block truncate">
              Micro Finance
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-[spin_0.6s_linear_infinite]" : ""}`}
            />
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer — right side with transitions */}
      <div
        className={`md:hidden fixed inset-0 z-50 ${
          isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 ease-out ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Drawer panel — slides in from the RIGHT */}
        <aside
          className={`absolute inset-y-0 right-0 w-72 max-w-[85vw] bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {navContent}
        </aside>
      </div>

      {/* Uninstall guide modal */}
      {showUninstallGuide && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in duration-150"
          onClick={() => setShowUninstallGuide(false)}
        >
          <div
            className="bg-white border border-slate-200/80 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center gap-2">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Uninstall SMV Finance
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Browsers don't allow apps to uninstall themselves — follow
                  these steps on your device.
                </p>
              </div>
            </div>

            <div className="p-5">
              <ol className="space-y-2.5 text-xs text-slate-700">
                {uninstallGuide.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg text-[10px] text-slate-500 leading-relaxed">
                <strong className="text-slate-700">Note:</strong> after
                uninstalling, reload this page — the Install App button will
                reappear automatically.
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowUninstallGuide(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition shadow-2xs cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
