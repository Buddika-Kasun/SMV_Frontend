import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  Loader2,
  ArrowRight,
  X,
  CreditCard,
  FileText,
  UserCheck,
  Banknote,
} from "lucide-react";
import { notificationService } from "@/src/services/notification.service";
import { useUI } from "@/src/contexts/UIContext";
import { Notification as AppNotification } from "@/src/api";
import { RefreshChannel } from "@/src/constants/refreshChannels";

interface NotificationCenterProps {
  /** Optional override — called when user clicks "Visit" in the detail modal. */
  onVisit?: (notification: AppNotification) => void;
}

const PAGE_SIZE = 20;

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
const getNotificationIcon = (type: string) => {
  if (type.startsWith("loan")) return FileText;
  if (type.startsWith("payment")) return Banknote;
  if (type.startsWith("kyc")) return UserCheck;
  if (type.startsWith("user")) return UserCheck;
  if (type.startsWith("card")) return CreditCard;
  return Bell;
};

const getNotificationTone = (type: string) => {
  if (type.includes("approved") || type.includes("recorded"))
    return "text-emerald-600 bg-emerald-50";
  if (type.includes("rejected") || type.includes("overdue"))
    return "text-rose-600 bg-rose-50";
  if (type.includes("pending")) return "text-amber-600 bg-amber-50";
  return "text-blue-600 bg-blue-50";
};

/** "Today", "Yesterday", or "Mon, 22 Sep 2025" */
const formatDateHeader = (iso: string): string => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";

  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/** "2:35 PM" */
const formatTime = (iso: string): string =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

interface DateSection {
  key: string;
  label: string;
  items: AppNotification[];
}

const formatNotificationType = (type: string): string =>
  type.replace(/[._]/g, " ").toUpperCase();

/**
 * Group notifications:
 *  - An "Unread" section at the very top
 *  - Read items grouped by calendar date, newest first
 */
const groupNotifications = (items: AppNotification[]): DateSection[] => {
  const unread = items.filter((n) => !n.read);
  const read = items.filter((n) => n.read);

  const sections: DateSection[] = [];

  if (unread.length > 0) {
    sections.push({
      key: "unread",
      label: "Unread",
      items: unread,
    });
  }

  const byDate = new Map<string, AppNotification[]>();
  for (const n of read) {
    const key = new Date(n.createdAt).toISOString().slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(n);
  }

  const sortedDates = Array.from(byDate.keys()).sort((a, b) =>
    a < b ? 1 : -1,
  );

  for (const date of sortedDates) {
    const first = byDate.get(date)![0];
    sections.push({
      key: date,
      label: formatDateHeader(first.createdAt),
      items: byDate.get(date)!,
    });
  }

  return sections;
};

// ---------------------------------------------------------
// Map a notification to a TabType for the "Visit" action
// ---------------------------------------------------------
const resolveVisitTab = (
  n: AppNotification,
):
  | "dashboard"
  | "applications"
  | "kyc"
  | "payments"
  | "settlement"
  | "customers"
  | "users"
  | "reports" => {
  if (n.type.startsWith("loan")) return "applications";
  if (n.type.startsWith("payment")) return "payments";
  if (n.type.startsWith("settlement")) return "settlement";
  if (n.type.startsWith("kyc")) return "kyc";
  if (n.type.startsWith("user")) return "users";
  if (n.type.startsWith("report")) return "reports";
  if (n.type.startsWith("customer")) return "customers";
  return "dashboard";
};

// ---------------------------------------------------------
// Component
// ---------------------------------------------------------
export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onVisit,
}) => {
  const { setActiveTab, unreadNotificationCount, refreshChannels } = useUI();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [meta, setMeta] = useState<{
    totalItems: number;
    page: number;
    limit: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [selected, setSelected] = useState<AppNotification | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef(1);

  const notificationChannel =
    refreshChannels[RefreshChannel.Notifications] ?? 0;

  const [bellRing, setBellRing] = useState(false);
  const prevUnreadRef = useRef(unreadNotificationCount);

  // Wiggle on unread count increase
  useEffect(() => {
    if (unreadNotificationCount > prevUnreadRef.current) {
      setBellRing(true);
      const t = setTimeout(() => setBellRing(false), 700);
      prevUnreadRef.current = unreadNotificationCount;
      return () => clearTimeout(t);
    }
    prevUnreadRef.current = unreadNotificationCount;
  }, [unreadNotificationCount]);

  // ---------------------------------------------------------
  // First page
  // ---------------------------------------------------------
  const fetchFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const { items, meta: m } = await notificationService.listNotifications({
        page: 1,
        limit: PAGE_SIZE,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setNotifications(items);
      setMeta(m);
      pageRef.current = 1;
    } catch {
      setNotifications([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFirstPage();
  }, [fetchFirstPage, notificationChannel]);

  // ---------------------------------------------------------
  // Infinite scroll
  // ---------------------------------------------------------
  const loadMore = useCallback(async () => {
    if (loadingMore || loading) return;
    if (meta && meta.page >= (meta.totalPages ?? 1)) return;

    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const { items, meta: m } = await notificationService.listNotifications({
        page: nextPage,
        limit: PAGE_SIZE,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setNotifications((prev) => [...prev, ...items]);
      setMeta(m);
      pageRef.current = nextPage;
    } catch (err) {
      console.error("Failed to load more notifications:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, meta]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // ---------------------------------------------------------
  // Click item → open modal + mark read (optimistic)
  // ---------------------------------------------------------
  const handleOpen = async (n: AppNotification) => {
    setSelected(n);

    if (n.read) return;

    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
    );

    try {
      await notificationService.markRead(n.id);
    } catch {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: false } : x)),
      );
    }
  };

  // ---------------------------------------------------------
  // Mark all as read
  // ---------------------------------------------------------
  const handleMarkAllRead = async () => {
    if (markingAll || unreadNotificationCount === 0) return;
    setMarkingAll(true);

    const prev = notifications;
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));

    try {
      await notificationService.markAllRead();
    } catch {
      setNotifications(prev);
    } finally {
      setMarkingAll(false);
    }
  };

  // ---------------------------------------------------------
  // Visit → navigates via setActiveTab (which also routes)
  // ---------------------------------------------------------
  const handleVisit = (n: AppNotification) => {
    setSelected(null);

    if (onVisit) {
      onVisit(n);
      return;
    }

    // setActiveTab both sets state AND navigates to `/${tab}`
    const tab = resolveVisitTab(n);
    setActiveTab(tab);
  };

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  const sections = groupNotifications(notifications);
  const hasMore = meta
    ? (meta.hasNextPage ?? meta.page < (meta.totalPages ?? 1))
    : false;

  return (
    <div className="space-y-4 flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Bell
                className={`w-4 h-4 ${bellRing ? "animate-bell-ring" : ""}`}
              />
            </div>
            Notification Center
            {unreadNotificationCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}{" "}
                unread
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Loan activity, payment alerts, KYC updates, and system messages.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          disabled={markingAll || unreadNotificationCount === 0}
          className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs px-3.5 py-1.5 rounded-lg transition shadow-2xs cursor-pointer self-stretch sm:self-auto"
        >
          {markingAll ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCheck className="w-3.5 h-3.5" />
          )}
          <span>Mark all as read</span>
        </button>
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 animate-pulse"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 bg-slate-100 rounded" />
                  <div className="h-2.5 w-64 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-50 rounded-full mb-3">
              <Bell className="w-6 h-6 text-slate-300" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              You're all caught up
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              No notifications to show right now.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sections.map((section) => (
              <div key={section.key}>
                {/* Section header */}
                <div
                  className={`sticky top-0 z-10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b flex items-center gap-2 backdrop-blur-sm ${
                    section.key === "unread"
                      ? "bg-rose-50/80 text-rose-700 border-rose-100"
                      : "bg-slate-50/90 text-slate-500 border-slate-100"
                  }`}
                >
                  {section.key === "unread" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  )}
                  <span>{section.label}</span>
                  {section.key === "unread" && (
                    <span className="text-slate-400 font-medium normal-case">
                      ({unreadNotificationCount})
                    </span>
                  )}
                </div>

                {/* Items */}
                {section.items.map((n) => {
                  const Icon = getNotificationIcon(n.type);
                  const tone = getNotificationTone(n.type);

                  return (
                    <button
                      key={n.id}
                      onClick={() => handleOpen(n)}
                      className={`w-full text-left p-3.5 hover:bg-slate-50/70 transition flex items-start gap-3 cursor-pointer border-l-2 ${
                        n.read
                          ? "border-transparent"
                          : "border-blue-500 bg-blue-50/30"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tone}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`text-xs truncate ${
                              n.read
                                ? "font-medium text-slate-700"
                                : "font-bold text-slate-900"
                            }`}
                          >
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatTime(n.createdAt)}
                          </span>
                        </div>
                        {n.body && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                            {n.body}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] uppercase font-semibold text-slate-400">
                            {formatNotificationType(n.type)}
                          </span>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-10" />

            {loadingMore && (
              <div className="p-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading more...
              </div>
            )}

            {!hasMore && notifications.length > 0 && (
              <div className="p-4 text-center text-[10px] text-slate-400 uppercase tracking-wider">
                End of notifications
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <NotificationDetailModal
          notification={selected}
          onClose={() => setSelected(null)}
          onVisit={handleVisit}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------
// Detail modal
// ---------------------------------------------------------
const NotificationDetailModal: React.FC<{
  notification: AppNotification;
  onClose: () => void;
  onVisit: (n: AppNotification) => void;
}> = ({ notification, onClose, onVisit }) => {
  const Icon = getNotificationIcon(notification.type);
  const tone = getNotificationTone(notification.type);

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200/80 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm">
              {notification.title}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {new Date(notification.createdAt).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          {notification.body ? (
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {notification.body}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">
              No additional details.
            </p>
          )}

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[10px] text-slate-500 flex items-center gap-2">
            <span className="uppercase font-semibold text-slate-400">
              Type:
            </span>
            <span className="font-mono">
              {formatNotificationType(notification.type)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-lg text-xs transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => onVisit(notification)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Visit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
