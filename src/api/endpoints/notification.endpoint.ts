import apiClient from "../config/client";
import {
  ApiResponse,
  ClearAllResult,
  MarkAllReadResult,
  Notification,
  NotificationListParams,
  NotificationUnreadCount,
} from "../types";

export const notificationEndpoint = {
  /**
   * List notifications for the current user (paginated, newest first)
   */
  getAll: (
    params?: NotificationListParams,
  ): Promise<ApiResponse<{ items: Notification[]; meta: any }>> => {
    return apiClient.get<{ items: Notification[]; meta: any }>(
      "/notifications",
      { params },
    );
  },

  /**
   * Get unread notification count for the current user
   */
  getUnreadCount: (): Promise<ApiResponse<NotificationUnreadCount>> => {
    return apiClient.get<NotificationUnreadCount>(
      "/notifications/unread-count",
    );
  },

  /**
   * Mark one notification as read
   */
  markRead: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.patch<null>(`/notifications/${id}/read`, {});
  },

  /**
   * Mark all notifications as read
   */
  markAllRead: (): Promise<ApiResponse<MarkAllReadResult>> => {
    return apiClient.patch<MarkAllReadResult>("/notifications/read-all", {});
  },

  /**
   * Delete one notification
   */
  delete: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<null>(`/notifications/${id}`);
  },

  /**
   * Clear all notifications for the current user
   */
  clearAll: (): Promise<ApiResponse<ClearAllResult>> => {
    return apiClient.delete<ClearAllResult>("/notifications");
  },
};
