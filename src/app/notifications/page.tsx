// app/notifications/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// --- Type Definitions ---
interface NotificationSettings {
  comments: boolean;
  follows: boolean;
  likes: boolean;
  messages: boolean;
  system?: boolean;
}

interface NotificationItem {
  _id: string;
  userId: string;
  senderId?: string;
  type: 'comment' | 'follow' | 'like' | 'message' | 'system';
  message: string;
  link?: string; // This can be undefined, null, or an empty string
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { getDynamicThemeClass } = useTheme();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    comments: true, follows: true, likes: true, messages: true, system: true
  });
  const [unreadCount, setUnreadCount] = useState(0);

  // --- Effects ---
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!session) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const settingsResponse = await axios.get('/api/user/settings');
        const userSettings: NotificationSettings = settingsResponse.data.notificationSettings || {
          comments: true, follows: true, likes: true, messages: true, system: true
        };
        setNotificationSettings(userSettings);

        const notificationsResponse = await axios.get('/api/notifications');
        const fetchedNotifications: NotificationItem[] = notificationsResponse.data;

        const filtered = fetchedNotifications.filter(notif => {
          switch (notif.type) {
            case 'comment': return userSettings.comments;
            case 'follow': return userSettings.follows;
            case 'like': return userSettings.likes;
            case 'message': return userSettings.messages;
            case 'system': return userSettings.system;
            default: return true;
          }
        });
        
        filtered.sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());

        // Add dummy links for testing if they are missing
        const notificationsWithLinks = filtered.map(notif => {
            if (!notif.link || notif.link.trim() === "") {
                if (notif.type === 'comment' || notif.type === 'like') {
                    return { ...notif, link: '/dummy-post-link' }; // Add a default link for testing
                } else if (notif.type === 'follow' || notif.type === 'message') {
                    return { ...notif, link: '/dummy-profile-link' }; // Add a default link for testing
                } else if (notif.type === 'system') {
                    return { ...notif, link: '/dashboard' }; // Add a default link for testing
                }
            }
            return notif;
        });

        setNotifications(notificationsWithLinks);
        setUnreadCount(notificationsWithLinks.filter(n => !n.read).length);
        console.log("Fetched and filtered notifications (with dummy links if added):", notificationsWithLinks);
        if (notificationsWithLinks.length > 0) {
            console.log("Example notification link (from final list):", notificationsWithLinks[0].link, "Type:", typeof notificationsWithLinks[0].link);
        }

      } catch (error) {
        console.error('Failed to fetch notifications or settings:', error);
        toast.error('Failed to load notifications. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 60000); 
    return () => clearInterval(interval);

  }, [session]);

  const markAsRead = useCallback(async (notificationId: string | string[]) => {
    const idsToMark = Array.isArray(notificationId) ? notificationId : [notificationId];
    try {
      setNotifications(prev => 
        prev.map(notif => 
          idsToMark.includes(notif._id) ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - idsToMark.filter(id => notifications.find(n => n._id === id && !n.read)).length));

      await axios.put('/api/notifications', { notificationIds: idsToMark, markAsRead: true });
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      toast.error('Failed to mark notifications as read. Please try again.');
      if (session) {
        setLoading(true);
        const reFetch = async () => {
          try {
            const settingsResponse = await axios.get('/api/user/settings');
            const userSettings: NotificationSettings = settingsResponse.data.notificationSettings || {
              comments: true, follows: true, likes: true, messages: true, system: true
            };
            setNotificationSettings(userSettings);
            const notificationsResponse = await axios.get('/api/notifications');
            const fetchedNotifications: NotificationItem[] = notificationsResponse.data;
            const filtered = fetchedNotifications.filter(notif => {
              switch (notif.type) {
                case 'comment': return userSettings.comments;
                case 'follow': return userSettings.follows;
                case 'like': return userSettings.likes;
                case 'message': return userSettings.messages;
                case 'system': return userSettings.system;
                default: return true;
              }
            });
            filtered.sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
            setNotifications(filtered);
            setUnreadCount(filtered.filter(n => !n.read).length);
          } finally {
            setLoading(false);
          }
        };
        reFetch();
      }
    }
  }, [session, notifications]);

  // --- MINIMUM CLICK DEBUGGING: handleNotificationClick ---
  const handleNotificationClick = useCallback((notification: NotificationItem) => {
    // THIS ALERT MUST SHOW if the click handler is triggered.
    alert("CLICK HANDLER TRIGGERED! Check browser console NOW for logs.");
    console.log("handleNotificationClick was called with:", notification);
    console.log("Notification Link:", notification.link);

    // If the above alert shows, then we can proceed with navigation logic again
    // For now, let's keep it simple to isolate the click event itself.
    // router.push(notification.link!); // DO NOT ENABLE THIS YET
  }, []); // Removed markAsRead and router from dependencies for this simple test

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'comment': return '💬';
      case 'follow': return '🤝';
      case 'like': return '❤️';
      case 'message': return '✉️';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen" style={{ backgroundColor: getDynamicThemeClass('background-primary'), color: getDynamicThemeClass('text-primary') }}>
        <p className="text-xl">Loading your notifications...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen" style={{ backgroundColor: getDynamicThemeClass('background-primary'), color: getDynamicThemeClass('text-primary') }}>
        Redirecting to login...
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8`} style={{ backgroundColor: getDynamicThemeClass('background-primary'), color: getDynamicThemeClass('text-primary') }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Notifications {unreadCount > 0 && `(${unreadCount} unread)`}</h1>

        {notifications.length === 0 ? (
          <div className={`p-6 rounded-xl text-center`} style={{ backgroundColor: getDynamicThemeClass('background-secondary'), border: `1px solid ${getDynamicThemeClass('border-color')}` }}>
            <p className="text-lg font-medium" style={{ color: getDynamicThemeClass('text-secondary') }}>
              No notifications to show.
            </p>
            <p className="text-sm mt-2" style={{ color: getDynamicThemeClass('text-secondary-faded') }}>
              Make sure your notification settings are enabled in <a href="/settings" className="underline text-[color:var(--accent-color)] hover:text-[color:var(--accent-color-hover)]">Settings</a>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {unreadCount > 0 && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => markAsRead(notifications.filter(n => !n.read).map(n => n._id))}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                             bg-[color:var(--button-secondary-bg)] text-[color:var(--button-secondary-text)] border-[1px] border-[color:var(--button-secondary-border)]
                             hover:bg-[color:var(--button-secondary-hover-bg)]"
                  style={{
                    backgroundColor: getDynamicThemeClass('button-secondary-bg'),
                    color: getDynamicThemeClass('button-secondary-text'),
                    border: `1px solid ${getDynamicThemeClass('button-secondary-border')}`,
                  }}
                >
                  Mark all as read
                </button>
              </div>
            )}
            
            <AnimatePresence>
              {notifications.map((notif) => (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`p-4 rounded-xl flex items-start space-x-4 cursor-pointer transition-all duration-200
                              ${!notif.read ? 'ring-2 ring-[color:var(--accent-color)]' : ''}`}
                  style={{
                    backgroundColor: notif.read ? getDynamicThemeClass('background-secondary') : getDynamicThemeClass('background-secondary-highlight'),
                    border: `1px solid ${getDynamicThemeClass('border-color')}`,
                    '--accent-color': getDynamicThemeClass('accent-color'),
                  } as React.CSSProperties}
                  onClick={() => handleNotificationClick(notif)} // THIS IS THE CRITICAL LINE
                >
                  <div className="flex-shrink-0 text-2xl">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-grow">
                    <p className={`font-medium text-base ${!notif.read ? 'text-[color:var(--text-primary)]' : 'text-[color:var(--text-secondary)]'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs mt-1" style={{ color: getDynamicThemeClass('text-secondary-faded') }}>
                      {formatDistanceToNow(parseISO(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="flex-shrink-0 self-center">
                      <span className="h-2.5 w-2.5 bg-[color:var(--accent-color)] rounded-full block" title="Unread"></span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}