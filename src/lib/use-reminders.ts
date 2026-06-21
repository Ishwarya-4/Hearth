import { useEffect, useRef } from "react";

export type ReminderEvent = {
  id: string;
  title: string;
  start_at: string;
  reminder_minutes?: number | null;
  location?: string | null;
};

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

/**
 * Schedules browser notifications for events that have a reminder set.
 * Note: this only fires while the app tab is open (no server/push backend).
 * Only events firing within the next 24h are scheduled.
 */
export function useReminders(events: ReminderEvent[], enabled: boolean) {
  const timers = useRef<Map<string, number>>(new Map());
  const fired = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !notificationsSupported() || Notification.permission !== "granted") return;

    const now = Date.now();
    for (const ev of events) {
      if (ev.reminder_minutes == null) continue;
      const key = `${ev.id}@${ev.start_at}`;
      if (fired.current.has(key) || timers.current.has(key)) continue;
      const fireAt = new Date(ev.start_at).getTime() - ev.reminder_minutes * 60_000;
      const delay = fireAt - now;
      if (delay <= 0 || delay > 24 * 60 * 60_000) continue;
      const t = window.setTimeout(() => {
        fired.current.add(key);
        timers.current.delete(key);
        try {
          new Notification(ev.title, {
            body: `Starts ${new Date(ev.start_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}${ev.location ? " · " + ev.location : ""}`,
            tag: key,
          });
        } catch {
          /* ignore */
        }
      }, delay);
      timers.current.set(key, t);
    }

    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, [events, enabled]);
}
