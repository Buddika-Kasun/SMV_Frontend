import {
  ClearAllResult,
  MarkAllReadResult,
  Notification,
  notificationEndpoint,
  NotificationListParams,
} from "../api";
import toast from "react-hot-toast";

export class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * List notifications for the current user
   */
  async listNotifications(
    params?: NotificationListParams,
  ): Promise<{ items: Notification[]; meta: any }> {
    try {
      const response = await notificationEndpoint.getAll(params);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch notifications");
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await notificationEndpoint.getUnreadCount();
      if (response.success && response.data) {
        return response.data.count ?? 0;
      }
      throw new Error(response.message || "Failed to fetch unread count");
    } catch (error: any) {
      console.error("Failed to fetch unread count:", error);
      // Non-critical — return 0 so the UI doesn't break
      return 0;
    }
  }

  /**
   * Mark one notification as read
   */
  async markRead(id: string): Promise<void> {
    try {
      const response = await notificationEndpoint.markRead(id);
      if (response.success) return;
      throw new Error(response.message || "Failed to mark as read");
    } catch (error: any) {
      console.error("Failed to mark notification as read:", error);
      toast.error(error.message || "Failed to mark as read");
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllRead(): Promise<MarkAllReadResult> {
    try {
      const response = await notificationEndpoint.markAllRead();
      if (response.success && response.data) {
        toast.success(`${response.data.count} notification(s) marked as read`);
        return response.data;
      }
      throw new Error(response.message || "Failed to mark all as read");
    } catch (error: any) {
      console.error("Failed to mark all as read:", error);
      toast.error(error.message || "Failed to mark all as read");
      throw error;
    }
  }

  /**
   * Delete one notification
   */
  async deleteNotification(id: string): Promise<void> {
    try {
      const response = await notificationEndpoint.delete(id);
      if (response.success) {
        toast.success("Notification deleted");
        return;
      }
      throw new Error(response.message || "Failed to delete notification");
    } catch (error: any) {
      console.error("Failed to delete notification:", error);
      toast.error(error.message || "Failed to delete notification");
      throw error;
    }
  }

  /**
   * Clear all notifications for the current user
   */
  async clearAll(): Promise<ClearAllResult> {
    try {
      const response = await notificationEndpoint.clearAll();
      if (response.success && response.data) {
        toast.success(`${response.data.count} notification(s) cleared`);
        return response.data;
      }
      throw new Error(response.message || "Failed to clear notifications");
    } catch (error: any) {
      console.error("Failed to clear notifications:", error);
      toast.error(error.message || "Failed to clear notifications");
      throw error;
    }
  }
}

export const notificationService = NotificationService.getInstance();
