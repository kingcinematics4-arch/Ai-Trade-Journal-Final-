export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: 'trade' | 'goal' | 'system';
  link?: string;
}

export const notificationService = {
  async createNotification(payload: NotificationPayload) {
    // Stub implementation for build stability
    console.info('[NotificationService] Notification created:', payload.title);
    return { success: true };
  },
  async markAsRead(notificationId: string) {
    return { success: true };
  },
};
