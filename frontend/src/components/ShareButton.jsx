import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Share2, Link2, Check, X as XIcon, Facebook, Linkedin, MessageCircle, Send } from "lucide-react";

const SHARE_TITLE = "yayhop is hopping soon";
const SHARE_TEXT =
  "Schedule rides, share travels, and help with pasabuys. Join the waitlist at yayhop.com";

export default function ShareButton({ url }) {
  const shareUrl =
    url ||
    (typeof window !== "undefined" ? window.location.origin + "/" : "https://yayhop.com");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popRef = useRef(null);
  const btnRef = useRef(null);

  // Close on outside click / escape
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
    // Prefer native share on mobile / supported browsers
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: shareUrl });
        return;
      } catch (err) {
        // User cancelled or share failed — fall through to popover
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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const enc = (s) => encodeURIComponent(s);
  const targets = [
    {
      id: "x",
      label: "X / Twitter",
      Icon: XIcon,
      href: `https://twitter.com/intent/tweet?text=${enc(SHARE_TEXT)}&url=${enc(shareUrl)}`,
    },
    {
      id: "facebook",
      label: "Facebook",
      Icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`,
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
          className="animate-fade-up absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-2xl shadow-2xl"
          style={{
            background: "var(--yh-card)",
            boxShadow: "0 20px 60px -15px rgba(0,0,0,0.25)",
          }}
          data-testid="share-popover"
        >
          <div className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--yh-text-secondary)" }}>
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
          <div className="h-px" style={{ background: "var(--yh-card-secondary)" }} />
          {targets.map(({ id, label, Icon, href }) => (
            <a
              key={id}
              href={href}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
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
              <span>{label}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
