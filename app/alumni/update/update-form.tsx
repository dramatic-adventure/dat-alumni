"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";

import ProfileStudio, {
  Field,
  Row,
  ghostButton as studioGhostButton,
} from "@/components/alumni/update/ProfileStudio";
import Dropzone from "@/components/media/Dropzone";
import MediaPickerModal from "@/components/media/MediaPickerModal";
import {
  normalizeProfile,
  validateProfile,
  buildLiveChanges,
} from "@/components/alumni/formLogic";
import { PROFILE_FIELDS, PROFILE_GROUPS } from "@/components/alumni/fields";
import type { AlumniProfile } from "@/schemas";

import SaveBar from "@/components/alumni/update/SaveBar";
import Toast from "@/components/alumni/update/Toast";

import FieldRenderer from "@/components/alumni/FieldRenderer";
import BackgroundSwatches from "@/components/alumni/update/BackgroundSwatches";

import { createUploader, type UploadKind, type UploadTask } from "@/lib/uploader";
import { useDraft } from "@/lib/useDraft";

import UpdateComposer from "@/components/alumni/UpdateComposer";
import CommunityUpdateLine from "@/components/alumni/update/CommunityUpdateLine";

const SHOW_LEGACY_SECTIONS = false; // flip to false when Studio is complete

/* ====== Aesthetic constants ====== */
const COLOR = {
  ink: "#241123",
  brand: "#6C00AF",
  gold: "#D9A919",
  teal: "#2493A9",
  red: "#F23359",
  snow: "#F2F2F2",
};

const subheadChipStyle: CSSProperties = {
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

const explainStyleLocal: CSSProperties = {
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: 15,
  lineHeight: 1.55,
  color: COLOR.snow,
  opacity: 0.95,
  margin: "0 0 14px",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 8,
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: 13,
  color: COLOR.snow,
  opacity: 0.9,
};

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: 10,
  padding: "12px 14px",
  outline: "none",
  border: "none",
  background: "#f2f2f2",
  color: "#241123",
  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
};

const inputLockedStyle: CSSProperties = {
  ...inputStyle,
  opacity: 0.65,
  cursor: "not-allowed",
};

const datButtonLocal: CSSProperties = {
  borderRadius: 14,
  padding: "12px 16px",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 500,
  fontSize: "0.9rem",
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  background: COLOR.teal,
  color: COLOR.snow,
  border: "1px solid rgba(0,0,0,0.22)",
  boxShadow: "0 10px 26px rgba(0,0,0,0.22)",
  cursor: "pointer",
  transform: "translateZ(0)",
};


const datButtonGhost: CSSProperties = {
  borderRadius: 14,
  padding: "10px 14px",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 700,
  letterSpacing: "0.03em",
  background: "transparent",
  color: "#f2f2f2",
  border: "1px solid rgba(255,255,255,0.65)",
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

const POINTER_MAP: Record<"headshot" | "album" | "reel" | "event", keyof PointerAssets> =
  {
    headshot: "currentHeadshotId",
    album: "featuredAlbumId",
    reel: "featuredReelId",
    event: "featuredEventId",
  };

// “Isabel Martínez” -> “isabel-martinez”
function slugify(s: string) {
  return (s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
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

  if (kind === "headshot") {
    const stamp = Date.now(); // or crypto.randomUUID()
    newBase = `${baseName}-headshot-${stamp}`;
  }

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

function Section({ children }: { children?: ReactNode }) {
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

// ------------------------------------------------------------
// Module definitions + Live-key filtering (single source of truth)
// ------------------------------------------------------------
type ModuleKey =
  | "Basics"
  | "Identity"
  | "Roles"
  | "Contact"
  | "CurrentUpdate"
  | "StoryMap"
  | "UpcomingEvent"
  | "TechSupport";

const LIVE_KEYS = new Set<string>([
  "name",
  "slug",
  "location",
  "isBiCoastal",
  "secondLocation",
  "backgroundStyle",
  "bioShort",
  "bioLong",
  "pronouns",
  "roles",
  "identityTags",
  "languages",
  "currentWork",
  "website",
  "instagram",
  "x",
  "tiktok",
  "threads",
  "bluesky",
  "linkedin",
  "primarySocial",
  "youtube",
  "vimeo",
  "imdb",
  "facebook",
  "linktree",
  "publicEmail",
  "spotlight",
  "programs",
  "tags",
  "statusFlags",
  "currentHeadshotUrl",
  "currentUpdateText",
  "currentUpdateLink",
  "currentUpdateExpiresAt",
  "upcomingEventTitle",
  "upcomingEventLink",
  "upcomingEventDate",
  "upcomingEventExpiresAt",
  "upcomingEventDescription",
  "storyTitle",
  "storyProgram",
  "storyLocationName",
  "storyYears",
  "storyPartners",
  "storyShortStory",
  "storyQuote",
  "storyQuoteAuthor",
  "storyMediaUrl",
  "storyMoreInfoUrl",
  "storyCountry",
  "showOnMap",
  "supportBug",
  "supportFeature",
  "supportAssistance",
]);

function keysForSaving(keys: string[]) {
  return keys.filter((k) => LIVE_KEYS.has(String(k)));
}

const MODULES: Record<ModuleKey, { fieldKeys: string[]; uploadKinds: UploadKind[] }> = {
  Basics: {
    fieldKeys: keysForSaving([
      "slug",
      "name",
      "location",
      "isBiCoastal",
      "secondLocation",
      "backgroundStyle",
      "currentHeadshotUrl",
      "bioLong",
      "currentWork",
      "upcomingEventTitle",
      "upcomingEventLink",
      "upcomingEventDate",
      "upcomingEventExpiresAt",
      "upcomingEventDescription",
    ]),
    uploadKinds: [],
  },

  Identity: {
    fieldKeys: keysForSaving(["pronouns", "identityTags", "languages"]),
    uploadKinds: [],
  },

  Roles: {
    fieldKeys: keysForSaving(["roles"]),
    uploadKinds: [],
  },

  Contact: {
    fieldKeys: keysForSaving([
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
      "imdb",
      // primarySocial handled by Contact save logic
    ]),
    uploadKinds: [],
  },

  CurrentUpdate: {
    fieldKeys: keysForSaving(["currentUpdateText", "currentUpdateLink", "currentUpdateExpiresAt"]),
    uploadKinds: [],
  },

  StoryMap: {
    fieldKeys: keysForSaving([
      "storyTitle",
      "storyProgram",
      "storyCountry",
      "storyYears",
      "storyLocationName",
      "storyPartners",
      "storyShortStory",
      "storyQuote",
      "storyQuoteAuthor",
      "storyMediaUrl",
      "storyMoreInfoUrl",
      "showOnMap",
    ]),
    uploadKinds: [],
  },

  UpcomingEvent: {
    fieldKeys: keysForSaving([
      "upcomingEventTitle",
      "upcomingEventLink",
      "upcomingEventDate",
      "upcomingEventExpiresAt",
      "upcomingEventDescription",
    ]),
    uploadKinds: [],
  },

  TechSupport: {
    fieldKeys: keysForSaving(["supportBug", "supportFeature", "supportAssistance"]),
    uploadKinds: [],
  },
};


export default function UpdateForm({
  email,
  isAdmin = false,
}: {
  email: string;
  isAdmin?: boolean;
}) {

  const [studioTab, setStudioTab] = useState<
  "basics" | "identity" | "media" | "contact" | "story" | "event"
>("basics");


const tabToModule = {
  basics: "Basics",
  identity: "Identity",
  media: "Basics",
  contact: "Contact",
  story: "StoryMap",
  event: "UpcomingEvent",
} as const satisfies Record<
  "basics" | "identity" | "media" | "contact" | "story" | "event",
  ModuleKey
>;

const activeModule: ModuleKey = tabToModule[studioTab];

  const mod = MODULES[activeModule];

  /** Stable identity state */
  const [stableAlumniId, setStableAlumniId] = useState(""); // never changes
  const [currentSlug, setCurrentSlug] = useState(""); // current canonical slug
  const [originalSlug, setOriginalSlug] = useState(""); // previous slug for forward mapping
  const [autoDetected, setAutoDetected] = useState(false);

  /** ✅ Baseline snapshot from Profile-Live (used for diff) */
  const [liveBaseline, setLiveBaseline] = useState<any>(null);

  /** Name lock */
  const [nameLocked, setNameLocked] = useState(true);

  /** Basic fields */
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  /** Profile object (Profile-Live-ish keys) */
  const [profile, setProfile] = useState<any>({
    name: "",
    slug: "",
    location: "",
    isBiCoastal: "",
    secondLocation: "",
    backgroundStyle: "kraft",

    bioShort: "",
    bioLong: "",

    website: "",
    instagram: "",
    youtube: "",
    vimeo: "",
    imdb: "",
    facebook: "",
    linktree: "",
    publicEmail: "",

    roles: "",
    pronouns: "",
    identityTags: "",
    languages: "",
    currentWork: "",
    programs: "",
    tags: "",
    statusFlags: "",
    spotlight: "",

    currentHeadshotUrl: "",

    x: "",
    tiktok: "",
    threads: "",
    bluesky: "",
    linkedin: "",
    primarySocial: "instagram",

    currentUpdateText: "",
    currentUpdateLink: "",
    currentUpdateExpiresAt: "",

    upcomingEventTitle: "",
    upcomingEventLink: "",
    upcomingEventDate: "",
    upcomingEventExpiresAt: "",
    upcomingEventDescription: "",

    storyTitle: "",
    storyProgram: "",
    storyLocationName: "",
    storyYears: "",
    storyPartners: "",
    storyShortStory: "",
    storyQuote: "",
    storyQuoteAuthor: "",
    storyMediaUrl: "",
    storyMoreInfoUrl: "",
    storyCountry: "",
    showOnMap: "",
  });

  // ✅ Single source of truth for “who is this?”
  const getIdentity = () => (stableAlumniId || "").trim();
  const isLoaded = !!getIdentity() && !!liveBaseline;

  /* drafts */
  const basicsDraft = useDraft({
    key: stableAlumniId ? `draft:${stableAlumniId}:basics` : "draft:__none__:basics",
    initial: {
      name,
      location,
      bioLong: profile.bioLong ?? "",
      currentHeadshotUrl: profile.currentHeadshotUrl ?? "",
      backgroundStyle: profile.backgroundStyle ?? "kraft",
      isBiCoastal:
        String(profile.isBiCoastal ?? "")
          .trim()
          .toLowerCase() === "true"
          ? "true"
          : "",
      secondLocation: String(profile.secondLocation ?? ""),
    },
    enabled: !!stableAlumniId,
  });

  const contactDraft = useDraft({
    key: stableAlumniId ? `draft:${stableAlumniId}:contact` : "draft:__none__:contact",
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
      imdb: "",
      facebook: "",
      linktree: "",
      publicEmail: "",
      primarySocial: "instagram",
    },
    enabled: !!stableAlumniId,
  });

/* media selections */
const [headshotFile, setHeadshotFile] = useState<File | null>(null);
const [albumFiles, setAlbumFiles] = useState<File[]>([]);
const [reelFiles, setReelFiles] = useState<File[]>([]);
const [eventFiles, setEventFiles] = useState<File[]>([]);
const [albumName, setAlbumName] = useState<string>("");

const [headshotPreviewUrl, setHeadshotPreviewUrl] = useState<string>("");

useEffect(() => {
  if (!headshotFile) {
    setHeadshotPreviewUrl("");
    return;
  }
  const url = URL.createObjectURL(headshotFile);
  setHeadshotPreviewUrl(url);
  return () => URL.revokeObjectURL(url);
}, [headshotFile]);


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
  const [pickerKind, setPickerKind] = useState<"headshot" | "album" | "reel" | "event">(
    "headshot"
  );

  const [status, setStatus] = useState<string>("");
  const [assets, setAssets] = useState<PointerAssets>({});

  /* UX */
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(
    null
  );
  const saveBtnRef = useRef<HTMLButtonElement | null>(null);

    // Upcoming Event Collapsible control
  const [eventOpen, setEventOpen] = useState(false);
  const eventSectionRef = useRef<HTMLDivElement | null>(null);

const openEventAndScroll = () => {
  setStudioTab("event");
  window.setTimeout(() => {
  document.getElementById("studio-event-anchor")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}, 120);
};




  // ------------------------------------------------------------
  // COMMUNITY FEED state + loader
  // ------------------------------------------------------------
  const [feed, setFeed] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);

  async function refreshFeed() {
    try {
      setFeedLoading(true);
      const r = await fetch("/api/alumni/community-feed?limit=8", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (r.ok && Array.isArray(j?.items)) setFeed(j.items);
    } finally {
      setFeedLoading(false);
    }
  }

  useEffect(() => {
    refreshFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* uploader */
  const uploaderRef = useRef<ReturnType<typeof createUploader> | null>(null);
  const queueEmptyResolver = useRef<(() => void) | null>(null);

  const headshotUploadResolver = useRef<{
  resolve: (url: string) => void;
  reject: (err: any) => void;
} | null>(null);

  /* MEDIA HUB click */
  const hubRef = useRef<HTMLDivElement | null>(null);

  /* socials (UI only) */
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

  // ✅ keep UI-only primarySocial state synced to profile.primarySocial
  // (no side-effects inside setProfile)
  useEffect(() => {
    const ps = String(profile?.primarySocial || "instagram");
    setPrimarySocial((prev) => (ps && ps !== prev ? ps : prev));
  }, [profile?.primarySocial]);


  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2600);
  };


  const openPicker = (kind: "headshot" | "album" | "reel" | "event") => {
    if (!getIdentity()) {
      showToast("Profile not loaded yet.", "error");
      return;
    }
    setPickerKind(kind);
    setPickerOpen(true);
  };

  const lastBasicsDraftSig = useRef<string>("");
  const lastContactDraftSig = useRef<string>("");

  const [lastPostedId, setLastPostedId] = useState<string | null>(null);


  async function undoPostedUpdate(updateId: string) {
    const res = await fetch("/api/alumni/update/undo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: updateId }),
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j?.ok) throw new Error(j?.error || "Undo failed.");

    // hide dots/menu after undo
    setLastPostedId((cur) => (cur === updateId ? null : cur));

    await refreshFeed();
  }


  // ------------------------------------------------------------
  // Boolean normalization (Live sheet-friendly)
  // ------------------------------------------------------------
  const truthy = (v: any) => {
    const s = String(v ?? "").trim().toLowerCase();
    return v === true || s === "true" || s === "1" || s === "yes";
  };

  const boolCell = (v: any) => (truthy(v) ? "true" : "");

  // ✅ single truth function for UI checks
  const isTrue = (v: any) => String(v ?? "").trim().toLowerCase() === "true";




  /** Baseline in Profile-Live key space (for diff). */
  function baselineFromLookup(j: any, slug: string, nm: string, loc: string) {
    return {
      slug: String(slug || "").trim().toLowerCase(),
      name: String(nm || "").trim(),
      location: String(loc || "").trim(),

      // ✅ normalize to Live "cell" values for reliable diffs
      isBiCoastal: boolCell(j?.isBiCoastal),
      secondLocation: String(j?.secondLocation || ""),
      backgroundStyle: String(j?.backgroundStyle || "kraft"),


      pronouns: String(j?.pronouns || ""),
      roles: String(j?.roles || ""),
      identityTags: String(j?.identityTags || ""),
      languages: String(j?.languages || ""),
      currentWork: String(j?.currentWork || ""),

      bioShort: String(j?.bioShort || ""),
      bioLong: String(j?.bioLong || ""),

      website: String(j?.website || ""),
      instagram: String(j?.instagram || ""),
      x: String(j?.x || ""),
      tiktok: String(j?.tiktok || ""),
      threads: String(j?.threads || ""),
      bluesky: String(j?.bluesky || ""),
      linkedin: String(j?.linkedin || ""),
      primarySocial: String(j?.primarySocial || ""),

      youtube: String(j?.youtube || ""),
      vimeo: String(j?.vimeo || ""),
      imdb: String(j?.imdb || ""),
      facebook: String(j?.facebook || ""),
      linktree: String(j?.linktree || ""),
      publicEmail: String(j?.publicEmail || ""),

      spotlight: String(j?.spotlight || ""),
      programs: String(j?.programs || ""),
      tags: String(j?.tags || ""),
      statusFlags: String(j?.statusFlags || ""),

      currentUpdateText: String(j?.currentUpdateText || ""),
      currentUpdateLink: String(j?.currentUpdateLink || ""),
      currentUpdateExpiresAt: String(j?.currentUpdateExpiresAt || ""),

      upcomingEventTitle: String(j?.upcomingEventTitle || ""),
      upcomingEventLink: String(j?.upcomingEventLink || ""),
      upcomingEventDate: String(j?.upcomingEventDate || ""),
      upcomingEventExpiresAt: String(j?.upcomingEventExpiresAt || ""),
      upcomingEventDescription: String(j?.upcomingEventDescription || ""),

      currentHeadshotUrl: String(j?.currentHeadshotUrl || ""),

      storyTitle: String(j?.storyTitle || ""),
      storyProgram: String(j?.storyProgram || ""),
      storyLocationName: String(j?.storyLocationName || ""),
      storyYears: String(j?.storyYears || ""),
      storyPartners: String(j?.storyPartners || ""),
      storyShortStory: String(j?.storyShortStory || ""),
      storyQuote: String(j?.storyQuote || ""),
      storyQuoteAuthor: String(j?.storyQuoteAuthor || ""),
      storyMediaUrl: String(j?.storyMediaUrl || ""),
      storyMoreInfoUrl: String(j?.storyMoreInfoUrl || ""),
      storyCountry: String(j?.storyCountry || ""),
      showOnMap: boolCell(j?.showOnMap),

    };
  }

  /* ---------- LOAD: hydrate from lookup(email) ---------- */
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/alumni/lookup?email=${encodeURIComponent(email)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const j = await res.json();

        if (j?.alumniId) setStableAlumniId(String(j.alumniId));

        const slug = String(j?.canonicalSlug || j?.slug || "").trim();
        if (slug) {
          setCurrentSlug(slug);
          setOriginalSlug(slug);
          setAutoDetected(true);
        }

        const nm = String(j?.name || "").trim();
        if (nm) setName(nm);

        const loc = String(j?.location || "").trim();
        if (loc) setLocation(loc);

        if (j?.status) setStatus(String(j.status));

        setLiveBaseline(baselineFromLookup(j, slug, nm, loc));

        setProfile((p: any) => {
          const next = {
            ...p,
            name: nm || p.name,
            slug: slug || p.slug,
            location: loc || p.location,

            pronouns: String(j?.pronouns || p.pronouns || ""),
            roles: String(j?.roles || p.roles || ""),
            identityTags: String(j?.identityTags || p.identityTags || ""),
            languages: String(j?.languages || p.languages || ""),
            currentWork: String(j?.currentWork || p.currentWork || ""),

            bioShort: String(j?.bioShort || p.bioShort || ""),
            bioLong: String(j?.bioLong || p.bioLong || ""),

            website: String(j?.website || p.website || ""),
            instagram: String(j?.instagram || p.instagram || ""),
            x: String(j?.x || p.x || ""),
            tiktok: String(j?.tiktok || p.tiktok || ""),
            threads: String(j?.threads || p.threads || ""),
            bluesky: String(j?.bluesky || p.bluesky || ""),
            linkedin: String(j?.linkedin || p.linkedin || ""),
            primarySocial: String(j?.primarySocial || p.primarySocial || "instagram"),

            youtube: String(j?.youtube || p.youtube || ""),
            vimeo: String(j?.vimeo || p.vimeo || ""),
            imdb: String(j?.imdb || p.imdb || ""),
            facebook: String(j?.facebook || p.facebook || ""),
            linktree: String(j?.linktree || p.linktree || ""),
            publicEmail: String(j?.publicEmail || p.publicEmail || ""),

            programs: String(j?.programs || p.programs || ""),
            tags: String(j?.tags || p.tags || ""),
            statusFlags: String(j?.statusFlags || p.statusFlags || ""),
            spotlight: String(j?.spotlight || p.spotlight || ""),

            currentUpdateText: String(j?.currentUpdateText || p.currentUpdateText || ""),
            currentUpdateLink: String(j?.currentUpdateLink || p.currentUpdateLink || ""),
            currentUpdateExpiresAt: String(
              j?.currentUpdateExpiresAt || p.currentUpdateExpiresAt || ""
            ),

            upcomingEventTitle: String(j?.upcomingEventTitle || p.upcomingEventTitle || ""),
            upcomingEventLink: String(j?.upcomingEventLink || p.upcomingEventLink || ""),
            upcomingEventDate: String(j?.upcomingEventDate || p.upcomingEventDate || ""),
            upcomingEventExpiresAt: String(
              j?.upcomingEventExpiresAt || p.upcomingEventExpiresAt || ""
            ),
            upcomingEventDescription: String(
              j?.upcomingEventDescription || p.upcomingEventDescription || ""
            ),

            backgroundStyle: String(j?.backgroundStyle || p.backgroundStyle || "kraft"),
            // ✅ normalize into Live-cell shape (string "true" or "")
            isBiCoastal: boolCell(j?.isBiCoastal || p.isBiCoastal),
            secondLocation: String(j?.secondLocation || p.secondLocation || ""),

            currentHeadshotUrl: String(j?.currentHeadshotUrl || p.currentHeadshotUrl || ""),

            storyTitle: String(j?.storyTitle || p.storyTitle || ""),
            storyProgram: String(j?.storyProgram || p.storyProgram || ""),
            storyLocationName: String(j?.storyLocationName || p.storyLocationName || ""),
            storyYears: String(j?.storyYears || p.storyYears || ""),
            storyPartners: String(j?.storyPartners || p.storyPartners || ""),
            storyShortStory: String(j?.storyShortStory || p.storyShortStory || ""),
            storyQuote: String(j?.storyQuote || p.storyQuote || ""),
            storyQuoteAuthor: String(j?.storyQuoteAuthor || p.storyQuoteAuthor || ""),
            storyMediaUrl: String(j?.storyMediaUrl || p.storyMediaUrl || ""),
            storyMoreInfoUrl: String(j?.storyMoreInfoUrl || p.storyMoreInfoUrl || ""),
            storyCountry: String(j?.storyCountry || p.storyCountry || ""),
            // ✅ normalize into Live-cell shape
            showOnMap: boolCell(j?.showOnMap || p.showOnMap),

          };

          return next;
        });


        if (j?.assets) setAssets(j.assets as PointerAssets);
      } catch {
        /* ignore */
      }
    };

    if (email) run();
  }, [email]);

  /* Slug preview: whenever name changes AND name is unlocked, update currentSlug */
  useEffect(() => {
    if (nameLocked) return;
    const next = slugify(name || "");
    if (!next) return;
    setCurrentSlug(next);
    setProfile((p: any) => ({ ...p, slug: next }));
  }, [name, nameLocked]);

  /* uploader lifecycle */
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
  onFileComplete: (task, resp) => {
    const json = resp || {};

    // ✅ If this was our one-shot headshot upload, resolve it
    if (task?.kind === "headshot" && headshotUploadResolver.current) {
      const url =
        (json as any)?.url ||
        (json as any)?.publicUrl ||
        (json as any)?.asset?.url ||
        "";
      const { resolve } = headshotUploadResolver.current;
      headshotUploadResolver.current = null;
      resolve(String(url || "").trim());
    }

    if (json?.status) setStatus(String(json.status));
    if (json?.updated) {
      const key = Object.keys(json.updated)[0] as keyof PointerAssets;
      const val = (json.updated as any)[key];
      setAssets((a) => ({ ...a, [key]: val }));
    }
  },

  onFileError: (task, err) => {
    // ✅ Reject the one-shot headshot promise if it was waiting
    if (task?.kind === "headshot" && headshotUploadResolver.current) {
      const { reject } = headshotUploadResolver.current;
      headshotUploadResolver.current = null;
      reject(err);
    }

    setFailed((f) => {
      const list = new Set(f[task.kind]);
      list.add(task.id);
      return { ...f, [task.kind]: Array.from(list) };
    });
    showToast(err?.message || `Failed uploading ${task.file.name}`, "error");
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

  /* Make dotted zone clickable */
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

  /* drafts hydration */

useEffect(() => {
  if (!stableAlumniId) return;

  const next = {
    name,
    location,
    bioLong: profile.bioLong ?? "",
    currentHeadshotUrl: profile.currentHeadshotUrl ?? "",
    backgroundStyle: profile.backgroundStyle ?? "kraft",
    // keep Live cell shape
    isBiCoastal: String(profile.isBiCoastal || "").toLowerCase() === "true" ? "true" : "",
    secondLocation: profile.secondLocation ?? "",
  } as const;


  const sig = JSON.stringify(next);
  if (lastBasicsDraftSig.current === sig) return;
  lastBasicsDraftSig.current = sig;

  basicsDraft.setValue(next as any);

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [
  stableAlumniId,
  name,
  location,
  profile.bioLong,
  profile.currentHeadshotUrl,
  profile.backgroundStyle,
  profile.isBiCoastal,
  profile.secondLocation,
]);



  useEffect(() => {
  if (!stableAlumniId) return;

  const next = {
    website: profile.website ?? "",
    instagram: profile.instagram ?? "",
    x: profile.x ?? "",
    tiktok: profile.tiktok ?? "",
    threads: profile.threads ?? "",
    bluesky: profile.bluesky ?? "",
    linkedin: profile.linkedin ?? "",
    youtube: profile.youtube ?? "",
    vimeo: profile.vimeo ?? "",
    imdb: profile.imdb ?? "",
    facebook: profile.facebook ?? "",
    linktree: profile.linktree ?? "",
    publicEmail: profile.publicEmail ?? "",
    primarySocial: profile.primarySocial ?? "instagram",
  } as const;

  const sig = JSON.stringify(next);
  if (lastContactDraftSig.current === sig) return;
  lastContactDraftSig.current = sig;

  contactDraft.setValue(next as any);

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [
  stableAlumniId,
  profile.website,
  profile.instagram,
  profile.x,
  profile.tiktok,
  profile.threads,
  profile.bluesky,
  profile.linkedin,
  profile.youtube,
  profile.vimeo,
  profile.imdb,
  profile.facebook,
  profile.linktree,
  profile.publicEmail,
  profile.primarySocial,
]);




/* helpers */
const fieldKeyOf = (f: any) => String(f?.path || f?.key || "").trim();

const byKeys = (keys: string[]) => {
  const wanted = new Set(keys.map((k) => String(k).trim()));
  return PROFILE_FIELDS.filter((f) => wanted.has(fieldKeyOf(f)));
};



const renderFieldsOrNull = (keys: string[]) => {
  const fields = byKeys(keys);
  if (!fields.length) return null;
  return (
    <FieldRenderer
      value={profile as AlumniProfile}
      onChange={(next) => setProfile(next as any)}
      fields={fields}
      baseline={liveBaseline as any}
    />
  );
};

const contactKeys = PROFILE_GROUPS["Contact"] ?? [];

/**
 * ✅ Current Update save (tweet-style)
 * Calls /api/alumni/update (writes Live + appends Profile-Changes + optionally DAT_Testimonials)
 */
const saveCurrentUpdate = async (text: string, promptUsed = ""): Promise<string | null> => {
  const alumniId = getIdentity();
  if (!alumniId) {
    showToast("Profile not loaded yet.", "error");
    return null;
  }

  const res = await fetch("/api/alumni/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      alumniId,
      text,
      promptUsed: String(promptUsed || "").trim(),
    }),
  });

  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j?.ok) throw new Error(j?.error || `Update failed (${res.status})`);

  return j?.id ? String(j.id) : null;
};


const postCurrentUpdate = async (rawText: string, meta?: any): Promise<string | null> => {
  const text = String(rawText || "").trim();
  if (!text) return null;

  const promptUsed =
    typeof meta?.promptUsed === "string"
      ? meta.promptUsed
      : typeof meta?.prompt === "string"
      ? meta.prompt
      : "";

  try {
    // optimistic UI
    setProfile((p: any) => ({ ...p, currentUpdateText: text }));

    const id = await saveCurrentUpdate(text, promptUsed);

    if (id) setLastPostedId(id);

    showToast("Posted ✅");
    await refreshFeed();

    return id;
  } catch (err: any) {
    showToast(err?.message || "Update failed", "error");
    return null;
  }
};

async function uploadHeadshotViaQueue(opts: { file: File; alumniId: string }) {
  const { file, alumniId } = opts;
  if (!alumniId) throw new Error("Missing alumniId for upload.");

  const uploader = uploaderRef.current;
  if (!uploader) throw new Error("Uploader not ready.");

  // Set up one-shot resolver
  const urlPromise = new Promise<string>((resolve, reject) => {
    headshotUploadResolver.current = { resolve, reject };
  });

  uploader.enqueue({
    kind: "headshot",
    files: [file],
    formFields: { alumniId },
  });

  const waitForQueue = new Promise<void>((resolve) => {
    queueEmptyResolver.current = resolve;
  });

  uploader.start();
  await waitForQueue;

  const url = (await urlPromise).trim();
  if (!url) throw new Error("Upload succeeded but no URL was returned.");
  return url;
}



async function rehydrate() {
  // ✅ Most reliable: refresh by email (avoids slug/id mismatch)
  if (!email) return;

  try {
    const r = await fetch(`/api/alumni/lookup?email=${encodeURIComponent(email)}`, {
      cache: "no-store",
    });
    if (!r.ok) return;

    const j = await r.json();

    if (j?.status) setStatus(String(j.status));
    if (j?.assets) setAssets(j.assets as PointerAssets);
    if (j?.alumniId) setStableAlumniId(String(j.alumniId));

    const slug = String(j?.canonicalSlug || j?.slug || "").trim();
    const nm = String(j?.name || "").trim();
    const loc = String(j?.location || "").trim();

    if (slug) setCurrentSlug(slug);
    if (nm) setName(nm);
    if (loc) setLocation(loc);

    setLiveBaseline(baselineFromLookup(j, slug, nm, loc));

    setProfile((p: any) => {
      const next = {
        ...p,
        slug: slug || p.slug,
        name: nm || p.name,
        location: loc || p.location,

        pronouns: String(j?.pronouns || p.pronouns || ""),
        roles: String(j?.roles || p.roles || ""),
        identityTags: String(j?.identityTags || p.identityTags || ""),
        languages: String(j?.languages || p.languages || ""),
        currentWork: String(j?.currentWork || p.currentWork || ""),

        bioShort: String(j?.bioShort || p.bioShort || ""),
        bioLong: String(j?.bioLong || p.bioLong || ""),

        website: String(j?.website || p.website || ""),
        instagram: String(j?.instagram || p.instagram || ""),
        x: String(j?.x || p.x || ""),
        tiktok: String(j?.tiktok || p.tiktok || ""),
        threads: String(j?.threads || p.threads || ""),
        bluesky: String(j?.bluesky || p.bluesky || ""),
        linkedin: String(j?.linkedin || p.linkedin || ""),
        primarySocial: String(j?.primarySocial || p.primarySocial || "instagram"),

        youtube: String(j?.youtube || p.youtube || ""),
        vimeo: String(j?.vimeo || p.vimeo || ""),
        imdb: String(j?.imdb || p.imdb || ""),
        facebook: String(j?.facebook || p.facebook || ""),
        linktree: String(j?.linktree || p.linktree || ""),
        publicEmail: String(j?.publicEmail || p.publicEmail || ""),

        programs: String(j?.programs || p.programs || ""),
        tags: String(j?.tags || p.tags || ""),
        statusFlags: String(j?.statusFlags || p.statusFlags || ""),
        spotlight: String(j?.spotlight || p.spotlight || ""),

        currentUpdateText: String(j?.currentUpdateText || p.currentUpdateText || ""),
        currentUpdateLink: String(j?.currentUpdateLink || p.currentUpdateLink || ""),
        currentUpdateExpiresAt: String(j?.currentUpdateExpiresAt || p.currentUpdateExpiresAt || ""),

        upcomingEventTitle: String(j?.upcomingEventTitle || p.upcomingEventTitle || ""),
        upcomingEventLink: String(j?.upcomingEventLink || p.upcomingEventLink || ""),
        upcomingEventDate: String(j?.upcomingEventDate || p.upcomingEventDate || ""),
        upcomingEventExpiresAt: String(j?.upcomingEventExpiresAt || p.upcomingEventExpiresAt || ""),
        upcomingEventDescription: String(
          j?.upcomingEventDescription || p.upcomingEventDescription || ""
        ),

        currentHeadshotUrl: String(j?.currentHeadshotUrl || p.currentHeadshotUrl || ""),
        backgroundStyle: String(j?.backgroundStyle || p.backgroundStyle || "kraft"),
        // ✅ normalize into Live-cell shape (string "true" or "")
        isBiCoastal: boolCell(j?.isBiCoastal || p.isBiCoastal),
        secondLocation: String(j?.secondLocation || p.secondLocation || ""),

        // ✅ keep Story Map in sync too
        storyTitle: String(j?.storyTitle || p.storyTitle || ""),
        storyProgram: String(j?.storyProgram || p.storyProgram || ""),
        storyLocationName: String(j?.storyLocationName || p.storyLocationName || ""),
        storyYears: String(j?.storyYears || p.storyYears || ""),
        storyPartners: String(j?.storyPartners || p.storyPartners || ""),
        storyShortStory: String(j?.storyShortStory || p.storyShortStory || ""),
        storyQuote: String(j?.storyQuote || p.storyQuote || ""),
        storyQuoteAuthor: String(j?.storyQuoteAuthor || p.storyQuoteAuthor || ""),
        storyMediaUrl: String(j?.storyMediaUrl || p.storyMediaUrl || ""),
        storyMoreInfoUrl: String(j?.storyMoreInfoUrl || p.storyMoreInfoUrl || ""),
        storyCountry: String(j?.storyCountry || p.storyCountry || ""),
        // ✅ normalize into Live-cell shape
        showOnMap: boolCell(j?.showOnMap || p.showOnMap),

      };

      return next;
    });

  } catch {
    /* ignore */
  }
}

const totalBytes = (files: File[]) => files.reduce((s, f) => s + (f?.size ?? 0), 0);

const prettyMB = (n?: number | null) => {
  const mb = Number(n ?? 0) / 1_000_000;
  return Math.round(mb * 10) / 10;
};

/** Map to Profile-Live schema. */
function toLiveSavableProfile(p: any) {
  return {
    name: String(p.name || "").trim(),
    slug: String(p.slug || "").trim().toLowerCase(),
    location: String(p.location || "").trim(),
    // ✅ Live sheet-friendly values
    isBiCoastal: boolCell(p.isBiCoastal),
    secondLocation: String(p.secondLocation || "").trim(),

    backgroundStyle: String(p.backgroundStyle || "kraft").trim(),

    pronouns: String(p.pronouns || "").trim(),
    roles: String(p.roles || "").trim(),
    identityTags: String(p.identityTags || "").trim(),
    languages: String(p.languages || "").trim(),
    currentWork: String(p.currentWork || "").trim(),
    bioShort: String(p.bioShort || "").trim(),
    bioLong: String(p.bioLong || "").trim(),

    website: String(p.website || "").trim(),
    instagram: String(p.instagram || "").trim(),
    x: String(p.x || "").trim(),
    tiktok: String(p.tiktok || "").trim(),
    threads: String(p.threads || "").trim(),
    bluesky: String(p.bluesky || "").trim(),
    linkedin: String(p.linkedin || "").trim(),
    primarySocial: String(p.primarySocial || "").trim(),
    youtube: String(p.youtube || "").trim(),
    vimeo: String(p.vimeo || "").trim(),
    imdb: String(p.imdb || "").trim(),
    facebook: String(p.facebook || "").trim(),
    linktree: String(p.linktree || "").trim(),
    publicEmail: String(p.publicEmail || "").trim(),

    spotlight: String(p.spotlight || "").trim(),
    programs: String(p.programs || "").trim(),
    tags: String(p.tags || "").trim(),
    statusFlags: String(p.statusFlags || "").trim(),

    currentUpdateText: String(p.currentUpdateText || "").trim(),
    currentUpdateLink: String(p.currentUpdateLink || "").trim(),
    currentUpdateExpiresAt: String(p.currentUpdateExpiresAt || "").trim(),

    upcomingEventTitle: String(p.upcomingEventTitle || "").trim(),
    upcomingEventLink: String(p.upcomingEventLink || "").trim(),
    upcomingEventDate: String(p.upcomingEventDate || "").trim(),
    upcomingEventExpiresAt: String(p.upcomingEventExpiresAt || "").trim(),
    upcomingEventDescription: String(p.upcomingEventDescription || "").trim(),

    currentHeadshotUrl: String(p.currentHeadshotUrl || "").trim(),

    storyTitle: String(p.storyTitle || "").trim(),
    storyProgram: String(p.storyProgram || "").trim(),
    storyLocationName: String(p.storyLocationName || "").trim(),
    storyYears: String(p.storyYears || "").trim(),
    storyPartners: String(p.storyPartners || "").trim(),
    storyShortStory: String(p.storyShortStory || "").trim(),
    storyQuote: String(p.storyQuote || "").trim(),
    storyQuoteAuthor: String(p.storyQuoteAuthor || "").trim(),
    storyMediaUrl: String(p.storyMediaUrl || "").trim(),
    storyMoreInfoUrl: String(p.storyMoreInfoUrl || "").trim(),
    storyCountry: String(p.storyCountry || "").trim(),
    showOnMap: boolCell(p.showOnMap),

  };
}

/* per-category save + uploads */
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
  const alumniId = stableAlumniId.trim();
  if (!alumniId) {
    showToast("Profile not loaded yet.", "error");
    return;
  }

  setLoading(true);
  setFailed({ headshot: [], album: [], reel: [], event: [] });

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
    if (albumName) baseFields.albumName = albumName;

    const humanBase = slugify((name || profile.name || currentSlug || "alumni").trim());

    // queue uploads with renamed files
    if (uploadKinds.includes("headshot") && headshotFile) {
      const f = renameForKind(headshotFile, "headshot", humanBase);
      uploader.enqueue({ kind: "headshot", files: [f], formFields: baseFields });
    }
    if (uploadKinds.includes("album") && albumFiles.length) {
      const files = albumFiles.map((f, i) => renameForKind(f, "album", humanBase, i + 1, albumName));
      uploader.enqueue({ kind: "album", files, formFields: baseFields });
    }
    if (uploadKinds.includes("reel") && reelFiles.length) {
      const files = reelFiles.map((f, i) => renameForKind(f, "reel", humanBase, i + 1));
      uploader.enqueue({ kind: "reel", files, formFields: baseFields });
    }
    if (uploadKinds.includes("event") && eventFiles.length) {
      const files = eventFiles.map((f, i) => renameForKind(f, "event", humanBase, i + 1));
      uploader.enqueue({ kind: "event", files, formFields: baseFields });
    }

    const hasUploads =
      (uploadKinds.includes("headshot") && !!headshotFile) ||
      (uploadKinds.includes("album") && albumFiles.length > 0) ||
      (uploadKinds.includes("reel") && reelFiles.length > 0) ||
      (uploadKinds.includes("event") && eventFiles.length > 0);

// ✅ nothing to do: no uploads staged AND no fields to save
if (!hasUploads && fieldKeys.length === 0) {
  showToast("Nothing to save.", "success");
  setLoading(false);
  return;
}

if (hasUploads) {
  const waitForQueue = new Promise<void>((resolve) => {
    queueEmptyResolver.current = resolve;
  });
  uploader.start();
  await waitForQueue;

  // ✅ MEDIA-ONLY SAVE PATH
  // If this category was uploads-only, don't fall through into diff/save logic
  if (!fieldKeys.length) {
    if (uploadKinds.includes("headshot")) setHeadshotFile(null);
    if (uploadKinds.includes("album")) setAlbumFiles([]);
    if (uploadKinds.includes("reel")) setReelFiles([]);
    if (uploadKinds.includes("event")) setEventFiles([]);

setProgress((p) => ({
  ...p,
  ...(uploadKinds.includes("headshot") ? { headshot: { uploaded: 0, total: 0, pct: 0 } } : {}),
  ...(uploadKinds.includes("album") ? { album: { uploaded: 0, total: 0, pct: 0 } } : {}),
  ...(uploadKinds.includes("reel") ? { reel: { uploaded: 0, total: 0, pct: 0 } } : {}),
  ...(uploadKinds.includes("event") ? { event: { uploaded: 0, total: 0, pct: 0 } } : {}),
}));

    showToast("Upload complete ✅");
    await rehydrate();
    return;
  }
}


    // CONTACT: clear hidden socials & set primary (do not rely on async setProfile)
    let profileForSave: any = profile;
      const tagKey = String(tag).trim().toLowerCase();
        if (tagKey === "contact") {
      const next = { ...(profile as any) };
      const ALL = ALL_SOCIALS as unknown as string[];
      ALL.forEach((k) => {
        if (!visibleSocials.includes(k)) next[k] = "";
      });
      if (visibleSocials.length && primarySocial && visibleSocials.includes(primarySocial)) {
        next.primarySocial = primarySocial;
      }
      setProfile(next);
      profileForSave = next;
    }

    // Normalize, then map to Live keys
    const mergedAny = normalizeProfile({
      ...(profileForSave as any),
      name: name || profileForSave.name || "",
      slug: (currentSlug || profileForSave.slug || "").trim(),
      location: location || profileForSave.location || "",

      bioLong: String(profileForSave.bioLong || ""),
      bioShort: String(profileForSave.bioShort || ""),
      statusFlags: String(profileForSave.statusFlags || ""),
      programs: String(profileForSave.programs || ""),
      tags: String(profileForSave.tags || ""),
      spotlight: String(profileForSave.spotlight || ""),
      currentWork: String(profileForSave.currentWork || ""),
      roles: String(profileForSave.roles || ""),
      pronouns: String(profileForSave.pronouns || ""),
    } as AlumniProfile) as any;

    const mergedLive = toLiveSavableProfile({
      ...mergedAny,
      name,
      slug: currentSlug,
      location,
      primarySocial: String(
        (tagKey === "contact"
          ? (profileForSave.primarySocial || primarySocial || "instagram")
          : (profileForSave.primarySocial || profile.primarySocial || "instagram")
        ) || "instagram"
      ),
    });

    // Validate only keys we’re saving
    const errs = validateProfile(mergedAny as AlumniProfile) || {};
    const filteredErrs = Object.fromEntries(Object.entries(errs).filter(([k]) => fieldKeys.includes(k)));
    if (Object.keys(filteredErrs).length) {
      const firstKey = Object.keys(filteredErrs)[0];
      const firstMsg = (filteredErrs as any)[firstKey] || "Please fix the highlighted fields.";
      showToast(firstMsg, "error");
      setLoading(false);
      return;
    }

    const baseline =
      liveBaseline ?? (baselineFromLookup({}, originalSlug || currentSlug, name, location) as any);

    const changesAll = buildLiveChanges(baseline as any, mergedLive as any) as Record<string, any>;

    const wanted = new Set(fieldKeys);
    const changes = Object.fromEntries(Object.entries(changesAll).filter(([k]) => wanted.has(k)));

    if (Object.keys(changes).length === 0) {
      showToast("No changes to save.", "success");
      setLoading(false);
      return;
    }

    const body = {
      alumniId,
      oldSlug: originalSlug && currentSlug && originalSlug !== currentSlug ? originalSlug : undefined,
      changes,
      submittedByEmail: email || "",
      note: `partial save (${tag}) via alumni form`,
    };

    const res = await fetch("/api/alumni/save", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const j = await res.json().catch(() => ({} as any));
    if (!res.ok || !j?.ok) throw new Error(j?.error || `Save failed (${res.status})`);

    // hard assert: server must confirm it saved attempted keys
    const attempted = Object.keys(changes);
    const saved = new Set<string>((j?.savedFields ?? []) as string[]);
    const missing = attempted.filter((k) => !saved.has(k));
    if (missing.length) {
      throw new Error(`Server did not persist: ${missing.join(", ")}. note=${j?.note ?? "none"}`);
    }

    if (originalSlug !== currentSlug) setOriginalSlug(currentSlug);
    setLiveBaseline((prev: any) => ({ ...(prev ?? {}), ...mergedLive }));

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
const Controls = ({ kind, disabled }: { kind: UploadKind; disabled?: boolean }) => (
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
      onClick={() => uploaderRef.current?.resumeKind(kind, { alumniId: stableAlumniId })}
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
  const tasks: UploadTask[] = uploaderRef.current?.getTasks().filter((t) => ids.includes(t.id)) ?? [];

  const retryOne = (id: string) => {
    const t = uploaderRef.current?.getTaskById(id);
    if (!t) return;
    const ff = { alumniId: stableAlumniId };
    uploaderRef.current?.resumeKind(kind, ff);
    uploaderRef.current?.enqueue({ kind, files: [t.file], formFields: ff });
    setFailed((f) => ({ ...f, [kind]: f[kind].filter((x) => x !== id) }));
    uploaderRef.current?.start();
  };

  const retryAll = () => {
    const ff = { alumniId: stableAlumniId };
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
      <div style={{ marginBottom: 8, fontWeight: 600 }}>Some files failed to upload:</div>
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
        <button type="button" onClick={retryAll} style={datButtonGhost} className="dat-btn-ghost">
          Retry all failed
        </button>
      </div>
    </div>
  );
};

// ------------------------------------------------------------
// ✅ DROPDOWN SECTIONS: ALWAYS RENDER
// ------------------------------------------------------------

// Prefer groups if present, otherwise fallback keys.
const AboutEditKeys =
  PROFILE_GROUPS["About"] ??
  PROFILE_GROUPS["Bio"] ??
  PROFILE_GROUPS["Profile"] ??
  ["roles", "currentWork", "bioShort"];

const TagsEditKeys =
  PROFILE_GROUPS["Programs"] ??
  PROFILE_GROUPS["Tags"] ??
  PROFILE_GROUPS["Meta"] ??
  ["spotlight", "programs", "tags", "statusFlags"];

const UpdatesEditKeys =
  PROFILE_GROUPS["Updates"] ??
  PROFILE_GROUPS["Announcements"] ??
  ["currentUpdateText", "currentUpdateLink", "currentUpdateExpiresAt"];

const UpcomingEventEditKeys =
  PROFILE_GROUPS["Upcoming Event"] ??
  PROFILE_GROUPS["Events"] ??
  [
    "upcomingEventTitle",
    "upcomingEventLink",
    "upcomingEventDate",
    "upcomingEventExpiresAt",
    "upcomingEventDescription",
  ];

const ContactEditKeys = [
  "website",
  "instagram",
  "x",
  "tiktok",
  "threads",
  "bluesky",
  "linkedin",
  "primarySocial",
  "youtube",
  "vimeo",
  "imdb",
  "facebook",
  "linktree",
  "publicEmail",
];

// ✅ Story Map section keys (match Profile-Live headers)
const StoryMapEditKeys =
  PROFILE_GROUPS["Story Map Contribution"] ?? [
    "storyTitle",
    "storyProgram",
    "storyLocationName",
    "storyYears",
    "storyPartners",
    "storyShortStory",
    "storyQuote",
    "storyQuoteAuthor",
    "storyMediaUrl",
    "storyMoreInfoUrl",
    "storyCountry",
    "showOnMap",
  ];




// ------------------------------------------------------------
// 2) ✅ Manual fallback (in case FieldRenderer has no defs yet)
// ------------------------------------------------------------
const ManualStoryMapFallback = () => (
  <div style={{ display: "grid", gap: 14 }}>
    <div>
      <label style={labelStyle}>Story Title</label>
      <input
        value={profile.storyTitle || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, storyTitle: e.target.value }))}
        style={inputStyle}
      />
    </div>

    <div>
      <label style={labelStyle}>Associated Program</label>
      <input
        value={profile.storyProgram || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, storyProgram: e.target.value }))}
        style={inputStyle}
        placeholder="ACTion / RAW / CASTAWAY / PASSAGE / ..."
      />
    </div>

    <div>
      <label style={labelStyle}>Country</label>
      <input
        value={profile.storyCountry || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, storyCountry: e.target.value }))}
        style={inputStyle}
        placeholder="Ecuador, Slovakia..."
      />
    </div>

    <div>
      <label style={labelStyle}>Year(s)</label>
      <input
        value={profile.storyYears || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, storyYears: e.target.value }))}
        style={inputStyle}
        placeholder="2016 or 2015–2016"
      />
    </div>

    <div>
      <label style={labelStyle}>Location Name (map pin label)</label>
      <input
        value={profile.storyLocationName || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, storyLocationName: e.target.value }))}
        style={inputStyle}
        placeholder="City / Region / Landmark"
      />
    </div>

    <div>
      <label style={labelStyle}>Partners</label>
      <input
        value={profile.storyPartners || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, storyPartners: e.target.value }))}
        style={inputStyle}
      />
    </div>

    <div>
      <label style={labelStyle}>Media URL</label>
      <input
        value={profile.storyMediaUrl || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, storyMediaUrl: e.target.value }))}
        style={inputStyle}
        placeholder="https://..."
      />
    </div>

    <div>
      <label style={labelStyle}>More Info URL</label>
      <input
        value={profile.storyMoreInfoUrl || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, storyMoreInfoUrl: e.target.value }))}
        style={inputStyle}
        placeholder="https://..."
      />
    </div>

    <div>
      <label style={labelStyle}>Short Story</label>
      <textarea
        value={profile.storyShortStory || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, storyShortStory: e.target.value }))}
        rows={6}
        style={{ ...inputStyle, minHeight: 160, resize: "vertical" }}
      />
    </div>

    <div>
      <label style={labelStyle}>Quote (no quotation marks)</label>
      <textarea
        value={profile.storyQuote || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, storyQuote: e.target.value }))}
        rows={3}
        style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
      />
    </div>

    <div>
      <label style={labelStyle}>Quote Author</label>
      <input
        value={profile.storyQuoteAuthor || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, storyQuoteAuthor: e.target.value }))}
        style={inputStyle}
      />
    </div>

    <label style={{ fontWeight: 700 }}>
      <input
        type="checkbox"
        checked={
          String(profile.showOnMap || "").toLowerCase() === "true" || profile.showOnMap === true
        }
        onChange={(e) =>
          setProfile((p: any) => ({ ...p, showOnMap: e.target.checked ? "true" : "" }))
        }
        style={{ marginRight: 10 }}
      />
      Show on Map?
    </label>

    <p style={{ ...explainStyleLocal, marginTop: 6 }}>
      (Fallback UI) Add Story Map keys to <code>PROFILE_FIELDS</code> to render via FieldRenderer.
    </p>
  </div>
);

// ------------------------------------------------------------
// 3) ✅ Add the Collapsible blocks in your render (near other dropdowns)
// ------------------------------------------------------------

// Manual fallback blocks when FieldRenderer has no matching fields.
const ManualAboutFallback = () => (
  <div style={{ display: "grid", gap: 14 }}>
    <div>
      <label style={labelStyle}>Pronouns</label>
      <input
        value={profile.pronouns || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, pronouns: e.target.value }))}
        style={inputStyle}
        placeholder="e.g. she/her, he/him, they/them"
      />
    </div>

    <div>
      <label style={labelStyle}>Roles</label>
      <input
        value={profile.roles || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, roles: e.target.value }))}
        style={inputStyle}
        placeholder="Actor, Director, Playwright..."
      />
    </div>

    <div>
      <label style={labelStyle}>Current Work</label>
      <input
        value={profile.currentWork || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, currentWork: e.target.value }))}
        style={inputStyle}
        placeholder="What are you working on right now?"
      />
    </div>

    <div>
      <label style={labelStyle}>Bio Short (optional)</label>
      <textarea
        value={profile.bioShort || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, bioShort: e.target.value }))}
        rows={4}
        style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
      />
    </div>

    {/* intentionally blank */}

  </div>
);

const ManualTagsFallback = () => (
  <div style={{ display: "grid", gap: 14 }}>
    <div>
      <label style={labelStyle}>Spotlight</label>
      <input
        value={profile.spotlight || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, spotlight: e.target.value }))}
        style={inputStyle}
        placeholder="Optional featured line"
      />
    </div>

    <div>
      <label style={labelStyle}>Programs</label>
      <input
        value={profile.programs || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, programs: e.target.value }))}
        style={inputStyle}
        placeholder="Comma-separated programs"
      />
    </div>

    <div>
      <label style={labelStyle}>Tags</label>
      <input
        value={profile.tags || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, tags: e.target.value }))}
        style={inputStyle}
        placeholder="Comma-separated tags"
      />
    </div>

    <div>
      <label style={labelStyle}>Status Flags</label>
      <input
        value={profile.statusFlags || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, statusFlags: e.target.value }))}
        style={inputStyle}
        placeholder="Comma-separated flags"
      />
    </div>

    <p style={{ ...explainStyleLocal, marginTop: 6 }}>
      (Fallback UI) To restore your dropdown/select UI, ensure these keys exist in
      <code> PROFILE_FIELDS</code> with the correct <code>path</code>.
    </p>
  </div>
);

const ManualUpdatesFallback = () => (
  <div style={{ display: "grid", gap: 14 }}>
    <div>
      <label style={labelStyle}>Update Text</label>
      <textarea
        value={profile.currentUpdateText || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, currentUpdateText: e.target.value }))}
        rows={4}
        style={{ ...inputStyle, minHeight: 140, resize: "vertical" }}
      />
    </div>

    <div>
      <label style={labelStyle}>Update Link</label>
      <input
        value={profile.currentUpdateLink || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, currentUpdateLink: e.target.value }))}
        style={inputStyle}
        placeholder="https://..."
      />
    </div>

    <div>
      <label style={labelStyle}>Expires At</label>
      <input
        value={profile.currentUpdateExpiresAt || ""}
        onChange={(e) =>
          setProfile((p: any) => ({ ...p, currentUpdateExpiresAt: e.target.value }))
        }
        style={inputStyle}
        placeholder="YYYY-MM-DD"
      />
    </div>

    <p style={{ ...explainStyleLocal, marginTop: 6 }}>
      (Fallback UI) Add these keys to <code>PROFILE_FIELDS</code> to render via FieldRenderer.
    </p>
  </div>
);

const ManualUpcomingEventFallback = () => (
  <div style={{ display: "grid", gap: 14 }}>
    <div>
      <label style={labelStyle}>Event Title</label>
      <input
        value={profile.upcomingEventTitle || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, upcomingEventTitle: e.target.value }))}
        style={inputStyle}
      />
    </div>

    <div>
      <label style={labelStyle}>Event Link</label>
      <input
        value={profile.upcomingEventLink || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, upcomingEventLink: e.target.value }))}
        style={inputStyle}
        placeholder="https://..."
      />
    </div>

    <div>
      <label style={labelStyle}>Event Date</label>
      <input
        value={profile.upcomingEventDate || ""}
        onChange={(e) => setProfile((p: any) => ({ ...p, upcomingEventDate: e.target.value }))}
        style={inputStyle}
        placeholder="YYYY-MM-DD"
      />
    </div>

    <div>
      <label style={labelStyle}>Expires At</label>
      <input
        value={profile.upcomingEventExpiresAt || ""}
        onChange={(e) =>
          setProfile((p: any) => ({ ...p, upcomingEventExpiresAt: e.target.value }))
        }
        style={inputStyle}
        placeholder="YYYY-MM-DD"
      />
    </div>

    <div>
      <label style={labelStyle}>Description</label>
      <textarea
        value={profile.upcomingEventDescription || ""}
        onChange={(e) =>
          setProfile((p: any) => ({ ...p, upcomingEventDescription: e.target.value }))
        }
        rows={5}
        style={{ ...inputStyle, minHeight: 160, resize: "vertical" }}
      />
    </div>

    <p style={{ ...explainStyleLocal, marginTop: 6 }}>
      (Fallback UI) Add these keys to <code>PROFILE_FIELDS</code> to render via FieldRenderer.
    </p>
  </div>
);

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
          {isAdmin ? " (admin)" : ""}
        </p>
      </div>
    </div>

    {/* MAIN */}
    <main
      style={{
        marginTop: "-5rem",
        padding: "5.5rem 0 4rem",
        position: "relative",
        zIndex: 10,
      }}
    >
      <div style={{ width: "90%", margin: "0 auto" }}>
        {/* ====== COMMUNITY LEDGER (Composer + Feed, one container) ====== */}
        <div style={{ margin: "2rem 0 3.25rem" }}>
          <div
            style={{
              background: "#f2f2f241",
              border: "none",
              boxShadow: "none",
              borderRadius: 16,
              padding: "16px 16px 14px",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: 14,
                  textTransform: "uppercase",
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  color: COLOR.ink,
                  opacity: 0.85,
                }}
              >
                Community Feed
              </div>
            </div>

            {!isLoaded ? (
  <p style={{ ...explainStyleLocal, color: COLOR.ink, opacity: 0.75, margin: 0 }}>
    Loading your profile…
  </p>
) : (
  <>
    <UpdateComposer
      onSubmit={async (text, meta) => {
        const id = await postCurrentUpdate(text, meta);
        return id ? { id } : undefined;
      }}

      onPosted={() => {}}
      onError={(err) => console.error(err)}
      onAddEvent={openEventAndScroll}
    />

    {/* Divider */}
    <div
      style={{
        height: 1,
        background: "rgba(36, 17, 35, 0.25)",
        margin: "14px 2px 12px",
      }}
    />

    {/* Feed */}
    {feedLoading ? (
      <p style={{ ...explainStyleLocal, color: COLOR.ink, opacity: 0.75, margin: 0 }}>
        Loading…
      </p>
    ) : !feed.length ? (
      <p style={{ ...explainStyleLocal, color: COLOR.ink, opacity: 0.75, margin: 0 }}>
        No updates yet.
      </p>
    ) : (
      <div style={{ display: "grid", gap: 10 }}>
        {feed.map((it: any) => (
          <CommunityUpdateLine
            key={it.id ?? `${it.alumniId}-${it.ts}-${it.field}`}
            name={it?.name}
            slug={it?.slug || it?.alumniId || "alumni"}
            text={it?.text}
            updateId={it?.id}
            showActions={Boolean(it?.id && (isAdmin || it.alumniId === stableAlumniId))}
            onUndo={undoPostedUpdate}
            style={{
              background: "#f2f2f27a",
              border: "1px solid rgba(36, 17, 35, 0.10)",
              boxShadow: "none",
            }}
          />
        ))}
      </div>
    )}
  </>
)}
          </div>
        </div>


{/* ====== PROFILE STUDIO (replaces MediaHub container) ====== */}
<div style={{ margin: "0.25rem 0 3.25rem" }}>
  <div
    style={{
      background: "rgba(36, 17, 35, 0.22)", // single low-opacity shade
      borderRadius: 16,
      padding: "16px 16px 18px",
      color: COLOR.snow,
    }}
  >
    <div
      style={{
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        fontSize: 14,
        textTransform: "uppercase",
        fontWeight: 700,
        letterSpacing: ".1em",
        opacity: 0.9,
        marginBottom: 12,
      }}
    >
      Profile Studio
    </div>

<ProfileStudio
  tab={studioTab}
  onTabChange={setStudioTab}
  loading={loading}
  onOpenPicker={(k) => openPicker(k)}
  basicsPanel={
    <div>
      <p style={explainStyleLocal}>
        Start here. Confirm your headline profile details — and set your headshot.
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        <span style={subheadChipStyle} className="subhead-chip">
          Profile Basics
        </span>

        <p style={explainStyleLocal} className="explain">
          Your professional name and slug are locked by default. If your professional name changed,
          unlock it and your slug preview will update automatically.
        </p>

        <div>
          <label htmlFor="slug" style={labelStyle}>
            Profile slug
          </label>
          <input id="slug" value={currentSlug} readOnly style={inputLockedStyle} />
          <p style={{ ...explainStyleLocal, marginTop: 6 }} className="explain">
            {autoDetected
              ? "We auto-detected your current slug from Profile-Live."
              : "Your slug mirrors your professional name."}
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
            <label htmlFor="name" style={labelStyle}>
              Professional name
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
              <input
                id="name"
                value={name}
                onChange={(e) => {
                  const v = e.target.value;
                  setName(v);
                  setProfile((p: any) => ({ ...p, name: v }));
                }}
                style={nameLocked ? inputLockedStyle : inputStyle}
                disabled={nameLocked}
              />
              <button
                type="button"
                className="dat-btn-ghost"
                style={datButtonGhost}
                onClick={() => setNameLocked((x) => !x)}
              >
                {nameLocked ? "My professional name changed" : "Lock name"}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="location" style={labelStyle}>
              Base
            </label>
            <input
              id="location"
              value={location}
              onChange={(e) => {
                const v = e.target.value;
                setLocation(v);
                setProfile((p: any) => ({ ...p, location: v }));
              }}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <label style={{ fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={isTrue(profile.isBiCoastal)}
              onChange={(e) =>
                setProfile((p: any) => ({
                  ...p,
                  isBiCoastal: e.target.checked ? "true" : "",
                }))
              }
              style={{ marginRight: 10 }}
            />
            Bi-coastal
          </label>

          {isTrue(profile.isBiCoastal) ? (
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Second location</label>
              <input
                value={profile.secondLocation || ""}
                onChange={(e) =>
                  setProfile((p: any) => ({ ...p, secondLocation: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: 18 }}>
          <BackgroundSwatches
            value={String(profile.backgroundStyle || "kraft")}
            onChange={(next) => setProfile((p: any) => ({ ...p, backgroundStyle: next }))}
          />
        </div>

        <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
          <div>
            <label style={labelStyle}>Bio / Artist Statement (public)</label>
            <textarea
              value={String(profile.bioLong ?? "")}
              onChange={(e) => setProfile((p: any) => ({ ...p, bioLong: e.target.value }))}
              rows={10}
              style={{ ...inputStyle, minHeight: 220, resize: "vertical" }}
            />
          </div>
        </div>
      </div>

      {/* Headshot actions (URL + library + upload) */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Field
            label="Headshot URL (optional)"
            help="If you paste a URL, it should point directly to the image file (not a webpage)."
          >
            <input
              value={profile.currentHeadshotUrl || ""}
              onChange={(e) =>
                setProfile((p: any) => ({ ...p, currentHeadshotUrl: e.target.value }))
              }
              style={inputStyle}
              placeholder="https://... (direct image URL)"
            />
          </Field>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              style={studioGhostButton}
              onClick={() => openPicker("headshot")}
              disabled={loading}
            >
              Choose past headshot
            </button>
            <button
              type="button"
              style={studioGhostButton}
              onClick={() => openPicker("album")}
              disabled={loading}
            >
              Open library
            </button>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <Dropzone
              accept="image/*"
              multiple={false}
              disabled={loading}
              label="Add a headshot"
              sublabel="or drag & drop here"
              onFiles={(files) => setHeadshotFile(files[0] || null)}
              onReject={(rej) => showToast(rej[0]?.reason || "File rejected", "error")}
            />

            {headshotFile ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "84px 1fr auto",
                  gap: 12,
                  alignItems: "center",
                  padding: 10,
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.18)",
                }}
              >
                <div
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                  }}
                >
                  {headshotPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={headshotPreviewUrl}
                      alt="Staged headshot preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : null}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, lineHeight: 1.2 }}>Staged headshot</div>
                  <div style={{ opacity: 0.8, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {headshotFile.name} • {Math.round(headshotFile.size / 1024)} KB
                  </div>
                  <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>
                    This will become your featured headshot when you save.
                  </div>
                </div>

                <button
                  type="button"
                  className="dat-btn-ghost"
                  style={datButtonGhost}
                  onClick={() => setHeadshotFile(null)}
                  disabled={loading}
                >
                  Clear
                </button>
              </div>
            ) : null}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                style={datButtonLocal}
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    // 1) If a headshot is staged, upload it and force it to win as currentHeadshotUrl
                    if (headshotFile) {
                      const uploadedUrl = await uploadHeadshotViaQueue({
                        file: headshotFile,
                        alumniId: stableAlumniId,
                      });


                      setProfile((p: any) => ({
                        ...p,
                        currentHeadshotUrl: String(uploadedUrl || "").trim(),
                      }));
                    }

                    // 2) Save Basics (includes currentHeadshotUrl if we set it above)
                    await saveCategory({
                      tag: "Basics",
                      fieldKeys: MODULES["Basics"].fieldKeys,
                      uploadKinds: [],
                      afterSave: () => {
                        basicsDraft.clearDraft();
                        setHeadshotFile(null);
                      },
                    });
                  } catch (e: any) {
                    showToast(e?.message || "Save failed", "error");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Save Profile Basics
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  }
  identityPanel={
    <div>
      <p style={explainStyleLocal}>
        Identity helps us represent you accurately and build the right rooms for collaboration.
      </p>

      <span style={subheadChipStyle} className="subhead-chip">
        Identity + Roles
      </span>

      {renderFieldsOrNull([
        ...MODULES["Identity"].fieldKeys,
        ...MODULES["Roles"].fieldKeys,
      ]) ?? (
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={labelStyle}>Pronouns</label>
            <input
              value={profile.pronouns || ""}
              onChange={(e) => setProfile((p: any) => ({ ...p, pronouns: e.target.value }))}
              style={inputStyle}
              placeholder="she/her, he/him, they/them…"
            />
          </div>

          <div>
            <label style={labelStyle}>Identity Tags</label>
            <input
              value={profile.identityTags || ""}
              onChange={(e) => setProfile((p: any) => ({ ...p, identityTags: e.target.value }))}
              style={inputStyle}
              placeholder="comma-separated"
            />
          </div>

          <div>
            <label style={labelStyle}>Languages</label>
            <input
              value={profile.languages || ""}
              onChange={(e) => setProfile((p: any) => ({ ...p, languages: e.target.value }))}
              style={inputStyle}
              placeholder="comma-separated"
            />
          </div>

          <div>
            <label style={labelStyle}>Roles</label>
            <input
              value={profile.roles || ""}
              onChange={(e) => setProfile((p: any) => ({ ...p, roles: e.target.value }))}
              style={inputStyle}
              placeholder="Actor, Director, Designer…"
            />
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 16,
        }}
      >
        <button
          type="button"
          style={datButtonLocal}
          className="dat-btn"
          disabled={loading}
          onClick={() =>
            saveCategory({
              tag: "Identity",
              fieldKeys: MODULES["Identity"].fieldKeys,
              uploadKinds: [],
            })
          }
        >
          Save Identity
        </button>

        <button
          type="button"
          style={datButtonLocal}
          className="dat-btn"
          disabled={loading}
          onClick={() =>
            saveCategory({
              tag: "Roles",
              fieldKeys: MODULES["Roles"].fieldKeys,
              uploadKinds: [],
            })
          }
        >
          Save Roles
        </button>
      </div>
    </div>
  }
      mediaPanel={
        <div>
          <p style={explainStyleLocal}>
            Albums + reels live here. You’re choosing placement before uploading.
          </p>

          {/* Optional inner toggle: Albums vs Reels */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            {/* You can implement a local toggle state in UpdateForm and pass it down;
                for now keep both visible or split with two sub-panels */}
            <button type="button" style={studioGhostButton} onClick={() => openPicker("album")} disabled={loading}>
              Choose album media
            </button>
            <button type="button" style={studioGhostButton} onClick={() => openPicker("reel")} disabled={loading}>
              Choose reel media
            </button>
          </div>

          {/* Staging inputs */}
          <div style={{ display: "grid", gap: 12 }}>
            <Field label="Album name (optional)">
              <input
                value={albumName || ""}
                onChange={(e) => setAlbumName(e.target.value)}
                style={inputStyle}
                placeholder="e.g. Production photos, BTS, PASSAGE…"
              />
            </Field>

            <Field label="Add photos to album">
              <Dropzone
                accept="image/*"
                multiple
                disabled={loading}
                label="Add photos to album"
                sublabel="or drag & drop here"
                onFiles={(files) => setAlbumFiles(files)}
                onReject={(rej) => showToast(rej[0]?.reason || "File rejected", "error")}
              />

            </Field>

            <Field label="Add reels (video files)">
              <Dropzone
                accept="video/*"
                multiple
                disabled={loading}
                label="Add reels"
                sublabel="or drag & drop here"
                onFiles={(files) => setReelFiles(files)}
                onReject={(rej) => showToast(rej[0]?.reason || "File rejected", "error")}
              />
            </Field>
          </div>

          {/* Upload staged media button (bottom-right, matching POST vibe) */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button
              type="button"
              style={datButtonLocal}
              disabled={loading || (!albumFiles.length && !reelFiles.length)}
              onClick={() =>
                saveCategory({
                  tag: "Media Upload",
                  fieldKeys: [], // uploads-only
                  uploadKinds: [
                    ...(albumFiles.length ? (["album"] as UploadKind[]) : []),
                    ...(reelFiles.length ? (["reel"] as UploadKind[]) : []),
                  ],
                })
              }
            >
              Upload Staged Media
            </button>
          </div>
        </div>
      }
      contactPanel={
        <div>
          <p style={explainStyleLocal}>
            Keep it calm: select the channels you use — then fields reveal.
          </p>

          {/* ✅ Keep your existing Contact UI here (chips + visibleSocials + primarySocial + FieldRenderer fallback) */}
<span style={subheadChipStyle} className="subhead-chip">
              Ways to reach you
            </span>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              {ALL_SOCIALS.map((k) => {
                const on = visibleSocials.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    className="dat-btn-ghost"
                    style={{ ...(datButtonGhost as any), opacity: on ? 1 : 0.55 }}
                    onClick={() => setVisibleSocials((v) => (on ? v.filter((x) => x !== k) : [...v, k]))}
                  >
                    {on ? "✓ " : ""} {k}
                  </button>
                );
              })}

              <select
                value={primarySocial}
                onChange={(e) => {
                  const v = e.target.value;
                  setPrimarySocial(v);
                  setProfile((p: any) => ({ ...p, primarySocial: v }));
                }}
                className="dat-btn-ghost"
                style={{ ...(datButtonGhost as any), padding: "10px 12px" }}
                title="Primary social"
              >
                {(visibleSocials.length ? visibleSocials : ["instagram"]).map((k) => (
                  <option key={k} value={k}>
                    {k} (primary)
                  </option>
                ))}
              </select>
            </div>

            {/* Prefer FieldRenderer in this file; fallback manual inputs if defs missing */}
            {renderFieldsOrNull(ContactEditKeys) ?? (
              <div style={{ display: "grid", gap: 12 }}>
                {ContactEditKeys.filter((k) => k !== "primarySocial").map((k) => (
                  <div key={k}>
                    <label style={labelStyle}>{k}</label>
                    <input
                      value={(profile as any)[k] || ""}
                      onChange={(e) => setProfile((p: any) => ({ ...p, [k]: e.target.value }))}
                      style={inputStyle}
                      placeholder={k === "publicEmail" ? "name@email.com" : "https://..."}
                    />
                  </div>
                ))}
                <p style={{ ...explainStyleLocal, marginTop: 6 }}>
                  (Fallback UI) Add contact keys to <code>PROFILE_FIELDS</code> if you want curated rendering.
                </p>
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                  onClick={() =>
                    saveCategory({
                      tag: "Contact",
                      fieldKeys: MODULES["Contact"].fieldKeys,
                      uploadKinds: MODULES["Contact"].uploadKinds,
                      afterSave: () => contactDraft.clearDraft(),
                    })
                  }
                style={datButtonLocal}
                className="dat-btn"
              >
                Save Contact
              </button>
            </div>

            <p style={{ ...explainStyleLocal, marginTop: 12 }}>
              Tip: toggle which socials you want visible above — hidden ones will be cleared on save.
            </p>
        </div>
      }
      storyPanel={
        <div>
          <p style={explainStyleLocal}>
            Your story becomes a map pin + memory. If you paste media, it should be a direct URL to the file.
          </p>

          {/* ✅ reuse your existing Story Map fields (FieldRenderer or Manual fallback) */}
          {renderFieldsOrNull(StoryMapEditKeys) ?? <ManualStoryMapFallback />}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button
              type="button"
              style={datButtonLocal}
              disabled={loading}
              onClick={() =>
                saveCategory({
                  tag: "Story Map",
                  fieldKeys: MODULES["StoryMap"].fieldKeys,
                  uploadKinds: [],
                })
              }
            >
              Publish Story to Map
            </button>
          </div>
        </div>
      }
      eventPanel={
        <div>
          <div id="studio-event-anchor" />
          <p style={explainStyleLocal}>
            Add your upcoming event and its image. (If you paste media, it should be a direct URL to the file.)
          </p>

          {/* Event fields */}
          {renderFieldsOrNull(UpcomingEventEditKeys) ?? <ManualUpcomingEventFallback />}

          {/* Event image: choose from library + upload */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <button type="button" style={studioGhostButton} onClick={() => openPicker("event")} disabled={loading}>
                Choose event image from library
              </button>
            </div>

            <Field label="Upload event image(s)">
              <Dropzone
                accept="image/*"
                multiple
                disabled={loading}
                label="Add event image(s)"
                sublabel="or drag & drop here"
                onFiles={(files) => setEventFiles(files)}
                onReject={(rej) => showToast(rej[0]?.reason || "File rejected", "error")}
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              <button
                type="button"
                style={studioGhostButton}
                disabled={loading || !eventFiles.length}
                onClick={() => setEventFiles([])}
              >
                Clear staged
              </button>
              <button
                type="button"
                style={datButtonLocal}
                disabled={loading || !eventFiles.length}
                onClick={() =>
                  saveCategory({
                    tag: "Event Image Upload",
                    fieldKeys: [], // uploads-only
                    uploadKinds: ["event"],
                  })
                }
              >
                Upload Event Image
              </button>
            </div>
          </div>

          {/* Save event fields */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button
              type="button"
              style={datButtonLocal}
              disabled={loading}
              onClick={() =>
                saveCategory({
                  tag: "Upcoming Event",
                  fieldKeys: MODULES["UpcomingEvent"].fieldKeys,
                  uploadKinds: [],
                })
              }
            >
              Save Event
            </button>
          </div>
        </div>
      }
    />

    {/* Keep your progress + Controls + FailedList rendering below the Studio (unchanged) */}
    {(progress.album.total > 0 ||
      progress.reel.total > 0 ||
      progress.event.total > 0 ||
      progress.headshot.total > 0) && (
      <div style={{ marginTop: 18 }}>
        {(["headshot", "album", "reel", "event"] as UploadKind[]).map((k) =>
          progress[k].total > 0 ? (
            <div key={k} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6 }}>
                {k[0].toUpperCase() + k.slice(1)} uploads {progress[k].pct}% &nbsp;(
                {prettyMB(progress[k].uploaded)} / {prettyMB(progress[k].total)} MB)
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
</div>


{SHOW_LEGACY_SECTIONS ? (
  <>
                {/* ====== 1) PROFILE BASICS ====== */}
          <Section>
            <span style={subheadChipStyle} className="subhead-chip">
              Profile details
            </span>
            <p style={explainStyleLocal} className="explain">
              Your professional name and slug are locked by default. If your professional name changed,
              unlock it and your slug preview will update automatically.
            </p>

            <div>
              <label htmlFor="slug" style={labelStyle}>
                Profile slug
              </label>
              <input id="slug" value={currentSlug} readOnly style={inputLockedStyle} />
              <p style={{ ...explainStyleLocal, marginTop: 6 }} className="explain">
                {autoDetected
                  ? "We auto-detected your current slug from Profile-Live."
                  : "Your slug mirrors your professional name."}
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
                <label htmlFor="name" style={labelStyle}>
                  Professional name
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setName(v);
                      setProfile((p: any) => ({ ...p, name: v }));
                    }}
                    style={nameLocked ? inputLockedStyle : inputStyle}
                    disabled={nameLocked}
                  />
                  <button
                    type="button"
                    className="dat-btn-ghost"
                    style={datButtonGhost}
                    onClick={() => setNameLocked((x) => !x)}
                  >
                    {nameLocked ? "My professional name changed" : "Lock name"}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="location" style={labelStyle}>
                  Base
                </label>
                <input
                  id="location"
                  value={location}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLocation(v);
                    setProfile((p: any) => ({ ...p, location: v }));
                  }}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={{ fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={isTrue(profile.isBiCoastal)}
                  onChange={(e) =>
                    setProfile((p: any) => ({
                      ...p,
                      isBiCoastal: e.target.checked ? "true" : "",
                    }))
                  }
                  style={{ marginRight: 10 }}
                />
                Bi-coastal
              </label>

              {isTrue(profile.isBiCoastal) ? (
                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>Second location</label>
                  <input
                    value={profile.secondLocation || ""}
                    onChange={(e) => setProfile((p: any) => ({ ...p, secondLocation: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              ) : null}
            </div>

            <div style={{ marginTop: 18 }}>
              <BackgroundSwatches
                value={String(profile.backgroundStyle || "kraft")}
                onChange={(next) => setProfile((p: any) => ({ ...p, backgroundStyle: next }))}
              />
            </div>

            <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
              <div>
                <label style={labelStyle}>Headshot URL (optional)</label>
                <input
                  value={profile.currentHeadshotUrl || ""}
                  onChange={(e) => setProfile((p: any) => ({ ...p, currentHeadshotUrl: e.target.value }))}
                  style={inputStyle}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label style={labelStyle}>Bio / Artist Statement (public)</label>
                <textarea
                  value={String(profile.bioLong ?? "")}
                  onChange={(e) => setProfile((p: any) => ({ ...p, bioLong: e.target.value }))}
                  rows={10}
                  style={{ ...inputStyle, minHeight: 220, resize: "vertical" }}
                />
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                onClick={() =>
                  saveCategory({
                    tag: "Profile Basics",
                    fieldKeys: MODULES["Basics"].fieldKeys,
                    uploadKinds: [],
                    afterSave: () => basicsDraft.clearDraft(),
                  })
                }
                style={datButtonLocal}
                className="dat-btn"
              >
                Save Profile Basics
              </button>
            </div>
          </Section>

        {/* ✅ ABOUT */}
          <Section>{renderFieldsOrNull(AboutEditKeys) ?? <ManualAboutFallback />}</Section>

        {/* ✅ PROGRAMS + TAGS */}
          <Section>{renderFieldsOrNull(TagsEditKeys) ?? <ManualTagsFallback />}</Section>

        {/* ✅ STORY MAP */}
          <Section>{renderFieldsOrNull(StoryMapEditKeys) ?? <ManualStoryMapFallback />}</Section>

        {/* ====== 2) CONTACT ====== */}
          <Section>
            <span style={subheadChipStyle} className="subhead-chip">
              Ways to reach you
            </span>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              {ALL_SOCIALS.map((k) => {
                const on = visibleSocials.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    className="dat-btn-ghost"
                    style={{ ...(datButtonGhost as any), opacity: on ? 1 : 0.55 }}
                    onClick={() => setVisibleSocials((v) => (on ? v.filter((x) => x !== k) : [...v, k]))}
                  >
                    {on ? "✓ " : ""} {k}
                  </button>
                );
              })}

              <select
                value={primarySocial}
                onChange={(e) => {
                  const v = e.target.value;
                  setPrimarySocial(v);
                  setProfile((p: any) => ({ ...p, primarySocial: v }));
                }}
                className="dat-btn-ghost"
                style={{ ...(datButtonGhost as any), padding: "10px 12px" }}
                title="Primary social"
              >
                {(visibleSocials.length ? visibleSocials : ["instagram"]).map((k) => (
                  <option key={k} value={k}>
                    {k} (primary)
                  </option>
                ))}
              </select>
            </div>

            {/* Prefer FieldRenderer in this file; fallback manual inputs if defs missing */}
            {renderFieldsOrNull(ContactEditKeys) ?? (
              <div style={{ display: "grid", gap: 12 }}>
                {ContactEditKeys.filter((k) => k !== "primarySocial").map((k) => (
                  <div key={k}>
                    <label style={labelStyle}>{k}</label>
                    <input
                      value={(profile as any)[k] || ""}
                      onChange={(e) => setProfile((p: any) => ({ ...p, [k]: e.target.value }))}
                      style={inputStyle}
                      placeholder={k === "publicEmail" ? "name@email.com" : "https://..."}
                    />
                  </div>
                ))}
                <p style={{ ...explainStyleLocal, marginTop: 6 }}>
                  (Fallback UI) Add contact keys to <code>PROFILE_FIELDS</code> if you want curated rendering.
                </p>
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                onClick={() =>
                  saveCategory({
                    tag: "Contact",
                    fieldKeys: MODULES["Contact"].fieldKeys,
                    afterSave: () => contactDraft.clearDraft(),
                  })
                }
                style={datButtonLocal}
                className="dat-btn"
              >
                Save Contact
              </button>
            </div>

            <p style={{ ...explainStyleLocal, marginTop: 12 }}>
              Tip: toggle which socials you want visible above — hidden ones will be cleared on save.
            </p>
          </Section>

        {/* ✅ CURRENT UPDATE */}
          <Section>{renderFieldsOrNull(UpdatesEditKeys) ?? <ManualUpdatesFallback />}</Section>

        {/* ✅ UPCOMING EVENT */}
        <div id="upcoming-event-section" ref={eventSectionRef}>
          <Section>{renderFieldsOrNull(UpcomingEventEditKeys) ?? <ManualUpcomingEventFallback />}</Section>
        </div>
  </>
) : null}

{/* Hidden submit */}
<form onSubmit={(e) => e.preventDefault()}>
  <button ref={saveBtnRef} type="submit" className="hidden">
    Save
  </button>
</form>

{/* Media Picker */}
<MediaPickerModal
  open={pickerOpen}
  onClose={() => setPickerOpen(false)}
  alumniId={stableAlumniId}
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


        {/* Global CSS */}
        <style jsx global>{`
  .alumni-update input,
  .alumni-update textarea,
  .alumni-update select {
    border: none !important;
    outline: none !important;
    background: #f2f2f2;
    color: #241123;
    border-radius: 10px;
    padding: 12px 14px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
    font-family: var(--font-space-grotesk), system-ui, sans-serif;
  }

  .alumni-update input:focus,
  .alumni-update textarea:focus,
  .alumni-update select:focus {
    outline: none !important;
    box-shadow: 0 0 0 3px rgba(217, 169, 25, 0.25),
      0 6px 18px rgba(0, 0, 0, 0.14);
  }

  .alumni-update textarea {
    width: 100%;
  }

  .alumni-update .dat-btn,
  .alumni-update .dat-btn-ghost {
    transition: transform 0.08s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  }

  /* Buttons/chips: opacity dip on hover */
  .alumni-update .dat-btn:hover,
  .alumni-update .dat-btn-ghost:hover {
    opacity: 0.88;
  }

  .alumni-update .dat-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.3);
  }

  .alumni-update .dat-btn-ghost:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.55);
  }

  /* Quick Update composer overrides */
  .alumni-update .update-composer textarea,
  .alumni-update textarea[data-update-composer] {
    background: #f2f2f2c8 !important;
    color: #241123 !important;
    box-shadow: inset 0 0 0 1px rgba(36, 17, 35, 0.10) !important;
    border-radius: 16px !important;
    padding: 14px 16px !important;
  }

  .alumni-update .update-composer textarea:focus,
  .alumni-update textarea[data-update-composer]:focus {
    box-shadow: 0 0 0 3px rgba(217, 169, 25, 0.18),
      inset 0 0 0 1px rgba(36, 17, 35, 0.14) !important;
  }

  /* Community feed name hover */
  .alumni-update a.feed-name {
    color: #6c00af;
    letter-spacing: 0.1em;
    text-decoration: none !important;
    transition: color 0.15s ease, letter-spacing 0.15s ease;
  }

  .alumni-update a.feed-name:hover {
    color: #f23359 !important;
    letter-spacing: 2px !important;
    text-decoration: none !important;
  }


`}</style>
      </div>
    </main>
  </div>
);
}

