export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string; // ← was `message`
  data?: Record<string, any>;
  read: boolean; // ← was `isRead`
  readAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  search?: string;
  read?: "true" | "false";
  type?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface NotificationUnreadCount {
  count: number;
}

export interface MarkAllReadResult {
  count: number;
}

export interface ClearAllResult {
  count: number;
}
