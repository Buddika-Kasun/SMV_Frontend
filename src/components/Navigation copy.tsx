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
} from "lucide-react";
import { TabType } from "../types";
import { User } from "../api";

import logoIcon from "@/src/assets/logo2.jpg";

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingApprovalsCount: number;
  pendingKycCount: number;
  overdueCount: number;
  activeConsultancyCount?: number;
  currentUser: User;
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
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isManagerOrAdmin =
    currentUser.role === "admin" || currentUser.role === "manager";

  // ---------------------------------------------------------
  // PWA install / uninstall state
  // ---------------------------------------------------------
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showUninstallGuide, setShowUninstallGuide] = useState(false);

  // Helper — recompute installed state from every available signal
  const recomputeInstalledState = useCallback(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const iosStandalone = (navigator as any).standalone === true;
    const standaloneNow = standalone || iosStandalone;
    setIsStandalone(standaloneNow);

    const installedAt = Number(localStorage.getItem(INSTALL_FLAG_KEY) || 0);
    const ttlMs = INSTALL_FLAG_TTL_DAYS * 24 * 60 * 60 * 1000;
    const flagIsFresh = installedAt > 0 && Date.now() - installedAt < ttlMs;

    // Installed if: running standalone OR the flag is fresh
    setIsInstalled(standaloneNow || flagIsFresh);
  }, []);

  useEffect(() => {
    recomputeInstalledState();

    // -------- Fresh install in this session --------
    const onInstalled = () => {
      localStorage.setItem(INSTALL_FLAG_KEY, Date.now().toString());
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // -------- Install prompt available --------
    // Fires when the app is installable. Critically, it fires AGAIN
    // after the user uninstalls the app from the OS.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // If we get a fresh prompt AND we're not in standalone mode,
      // the previous install was removed — hide the uninstall button.
      const standaloneNow = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      if (!standaloneNow) {
        localStorage.removeItem(INSTALL_FLAG_KEY);
        setIsInstalled(false);
      }
    };

    // -------- Re-check when the tab regains focus --------
    // Catches the case: user opens standalone → uninstalls → returns to tab
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
  // Uninstall — only opens the guide, no state changes
  // ---------------------------------------------------------
  const handleUninstallClick = () => {
    setShowUninstallGuide(true);
  };

  // ---------------------------------------------------------
  // OS-specific uninstall guide (with "close the app" first)
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
  };

  return (
    <aside className="w-full md:w-56 bg-white text-slate-800 flex flex-col shrink-0 border-r border-slate-200/80">
      {/* Brand Header */}
      <div
        className="px-4 py-2 border-b border-slate-100 flex items-center gap-2.5 cursor-pointer"
        onClick={() => handleTabClick(allTabs[0])}
      >
        <img
          src={logoIcon}
          alt="SMV Holdings"
          className="w-10 h-10 object-contain rounded-full"
        />
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
      <nav className="flex-1 p-3 overflow-x-auto md:overflow-y-auto flex md:flex-col scrollbar-none">
        {/* Tabs */}
        <div className="flex md:flex-col gap-1 md:w-full">
          {allTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              activeTab === tab.id || location.pathname === tab.path;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`px-3 py-2 rounded-lg flex items-center justify-between text-xs transition cursor-pointer shrink-0 md:w-full ${
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
        </div>

        {/* --------------------------------------------------------- */}
        {/* Install App — shown when not installed and prompt available */}
        {/* --------------------------------------------------------- */}
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

        {/* --------------------------------------------------------- */}
        {/* Uninstall App — stays until user actually uninstalls */}
        {/* --------------------------------------------------------- */}
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

      {/* Minimal User Role Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 text-[10px] text-slate-500 flex items-center justify-between">
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

      {/* Uninstall guide modal */}
      {showUninstallGuide && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
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
    </aside>
  );
};
