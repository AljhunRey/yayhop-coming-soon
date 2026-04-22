import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Share2,
  Link2,
  Check,
  Facebook,
  Linkedin,
  MessageCircle,
  Send,
  Instagram,
} from "lucide-react";
import { XLogo } from "@/components/BrandIcons";
import { trackEvent } from "@/lib/analytics";

// Always share the canonical production URL, regardless of where the user
// is currently browsing the site (preview, staging, etc.).
const CANONICAL_URL = "https://yayhop.com";
const SHARE_TITLE = "yayhop is hopping soon";
const SHARE_TEXT =
  "Schedule rides, share travels, and help with pasabuys. Join the waitlist at yayhop.com";

export default function ShareButton() {
  const shareUrl = CANONICAL_URL;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (
        popRef.current &&
        !popRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleClick = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: shareUrl });
        trackEvent("share_click", { platform: "native" });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    setOpen((v) => !v);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied!");
      trackEvent("share_click", { platform: "copy_link" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const handleInstagram = async () => {
    // Instagram has no web share URL — we copy a ready-made caption and point
    // the user to Instagram so they can paste it in a Story, Reel, or DM.
    const caption = `${SHARE_TEXT}\n\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(caption);
    } catch {}
    trackEvent("share_click", { platform: "instagram" });
    toast.success("Caption copied — paste in your Instagram Story, Reel, or DM!", {
      duration: 5000,
    });
    setTimeout(() => {
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    }, 300);
    setOpen(false);
  };

  const enc = encodeURIComponent;
  const linkTargets = [
    {
      id: "x",
      label: "X",
      Icon: XLogo,
      href: `https://twitter.com/intent/tweet?text=${enc(SHARE_TEXT)}&url=${enc(shareUrl)}`,
    },
    {
      id: "facebook",
      label: "Facebook",
      Icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}&quote=${enc(SHARE_TEXT)}`,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      Icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(shareUrl)}`,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      Icon: MessageCircle,
      href: `https://wa.me/?text=${enc(`${SHARE_TEXT} ${shareUrl}`)}`,
    },
    {
      id: "telegram",
      label: "Telegram",
      Icon: Send,
      href: `https://t.me/share/url?url=${enc(shareUrl)}&text=${enc(SHARE_TEXT)}`,
    },
  ];

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition hover:scale-[1.03]"
        style={{
          color: "var(--yh-text)",
          backgroundColor: "var(--yh-card)",
        }}
        data-testid="share-button"
      >
        <Share2 className="h-4 w-4" style={{ color: "var(--yh-accent)" }} />
        Share
      </button>

      {open && (
        <div
          ref={popRef}
          role="menu"
          className="animate-fade-up absolute right-0 z-[100] mt-2 w-64 overflow-hidden rounded-2xl shadow-2xl"
          style={{
            background: "var(--yh-card)",
            boxShadow: "0 20px 60px -15px rgba(0,0,0,0.35)",
          }}
          data-testid="share-popover"
        >
          <div
            className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--yh-text-secondary)" }}
          >
            Spread the hop
          </div>

          <button
            type="button"
            onClick={copyLink}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-[color-mix(in_srgb,var(--yh-accent)_10%,transparent)]"
            style={{ color: "var(--yh-text)" }}
            data-testid="share-copy-link"
          >
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: "color-mix(in srgb, var(--yh-accent) 14%, transparent)",
                color: "var(--yh-accent)",
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            </span>
            <span className="flex-1 font-medium">{copied ? "Copied!" : "Copy link"}</span>
          </button>

          <button
            type="button"
            onClick={handleInstagram}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-[color-mix(in_srgb,var(--yh-accent)_10%,transparent)]"
            style={{ color: "var(--yh-text)" }}
            data-testid="share-instagram"
          >
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: "color-mix(in srgb, var(--yh-accent) 14%, transparent)",
                color: "var(--yh-accent)",
              }}
            >
              <Instagram className="h-4 w-4" />
            </span>
            <span className="flex-1 font-medium">Instagram</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--yh-text-secondary)" }}>
              caption
            </span>
          </button>

          <div className="h-px" style={{ background: "var(--yh-card-secondary)" }} />

          {linkTargets.map(({ id, label, Icon, href }) => (
            <a
              key={id}
              href={href}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                trackEvent("share_click", { platform: id });
                setOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-[color-mix(in_srgb,var(--yh-accent)_10%,transparent)]"
              style={{ color: "var(--yh-text)" }}
              data-testid={`share-${id}`}
            >
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: "color-mix(in srgb, var(--yh-accent) 14%, transparent)",
                  color: "var(--yh-accent)",
                }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-medium">{label}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
