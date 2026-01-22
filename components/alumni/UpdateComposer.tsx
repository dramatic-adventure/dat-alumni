// components/alumni/UpdateComposer.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_STARTERS, isDatGold } from "@/lib/updateStarters";

type SubmitMeta = {
  promptUsed: string;
  isDatGold: boolean;
};

type UpdateComposerProps = {
  /** Called when the user posts. Return a promise; composer shows loading + disables inputs. */
  onSubmit: (
    text: string,
    meta?: SubmitMeta
  ) => Promise<{ id: string } | void> | { id: string } | void;

  onPostedId?: (id: string) => void;

  /** Optional: called after a successful post (after state reset). */
  onPosted?: () => void;

  /** Optional: called if submit throws. */
  onError?: (err: unknown) => void;

  /** Prefill text. Defaults to "" (placeholder does the work). */
  initialText?: string;

  /** Character limit. Defaults to 280. */
  maxChars?: number;

  /** Optional placeholder override. If provided, disables rotating starters. */
  placeholder?: string;

  /** Optional className for outer wrapper. */
  className?: string;

  /** Optional: render compact (tighter padding) */
  compact?: boolean;

  /** Optional: rotate placeholder on hover (subtle) */
  rotateOnHover?: boolean;

  /** Optional: plus button action (legacy name) */
  onAddEvent?: () => void;

  /** Optional: plus menu action (new explicit name) */
  onAddUpcomingEvent?: () => void;
};

function clampText(s: string, max: number) {
  const t = String(s ?? "");
  return t.length > max ? t.slice(0, max) : t;
}

function normalizeNewlines(s: string) {
  return String(s ?? "").replace(/\r\n/g, "\n");
}

function pickRandom(list: readonly string[]) {
  return list[Math.floor(Math.random() * list.length)];
}

function normalizeForDedup(s: string) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u2026/g, "...");
}

/** -----------------------------
 * Starter pacing (localStorage)
 * ----------------------------- */
const LS_KEY = "dat:updateComposer:starterPacing:v1";

/**
 * Policy knobs:
 * - Don’t show gold more often than every MIN_NON_GOLD_BETWEEN_GOLD picks
 * - Force a gold by FORCE_GOLD_AFTER_NON_GOLD picks
 */
const MIN_NON_GOLD_BETWEEN_GOLD = 3;
const FORCE_GOLD_AFTER_NON_GOLD = 6;

type PacingState = {
  nonGoldSinceGold: number;
  lastStarter?: string;
};

function safeReadPacing(): PacingState {
  try {
    if (typeof window === "undefined")
      return { nonGoldSinceGold: FORCE_GOLD_AFTER_NON_GOLD };
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return { nonGoldSinceGold: FORCE_GOLD_AFTER_NON_GOLD };
    const j = JSON.parse(raw);
    return {
      nonGoldSinceGold:
        typeof j?.nonGoldSinceGold === "number"
          ? j.nonGoldSinceGold
          : FORCE_GOLD_AFTER_NON_GOLD,
      lastStarter: typeof j?.lastStarter === "string" ? j.lastStarter : undefined,
    };
  } catch {
    return { nonGoldSinceGold: FORCE_GOLD_AFTER_NON_GOLD };
  }
}

function safeWritePacing(next: PacingState) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function chooseStarterPaced(prevStarter?: string) {
  if (!ALL_STARTERS?.length) return "";

  const gold = ALL_STARTERS.filter((s) => isDatGold(s));
  const nonGold = ALL_STARTERS.filter((s) => !isDatGold(s));

  // If “gold vs non-gold” can’t be computed, just randomize w/ no immediate repeat
  if (!gold.length || !nonGold.length) {
    let next = pickRandom(ALL_STARTERS);
    if (ALL_STARTERS.length > 1)
      while (next === prevStarter) next = pickRandom(ALL_STARTERS);
    return next;
  }

  const pacing = safeReadPacing();
  const mustAvoidGold = pacing.nonGoldSinceGold < MIN_NON_GOLD_BETWEEN_GOLD;
  const shouldForceGold = pacing.nonGoldSinceGold >= FORCE_GOLD_AFTER_NON_GOLD;

  let pool: string[] = nonGold;
  if (!mustAvoidGold) pool = shouldForceGold ? gold : ALL_STARTERS.slice();

  const last = pacing.lastStarter || prevStarter;
  if (pool.length > 1 && last) pool = pool.filter((s) => s !== last);
  if (!pool.length) pool = shouldForceGold ? gold : ALL_STARTERS.slice();

  const next = pickRandom(pool);

  const nextIsGold = isDatGold(next);
  safeWritePacing({
    lastStarter: next,
    nonGoldSinceGold: nextIsGold ? 0 : Math.min(999, pacing.nonGoldSinceGold + 1),
  });

  return next;
}

export default function UpdateComposer({
  onSubmit,
  onPosted,
  onPostedId,
  onError,
  initialText = "",
  maxChars = 280,
  placeholder,
  className = "",
  compact = false,
  rotateOnHover = false,
  onAddEvent,
  onAddUpcomingEvent,
}: UpdateComposerProps) {
  const COLOR = {
    ink: "#241123",
    brand: "#6C00AF",
    gold: "#D9A919",
    snow: "#F2F2F2",
    red: "#F23359",
  };

  const [text, setText] = useState<string>(clampText(normalizeNewlines(initialText), maxChars));
  const [isPosting, setIsPosting] = useState(false);
  const [touched, setTouched] = useState(false);
  const [errMsg, setErrMsg] = useState<string>("");

  // Initialize starter once (placeholder override OR paced starter)
  const initialStarter = useMemo(() => {
    return placeholder?.trim() ? placeholder.trim() : chooseStarterPaced(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [starter, setStarter] = useState<string>(initialStarter);

  /**
   * Ref for "current starter concept"
   */
  const starterRef = useRef<string>(initialStarter);

  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // + menu
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);

  // Tracks whether the prompt was auto-injected AND the user hasn't typed past it yet
  const [autoPromptActive, setAutoPromptActive] = useState(false);
  const autoPromptValueRef = useRef<string>(""); // keeps the injected prompt string

  // Close menu on outside click / Esc
  useEffect(() => {
    if (!menuOpen) return;

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (menuWrapRef.current?.contains(t)) return;
      setMenuOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Keep initialText in sync ONLY when user hasn't touched anything.
  useEffect(() => {
    setText((prev) => {
      if (touched) return prev;
      const next = clampText(normalizeNewlines(initialText), maxChars);

      // external prefill should cancel auto prompt behavior
      if (next.trim()) {
        setAutoPromptActive(false);
        autoPromptValueRef.current = "";
      }

      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText, maxChars]);

  // If placeholder prop is provided/changed, lock starter to it (and ref too).
  useEffect(() => {
    if (!placeholder?.trim()) return;
    const locked = placeholder.trim();
    starterRef.current = locked;
    setStarter(locked);

    // locked placeholder should disable auto prompt
    setAutoPromptActive(false);
    autoPromptValueRef.current = "";
  }, [placeholder]);

  const trimmed = useMemo(() => text.replace(/\s+/g, " ").trim(), [text]);
  const remaining = maxChars - text.length;

  const canPost = useMemo(() => {
    if (isPosting) return false;
    if (!trimmed) return false;
    if (remaining < 0) return false;

    // prevent “posting the prompt verbatim”
    const shown = String(
      taRef.current?.getAttribute("placeholder") ?? starterRef.current ?? ""
    ).trim();
    if (normalizeForDedup(trimmed) === normalizeForDedup(shown)) return false;

    return true;
  }, [isPosting, trimmed, remaining]);

  function setStarterSync(next: string) {
    const v = String(next ?? "").trim();
    starterRef.current = v;
    setStarter(v);
  }

  // helper: ignore promote if click originates from menu/buttons region
  function shouldSkipPromoteFromEventTarget(target: EventTarget | null) {
    const el = target as HTMLElement | null;
    if (!el) return false;
    return Boolean(el.closest('[data-no-promote="1"]'));
  }

  function rotateStarter(opts?: { alsoUpdateInjected?: boolean }) {
    if (placeholder?.trim()) return;

    const shownNow = String(
      taRef.current?.getAttribute("placeholder") ?? starterRef.current ?? starter ?? ""
    ).trim();

    const next = chooseStarterPaced(shownNow);
    setStarterSync(next);
    setErrMsg("");
    setMenuOpen(false);

    const shouldUpdateInjected = Boolean(opts?.alsoUpdateInjected);

    // If the prompt has been promoted into editable text AND the user hasn't typed past it,
    // refresh should replace that injected prompt too.
    if (shouldUpdateInjected && autoPromptActive) {
      const injected = String(autoPromptValueRef.current || "").trim();
      const current = String(text ?? "");

      const injectedAsText = injected ? `${injected} ` : "";
      const isStillJustInjected =
        injected &&
        (current === injectedAsText || current.trim() === injected) &&
        normalizeForDedup(current.trim()) === normalizeForDedup(injected);

      if (isStillJustInjected && next) {
        const nextText = `${next} `;
        autoPromptValueRef.current = next;
        setText(clampText(normalizeNewlines(nextText), maxChars));

        requestAnimationFrame(() => {
          const el = taRef.current;
          if (!el) return;
          const pos = Math.min(nextText.length, el.value.length);
          try {
            el.setSelectionRange(pos, pos);
          } catch {
            // ignore
          }
        });
      } else {
        setAutoPromptActive(false);
        autoPromptValueRef.current = "";
      }
    }
  }

  function promoteStarterIntoText() {
    if (isPosting) return;
    if (placeholder?.trim()) return;
    if (touched) return;
    if (text.trim()) return;

    const shown = String(taRef.current?.getAttribute("placeholder") ?? "").trim();
    if (!shown) return;

    const nextText = `${shown} `;
    setTouched(true);
    setErrMsg("");
    setText(clampText(normalizeNewlines(nextText), maxChars));

    setAutoPromptActive(true);
    autoPromptValueRef.current = shown;

    requestAnimationFrame(() => {
      const el = taRef.current;
      if (!el) return;
      const pos = Math.min(nextText.length, el.value.length);
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        // ignore
      }
    });
  }

  async function handlePost() {
    setErrMsg("");
    try {
      setIsPosting(true);

      const usedPrompt = String(
        taRef.current?.getAttribute("placeholder") ?? starterRef.current ?? ""
      ).trim();

      const meta: SubmitMeta = {
        promptUsed: usedPrompt,
        isDatGold: isDatGold(usedPrompt),
      };

      const result = await onSubmit(trimmed, meta);
      const createdId = (result as any)?.id as string | undefined;
      if (createdId) onPostedId?.(createdId);

      setTouched(false);
      setText("");
      setMenuOpen(false);

      setAutoPromptActive(false);
      autoPromptValueRef.current = "";

      if (!placeholder?.trim()) {
        const shownNow = String(
          taRef.current?.getAttribute("placeholder") ?? starterRef.current ?? starter ?? ""
        ).trim();
        const next = chooseStarterPaced(shownNow);
        setStarterSync(next);
      }

      requestAnimationFrame(() => taRef.current?.focus());
      onPosted?.();
    } catch (err) {
      const msg = (err as any)?.message || "Update failed.";
      setErrMsg(String(msg));
      onError?.(err);
    } finally {
      setIsPosting(false);
    }
  }

  // Progress ring (used inside textarea overlay)
  const ring = useMemo(() => {
    const size = 18;
    const stroke = 2.25;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;

    const used = Math.min(maxChars, Math.max(0, text.length));
    const pct = maxChars ? used / maxChars : 0;
    const dash = c * pct;

    const warn = remaining <= 20;
    const over = remaining < 0;

    const fg = over ? COLOR.red : warn ? COLOR.gold : "rgba(36,17,35,0.40)";
    const bg = "rgba(36,17,35,0.12)";

    return (
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={bg} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={fg}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    );
  }, [text.length, maxChars, remaining]);

  const pad = compact ? 10 : 12;

  return (
    <form
      className={`update-composer ${className}`}
      style={{ width: "100%" }}
      onSubmit={(e) => {
        e.preventDefault();
        if (canPost) handlePost();
      }}
    >
      {/* Minimal, local styling for legibility on kraft */}
      <style jsx>{`
        .update-composer textarea::placeholder {
          color: rgba(36, 17, 35, 0.45);
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-weight: 400;
          letter-spacing: 0.02em;
        }

        .update-composer textarea::selection {
          background: rgba(217, 169, 25, 0.35);
        }

        .update-composer button {
          transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease,
            opacity 120ms ease;
        }

        .update-composer .uc-btn-plus:hover:not(:disabled) {
          transform: translateY(-1px) scale(1.02);
          filter: brightness(1.06);
          opacity: 1;
          box-shadow: 0 10px 18px rgba(0, 0, 0, 0.10);
        }
        .update-composer .uc-btn-plus:active:not(:disabled) {
          transform: translateY(0px) scale(0.98);
          box-shadow: none;
        }

        .update-composer .uc-btn-refresh:hover:not(:disabled) {
          transform: translateY(-1px) rotate(-8deg);
          filter: brightness(1.06);
          opacity: 1;
        }
        .update-composer .uc-btn-refresh:active:not(:disabled) {
          transform: translateY(0px) rotate(0deg) scale(0.98);
        }

        .update-composer .uc-btn-post {
          transform: translateZ(0);
        }
        .update-composer .uc-btn-post:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.06);
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.14);
        }
        .update-composer .uc-btn-post:active:not(:disabled) {
          transform: translateY(0px) scale(0.99);
          box-shadow: none;
        }

        .update-composer .uc-menu-item:hover:not(:disabled) {
          background: rgba(108, 0, 175, 0.08);
          transform: translateX(1px);
        }
        .update-composer .uc-menu-item:active:not(:disabled) {
          transform: translateX(0px);
          filter: brightness(0.98);
        }

        .update-composer .uc-btn-post:hover:not(:disabled) {
          background: #510083ff !important;
          color: #f2f2f2 !important;
          opacity: 1 !important;
        }

        .update-composer .uc-btn-plus:hover:not(:disabled) {
          background: #6c00af !important;
          color: #f2f2f2 !important;
          opacity: 1 !important;
        }

        .uc-menu-item {
            width: 100%;
            text-align: left;
            border: 0;
            cursor: pointer;
            font-family: var(--font-dm-sans), system-ui, sans-serif;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.01em;
            opacity: 1;
        }

        /* TEXT-ONLY menu item (no pill) */
        .uc-menu-item--add-event {
            background: transparent;
            padding: 0;
            border-radius: 0;
            color: #6c00af;
        }

        /* hover: no underline, just a subtle “lift + brighten” */
        .uc-menu-item--add-event:hover {
            background: transparent;
            text-decoration: none;
            opacity: 0.95;
            transform: translateX(1px);
            filter: brightness(1.06);
        }

        /* make sure generic hover rules don’t reintroduce a pill */
        .update-composer .uc-menu-item.uc-menu-item--add-event:hover:not(:disabled) {
            background: transparent;
            transform: translateX(1px);
        }


      `}</style>

      <div
        className="uc-shell"
        style={{
          borderRadius: 16,
          background: "#f2f2f200",
          border: errMsg ? "0px solid rgba(242,51,89,0.42)" : "0px solid rgba(36,17,35,0.12)",
          boxShadow: "inset 0 0 0 0px rgba(255,255,255,0.14)",
          paddingLeft: 0,
          paddingRight: 0,
          padding: 0,
          opacity: isPosting ? 0.82 : 1,
          transition: "opacity 150ms ease",
        }}
        onMouseEnter={() => {
          if (!rotateOnHover) return;
          if (touched) return;
          if (menuOpen) return;
          rotateStarter();
        }}
        onMouseDown={(e) => {
          if (shouldSkipPromoteFromEventTarget(e.target)) return;
          if (!touched && !text.trim() && !placeholder?.trim()) {
            promoteStarterIntoText();
          }
        }}
      >
        <div style={{ position: "relative" }}>
          <textarea
            ref={taRef}
            data-update-composer
            value={text}
            onChange={(e) => {
              setTouched(true);
              setErrMsg("");
              const nextRaw = normalizeNewlines(e.target.value);
              setText(clampText(nextRaw, maxChars));

              if (autoPromptActive) {
                const injected = String(autoPromptValueRef.current || "");
                if (injected) {
                  const prefix = `${injected} `;
                  const stillAuto =
                    nextRaw === prefix ||
                    nextRaw.startsWith(prefix) ||
                    nextRaw.trim() === injected;

                  if (!stillAuto) {
                    setAutoPromptActive(false);
                    autoPromptValueRef.current = "";
                  }
                } else {
                  setAutoPromptActive(false);
                }
              }
            }}
            placeholder={starter}
            disabled={isPosting}
            rows={3}
            style={{
              width: "100%",
              resize: "none",
              outline: "none",
              border: "none",
              background: "transparent",
              color: COLOR.ink,
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: 16,
              lineHeight: 1.55,
              letterSpacing: "0.02em",
              minHeight: 96,
              paddingBottom: 34,
            }}
            onFocus={() => {
              if (menuOpen) return;
              promoteStarterIntoText();
            }}
            onKeyDown={(e) => {
              if (e.key === "Tab" && !text.trim() && !touched && !placeholder?.trim()) {
                e.preventDefault();
                promoteStarterIntoText();
                return;
              }

              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                if (canPost) handlePost();
              }
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
              pointerEvents: "none",
              userSelect: "none",
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: 12,
              fontVariantNumeric: "tabular-nums",
              color:
                remaining < 0
                  ? COLOR.red
                  : remaining <= 20
                  ? COLOR.gold
                  : "rgba(36,17,35,0.55)",
            }}
          >
            {ring}
            <span>{remaining >= 0 ? remaining : 0}</span>
          </div>
        </div>

        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 8,
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: 12,
                color: COLOR.ink,
            }}
            >

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              ref={menuWrapRef}
              data-no-promote="1"
              style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            >
              <button
                className="uc-btn-plus"
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                disabled={isPosting}
                title="More options"
                aria-label="More options"
                style={{
                  border: "1px solid rgba(36,17,35,0.18)",
                  background: "#6c00af88",
                  color: COLOR.snow,
                  borderRadius: 999,
                  fontSize: 22,
                  fontWeight: 700,
                  cursor: isPosting ? "not-allowed" : "pointer",
                  opacity: isPosting ? 0.45 : 1,
                }}
              >
                ＋
              </button>

              {menuOpen && !isPosting && (
                <div
                  role="menu"
                  aria-label="Update options"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    minWidth: 220,
                    borderRadius: 14,
                    padding: 8,
                    background: "#f2f2f2",
                    border: "1px solid rgba(36,17,35,0.14)",
                    boxShadow: "0 14px 40px rgba(0,0,0,0.14)",
                    backdropFilter: "blur(10px)",
                    zIndex: 9999,
                  }}
                >
                  <div style={{ padding: "2px 2px" }}>
                    <button
                        className="uc-menu-item uc-menu-item--add-event"
                        type="button"
                        role="menuitem"
                        onClick={() => {
                        setMenuOpen(false);
                        onAddEvent?.();
                        }}
                    >
                        Add an upcoming event
                    </button>
                    </div>
                </div>
              )}

              <button
                className="uc-btn-refresh"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  rotateStarter({ alsoUpdateInjected: true });
                }}
                disabled={isPosting || Boolean(placeholder?.trim())}
                title={placeholder?.trim() ? "Prompt locked" : "New prompt"}
                aria-label="New prompt"
                style={{
                  border: "1px solid hsla(303, 36%, 10%, 0.18)",
                  background: "rgba(255,255,255,0.3)",
                  color: "#6c00afa7",
                  borderRadius: 999,
                  fontSize: 24,
                  fontWeight: 700,
                  cursor:
                    isPosting || Boolean(placeholder?.trim()) ? "not-allowed" : "pointer",
                  opacity: isPosting || Boolean(placeholder?.trim()) ? 0.45 : 1,
                }}
              >
                ↻
              </button>
            </div>

            <span style={{ opacity: 0.68 }}>⌘/Ctrl+Enter to post</span>
          </div>

          <button
            className="uc-btn-post"
            type="submit"
            disabled={!canPost}
            title={!canPost ? "Write a short update first" : "Post update"}
            style={{
              border: "1px solid rgba(36,17,35,0.18)",
              borderRadius: 999,
              padding: "8px 14px",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: 14,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: COLOR.snow,
              cursor: canPost ? "pointer" : "not-allowed",
              opacity: canPost ? 1 : 0.95,
              background: canPost ? "#6c00af" : "#6c00af89",
              boxShadow: canPost ? "0 10px 22px rgba(0,0,0,0.10)" : "none",
              textIndent: "0.25em",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isPosting ? "Posting..." : "Post"}
          </button>
        </div>

        <div
          role={errMsg ? "alert" : undefined}
          aria-live="polite"
          style={{
            marginTop: errMsg ? 6 : 0,
            overflow: "hidden",
            maxHeight: errMsg ? 200 : 0,
            opacity: errMsg ? 0.95 : 0,
            transition: "max-height 180ms ease, opacity 180ms ease, margin-top 180ms ease",
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: 13,
            color: COLOR.red,
          }}
        >
          {errMsg}
        </div>
      </div>
    </form>
  );
}
