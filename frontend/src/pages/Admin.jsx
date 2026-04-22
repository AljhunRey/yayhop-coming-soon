import { useEffect, useState } from "react";
import {
  Lock,
  RefreshCw,
  Download,
  Mail,
  Users,
  ExternalLink,
  Eye,
  Share2,
  UserPlus,
  BarChart3,
} from "lucide-react";
import { createAdminClient, supabase, SUPABASE_PROJECT_URL } from "@/lib/supabase";

const STORAGE_KEY = "yh_supabase_service_key";

const PLATFORM_LABELS = {
  native: "Native share",
  copy_link: "Copy link",
  x: "X / Twitter",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  instagram: "Instagram",
};

function aggregateEvents(events) {
  const byType = {};
  const byPlatform = {};
  const dailyViews = {};
  for (const e of events || []) {
    byType[e.event_type] = (byType[e.event_type] || 0) + 1;
    if (e.event_type === "share_click") {
      const p = e.meta?.platform || "unknown";
      byPlatform[p] = (byPlatform[p] || 0) + 1;
    }
    if (e.event_type === "page_view") {
      const d = (e.created_at || "").slice(0, 10);
      if (d) dailyViews[d] = (dailyViews[d] || 0) + 1;
    }
  }
  const uniqueSessions = new Set(
    (events || []).filter((e) => e.event_type === "page_view").map((e) => e.meta?.session)
  );
  uniqueSessions.delete(undefined);
  uniqueSessions.delete(null);
  return {
    visits: byType.page_view || 0,
    uniqueVisitors: uniqueSessions.size,
    shares: byType.share_click || 0,
    signups: byType.waitlist_signup || 0,
    byPlatform,
    dailyViews,
  };
}

export default function Admin() {
  const [key, setKey] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [entries, setEntries] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [count, setCount] = useState(null);

  useEffect(() => {
    supabase.rpc("get_waitlist_count").then(({ data, error: e }) => {
      if (!e && typeof data === "number") setCount(data);
    });
  }, []);

  const load = async (k) => {
    const useKey = (k ?? key).trim();
    if (!useKey) {
      setError("Please paste your Supabase service_role key");
      return;
    }
    if (!useKey.startsWith("eyJ")) {
      setError("That doesn't look like a Supabase JWT — it should start with 'eyJ'.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const admin = createAdminClient(useKey);

      const [wl, ev] = await Promise.all([
        admin
          .from("waitlist")
          .select("id, email, name, created_at")
          .order("created_at", { ascending: false }),
        admin
          .from("analytics_events")
          .select("event_type, meta, created_at")
          .order("created_at", { ascending: false })
          .limit(5000),
      ]);

      if (wl.error) {
        if (wl.error.message?.toLowerCase().includes("jwt")) {
          setError("Invalid service_role key.");
        } else {
          setError(wl.error.message || "Couldn't load entries.");
        }
        setEntries(null);
        setStats(null);
        return;
      }

      setEntries(wl.data || []);
      // analytics table may not exist yet — degrade gracefully
      if (ev.error) {
        setStats({ missing: true, error: ev.error.message });
      } else {
        setStats(aggregateEvents(ev.data || []));
      }
      localStorage.setItem(STORAGE_KEY, useKey);
    } catch (err) {
      console.error(err);
      setError("Couldn't connect to Supabase.");
      setEntries(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) load(cached);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setKey("");
    setEntries(null);
    setStats(null);
  };

  const downloadCsv = () => {
    if (!entries || !entries.length) return;
    const header = ["name", "email", "created_at", "id"].join(",");
    const rows = entries.map((e) =>
      [e.name || "", e.email, e.created_at, e.id]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yayhop-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const fmtDate = (s) => {
    try {
      return new Date(s).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return s;
    }
  };

  const supabaseTableUrl = SUPABASE_PROJECT_URL
    ? `https://supabase.com/dashboard/project/${
        SUPABASE_PROJECT_URL.replace("https://", "").split(".")[0]
      }/editor`
    : null;

  // Build platform rows sorted by count desc
  const platformRows = stats?.byPlatform
    ? Object.entries(stats.byPlatform)
        .map(([k, v]) => ({ platform: k, label: PLATFORM_LABELS[k] || k, count: v }))
        .sort((a, b) => b.count - a.count)
    : [];
  const maxPlatformCount = platformRows.reduce((m, r) => Math.max(m, r.count), 0) || 1;

  return (
    <main className="yh-bg min-h-screen" data-testid="admin-page">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--yh-accent)" }}>
              yayhop admin
            </p>
            <h1 className="mt-1 font-satoshi text-3xl font-black sm:text-4xl" style={{ color: "var(--yh-text)" }}>
              Dashboard
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--yh-text-secondary)" }}>
              Signups: <strong style={{ color: "var(--yh-text)" }}>{count ?? "—"}</strong>
              <span className="mx-2 opacity-50">·</span>
              Data source: Supabase
            </p>
          </div>
          {entries && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => load()}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                style={{ background: "var(--yh-card)", color: "var(--yh-text)" }}
                data-testid="admin-refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={downloadCsv}
                disabled={!entries.length}
                className="yh-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                data-testid="admin-download-csv"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              {supabaseTableUrl && (
                <a
                  href={supabaseTableUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                  style={{ background: "var(--yh-card)", color: "var(--yh-text)" }}
                  data-testid="admin-open-supabase"
                >
                  <ExternalLink className="h-4 w-4" />
                  Supabase
                </a>
              )}
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                style={{ background: "var(--yh-card)", color: "var(--yh-text-secondary)" }}
                data-testid="admin-logout"
              >
                Log out
              </button>
            </div>
          )}
        </header>

        {/* Key entry */}
        {!entries && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load();
            }}
            className="rounded-3xl p-6 sm:p-8"
            style={{ background: "var(--yh-card)" }}
            data-testid="admin-key-form"
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--yh-text)" }}>
              <Lock className="h-4 w-4" style={{ color: "var(--yh-accent)" }} />
              Supabase service_role key required
            </div>
            <p className="mb-5 text-sm" style={{ color: "var(--yh-text-secondary)" }}>
              Paste your Supabase <strong style={{ color: "var(--yh-text)" }}>service_role</strong> key (Settings → API Keys). It is stored only in your browser's localStorage on this device — never in the source code, never sent to anyone but Supabase.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="password"
                placeholder="eyJhbGci..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="yh-input h-12 w-full rounded-xl px-4 text-sm sm:flex-1"
                data-testid="admin-key-input"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={loading}
                className="yh-btn h-12 rounded-xl px-6 text-sm font-bold"
                data-testid="admin-unlock-button"
              >
                {loading ? "Unlocking…" : "Unlock"}
              </button>
            </div>
            {error && (
              <p className="mt-3 text-sm font-medium" style={{ color: "#ff3b30" }} data-testid="admin-error">
                {error}
              </p>
            )}
            {supabaseTableUrl && (
              <p className="mt-4 text-xs" style={{ color: "var(--yh-text-secondary)" }}>
                Prefer the Supabase dashboard?{" "}
                <a
                  href={supabaseTableUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline"
                  style={{ color: "var(--yh-accent)" }}
                >
                  Open waitlist table →
                </a>
              </p>
            )}
          </form>
        )}

        {/* Analytics */}
        {entries && stats && !stats.missing && (
          <section className="mb-10" data-testid="analytics-section">
            <h2 className="mb-4 flex items-center gap-2 font-satoshi text-lg font-bold" style={{ color: "var(--yh-text)" }}>
              <BarChart3 className="h-5 w-5" style={{ color: "var(--yh-accent)" }} />
              Analytics
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={Eye} label="Page views" value={stats.visits} />
              <StatCard icon={Users} label="Unique visitors" value={stats.uniqueVisitors} />
              <StatCard icon={Share2} label="Shares" value={stats.shares} />
              <StatCard icon={UserPlus} label="Signups" value={stats.signups} />
            </div>

            <div className="mt-6 rounded-3xl p-6" style={{ background: "var(--yh-card)" }}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-satoshi text-base font-bold" style={{ color: "var(--yh-text)" }}>
                  Shares by platform
                </h3>
                <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--yh-text-secondary)" }}>
                  total: {stats.shares}
                </span>
              </div>
              {platformRows.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--yh-text-secondary)" }}>
                  No shares yet — people will start sharing once you launch.
                </p>
              ) : (
                <div className="space-y-3" data-testid="share-breakdown">
                  {platformRows.map((r) => (
                    <div key={r.platform} className="flex items-center gap-3">
                      <div className="w-32 shrink-0 text-sm font-medium" style={{ color: "var(--yh-text)" }}>
                        {r.label}
                      </div>
                      <div
                        className="relative h-2 flex-1 overflow-hidden rounded-full"
                        style={{ background: "var(--yh-card-secondary)" }}
                      >
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            width: `${(r.count / maxPlatformCount) * 100}%`,
                            background:
                              "linear-gradient(90deg, var(--yh-accent) 0%, var(--yh-accent-dark) 100%)",
                          }}
                        />
                      </div>
                      <div className="w-10 shrink-0 text-right text-sm font-bold tabular-nums" style={{ color: "var(--yh-text)" }}>
                        {r.count}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {entries && stats?.missing && (
          <div
            className="mb-10 rounded-3xl p-6 text-sm"
            style={{
              background: "var(--yh-card)",
              color: "var(--yh-text-secondary)",
            }}
            data-testid="analytics-missing"
          >
            <p className="font-semibold" style={{ color: "var(--yh-text)" }}>
              Analytics not set up yet
            </p>
            <p className="mt-1">
              Run the analytics SQL in Supabase SQL Editor (see <code>/supabase/analytics_setup.sql</code>) to enable page-view, share, and signup tracking on this dashboard.
            </p>
          </div>
        )}

        {/* Waitlist entries */}
        {entries && (
          <section data-testid="waitlist-section">
            <h2 className="mb-4 flex items-center gap-2 font-satoshi text-lg font-bold" style={{ color: "var(--yh-text)" }}>
              <Users className="h-5 w-5" style={{ color: "var(--yh-accent)" }} />
              Waitlist entries
            </h2>
            <div className="overflow-hidden rounded-3xl" style={{ background: "var(--yh-card)" }} data-testid="admin-entries">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                  <Users className="h-8 w-8" style={{ color: "var(--yh-accent)" }} />
                  <p className="font-satoshi text-lg font-bold" style={{ color: "var(--yh-text)" }}>
                    No signups yet
                  </p>
                  <p className="text-sm" style={{ color: "var(--yh-text-secondary)" }}>
                    When people join the waitlist, they'll show up here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm" data-testid="admin-table">
                    <thead>
                      <tr style={{ color: "var(--yh-text-secondary)" }} className="text-xs uppercase tracking-[0.14em]">
                        <th className="px-5 py-4 font-semibold">#</th>
                        <th className="px-5 py-4 font-semibold">Name</th>
                        <th className="px-5 py-4 font-semibold">Email</th>
                        <th className="px-5 py-4 font-semibold">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e, i) => (
                        <tr
                          key={e.id}
                          style={{
                            background: i % 2 === 0 ? "transparent" : "var(--yh-card-secondary)",
                            color: "var(--yh-text)",
                          }}
                          data-testid={`admin-row-${i}`}
                        >
                          <td className="px-5 py-4 font-semibold" style={{ color: "var(--yh-text-secondary)" }}>
                            {entries.length - i}
                          </td>
                          <td className="px-5 py-4">
                            {e.name || <span style={{ color: "var(--yh-text-secondary)" }}>—</span>}
                          </td>
                          <td className="px-5 py-4">
                            <a
                              href={`mailto:${e.email}`}
                              className="inline-flex items-center gap-2 font-medium hover:underline"
                              style={{ color: "var(--yh-accent)" }}
                            >
                              <Mail className="h-3.5 w-3.5" />
                              {e.email}
                            </a>
                          </td>
                          <td className="px-5 py-4" style={{ color: "var(--yh-text-secondary)" }}>
                            {fmtDate(e.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 sm:p-5"
      style={{ background: "var(--yh-card)" }}
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div
        aria-hidden
        className="absolute -right-4 -top-4 h-20 w-20 rounded-full blur-2xl"
        style={{
          background: "radial-gradient(circle, color-mix(in srgb, var(--yh-accent) 35%, transparent) 0%, transparent 70%)",
          opacity: 0.3,
        }}
      />
      <div className="relative flex items-center gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: "color-mix(in srgb, var(--yh-accent) 14%, transparent)",
            color: "var(--yh-accent)",
          }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--yh-text-secondary)" }}>
            {label}
          </div>
          <div className="mt-0.5 font-satoshi text-2xl font-black" style={{ color: "var(--yh-text)" }}>
            {value.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
