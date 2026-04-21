import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ArrowRight, Mail, MapPin, Sparkles, Car, Package, Users, Check } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LOGO_DARK = "https://customer-assets.emergentagent.com/job_d06f4357-d611-4fca-9e5e-ffbd70d85b75/artifacts/m6hvgmhg_logo-full-dark.png";
const LOGO_LIGHT = "https://customer-assets.emergentagent.com/job_d06f4357-d611-4fca-9e5e-ffbd70d85b75/artifacts/jfzoowq7_logo-full-light.png";
const BUNNY = "https://customer-assets.emergentagent.com/job_d06f4357-d611-4fca-9e5e-ffbd70d85b75/artifacts/gizaii8c_SocMed-PP-transparent.png";

const CONTACT_EMAIL = "official@yayhop.com";

const FEATURES = [
  {
    icon: Car,
    title: "Schedule Rides",
    copy: "Plan trips ahead, split costs, and meet riders going your way.",
  },
  {
    icon: Users,
    title: "Share Travels",
    copy: "Post your route, find companions, and turn journeys into stories.",
  },
  {
    icon: Package,
    title: "Help with Pasabuys",
    copy: "Bring home what matters — pick up, deliver, earn on the way.",
  },
];

export default function Landing() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [count, setCount] = useState(null);

  useEffect(() => {
    let mounted = true;
    axios
      .get(`${API}/waitlist/count`)
      .then((r) => {
        if (mounted) setCount(r.data.count ?? 0);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Please enter your email");
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!emailOk) {
      toast.error("That email looks off — mind checking?");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/waitlist`, {
        email: trimmed,
        name: name.trim() || null,
      });
      setJoined(true);
      if (data.already_joined) {
        toast.success("You're already on the list — hop tight!");
      } else {
        toast.success("You're in! We'll hop into your inbox soon.");
        setCount((c) => (typeof c === "number" ? c + 1 : c));
      }
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(
        typeof detail === "string" ? detail : "Something hopped wrong. Try again?"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="yh-bg relative min-h-screen overflow-hidden" data-testid="landing-page">
      {/* Ambient background flourishes */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,118,14,0.28) 0%, rgba(255,118,14,0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -left-32 h-[480px] w-[480px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,118,14,0.18) 0%, rgba(255,118,14,0) 70%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 dotted-grid opacity-40" />

      {/* Nav */}
      <header
        className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7"
        data-testid="site-header"
      >
        <a href="/" className="flex items-center gap-3" data-testid="logo-link">
          <img
            src={LOGO_DARK}
            alt="yayhop"
            className="logo-dark h-9 w-auto sm:h-11"
            data-testid="logo-dark"
          />
          <img
            src={LOGO_LIGHT}
            alt="yayhop"
            className="logo-light h-9 w-auto sm:h-11"
            data-testid="logo-light"
          />
        </a>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="hidden items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition hover:scale-[1.02] sm:inline-flex"
          style={{
            borderColor: "var(--yh-border)",
            color: "var(--yh-text)",
            backgroundColor: "var(--yh-card)",
          }}
          data-testid="header-contact-link"
        >
          <Mail className="h-4 w-4" style={{ color: "var(--yh-accent)" }} />
          <span>{CONTACT_EMAIL}</span>
        </a>
      </header>

      {/* Hero */}
      <section
        className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 pb-20 pt-6 sm:px-8 sm:pt-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-28"
        data-testid="hero-section"
      >
        {/* Left: copy + form */}
        <div className="relative">
          <span
            className="yh-pill animate-fade-up"
            data-testid="under-dev-badge"
          >
            <span className="yh-dot" />
            Under Development
          </span>

          <h1
            className="animate-fade-up delay-100 mt-6 font-satoshi text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-7xl"
            style={{ color: "var(--yh-text)" }}
            data-testid="hero-headline"
          >
            Something’s about to <br className="hidden sm:block" />
            <span className="yh-accent">hop</span> into motion.
          </h1>

          <p
            className="animate-fade-up delay-200 mt-6 max-w-xl text-base leading-relaxed sm:text-lg"
            style={{ color: "var(--yh-text-secondary)" }}
            data-testid="hero-tagline"
          >
            yayhop lets you <strong style={{ color: "var(--yh-text)" }}>schedule rides</strong>,
            {" "}<strong style={{ color: "var(--yh-text)" }}>share travels</strong>, and
            {" "}<strong style={{ color: "var(--yh-text)" }}>help with pasabuys</strong> — all in one place.
            We’re building it now. Be the first to hop in.
          </p>

          {/* Waitlist form */}
          <form
            onSubmit={handleSubmit}
            className="animate-fade-up delay-300 mt-8 flex w-full max-w-xl flex-col gap-3"
            data-testid="waitlist-form"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={joined || loading}
                className="yh-input h-12 rounded-xl px-4 text-sm sm:w-44"
                data-testid="waitlist-name-input"
              />
              <input
                type="email"
                required
                placeholder="you@awesome.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={joined || loading}
                className="yh-input h-12 flex-1 rounded-xl px-4 text-sm"
                data-testid="waitlist-email-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading || joined}
              className="yh-btn flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold tracking-wide"
              data-testid="waitlist-submit-button"
            >
              {joined ? (
                <>
                  <Check className="h-4 w-4" />
                  You're on the list
                </>
              ) : loading ? (
                "Hopping you in…"
              ) : (
                <>
                  Join the Waitlist
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Trust row */}
          <div
            className="animate-fade-up delay-400 mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm"
            style={{ color: "var(--yh-text-secondary)" }}
            data-testid="trust-row"
          >
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: "var(--yh-accent)" }} />
              <span className="text-shimmer font-semibold">Coming Soon</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" style={{ color: "var(--yh-accent)" }} />
              No spam. Just one launch ping.
            </span>
            {typeof count === "number" && count > 0 && (
              <span
                className="inline-flex items-center gap-2 font-semibold"
                data-testid="waitlist-count"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "var(--yh-accent)" }}
                />
                {count.toLocaleString()}{" "}
                {count === 1 ? "person is" : "people are"} already in
              </span>
            )}
          </div>
        </div>

        {/* Right: animated bunny */}
        <div className="relative flex items-center justify-center lg:justify-end">
          <div className="relative aspect-square w-[min(420px,80vw)]">
            {/* Ring halos */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 50% 55%, color-mix(in srgb, var(--yh-accent) 22%, transparent) 0%, transparent 65%)",
              }}
            />
            <div
              aria-hidden
              className="absolute inset-10 rounded-full border"
              style={{ borderColor: "color-mix(in srgb, var(--yh-accent) 25%, transparent)" }}
            />
            <div
              aria-hidden
              className="absolute inset-24 rounded-full border"
              style={{ borderColor: "color-mix(in srgb, var(--yh-accent) 15%, transparent)" }}
            />
            <span className="pulse-ring" aria-hidden />

            <img
              src={BUNNY}
              alt="yayhop mascot hopping"
              className="animate-hop absolute inset-0 m-auto h-[82%] w-[82%] select-none object-contain drop-shadow-[0_22px_48px_rgba(255,118,14,0.38)]"
              data-testid="hero-bunny"
              draggable={false}
            />

            {/* Floating chips */}
            <div
              className="animate-floaty absolute -left-2 top-8 rounded-2xl border px-3 py-2 text-xs font-semibold shadow-lg sm:-left-6"
              style={{
                background: "var(--yh-card)",
                borderColor: "var(--yh-border)",
                color: "var(--yh-text)",
              }}
              data-testid="chip-rides"
            >
              <span className="mr-1" style={{ color: "var(--yh-accent)" }}>◆</span>
              Rides scheduled, friends found
            </div>
            <div
              className="animate-floaty absolute -right-2 bottom-10 rounded-2xl border px-3 py-2 text-xs font-semibold shadow-lg sm:-right-6"
              style={{
                background: "var(--yh-card)",
                borderColor: "var(--yh-border)",
                color: "var(--yh-text)",
                animationDelay: "1.5s",
              }}
              data-testid="chip-pasabuy"
            >
              <span className="mr-1" style={{ color: "var(--yh-accent)" }}>◆</span>
              Pasabuys, sorted.
            </div>
          </div>
        </div>
      </section>

      {/* Feature teaser strip */}
      <section
        className="relative z-10 mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28"
        data-testid="features-section"
      >
        <div className="mb-8 flex items-end justify-between">
          <h2
            className="font-satoshi text-xl font-bold sm:text-2xl"
            style={{ color: "var(--yh-text)" }}
            data-testid="features-heading"
          >
            What we're hopping toward
          </h2>
          <span
            className="hidden text-xs uppercase tracking-[0.2em] sm:inline"
            style={{ color: "var(--yh-text-secondary)" }}
          >
            v1 · in the oven
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-3xl border p-6 transition hover:-translate-y-1"
                style={{
                  background: "var(--yh-card)",
                  borderColor: "var(--yh-border)",
                  animation: `fadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${0.1 * (i + 1)}s both`,
                }}
                data-testid={`feature-card-${i}`}
              >
                <div
                  aria-hidden
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl transition-opacity group-hover:opacity-60"
                  style={{
                    background:
                      "radial-gradient(circle, color-mix(in srgb, var(--yh-accent) 35%, transparent) 0%, transparent 70%)",
                    opacity: 0.35,
                  }}
                />
                <div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    background:
                      "color-mix(in srgb, var(--yh-accent) 15%, transparent)",
                    color: "var(--yh-accent)",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3
                  className="mt-5 font-satoshi text-lg font-bold"
                  style={{ color: "var(--yh-text)" }}
                >
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--yh-text-secondary)" }}>
                  {f.copy}
                </p>
                <div
                  className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--yh-accent)" }}
                >
                  Building now
                  <span className="h-px w-8" style={{ background: "var(--yh-accent)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact strip */}
      <section
        className="relative z-10 mx-auto max-w-7xl px-5 pb-16 sm:px-8"
        data-testid="contact-section"
      >
        <div
          className="relative overflow-hidden rounded-3xl border px-6 py-10 sm:px-10 sm:py-12"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--yh-accent) 10%, var(--yh-card)) 0%, var(--yh-card) 60%)",
            borderColor: "var(--yh-border)",
          }}
        >
          <div className="grain-overlay" aria-hidden />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: "var(--yh-accent)" }}
              >
                Get in touch
              </p>
              <h3
                className="mt-2 font-satoshi text-2xl font-bold sm:text-3xl"
                style={{ color: "var(--yh-text)" }}
              >
                Questions, partnerships, press?
              </h3>
              <p className="mt-1 text-sm sm:text-base" style={{ color: "var(--yh-text-secondary)" }}>
                Send us a note — we read every one.
              </p>
            </div>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="yh-btn inline-flex items-center gap-3 rounded-xl px-6 py-3 text-sm font-bold"
              data-testid="contact-email-cta"
            >
              <Mail className="h-4 w-4" />
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 mx-auto max-w-7xl px-5 pb-10 sm:px-8"
        data-testid="site-footer"
      >
        <div
          className="flex flex-col items-start justify-between gap-4 border-t pt-6 text-xs sm:flex-row sm:items-center"
          style={{ borderColor: "var(--yh-border)", color: "var(--yh-text-secondary)" }}
        >
          <span>© {new Date().getFullYear()} yayhop. All rights reserved.</span>
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--yh-accent)" }}
            />
            Crafted with care — launch imminent.
          </span>
        </div>
      </footer>
    </main>
  );
}
