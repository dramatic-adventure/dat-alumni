"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import MediaPickerModal from "@/components/media/MediaPickerModal";
import {
  normalizeProfile,
  validateProfile,
  buildLiveChanges,
} from "@/components/alumni/formLogic";
import { PROFILE_FIELDS, PROFILE_GROUPS } from "@/components/alumni/fields";
import type { AlumniProfile } from "@/schemas";

import Collapsible from "@/components/ui/Collapsible";
import SaveBar from "@/components/alumni/update/SaveBar";
import Toast from "@/components/alumni/update/Toast";
import ContactFields from "@/components/alumni/update/ContactFields";
import FieldRenderer from "@/components/alumni/FieldRenderer";
import MediaHub from "@/components/media/MediaHub";
import BackgroundSwatches from "@/components/alumni/update/BackgroundSwatches";

import {
  createUploader,
  type UploadKind,
  type UploadTask,
} from "@/lib/uploader";

import { useDraft } from "@/lib/useDraft";

/* ====== Aesthetic constants ====== */
const COLOR = {
  ink: "#241123",
  brand: "#6C00AF",
  gold: "#D9A919",
  teal: "#2493A9",
  red: "#F23359",
  snow: "#F2F2F2",
};

const subheadChipStyle: React.CSSProperties = {
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontSize: "2rem",
  fontWeight: 600,
  letterSpacing: ".5px",
  color: COLOR.gold,
  display: "inline-block",
  margin: "0 0 1rem",
  backgroundColor: COLOR.ink,
  opacity: 0.7,
  padding: "0.1em 0.6em",
  borderRadius: "0.35em",
  textDecoration: "none",
};

const explainStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: 15,
  lineHeight: 1.55,
  color: COLOR.snow,
  opacity: 0.95,
  margin: "0 0 14px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 10,
  padding: "12px 14px",
  outline: "none",
  border: "none",
  background: "#fff",
  color: "#111",
  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
};

const datButton: React.CSSProperties = {
  borderRadius: 14,
  padding: "12px 16px",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 700,
  letterSpacing: "0.03em",
  background:
    "linear-gradient(180deg, rgba(217,169,25,0.98), rgba(108,0,175,0.98))",
  color: "#fff",
  border: "none",
  boxShadow: "0 8px 22px rgba(0,0,0,0.25)",
  cursor: "pointer",
  transform: "translateZ(0)",
};
const datButtonGhost: React.CSSProperties = {
  borderRadius: 14,
  padding: "10px 14px",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 700,
  letterSpacing: "0.03em",
  background: "transparent",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.35)",
  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
  cursor: "pointer",
};

/* ---------- helpers ---------- */
type PointerAssets = {
  currentHeadshotId?: string;
  featuredAlbumId?: string;
  featuredReelId?: string;
  featuredEventId?: string;
};

const POINTER_MAP: Record<
  "headshot" | "album" | "reel" | "event",
  keyof PointerAssets
> = {
  headshot: "currentHeadshotId",
  album: "featuredAlbumId",
  reel: "featuredReelId",
  event: "featuredEventId",
};

// turn “Isabel Martínez” -> “isabel-martinez”
function slugify(s: string) {
  return (s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
function fileExtension(name: string) {
  const m = /\.[A-Za-z0-9]+$/.exec(name);
  return m ? m[0] : "";
}
function renameForKind(
  file: File,
  kind: UploadKind,
  baseName: string,
  index = 1,
  albumName?: string
) {
  const ext = fileExtension(file.name) || "";
  const idx = String(index).padStart(3, "0");
  let newBase = baseName;

  if (kind === "headshot") newBase = `${baseName}-headshot`;
  if (kind === "album") {
    const albumSlug = slugify(albumName || "gallery");
    newBase = `${baseName}-${albumSlug}-${idx}`;
  }
  if (kind === "reel") newBase = `${baseName}-reel-${idx}`;
  if (kind === "event") newBase = `${baseName}-event-${idx}`;

  const newName = `${newBase}${ext || ".bin"}`;
  try {
    return new File([file], newName, {
      type: file.type,
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        textAlign: "left",
        marginBottom: "3rem",
        background: "rgba(36, 17, 35, 0.22)",
        borderRadius: 10,
        padding: "2rem",
        color: COLOR.snow,
      }}
    >
      {children}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div
      style={{
        width: "100%",
        height: 8,
        borderRadius: 999,
        background: "rgba(255,255,255,0.18)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: 999,
          transition: "width .25s ease",
          background: `linear-gradient(90deg, ${COLOR.gold}, ${COLOR.brand})`,
        }}
      />
    </div>
  );
}

/* ---------- component ---------- */
export default function UpdateForm({ email }: { email: string }) {
  /* identity/basic state */
  const [alumniId, setAlumniId] = useState("");
  const [originalSlug, setOriginalSlug] = useState<string>(""); // NEW
  const [autoDetected, setAutoDetected] = useState(false);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const [profile, setProfile] = useState<Partial<AlumniProfile>>({
    slug: "",
    name: "",
    website: "",
    instagram: "",
    x: "",
    tiktok: "",
    threads: "",
    bluesky: "",
    linkedin: "",
    youtube: "",
    vimeo: "",
    facebook: "",
    linktree: "",
    publicEmail: "",
    artistStatement: "",
    headshotUrl: "",
    backgroundStyle: "kraft",
    datRoles: [],
    currentRole: "",
    isBiCoastal: false,
    secondLocation: "",
    identityTags: [],
    currentUpdateText: "",
    currentUpdateLink: "",
    currentUpdateExpiresAt: "",
    // Upcoming Event (+ description)
    ...( {
      upcomingEventTitle: "",
      upcomingEventLink: "",
      upcomingEventDate: "",
      upcomingEventExpiresAt: "",
      upcomingEventDescription: "",
    } as any ),
    story: {
      title: "",
      program: "",
      programCountry: "",
      years: "",
      location: "",
      partners: "",
      mediaUrl: "",
      shortStory: "",
      url: "",
      quote: "",
      quoteAuthor: "",
    },
    support: { bug: "", feature: "", assistance: "" },
  });

  /* drafts */
  const basicsDraft = useDraft({
    key: alumniId ? `draft:${alumniId}:basics` : "draft:__none__:basics",
    initial: {
      name,
      location,
      artistStatement: profile.artistStatement ?? "",
      headshotUrl: profile.headshotUrl ?? "",
      backgroundStyle: profile.backgroundStyle ?? "kraft",
      identityTags: profile.identityTags ?? [],
      isBiCoastal: profile.isBiCoastal ?? false,
      secondLocation: profile.secondLocation ?? "",
    },
    enabled: !!alumniId,
  });

  const contactDraft = useDraft({
    key: alumniId ? `draft:${alumniId}:contact` : "draft:__none__:contact",
    initial: {
      website: "",
      instagram: "",
      x: "",
      tiktok: "",
      threads: "",
      bluesky: "",
      linkedin: "",
      youtube: "",
      vimeo: "",
      facebook: "",
      linktree: "",
      publicEmail: "",
    },
    enabled: !!alumniId,
  });

  /* media selections */
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [albumFiles, setAlbumFiles] = useState<File[]>([]);
  const [reelFiles, setReelFiles] = useState<File[]>([]);
  const [eventFiles, setEventFiles] = useState<File[]>([]);
  const [albumName, setAlbumName] = useState<string>(""); // NEW

  /* progress + failures */
  const [progress, setProgress] = useState<{
    headshot: { uploaded: number; total: number; pct: number };
    album: { uploaded: number; total: number; pct: number };
    reel: { uploaded: number; total: number; pct: number };
    event: { uploaded: number; total: number; pct: number };
  }>({
    headshot: { uploaded: 0, total: 0, pct: 0 },
    album: { uploaded: 0, total: 0, pct: 0 },
    reel: { uploaded: 0, total: 0, pct: 0 },
    event: { uploaded: 0, total: 0, pct: 0 },
  });

  const [failed, setFailed] = useState<Record<UploadKind, string[]>>({
    headshot: [],
    album: [],
    reel: [],
    event: [],
  });

  /* picker / status */
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerKind, setPickerKind] =
    useState<"headshot" | "album" | "reel" | "event">("headshot");

  const [status, setStatus] = useState<string>("");
  const [assets, setAssets] = useState<PointerAssets>({});

  /* UX */
  const [loading, setLoading] = useState(false);
  const [toast, setToast] =
    useState<{ msg: string; type: "success" | "error" } | null>(null);
  const saveBtnRef = useRef<HTMLButtonElement | null>(null);

  /* uploader */
  const uploaderRef = useRef<ReturnType<typeof createUploader> | null>(null);
  const queueEmptyResolver = useRef<(() => void) | null>(null);

  /* MEDIA HUB: make whole dashed zone clickable */
  const hubRef = useRef<HTMLDivElement | null>(null);

  /* socials: choose visible + primary */
  const ALL_SOCIALS = [
    "instagram",
    "x",
    "tiktok",
    "threads",
    "bluesky",
    "linkedin",
    "youtube",
    "vimeo",
    "facebook",
  ] as const;
  const [visibleSocials, setVisibleSocials] = useState<string[]>([
    "instagram",
    "x",
    "linkedin",
  ]);
  const [primarySocial, setPrimarySocial] = useState<string>("instagram");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2600);
  };

  const openPicker = (kind: "headshot" | "album" | "reel" | "event") => {
    if (!alumniId) {
      showToast("Please enter your profile slug (alumniId) first.", "error");
      return;
    }
    setPickerKind(kind);
    setPickerOpen(true);
  };

  /* effects */
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(
          `/api/alumni/lookup?email=${encodeURIComponent(email)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const j = await res.json();
        if (j?.alumniId) {
          setAlumniId(j.alumniId);
          setOriginalSlug(j.alumniId); // NEW
          setProfile((p) => ({ ...p, slug: j.alumniId }));
          setAutoDetected(true);
        }
        if (j?.status) setStatus(String(j.status));
        if (j?.assets) setAssets(j.assets as PointerAssets);
      } catch {
        /* ignore */
      }
    };
    if (email) run();
  }, [email]);

  // Auto-sync slug to professional name unless user explicitly unlocks slug edit
  useEffect(() => {
    if (!(profile as any).__forceSlugEdit) {
      const next = slugify(name || (profile.name as string) || alumniId);
      if (next && next !== alumniId) {
        setAlumniId(next);
        setProfile((p) => ({ ...p, slug: next }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  // Uploader lifecycle
  useEffect(() => {
    uploaderRef.current = createUploader({
      endpoint: "/api/upload",
      maxRetries: 2,
      backoffBaseMs: 600,
      concurrent: 1,
      callbacks: {
        onKindProgress: (kind, bucket) => {
          setProgress((p) => ({ ...p, [kind]: bucket }));
        },
        onFileComplete: (_task, resp) => {
          const json = resp || {};
          if (json?.status) setStatus(String(json.status));
          if (json?.updated) {
            const key = Object.keys(json.updated)[0] as keyof PointerAssets;
            const val = json.updated[key];
            setAssets((a) => ({ ...a, [key]: val }));
          }
        },
        onFileError: (task, err) => {
          setFailed((f) => {
            const list = new Set(f[task.kind]);
            list.add(task.id);
            return { ...f, [task.kind]: Array.from(list) };
          });
          showToast(
            err?.message || `Failed uploading ${task.file.name}`,
            "error"
          );
        },
        onQueueEmpty: () => {
          if (queueEmptyResolver.current) {
            const resolve = queueEmptyResolver.current;
            queueEmptyResolver.current = null;
            resolve();
          }
        },
      },
    });
    return () => {
      uploaderRef.current?.cancelAll();
      uploaderRef.current = null;
    };
  }, []);

  // Make whole dotted zone clickable to open Finder
  useEffect(() => {
    const root = hubRef.current;
    if (!root) return;
    const handleClick = (e: MouseEvent) => {
      const zone = (e.target as HTMLElement)?.closest?.(
        "[data-mediahub] .dropzone, [data-mediahub] .drop-area, [data-mediahub] .dropzone-root"
      );
      if (!zone) return;
      const input = root.querySelector<HTMLInputElement>("input[type=file]");
      input?.click();
    };
    root.addEventListener("click", handleClick);
    return () => root.removeEventListener("click", handleClick);
  }, []);

  /* drafts hydration when profile bits change */
  useEffect(() => {
    basicsDraft.setValue({
      name,
      location,
      artistStatement: profile.artistStatement ?? "",
      headshotUrl: profile.headshotUrl ?? "",
      backgroundStyle: profile.backgroundStyle ?? "kraft",
      identityTags: profile.identityTags ?? [],
      isBiCoastal: profile.isBiCoastal ?? false,
      secondLocation: profile.secondLocation ?? "",
    } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    name,
    location,
    profile.artistStatement,
    profile.headshotUrl,
    profile.backgroundStyle,
    profile.identityTags,
    profile.isBiCoastal,
    profile.secondLocation,
  ]);

  useEffect(() => {
    contactDraft.setValue({
      website: profile.website ?? "",
      instagram: profile.instagram ?? "",
      x: profile.x ?? "",
      tiktok: profile.tiktok ?? "",
      threads: profile.threads ?? "",
      bluesky: profile.bluesky ?? "",
      linkedin: profile.linkedin ?? "",
      youtube: profile.youtube ?? "",
      vimeo: profile.vimeo ?? "",
      facebook: profile.facebook ?? "",
      linktree: profile.linktree ?? "",
      publicEmail: profile.publicEmail ?? "",
    } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profile.website,
    profile.instagram,
    profile.x,
    profile.tiktok,
    profile.threads,
    profile.bluesky,
    profile.linkedin,
    profile.youtube,
    profile.vimeo,
    profile.facebook,
    profile.linktree,
    profile.publicEmail,
  ]);

  /* helpers */
  const byKeys = (keys: string[]) =>
    PROFILE_FIELDS.filter(
      (f) => keys.includes((f.path || (f.key as string)) as string)
    );

  const renderFields = (keys: string[]) => (
    <FieldRenderer
      value={profile as AlumniProfile}
      onChange={(next) => setProfile(next as Partial<AlumniProfile>)}
      fields={byKeys(keys)}
    />
  );

  const contactKeys = PROFILE_GROUPS["Contact"] ?? [];

  async function rehydrate() {
    if (!alumniId) return;
    try {
      const r = await fetch(
        `/api/alumni/lookup?alumniId=${encodeURIComponent(alumniId)}`,
        { cache: "no-store" }
      );
      if (!r.ok) return;
      const j = await r.json();
      if (j?.status) setStatus(String(j.status));
      if (j?.assets) setAssets(j.assets as PointerAssets);
    } catch {
      /* ignore */
    }
  }

  const totalBytes = (files: File[]) =>
    files.reduce((s, f) => s + (f?.size ?? 0), 0);

  const prettyMB = (n?: number | null) => {
    const mb = Number(n ?? 0) / 1_000_000;
    return Math.round(mb * 10) / 10;
  };

  /* per-category save + uploads (with album-aware rename) */
  async function saveCategory({
    tag,
    fieldKeys = [],
    uploadKinds = [],
    afterSave,
  }: {
    tag: string;
    fieldKeys?: string[];
    uploadKinds?: UploadKind[];
    afterSave?: () => void;
  }) {
    if (!alumniId) {
      showToast("Please provide your alumni ID (slug).", "error");
      return;
    }

    setLoading(true);
    setFailed({ headshot: [], album: [], reel: [], event: [] });

    // progress totals for requested kinds only
    setProgress((p) => ({
      headshot: uploadKinds.includes("headshot")
        ? { uploaded: 0, total: headshotFile?.size ?? 0, pct: 0 }
        : p.headshot,
      album: uploadKinds.includes("album")
        ? { uploaded: 0, total: totalBytes(albumFiles), pct: 0 }
        : p.album,
      reel: uploadKinds.includes("reel")
        ? { uploaded: 0, total: totalBytes(reelFiles), pct: 0 }
        : p.reel,
      event: uploadKinds.includes("event")
        ? { uploaded: 0, total: totalBytes(eventFiles), pct: 0 }
        : p.event,
    }));

    try {
      const uploader = uploaderRef.current!;
      const baseFields: Record<string, string> = { alumniId };
      if (albumName) baseFields.albumName = albumName; // give server the collection name
      const humanBase = slugify(
        (name || (profile.name as string) || alumniId || "alumni").trim()
      );

      // queue uploads with renamed files
      if (uploadKinds.includes("headshot") && headshotFile) {
        const f = renameForKind(headshotFile, "headshot", humanBase);
        uploader.enqueue({
          kind: "headshot",
          files: [f],
          formFields: baseFields,
        });
      }
      if (uploadKinds.includes("album") && albumFiles.length) {
        const files = albumFiles.map((f, i) =>
          renameForKind(f, "album", humanBase, i + 1, albumName)
        );
        uploader.enqueue({ kind: "album", files, formFields: baseFields });
      }
      if (uploadKinds.includes("reel") && reelFiles.length) {
        const files = reelFiles.map((f, i) =>
          renameForKind(f, "reel", humanBase, i + 1)
        );
        uploader.enqueue({ kind: "reel", files, formFields: baseFields });
      }
      if (uploadKinds.includes("event") && eventFiles.length) {
        const files = eventFiles.map((f, i) =>
          renameForKind(f, "event", humanBase, i + 1)
        );
        uploader.enqueue({ kind: "event", files, formFields: baseFields });
      }

      const hasUploads =
        (uploadKinds.includes("headshot") && !!headshotFile) ||
        (uploadKinds.includes("album") && albumFiles.length > 0) ||
        (uploadKinds.includes("reel") && reelFiles.length > 0) ||
        (uploadKinds.includes("event") && eventFiles.length > 0);

      if (hasUploads) {
        const waitForQueue = new Promise<void>((resolve) => {
          queueEmptyResolver.current = resolve;
        });
        uploader.start();
        await waitForQueue;
      }

      // CONTACT: clear hidden socials & set primary
      if (tag === "Contact") {
        const next = { ...(profile as any) };
        const ALL = ALL_SOCIALS as unknown as string[];
        ALL.forEach((k) => {
          if (!visibleSocials.includes(k)) next[k] = "";
        });
        if (
          visibleSocials.length &&
          primarySocial &&
          visibleSocials.includes(primarySocial)
        ) {
          (next as any).primarySocial = primarySocial;
        }
        setProfile(next);
      }

      // 2) Partial profile save
      const merged: AlumniProfile = normalizeProfile({
        ...(profile as AlumniProfile),
        name: name || (profile.name as string) || "",
        slug: alumniId || (profile.slug as string) || "",
        location: location || (profile.location as string) || "",
      });

      // Enforce Current Update starts with "I am "
      if (fieldKeys.includes("currentUpdateText")) {
        const t = merged.currentUpdateText || "";
        if (!/^\s*i\s+am\b/i.test(t)) {
          merged.currentUpdateText = `I am ${t}`.replace(/\s+/g, " ").trim();
        }
      }

      const errs = validateProfile(merged);
      const filteredErrs = Object.fromEntries(
        Object.entries(errs).filter(([k]) => fieldKeys.includes(k))
      );
      if (Object.keys(filteredErrs).length) {
        const firstKey = Object.keys(filteredErrs)[0];
        const firstMsg =
          (filteredErrs as any)[firstKey] || "Please fix the highlighted fields.";
        showToast(firstMsg, "error");
        setLoading(false);
        return;
      }

      const original = { slug: originalSlug || alumniId } as AlumniProfile;
      const changesAll = buildLiveChanges(original, merged);
      const changes = Object.fromEntries(
        Object.entries(changesAll).filter(([k]) => fieldKeys.includes(k))
      );

      if (Object.keys(changes).length > 0) {
        const res = await fetch("/api/alumni/save", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            alumniId, // possibly the NEW slug
            oldSlug: originalSlug !== alumniId ? originalSlug : undefined, // NEW
            changes,
            submittedByEmail: email || "",
            note: `partial save (${tag}) via alumni form`,
          }),
        });
        const j = await res.json();
        if (!res.ok || !j.ok) throw new Error(j?.error || "Save failed");
        if (originalSlug !== alumniId) setOriginalSlug(alumniId); // move forward
      }

      // clear staged files if any
      if (uploadKinds.includes("headshot")) setHeadshotFile(null);
      if (uploadKinds.includes("album")) setAlbumFiles([]);
      if (uploadKinds.includes("reel")) setReelFiles([]);
      if (uploadKinds.includes("event")) setEventFiles([]);

      afterSave?.();

      showToast(`Category saved — profile updated.`);
      await rehydrate();
    } catch (err: any) {
      showToast(err?.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  }

  /* pause/resume/cancel + failed retry */
  const Controls = ({
    kind,
    disabled,
  }: {
    kind: UploadKind;
    disabled?: boolean;
  }) => (
    <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
      <button
        type="button"
        disabled={!!disabled}
        onClick={() => uploaderRef.current?.pauseKind(kind)}
        style={datButtonGhost}
        className="dat-btn-ghost"
      >
        Pause
      </button>
      <button
        type="button"
        disabled={!!disabled}
        onClick={() => uploaderRef.current?.resumeKind(kind, { alumniId })}
        style={datButtonGhost}
        className="dat-btn-ghost"
      >
        Resume
      </button>
      <button
        type="button"
        disabled={!!disabled}
        onClick={() => uploaderRef.current?.cancelKind(kind)}
        style={{
          ...datButtonGhost,
          border: "1px solid rgba(242,51,89,0.7)",
          background: "rgba(242,51,89,0.15)",
        }}
        className="dat-btn-ghost"
      >
        Cancel
      </button>
    </div>
  );

  const FailedList = ({ kind }: { kind: UploadKind }) => {
    const ids = failed[kind];
    if (!ids.length) return null;
    const tasks: UploadTask[] =
      uploaderRef.current?.getTasks().filter((t) => ids.includes(t.id)) ??
      [];

    const retryOne = (id: string) => {
      const t = uploaderRef.current?.getTaskById(id);
      if (!t) return;
      const ff = { alumniId };
      uploaderRef.current?.resumeKind(kind, ff);
      uploaderRef.current?.enqueue({ kind, files: [t.file], formFields: ff });
      setFailed((f) => ({ ...f, [kind]: f[kind].filter((x) => x !== id) }));
      uploaderRef.current?.start();
    };

    const retryAll = () => {
      const ff = { alumniId };
      const files = tasks.map((t) => t.file);
      if (!files.length) return;
      uploaderRef.current?.resumeKind(kind, ff);
      uploaderRef.current?.enqueue({ kind, files, formFields: ff });
      setFailed((f) => ({ ...f, [kind]: [] }));
      uploaderRef.current?.start();
    };

    return (
      <div
        style={{
          marginTop: 12,
          background: "rgba(242,51,89,0.12)",
          borderRadius: 8,
          padding: 12,
          color: COLOR.snow,
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: 600 }}>
          Some files failed to upload:
        </div>
        <ul style={{ marginLeft: 18, listStyle: "disc" }}>
          {tasks.map((t) => (
            <li key={t.id} style={{ margin: "6px 0" }}>
              {t.file.name} ({prettyMB(t.file.size)} MB)
              <button
                type="button"
                onClick={() => retryOne(t.id)}
                style={{ ...datButtonGhost, padding: "4px 8px", marginLeft: 10 }}
                className="dat-btn-ghost"
              >
                Retry
              </button>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            onClick={retryAll}
            style={datButtonGhost}
            className="dat-btn-ghost"
          >
            Retry all failed
          </button>
        </div>
      </div>
    );
  };

  /* render */
  return (
    <div className="alumni-update">
      {/* HERO */}
      <div
        style={{
          position: "relative",
          height: "95vh",
          overflow: "hidden",
          zIndex: 0,
          boxShadow: "0 0 33px rgba(0, 0, 0, 0.5)",
        }}
      >
        <Image
          src={"/images/alumni-hero.jpg"}
          alt="Alumni Update Hero"
          fill
          priority
          className="object-cover object-center"
          style={{ zIndex: -1 }}
        />
        <div style={{ position: "absolute", bottom: "1rem", right: "5%" }}>
          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(3rem, 7vw, 8rem)",
              color: "#f2f2f2",
              textTransform: "uppercase",
              textShadow: "0 8px 20px rgba(0,0,0,0.8)",
              margin: 0,
            }}
          >
            Update Your Profile
          </h1>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "1.8rem",
              color: "#f2f2f2",
              opacity: 0.7,
              margin: 0,
              textShadow: "0 4px 12px rgba(0,0,0,0.9)",
              textAlign: "right",
            }}
          >
            Signed in as <strong>{email}</strong>
          </p>
        </div>
      </div>

      {/* MAIN */}
      <main
        style={{
          marginTop: "-5rem",

          padding: "5.5rem 0 4rem", // extra top/bottom buffer
          position: "relative",
          opacity: 0.9,
          zIndex: 10,
        }}
      >
        <div style={{ width: "90%", margin: "0 auto" }}>
          {/* Media Hub */}
          <div data-mediahub ref={hubRef} style={{ margin: "2.5rem 0 3.25rem" }}>
            <MediaHub
              // files
              headshotFile={headshotFile}
              setHeadshotFile={setHeadshotFile}
              albumFiles={albumFiles}
              setAlbumFiles={setAlbumFiles}
              reelFiles={reelFiles}
              setReelFiles={setReelFiles}
              eventFiles={eventFiles}
              setEventFiles={setEventFiles}
              // album/collection name (NEW)
              albumName={albumName}
              setAlbumName={setAlbumName}
              // actions
              uploading={loading}
              onUploadAll={() =>
                saveCategory({
                  tag: "Media (All)",
                  fieldKeys: [],
                  uploadKinds: ["headshot", "album", "reel", "event"],
                })
              }
              onOpenPicker={(k: "headshot" | "album" | "reel" | "event") =>
                openPicker(k)
              }
              onFeature={(
                kind: "headshot" | "album" | "reel" | "event",
                _idx: number
              ) => openPicker(kind)}
            />

            {/* Quick alternate: Headshot via URL */}
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                className="dat-btn-ghost"
                style={datButtonGhost}
                onClick={() => {
                  const url = prompt("Paste a direct image URL for your headshot");
                  if (url) setProfile((p) => ({ ...p, headshotUrl: url }));
                }}
              >
                Use image URL instead
              </button>
            </div>

            {/* Composite progress per kind */}
            {(progress.album.total > 0 ||
              progress.reel.total > 0 ||
              progress.event.total > 0 ||
              progress.headshot.total > 0) && (
              <div style={{ marginTop: 18 }}>
                {(["headshot", "album", "reel", "event"] as UploadKind[]).map(
                  (k) =>
                    progress[k].total > 0 ? (
                      <div key={k} style={{ marginBottom: 12 }}>
                        <div
                          style={{
                            fontSize: 12,
                            opacity: 0.9,
                            marginBottom: 6,
                          }}
                        >
                          {k[0].toUpperCase() + k.slice(1)} uploads{" "}
                          {progress[k].pct}% &nbsp;({prettyMB(progress[k].uploaded)} /{" "}
                          {prettyMB(progress[k].total)} MB)
                        </div>
                        <ProgressBar value={progress[k].pct} />
                        <Controls kind={k} disabled={loading} />
                        <FailedList kind={k} />
                      </div>
                    ) : null
                )}
              </div>
            )}
          </div>

          {/* ====== 1) PROFILE BASICS ====== */}
          <Collapsible title="Profile Basics" defaultOpen>
            <Section>
              <span style={subheadChipStyle} className="subhead-chip">
                Profile details
              </span>
              <p style={explainStyle} className="explain">
                Your public name, where you’re based, identity tags, and aesthetic basics.
              </p>

              {/* Slug (alumni id), Name, Location */}
              <div>
                <label
                  htmlFor="alumniId"
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: 13,
                    color: COLOR.snow,
                    opacity: 0.9,
                  }}
                >
                  Profile slug
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                  }}
                >
                  <input
                    id="alumniId"
                    value={alumniId}
                    onChange={(e) => {
                      const v = e.target.value.trim().toLowerCase();
                      setAlumniId(v);
                      setProfile((p) => ({ ...p, slug: v }));
                      setAutoDetected(false);
                    }}
                    required
                    style={{
                      ...inputStyle,
                      opacity: (profile as any).__forceSlugEdit ? 1 : 0.65,
                    }}
                    placeholder="auto-generated from your professional name"
                    disabled={!(profile as any).__forceSlugEdit}
                  />
                  <button
                    type="button"
                    className="dat-btn-ghost"
                    style={datButtonGhost}
                    onClick={() =>
                      setProfile((p) => ({
                        ...(p as any),
                        __forceSlugEdit: !(p as any).__forceSlugEdit,
                      }))
                    }
                    title="Only use if your professional name has changed"
                  >
                    {(profile as any).__forceSlugEdit
                      ? "Lock slug"
                      : "My professional name changed"}
                  </button>
                </div>
                <p style={{ ...explainStyle, marginTop: 6 }} className="explain">
                  Your slug mirrors your professional name. Unlock only if that name has changed.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 24,
                  marginTop: 12,
                }}
              >
                <div>
                  <label
                    htmlFor="name"
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontSize: 13,
                      color: COLOR.snow,
                      opacity: 0.9,
                    }}
                  >
                    Professional name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={inputStyle}
                    placeholder="e.g. Isabel Martínez"
                  />
                </div>

                <div>
                  <label
                    htmlFor="location"
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontSize: 13,
                      color: COLOR.snow,
                      opacity: 0.9,
                    }}
                  >
                    Base
                  </label>
                  <input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={inputStyle}
                    placeholder="e.g. NYC"
                  />
                </div>
              </div>

              {/* Identity + bi-coastal */}
              <div style={{ marginTop: 18 }}>
                {renderFields(["identityTags", "isBiCoastal"])}
                {profile.isBiCoastal ? renderFields(["secondLocation"]) : null}
                <p style={{ ...explainStyle, marginTop: 8 }}>
                  <strong>Identity tags</strong> help people discover your work.
                </p>
              </div>

              {/* Background swatches */}
              <div style={{ marginTop: 18 }}>
                <BackgroundSwatches
                  value={String(profile.backgroundStyle || "kraft")}
                  onChange={(next) =>
                    setProfile((p) => ({
                      ...(p as any),
                      backgroundStyle: next,
                    }))
                  }
                />
              </div>

              {/* Headshot URL + artist statement */}
              <div style={{ marginTop: 18 }}>
                {renderFields(["headshotUrl", "artistStatement"])}
              </div>

              {/* Save basics */}
              <div style={{ marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() =>
                    saveCategory({
                      tag: "Profile Basics",
                      fieldKeys: [
                        "slug",
                        "name",
                        "location",
                        "isBiCoastal",
                        "secondLocation",
                        "identityTags",
                        "backgroundStyle",
                        "headshotUrl",
                        "artistStatement",
                      ],
                      uploadKinds: [],
                      afterSave: () => basicsDraft.clearDraft(),
                    })
                  }
                  style={datButton}
                  className="dat-btn"
                >
                  Save Profile Basics
                </button>
              </div>
            </Section>
          </Collapsible>

          {/* ====== 2) ROLES ====== */}
          <Collapsible title="Roles" defaultOpen={false}>
            <Section>
              <span style={subheadChipStyle} className="subhead-chip">
                How you identify professionally
              </span>
              <p style={explainStyle} className="explain">
                Add all roles you’ve held with DAT and the role you use today.
              </p>
              {renderFields(
                PROFILE_GROUPS["Roles"] ?? ["datRoles", "currentRole"]
              )}
              <div style={{ marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() =>
                    saveCategory({
                      tag: "Roles",
                      fieldKeys: ["datRoles", "currentRole"],
                    })
                  }
                  style={datButton}
                  className="dat-btn"
                >
                  Save Roles
                </button>
              </div>
            </Section>
          </Collapsible>

          {/* ====== 3) CONTACT ====== */}
          <Collapsible title="Contact" defaultOpen={false}>
            <Section>
              <span style={subheadChipStyle} className="subhead-chip">
                Ways to reach you
              </span>
              <p style={explainStyle} className="explain">
                Share links and handles for your site and socials. Handles can be pasted as
                <code style={{ margin: "0 4px" }}>@handle</code> or full URLs; we’ll normalize them.
              </p>

              {/* Social visibility + primary */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                {ALL_SOCIALS.map((k) => {
                  const on = visibleSocials.includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      className="dat-btn-ghost"
                      style={{ ...(datButtonGhost as any), opacity: on ? 1 : 0.55 }}
                      onClick={() =>
                        setVisibleSocials((v) =>
                          on ? v.filter((x) => x !== k) : [...v, k]
                        )
                      }
                    >
                      {on ? "✓ " : ""} {k}
                    </button>
                  );
                })}
                <select
                  value={primarySocial}
                  onChange={(e) => setPrimarySocial(e.target.value)}
                  className="dat-btn-ghost"
                  style={{ ...(datButtonGhost as any), padding: "10px 12px" }}
                  title="Primary social"
                >
                  {visibleSocials.map((k) => (
                    <option key={k} value={k}>
                      {k} (primary)
                    </option>
                  ))}
                </select>
              </div>

              <ContactFields
                value={profile as AlumniProfile}
                onChange={(next) => setProfile(next as Partial<AlumniProfile>)}
                fields={byKeys(contactKeys)}
              />
              <div style={{ marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() =>
                    saveCategory({
                      tag: "Contact",
                      fieldKeys: [
                        "website",
                        "instagram",
                        "x",
                        "tiktok",
                        "threads",
                        "bluesky",
                        "linkedin",
                        "youtube",
                        "vimeo",
                        "facebook",
                        "linktree",
                        "publicEmail",
                        "primarySocial",
                      ],
                      afterSave: () => contactDraft.clearDraft(),
                    })
                  }
                  style={datButton}
                  className="dat-btn"
                >
                  Save Contact
                </button>
              </div>
            </Section>
          </Collapsible>

          {/* ====== 4) CURRENT UPDATE ====== */}
          <Collapsible title="Current Update" defaultOpen={false}>
            <Section>
              <span style={subheadChipStyle} className="subhead-chip">
                What you’re up to now
              </span>
              <p style={explainStyle} className="explain">
                A one-liner in the first person that auto-archives after your expiration date. Add a link if there’s more to see.
              </p>

              {/* "I am ..." enforced UI */}
              <div style={{ display: "grid", gap: 12 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 4,
                    fontWeight: 700,
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "1.15rem",
                  }}
                >
                  Current line (first person)
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 12,
                      fontWeight: 700,
                      opacity: 0.95,
                    }}
                  >
                    I am
                  </span>
                  <input
                    style={{ ...inputStyle, paddingLeft: 56 }}
                    placeholder="writing a new solo show that opens in January."
                    value={(profile.currentUpdateText || "").replace(
                      /^\s*i\s+am\s+/i,
                      ""
                    )}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        currentUpdateText: `I am ${e.target.value}`
                          .replace(/\s+/g, " ")
                          .trim(),
                      }))
                    }
                  />
                </div>
                {renderFields(["currentUpdateLink", "currentUpdateExpiresAt"])}
              </div>

              <div style={{ marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() =>
                    saveCategory({
                      tag: "Current Update",
                      fieldKeys: [
                        "currentUpdateText",
                        "currentUpdateLink",
                        "currentUpdateExpiresAt",
                      ],
                    })
                  }
                  style={datButton}
                  className="dat-btn"
                >
                  Save Current Update
                </button>
              </div>
            </Section>
          </Collapsible>

          {/* ====== 5) UPCOMING EVENT ====== */}
          <Collapsible title="Upcoming Event" defaultOpen={false}>
            <Section>
              <span style={subheadChipStyle} className="subhead-chip">
                Promote an upcoming event
              </span>
              <p style={explainStyle} className="explain">
                Add a short headline, optional link, date, and description. You can also attach media—images, audio (podcasts), or video (trailers/teasers). When it expires, we’ll archive it.
              </p>

              <div
                style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontSize: 13,
                      color: COLOR.snow,
                      opacity: 0.9,
                    }}
                  >
                    Event title
                  </label>
                  <input
                    style={inputStyle}
                    value={(profile as any).upcomingEventTitle || ""}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...(p as any),
                        upcomingEventTitle: e.target.value,
                      }))
                    }
                    placeholder="Opening night for…"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontSize: 13,
                      color: COLOR.snow,
                      opacity: 0.9,
                    }}
                  >
                    Event link (optional)
                  </label>
                  <input
                    style={inputStyle}
                    value={(profile as any).upcomingEventLink || ""}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...(p as any),
                        upcomingEventLink: e.target.value,
                      }))
                    }
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontSize: 13,
                      color: COLOR.snow,
                      opacity: 0.9,
                    }}
                  >
                    Short description (optional)
                  </label>
                  <textarea
                    style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                    value={(profile as any).upcomingEventDescription || ""}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...(p as any),
                        upcomingEventDescription: e.target.value,
                      }))
                    }
                    placeholder="What is it? Why should folks come?"
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 16,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: 8,
                        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                        fontSize: 13,
                        color: COLOR.snow,
                        opacity: 0.9,
                      }}
                    >
                      Event date
                    </label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={(profile as any).upcomingEventDate || ""}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...(p as any),
                          upcomingEventDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: 8,
                        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                        fontSize: 13,
                        color: COLOR.snow,
                        opacity: 0.9,
                      }}
                    >
                      Expiration date (auto archive)
                    </label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={(profile as any).upcomingEventExpiresAt || ""}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...(p as any),
                          upcomingEventExpiresAt: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() =>
                    saveCategory({
                      tag: "Upcoming Event",
                      fieldKeys: [
                        "upcomingEventTitle",
                        "upcomingEventLink",
                        "upcomingEventDate",
                        "upcomingEventExpiresAt",
                        "upcomingEventDescription",
                      ],
                    })
                  }
                  style={datButton}
                  className="dat-btn"
                >
                  Save Upcoming Event
                </button>
              </div>
            </Section>
          </Collapsible>

          {/* ====== 6) STORY MAP ====== */}
          <Collapsible title="Add a Story to the Story Map" defaultOpen={false}>
            <Section>
              <span style={subheadChipStyle} className="subhead-chip">
                Story details
              </span>
              <p style={explainStyle} className="explain">
                Pin a moment from your DAT journey. Choose program, location, add partners, a short story,
                and an optional quote. Media links are archived for posterity.
              </p>
              {renderFields(
                PROFILE_GROUPS["Story Map"] ?? [
                  "story.title",
                  "story.program",
                  "story.programCountry",
                  "story.years",
                  "story.location",
                  "story.partners",
                  "story.mediaUrl",
                  "story.shortStory",
                  "story.url",
                  "story.quote",
                  "story.quoteAuthor",
                ]
              )}
              <div style={{ marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() =>
                    saveCategory({
                      tag: "Story",
                      fieldKeys: [], // stored to Story-Map sheet in your pipeline
                    })
                  }
                  style={datButton}
                  className="dat-btn"
                >
                  Save Story Details
                </button>
              </div>
            </Section>
          </Collapsible>

          {/* Hidden global submit (optional Save All) */}
          <form onSubmit={(e) => e.preventDefault()}>
            <button ref={saveBtnRef} type="submit" className="hidden">
              Save
            </button>
          </form>
        </div>
      </main>

      {/* Sticky Save Bar */}
      <SaveBar
        loading={loading}
        disabled={loading || !alumniId}
        onClick={() => {
          saveCategory({
            tag: "All (Basics + Roles + Contact + Updates + Upcoming Event)",
            fieldKeys: [
              "slug",
              "name",
              "location",
              "isBiCoastal",
              "secondLocation",
              "identityTags",
              "backgroundStyle",
              "headshotUrl",
              "artistStatement",
              "datRoles",
              "currentRole",
              "website",
              "instagram",
              "x",
              "tiktok",
              "threads",
              "bluesky",
              "linkedin",
              "youtube",
              "vimeo",
              "facebook",
              "linktree",
              "publicEmail",
              "primarySocial",
              "currentUpdateText",
              "currentUpdateLink",
              "currentUpdateExpiresAt",
              "upcomingEventTitle",
              "upcomingEventLink",
              "upcomingEventDate",
              "upcomingEventExpiresAt",
              "upcomingEventDescription",
            ],
            uploadKinds: [],
            afterSave: () => {
              basicsDraft.clearDraft();
              contactDraft.clearDraft();
            },
          });
        }}
      />

      {/* Media Picker */}
      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        alumniId={alumniId}
        kind={pickerKind}
        title={`Choose ${pickerKind}`}
        onFeatured={(fileId?: string) => {
          if (fileId) {
            const key = POINTER_MAP[pickerKind];
            setAssets((a) => ({ ...a, [key]: fileId }));
          }
          showToast("Featured media updated.");
        }}
      />

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ====== Global, scoped tidy CSS ====== */}
      <style jsx global>{`
        /* Remove old borders/outlines */
        .alumni-update * { border-color: transparent !important; }
        .alumni-update hr,
        .alumni-update fieldset,
        .alumni-update .divider,
        .alumni-update .card,
        .alumni-update .panel {
          border: none !important;
          box-shadow: none !important;
          background-clip: padding-box;
        }

        .alumni-update input,
        .alumni-update textarea,
        .alumni-update select {
          border: none !important;
          outline: none !important;
          background: #fff;
          color: #111;
          border-radius: 10px;
          padding: 12px 14px;
          box-shadow: 0 6px 18px rgba(0,0,0,0.12);
          font-family: var(--font-dm-sans), system-ui, sans-serif;        }
        .alumni-update input:focus,
        .alumni-update textarea:focus,
        .alumni-update select:focus {
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(217,169,25,0.25), 0 6px 18px rgba(0,0,0,0.14);
        }

        .alumni-update label,
        .alumni-update .explain,
        .alumni-update p,
        .alumni-update .helper {
          font-family: var(--font-dm-sans), system-ui, sans-serif;        }
        .alumni-update .subhead-chip {
          font-family: var(--font-space-grotesk), system-ui, sans-serif;          font-size: 2rem;
          font-weight: 600;
          color: #D9A919;
          display: inline-block;
          margin: 0 0 1rem;
          background-color: #241123;
          opacity: 0.7;
          padding: 0.1em 0.6em;
          border-radius: 0.35em;
          text-decoration: none;
        }
        .alumni-update .explain { font-size: 0.98rem; opacity: 0.9; }

        /* Bigger background swatches */
        .alumni-update .background-swatches .swatch,
        .alumni-update [data-swatch] {
          width: 52px !important;
          height: 36px !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18) !important;
        }
        .alumni-update .background-swatches .label {
          font-size: 1rem !important;
          padding: 8px 12px !important;
        }

        /* MediaHub: taller drop area + modern rail */
        [data-mediahub] .dropzone,
        [data-mediahub] .drop-area,
        [data-mediahub] .dz,
        [data-mediahub] .dropzone-root {
          min-height: 190px !important;
          border-radius: 16px !important;
          border: 2px dashed rgba(255,255,255,0.55) !important;
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)) !important;
          backdrop-filter: blur(2px);
          cursor: pointer;
        }
        [data-mediahub] .stage,
        [data-mediahub] .staged,
        [data-mediahub] .rail {
          display: grid !important;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important;
          gap: 14px !important;
          margin-top: 16px;
        }
        [data-mediahub] .tile,
        [data-mediahub] .thumb {
          border-radius: 14px !important;
          overflow: hidden !important;
          box-shadow: 0 12px 28px rgba(0,0,0,0.24) !important;
          transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
        }
        [data-mediahub] .tile:hover,
        [data-mediahub] .thumb:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 16px 36px rgba(0,0,0,0.32) !important;
        }
        [data-mediahub] .tile .meta,
        [data-mediahub] .thumb .meta {
          position: absolute;
          left: 8px; right: 8px; bottom: 8px;
          font-family: var(--font-dm-sans), system-ui, sans-serif;          font-size: 12px;
          padding: 6px 8px;
          border-radius: 8px;
          background: rgba(0,0,0,0.45);
          color: #fff;
        }

        /* DAT buttons + hover */
        .dat-btn,
        .dat-btn-ghost { transition: transform .08s ease, box-shadow .2s ease, opacity .2s ease; }
        .dat-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 26px rgba(0,0,0,0.30); }
        .dat-btn:active { transform: translateY(0); box-shadow: 0 6px 18px rgba(0,0,0,0.22); }
        .dat-btn-ghost:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.55); }

        /* Subtle hover for all interactive controls */
        .alumni-update button:hover,
        .alumni-update a:hover,
        .alumni-update select:hover,
        .alumni-update [role="button"]:hover {
          filter: brightness(1.02);
        }
      `}</style>
    </div>
  );
}
