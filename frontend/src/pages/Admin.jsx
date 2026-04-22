import { useEffect, useState } from "react";
import axios from "axios";
import { Lock, RefreshCw, Download, Mail, Users } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const STORAGE_KEY = "yh_admin_key";

export default function Admin() {
  const [key, setKey] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [entries, setEntries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [count, setCount] = useState(null);

  useEffect(() => {
    axios.get(`${API}/waitlist/count`).then((r) => setCount(r.data.count)).catch(() => {});
  }, []);

  const load = async (k) => {
    const useKey = (k ?? key).trim();
    if (!useKey) {
      setError("Please enter your admin key");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API}/waitlist/admin`, { params: { key: useKey } });
      setEntries(data);
      localStorage.setItem(STORAGE_KEY, useKey);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) setError("Invalid admin key.");
      else setError("Couldn't load entries. Try again?");
      setEntries(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load if key was cached
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) load(cached);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setKey("");
    setEntries(null);
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

  return (
    <main className="yh-bg min-h-screen" data-testid="admin-page">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--yh-accent)" }}>
              yayhop admin
            </p>
            <h1 className="mt-1 font-satoshi text-3xl font-black sm:text-4xl" style={{ color: "var(--yh-text)" }}>
              Waitlist entries
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--yh-text-secondary)" }}>
              Total signups: <strong style={{ color: "var(--yh-text)" }}>{count ?? "—"}</strong>
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
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={downloadCsv}
                className="yh-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                data-testid="admin-download-csv"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
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
              Admin key required
            </div>
            <p className="mb-5 text-sm" style={{ color: "var(--yh-text-secondary)" }}>
              Enter your admin key to view all waitlist signups. The key is stored locally in this browser so you won't have to re-enter it.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="password"
                placeholder="Paste admin key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="yh-input h-12 flex-1 rounded-xl px-4 text-sm"
                data-testid="admin-key-input"
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
          </form>
        )}

        {/* Entries table */}
        {entries && (
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
                        <td className="px-5 py-4">{e.name || <span style={{ color: "var(--yh-text-secondary)" }}>—</span>}</td>
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
        )}
      </div>
    </main>
  );
}
