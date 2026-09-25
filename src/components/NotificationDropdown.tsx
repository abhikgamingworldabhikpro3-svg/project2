import React, { useEffect, useState, useRef } from 'react';
import {
  Bell,
  BookOpen,
  CalendarCheck,
  CheckCheck,
  CreditCard,
  FileText,
  GraduationCap,
  Megaphone,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { AppNotification } from '../types';

export const NotificationDropdown: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    const notifQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      notifQuery,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
        // Sort descending by createdAt
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setNotifications(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'notifications');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    for (const item of unread) {
      try {
        await updateDoc(doc(db, 'notifications', item.id), { read: true });
      } catch {
        // Continue
      }
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'assignment':
      case 'deadline':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'grading':
        return <GraduationCap className="w-4 h-4 text-emerald-500" />;
      case 'attendance':
        return <CalendarCheck className="w-4 h-4 text-amber-500" />;
      case 'fee_reminder':
        return <CreditCard className="w-4 h-4 text-rose-500" />;
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-cyan-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold text-[11px]">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No notifications yet. You are all caught up!
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`p-3.5 hover:bg-slate-50 flex items-start gap-3 transition-colors cursor-pointer ${
                    !n.read ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  <div className="mt-0.5 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs font-semibold truncate ${
                          !n.read ? 'text-indigo-950 font-bold' : 'text-slate-800'
                        }`}
                      >
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(n.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
