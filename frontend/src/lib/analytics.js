import { supabase } from "@/lib/supabase";

/**
 * Lightweight analytics — writes directly to Supabase via the anon role.
 * RLS allows anon INSERT only. Nothing is read from the client.
 *
 * Event types we track:
 *  - page_view
 *  - share_click  (meta.platform = 'x' | 'facebook' | 'linkedin' | ...)
 *  - waitlist_signup
 */
const SESSION_KEY = "yh_session_id";

function sessionId() {
  if (typeof window === "undefined") return null;
  let s = sessionStorage.getItem(SESSION_KEY);
  if (!s) {
    s = (crypto?.randomUUID?.() ||
      Math.random().toString(36).slice(2) + Date.now().toString(36));
    sessionStorage.setItem(SESSION_KEY, s);
  }
  return s;
}

export async function trackEvent(eventType, meta = {}) {
  try {
    await supabase.from("analytics_events").insert({
      event_type: eventType,
      meta: {
        ...meta,
        path: typeof window !== "undefined" ? window.location.pathname : null,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        session: sessionId(),
        ua: typeof navigator !== "undefined" ? navigator.userAgent?.slice(0, 160) : null,
      },
    });
  } catch (err) {
    // Never block UX on analytics errors
    console.debug("analytics: failed", err);
  }
}

const PAGEVIEW_KEY = "yh_pv_sent";
export function trackPageViewOnce() {
  if (typeof window === "undefined") return;
  // One page_view per session per path
  const key = `${PAGEVIEW_KEY}:${window.location.pathname}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  trackEvent("page_view");
}
