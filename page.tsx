'use client';

import { useNotifications } from '@/contexts/NotificationsContext';

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
  } = useNotifications();

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">
        Notifications
      </h1>

      <p>Total Notifications: {notifications.length}</p>
      <p>Unread: {unreadCount}</p>

      <div className="mt-6 space-y-4">
        {notifications.length === 0 ? (
          <div className="border border-zinc-700 rounded-xl p-4">
            No notifications found
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="border border-zinc-700 rounded-xl p-4"
            >
              <h2 className="font-bold">
                {notification.title}
              </h2>

              <p className="text-zinc-400">
                {notification.message}
              </p>

              <p className="text-xs text-zinc-500 mt-2">
                {notification.type}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}