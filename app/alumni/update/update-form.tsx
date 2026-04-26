"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";

import { MODULES, type ModuleKey } from "./liveModules";
import { boolCell } from "@/app/alumni/update/helpers/boolean";
import { baselineFromLookup } from "@/app/alumni/update/helpers/baseline";
import { toLiveSavableProfile, totalBytes, prettyMB } from "@/app/alumni/update/helpers/liveMap";
import {
  UpcomingEventEditKeys,
  ContactEditKeys,
  StoryMapEditKeys,
} from "@/app/alumni/update/constants/editKeys";
import ManualStoryMapFallback from "@/app/alumni/update/fallbacks/ManualStoryMapFallback";
import ManualUpcomingEventFallback from "@/app/alumni/update/fallbacks/ManualUpcomingEventFallback";
import { UploadProgressSection } from "@/app/alumni/update/uploads/UploadControls";


import { Section } from "./UpdateBits";
import {
  POINTER_MAP,
  type PointerAssets,
  slugify,
  alumniIdFromLookupPayload,
  slugFromLookupPayload,
  normalizeId,
  resolveTargetAlumniId,
  isImpersonating,
  renameForKind,
} from "./updateUtils";

import {
  COLOR,
  subheadChipStyle,
  explainStyleLocal,
  explainStyleLight,
  labelStyle,
  inputStyle,
  inputLockedStyle,
  datButtonLocal,
  datButtonGhost,
} from "./updateStyles";

import Image from "next/image";

import ProfileStudio, {
  type StudioTab,
  Field,
  Row,
  ghostButton as studioGhostButton,
} from "@/components/alumni/update/ProfileStudio";

import BasicsPanel from "@/app/alumni/update/studio/BasicsPanel";
import IdentityPanel from "@/app/alumni/update/studio/IdentityPanel";
import MediaPanel from "@/app/alumni/update/studio/MediaPanel";
import ContactPanel from "@/app/alumni/update/studio/ContactPanel";
import StoryPanel from "@/app/alumni/update/studio/StoryPanel";
import EventPanel from "@/app/alumni/update/studio/EventPanel";


import MediaPickerModal from "@/components/media/MediaPickerModal";
import {
  normalizeProfile,
  validateProfile,
  buildLiveChanges,
} from "@/components/alumni/formLogic";
import { PROFILE_FIELDS, PROFILE_GROUPS } from "@/components/alumni/fields";
import type { AlumniProfile } from "@/schemas";

import Toast from "@/components/alumni/update/Toast";

import FieldRenderer from "@/components/alumni/FieldRenderer";

import { createUploader, type UploadKind, type UploadTask } from "@/lib/uploader";
import { useDraft } from "@/lib/useDraft";

import Feed from "@/app/alumni/update/community/Feed";

const SHOW_LEGACY_SECTIONS = false; // legacy UI removed; Studio only

export default function UpdateForm({
  email,
  isAdmin = false,
  alumniId,
  impersonating = false,
}: {
  email: string;
  isAdmin?: boolean;
  alumniId?: string;
  impersonating?: boolean;
}) {

// ========================
// Identity: viewer vs target
// ========================

// Viewer identity is server-resolved via /api/alumni/owner.
// (Do NOT treat email as identity; it is only a lookup fallback.)
const [viewerAlumniIdFromSession, setViewerAlumniIdFromSession] = useState("");

// Admin impersonation inputs (page.tsx prop or query param)
const impersonationTargetIdProp = String(alumniId || "").trim();

// ✅ Allow impersonation if:
// - admin (prod/dev), OR
// - non-production (local/dev preview)
const canImpersonateHere = isAdmin || process.env.NODE_ENV !== "production";

// If page.tsx passed an alumniId, use it (admin-gated by canImpersonateHere).
const targetAlumniIdFromProp =
  canImpersonateHere && impersonationTargetIdProp ? impersonationTargetIdProp : "";


  useEffect(() => {
    let alive = true;
    const run = async () => {
    try {
      const r = await fetch("/api/alumni/owner?nocache=1", {
        cache: "no-store",
        credentials: "include",
      });
      const j = await r.json().catch(() => ({}));
      if (!alive) return;

      if (r.ok && j?.alumniId) {
        setViewerAlumniIdFromSession(String(j.alumniId).trim());
        return;
      }

      // Non-OK response or missing alumniId
      setViewerAlumniIdFromSession("");
    } catch {
      // Network / runtime error
      if (alive) setViewerAlumniIdFromSession("");
    }

    };
    run();
    return () => {
      alive = false;
    };
  }, []);

  const headshotUploadInFlight = useRef(false);
  const lastUploadedHeadshotRef = useRef<{ name: string; size: number; lastModified: number; fileId: string } | null>(null);
  const [basicsSavedRecently, setBasicsSavedRecently] = useState(false);
  const basicsSavedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [contactSavedRecently, setContactSavedRecently] = useState(false);
  const contactSavedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [identitySavedRecently, setIdentitySavedRecently] = useState(false);
  const identitySavedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [eventSavedRecently, setEventSavedRecently] = useState(false);
  const eventSavedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchParams = useSearchParams();

  const targetAlumniIdFromQuery = String(
    searchParams.get("alumniId") || searchParams.get("asId") || ""
  ).trim();

  const forceSlug = String(searchParams.get("slug") || "").trim();

  // target = profile being edited (admin-gated)
  const targetAlumniId = resolveTargetAlumniId({
    admin: canImpersonateHere,
    viewerAlumniId: normalizeId(viewerAlumniIdFromSession),
    targetAlumniIdFromQuery: normalizeId(targetAlumniIdFromProp || targetAlumniIdFromQuery),
  });

const lookupUrl = useMemo(() => {
  if (targetAlumniId) {
    return `/api/alumni/lookup?alumniId=${encodeURIComponent(targetAlumniId)}&nocache=1`;
  }

  if (forceSlug) {
    return `/api/alumni/lookup?slug=${encodeURIComponent(forceSlug)}&nocache=1`;
  }

  // Email is LAST-resort fallback only when we have no alumniId target.
  const e = String(email || "").trim();
  if (!e) return "";
  return `/api/alumni/lookup?email=${encodeURIComponent(e)}&nocache=1`;
}, [targetAlumniId, forceSlug, email]);

  // ✅ Hooks MUST be inside the component:
  const [studioTab, setStudioTab] = useState<StudioTab>("basics");

  const didInitTabFromQuery = useRef(false);

  useEffect(() => {
    if (didInitTabFromQuery.current) return;

    const raw = String(searchParams?.get("tab") || "").toLowerCase();
    const allowed: StudioTab[] = ["basics", "identity", "media", "contact", "story", "event"];

    if (allowed.includes(raw as StudioTab)) {
      setStudioTab(raw as StudioTab);
    }

    didInitTabFromQuery.current = true;
  }, [searchParams]);


  const tabToModule = useMemo(
    () =>
      ({
        basics: "Basics",
        identity: "Identity",
        media: "Basics",
        contact: "Contact",
        story: "StoryMap",
        event: "UpcomingEvent",
      }) as const satisfies Record<StudioTab, ModuleKey>,
    []
  );

  const activeModule: ModuleKey = tabToModule[studioTab];
  const mod = MODULES[activeModule];

  const [targetAlumniIdFromLookup, setTargetAlumniIdFromLookup] = useState("");

  // Viewer identity: only from session (or optional prop if you truly have one).
  const viewerAlumniId = String(viewerAlumniIdFromSession || "").trim();

  // Target identity (for loading/editing): from target resolver OR lookup payload
  const resolvedTargetAlumniId = String(
    targetAlumniId || targetAlumniIdFromLookup || ""
  ).trim();

  // stableAlumniId is the TARGET profile id (drives what loads into the form)
  const stableAlumniId = resolvedTargetAlumniId;

  const [studioMountKey, setStudioMountKey] = useState(0);

  useEffect(() => {
    // When the target person changes, force a full remount of the Studio subtree
    // so it cannot keep the previous person's baseline/draft state.
    setStudioMountKey((k) => k + 1);
  }, [stableAlumniId]);

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
    showWebsite: "",
    showPublicEmail: "",
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
    practiceTags: "",
    exploreCareTags: "",
    languages: "",
    currentTitle: "",
    currentWork: "",
    programs: "",
    tags: "",
    statusFlags: "",
    spotlight: "",

    currentHeadshotId: "",
    currentHeadshotUrl: "",
    featuredAlbumId: "",
    featuredReelId: "",
    featuredEventId: "",

    x: "",
    tiktok: "",
    threads: "",
    bluesky: "",
    linkedin: "",
    newsletter: "",
    primarySocial: "instagram",

    currentUpdateText: "",
    currentUpdateLink: "",
    currentUpdateExpiresAt: "",

    upcomingEventTitle: "",
    upcomingEventLink: "",
    upcomingEventDate: "",
    upcomingEventExpiresAt: "",
    upcomingEventDescription: "",
    upcomingEventCity: "",
    upcomingEventStateCountry: "",
    upcomingEventMediaType: "",
    upcomingEventMediaUrl: "",
    upcomingEventMediaAlt: "",
    upcomingEventVideoAutoplay: "",

    storyTitle: "",
    storyProgram: "",
    storyLocationName: "",
    storyYears: "",
    storyPartners: "",
    storyShortStory: "",
    storyQuote: "",
    storyQuoteAttribution: "",
    storyMediaUrl: "",
    storyMoreInfoUrl: "",
    storyCountry: "",
    storyShowOnMap: "",
    storyKey: "",
    storyTimeStamp: "",
  });

  // ✅ Single source of truth for "who is this?"
  const isLoaded = !!stableAlumniId && !!liveBaseline;

  // Dirty detection: compare live profile against last-saved baseline
  const contactDirty = useMemo(() => {
    if (!isLoaded) return false;
    return MODULES["Contact"].fieldKeys.some(
      (k) => String((profile as any)[k] ?? "") !== String((liveBaseline as any)[k] ?? "")
    );
  }, [profile, liveBaseline, isLoaded]);

  const basicsDirty = useMemo(() => {
    if (!isLoaded) return false;
    const nameChanged = name !== liveBaseline?.name;
    const locChanged = location !== liveBaseline?.location;
    return (
      nameChanged ||
      locChanged ||
      MODULES["Basics"].fieldKeys.some(
        (k) => String((profile as any)[k] ?? "") !== String((liveBaseline as any)[k] ?? "")
      )
    );
  }, [profile, liveBaseline, isLoaded, name, location]);

  const identityDirty = useMemo(() => {
    if (!isLoaded) return false;
    return MODULES["Identity"].fieldKeys.some(
      (k) => String((profile as any)[k] ?? "") !== String((liveBaseline as any)[k] ?? "")
    );
  }, [profile, liveBaseline, isLoaded]);

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
      showWebsite: "",
      showPublicEmail: "",
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
      newsletter: "",
      publicEmail: "",
      primarySocial: "instagram",
    },
    enabled: !!stableAlumniId,
  });

  /* media selections */
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [extraHeadshotFiles, setExtraHeadshotFiles] = useState<File[]>([]);
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
  const [signOutHover, setSignOutHover] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(
    null
  );
  const saveBtnRef = useRef<HTMLButtonElement | null>(null);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const showToastRef = useRef(showToast);

  const toastNow = (msg: string, type: "success" | "error" = "success") =>
    showToastRef.current?.(msg, type);

  function normalizeHeadshotUrl(u: string) {
    return u.trim().replace(/^http:\/\//i, "https://");
  }

  // Basics save handler — returns true on successful save
  async function handleSaveBasics(headshotUrl?: string): Promise<boolean> {
    setLoading(true);
    let didSave = false;
    let savedHeadshot: { url: string; id: string } | null = null;

    try {
      const alumniId = stableAlumniId;
      if (!alumniId) throw new Error("Profile not loaded yet.");
      if (!profile) throw new Error("Profile not loaded yet.");

      const hadStagedHeadshot = !!headshotFile;

      // Normalize URL input (trim + http→https)
      const normalizedHeadshotUrl = headshotUrl ? normalizeHeadshotUrl(headshotUrl) : undefined;

      // Apply URL-input override if provided (no staged file needed)
      let nextProfile: any = normalizedHeadshotUrl
        ? { ...profile, currentHeadshotUrl: normalizedHeadshotUrl, currentHeadshotId: "" }
        : profile;

      // Mark the chosen headshot current in Profile-Media before saveCategory writes Profile-Live.
      const stagedFileId = String(nextProfile.currentHeadshotId || "").trim();
      const baselineFileId = String(liveBaseline?.currentHeadshotId || "").trim();
      const stagedUrl = normalizeHeadshotUrl(String(nextProfile.currentHeadshotUrl || ""));
      const baselineUrl = normalizeHeadshotUrl(String(liveBaseline?.currentHeadshotUrl || ""));

      // Canonical externalUrl to feature: text-input arg takes precedence, then chooser selection
      const externalUrlToFeature =
        normalizedHeadshotUrl ||
        (!stagedFileId && stagedUrl && (baselineFileId || stagedUrl !== baselineUrl)
          ? stagedUrl
          : "");

      if (externalUrlToFeature) {
        // URL-based: flip isCurrent on the URL row; saveCategory writes currentHeadshotUrl to Profile-Live
        try {
          await fetch("/api/media/feature", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ alumniId, kind: "headshot", externalUrl: externalUrlToFeature }),
          });
        } catch {
          // non-fatal
        }
      } else if (stagedFileId && stagedFileId !== baselineFileId) {
        // File selected via chooser: flip isCurrent on the fileId row
        try {
          await fetch("/api/media/feature", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ alumniId, kind: "headshot", fileId: stagedFileId }),
          });
        } catch {
          // non-fatal: saveCategory will still persist currentHeadshotId to Profile-Live
        }
      } else if (!stagedFileId && !stagedUrl && !headshotFile) {
        // Saving intentionally empty headshot (user chose default/fallback).
        // Always clear Profile-Media — handles out-of-sync rows regardless of liveBaseline state.
        try {
          await fetch("/api/media/feature", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ alumniId, kind: "headshot", clear: true }),
          });
        } catch {
          // non-fatal
        }
      }

      if (headshotFile) {
        if (headshotUploadInFlight.current) {
          throw new Error("Headshot upload already in progress.");
        }

        // File-signature dedup: same file re-selected in this session → reuse cached fileId,
        // no new upload, no duplicate Profile-Media row.
        const fileSig = {
          name: headshotFile.name,
          size: headshotFile.size,
          lastModified: headshotFile.lastModified,
        };
        const prevUpload = lastUploadedHeadshotRef.current;
        const isSameFile =
          prevUpload &&
          prevUpload.name === fileSig.name &&
          prevUpload.size === fileSig.size &&
          prevUpload.lastModified === fileSig.lastModified;

        if (isSameFile) {
          nextProfile = { ...nextProfile, currentHeadshotId: prevUpload.fileId, currentHeadshotUrl: "" };
        } else {
          headshotUploadInFlight.current = true;
          try {
            const { url: uploadedUrl, fileId: uploadedFileId } = await uploadHeadshotViaQueue({
              file: headshotFile,
              alumniId,
            });

            const resolvedUrl = uploadedUrl.trim();
            const resolvedFileId = uploadedFileId.trim();

            if (resolvedUrl) {
              nextProfile = { ...profile, currentHeadshotUrl: resolvedUrl, currentHeadshotId: "" };
              setProfile(nextProfile);
            } else if (resolvedFileId) {
              // Drive file saved; store fileId so saveCategory writes it to Profile-Live correctly.
              nextProfile = { ...nextProfile, currentHeadshotId: resolvedFileId, currentHeadshotUrl: "" };
              lastUploadedHeadshotRef.current = { ...fileSig, fileId: resolvedFileId };
            }
          } finally {
            headshotUploadInFlight.current = false;
          }
        }
      }

      await saveCategory({
        tag: "Basics",
        fieldKeys: MODULES["Basics"].fieldKeys,
        uploadKinds: [],
        profileOverride: nextProfile,
        afterSave: () => {
          didSave = true;
          savedHeadshot = {
            url: String(nextProfile.currentHeadshotUrl ?? ""),
            id: String(nextProfile.currentHeadshotId ?? ""),
          };
          basicsDraft.clearDraft();
          setHeadshotFile(null);
          // Reset headshot progress bar — saveCategory uses uploadKinds:[] so never resets it
          setProgress((p) => ({ ...p, headshot: { uploaded: 0, total: 0, pct: 0 } }));
        },
      });

      // URL headshots: saveCategory may return "no changes" when Profile-Live already has the
      // correct URL, but the feature call above still ran. Treat that as success so the URL
      // input clears.
      if (!didSave && externalUrlToFeature) {
        didSave = true;
      }

      // Clear/default: saveCategory may return "no changes" when Profile-Live is already empty,
      // but the media clear above still ran. Treat that as success so the UI reflects the intent.
      if (!didSave && !stagedFileId && !stagedUrl && !headshotFile) {
        didSave = true;
        savedHeadshot = { url: "", id: "" };
      }

      if (didSave && savedHeadshot) {
        // Patch baseline + profile with what was saved — overrides any stale rehydrate data
        const sh = savedHeadshot as { url: string; id: string };
        setLiveBaseline((prev: any) => ({
          ...(prev ?? {}),
          currentHeadshotUrl: sh.url,
          currentHeadshotId: sh.id,
        }));
        setProfile((p: any) => ({
          ...p,
          currentHeadshotUrl: sh.url,
          currentHeadshotId: sh.id,
        }));

        // Flash the Save button to confirm success
        if (basicsSavedTimeoutRef.current) clearTimeout(basicsSavedTimeoutRef.current);
        setBasicsSavedRecently(true);
        basicsSavedTimeoutRef.current = setTimeout(() => setBasicsSavedRecently(false), 2500);
      }

      // Belt-and-suspenders: clear staged headshot on success even if saveCategory returned
      // "No changes to save." and afterSave was never called (e.g. re-selecting current headshot).
      if (didSave) {
        setHeadshotFile(null);
        // Fire-and-forget: upload extra headshots via direct fetch with isFeatured=FALSE.
        // Using fetch (not uploadHeadshotViaQueue) for two reasons:
        // 1. Avoids touching the shared headshotUploadResolver / progress bar, so the bar
        //    never reappears after the primary save clears it.
        // 2. isFeatured=FALSE tells the server not to overwrite the just-saved primary
        //    headshot in Profile-Live — prevents extras from clobbering the featured pointer.
        const extrasToUpload = extraHeadshotFiles;
        if (extrasToUpload.length > 0 && alumniId) {
          setExtraHeadshotFiles([]);
          (async () => {
            let uploaded = 0;
            for (const f of extrasToUpload) {
              try {
                const form = new FormData();
                form.append("file", f);
                form.append("alumniId", alumniId);
                form.append("kind", "headshot");
                form.append("isFeatured", "FALSE");
                const resp = await fetch("/api/upload", { method: "POST", body: form });
                if (resp.ok) uploaded++;
              } catch { /* best-effort */ }
            }
            if (uploaded > 0) showToastRef.current?.(`${uploaded} extra headshot${uploaded > 1 ? "s" : ""} uploaded ✓`);
          })();
        }
      }

      return didSave;
    } catch (e: any) {
      showToastRef.current?.(e?.message || "Save failed", "error");
      return false;
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

    // ------------------------------------------------------------
  // STORY MAP editor state (UI-only; NOT saved to Profile-Live)
  // ------------------------------------------------------------
  // STORY MAP pointer (saved in Profile-Live as storyKey)

  const read = (obj: any, ...keys: string[]) => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
    }
    return "";
  };

  function NOW_ISO() {
    return new Date().toISOString();
  }

  const clearStoryEditor = () => {
    setProfile((p: any) => ({
      ...p,

      // ✅ clear pointer (prevents "accidentally editing last-selected story")
      storyKey: "",

      // ✅ clear buffer fields
      storyTitle: "",
      storyProgram: "",
      storyLocationName: "",
      storyYears: "",
      storyPartners: "",
      storyShortStory: "",
      storyQuote: "",
      storyQuoteAttribution: "",
      storyMediaUrl: "",
      storyMoreInfoUrl: "",
      storyCountry: "",

      // ✅ default false
      storyShowOnMap: "",

      // ✅ new edit session timestamp
      storyTimeStamp: NOW_ISO(),
    }));
  };

// ------------------------------------------------------------
// MY STORIES (list for dropdown)
// ------------------------------------------------------------
type MyStory = {
  // canonical key (required)
  storyKey: string;

  // identity / ownership (often useful for debugging + display)
  alumniId?: string;
  author?: string;
  authorSlug?: string;

  // story fields (buffer-compatible names)
  storyTitle?: string;
  storyProgram?: string;
  storyLocationName?: string;
  storyYears?: string;
  storyPartners?: string;
  storyShortStory?: string;
  storyQuote?: string;
  storyQuoteAttribution?: string;
  storyMediaUrl?: string;
  storyMoreInfoUrl?: string;
  storyCountry?: string;
  storyShowOnMap?: any;

  // timestamp (Map Data is usually `ts`; your editor buffer uses `storyTimeStamp`)
  ts?: string;
  storyTimeStamp?: string;
};


const [myStories, setMyStories] = useState<MyStory[]>([]);
const [myStoriesLoading, setMyStoriesLoading] = useState(false);

const refreshMyStories = useCallback(
  async (targetIdArg?: string) => {
    const alumniIdForStories = String(targetIdArg ?? stableAlumniId ?? "").trim();

    if (!alumniIdForStories) {
      // Don’t toast on initial boot (avoids noise); just clear list.
      setMyStories([]);
      return;
    }

    setMyStoriesLoading(true);

    try {
      const url = `/api/map/my-stories?alumniId=${encodeURIComponent(alumniIdForStories)}`;
      const r = await fetch(url, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        const msg =
          r.status === 404
            ? 'My Stories endpoint not found (404). Check app/api/map/my-stories/route.ts exists and restart dev server.'
            : typeof j?.error === "string"
            ? j.error
            : `Couldn’t load My Stories (${r.status}).`;

        showToastRef.current?.(msg, "error");
        setMyStories([]);
        return;
      }

      const raw: any[] = Array.isArray(j?.stories)
        ? j.stories
        : Array.isArray(j?.items)
        ? j.items
        : [];

      const seen = new Set<string>();
      const cleaned: MyStory[] = [];
      let missingKey = 0;

      for (const it of raw) {
        const key = String(it?.storyKey || it?.story_key || it?.key || "").trim();
        if (!key) {
          missingKey++;
          continue;
        }
        if (seen.has(key)) continue;
        seen.add(key);

        cleaned.push({
          ...it,
          storyKey: key,

          alumniId: String(it?.alumniId || it?.alumni_id || ""),
          author: String(it?.author || it?.Author || it?.name || ""),
          authorSlug: String(it?.authorSlug || it?.author_slug || it?.slug || ""),

          storyTitle: String(it?.storyTitle || it?.title || it?.Title || ""),
          storyProgram: String(it?.storyProgram || it?.program || it?.Program || ""),
          storyLocationName: String(
            it?.storyLocationName || it?.locationName || it?.LocationName || ""
          ),
          storyYears: String(it?.storyYears || it?.years || it?.Years || ""),
          storyPartners: String(it?.storyPartners || it?.partners || it?.Partners || ""),
          storyShortStory: String(it?.storyShortStory || it?.shortStory || it?.ShortStory || ""),
          storyQuote: String(it?.storyQuote || it?.quote || it?.Quote || ""),
          storyQuoteAttribution: String(
            it?.storyQuoteAttribution || it?.quoteAttribution || it?.QuoteAttribution || ""
          ),
          storyMediaUrl: String(
            it?.storyMediaUrl || it?.mediaURL || it?.mediaUrl || it?.MediaURL || ""
          ),
          storyMoreInfoUrl: String(
            it?.storyMoreInfoUrl || it?.moreInfoLink || it?.moreInfoUrl || it?.MoreInfoLink || ""
          ),
          storyCountry: String(it?.storyCountry || it?.country || it?.Country || ""),
          storyShowOnMap: it?.storyShowOnMap ?? it?.showOnMap ?? it?.ShowOnMap,

          ts: String(it?.ts || it?.TS || ""),
          storyTimeStamp: String(it?.storyTimeStamp || it?.timestamp || it?.timeStamp || ""),
        });
      }

      cleaned.sort((a, b) => {
        const at = Date.parse(String(a.ts || a.storyTimeStamp || "")) || 0;
        const bt = Date.parse(String(b.ts || b.storyTimeStamp || "")) || 0;
        return bt - at;
      });

      setMyStories(cleaned);

      if (!cleaned.length && raw.length && missingKey === raw.length) {
        showToastRef.current?.(
          `Found ${raw.length} rows, but none had a storyKey. Check Map Data storyKey column + API mapping.`,
          "error"
        );
      }
    } catch (e: any) {
      setMyStories([]);
      showToastRef.current?.(e?.message || "Couldn’t load My Stories.", "error");
    } finally {
      setMyStoriesLoading(false);
    }
  },
  [stableAlumniId]
);

useEffect(() => {
  // Load when identity becomes available (session/admin/lookup).
  if (!stableAlumniId) return;
  refreshMyStories();
}, [stableAlumniId, refreshMyStories]);

async function onSelectStoryFromMyStories(storyKey: string) {
  const key = String(storyKey || "").trim();
  if (!key) return;

  // ✅ Prefer in-memory lookup (no per-select fetch)
  const row = (myStories || []).find(
    (s) => String((s as any)?.storyKey ?? "").trim() === key
  );

  // Optional fallback fetch if not found in list (safe, but ideally never needed)
  let data: any = row;

  // Safety net: should rarely run.
  // Protects against stale My Stories state or just-published rows.

  if (!data && key) {
    const r = await fetch(
      `/api/map/story?storyKey=${encodeURIComponent(key)}`,
      { cache: "no-store" }
    );
    if (r.ok) {
      const j = await r.json().catch(() => null);
      if (j?.item) data = j.item;
    }
  }

  if (!data) {
    showToastRef.current?.("Couldn’t load that story.", "error");
    return;
  }

  // ✅ Hydrate the editor buffer from the selected story row
  setProfile((p: any) => ({
    ...p,
    storyKey: key,

    storyTitle: read(data, "storyTitle", "title", "Title"),
    storyProgram: read(data, "storyProgram", "program", "Program"),
    storyLocationName: read(
      data,
      "storyLocationName",
      "locationName",
      "Location Name",
      "LocationName"
    ),
    storyYears: read(data, "storyYears", "years", "Year(s)", "Years"),
    storyPartners: read(data, "storyPartners", "partners", "Partners"),
    storyShortStory: read(
      data,
      "storyShortStory",
      "shortStory",
      "Short Story",
      "ShortStory"
    ),
    storyQuote: read(data, "storyQuote", "quote", "Quote"),
    storyQuoteAttribution: read(
      data,
      "storyQuoteAttribution",
      "quoteAttribution",
      "Quote Attribution",
      "QuoteAttribution"
    ),
    storyMediaUrl: read(
      data,
      "storyMediaUrl",
      "mediaURL",
      "mediaUrl",
      "Image URL",
      "Media URL"
    ),
    storyMoreInfoUrl: read(
      data,
      "storyMoreInfoUrl",
      "moreInfoLink",
      "moreInfoUrl",
      "More Info Link",
      "MoreInfoLink"
    ),
    storyCountry: read(data, "storyCountry", "country", "Country"),

    storyShowOnMap: boolCell(
      data?.storyShowOnMap ?? data?.showOnMap ?? data?.ShowOnMap
    ),

    storyTimeStamp: String(data?.ts || data?.storyTimeStamp || "") || NOW_ISO(),
  }));
}




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
  resolve: (result: { url: string; fileId: string }) => void;
  reject: (err: any) => void;
} | null>(null);

  /* MEDIA HUB click */
  const hubRef = useRef<HTMLDivElement | null>(null);

  const [primarySocial, setPrimarySocial] = useState<string>("instagram");

  // ✅ keep UI-only primarySocial state synced to profile.primarySocial
  // (no side-effects inside setProfile)
  useEffect(() => {
    const ps = String(profile?.primarySocial || "instagram");
    setPrimarySocial((prev) => (ps && ps !== prev ? ps : prev));
  }, [profile?.primarySocial]);

  const openPicker = (kind: "headshot" | "album" | "reel" | "event") => {
    if (!stableAlumniId) {
      showToastRef.current?.("Profile not loaded yet.", "error");
      return;
    }
    setPickerKind(kind);
    setPickerOpen(true);
  };

  const lastBasicsDraftSig = useRef<string>("");
  const lastContactDraftSig = useRef<string>("");

  // Browser leave warning when there are unsaved changes
  useEffect(() => {
    const anyDirty = contactDirty || basicsDirty || identityDirty || !!headshotFile;
    if (!anyDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [contactDirty, basicsDirty, identityDirty, headshotFile]);

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


  /* ---------- LOAD: hydrate from lookup(target first; email last) ---------- */
useEffect(() => {
  const run = async () => {
    try {
      const url = lookupUrl.startsWith("/") ? lookupUrl : `/${lookupUrl}`;
      const res = await fetch(url, { cache: "no-store", credentials: "include" });
      if (!res.ok) return;

      const j = await res.json();

      const slug = String(j?.canonicalSlug || j?.slug || "").trim();

      if (slug) {
        setCurrentSlug(slug);
        setOriginalSlug(slug);
        setAutoDetected(true);
      }

      // Target identity from lookup payload (NEVER viewer identity)
      const resolvedId = alumniIdFromLookupPayload(j);
      if (resolvedId) setTargetAlumniIdFromLookup(resolvedId);

      const nm = String(j?.name || "").trim();
      if (nm) setName(nm);

      const loc = String(j?.location || "").trim();
      if (loc) setLocation(loc);

      if (j?.status) setStatus(String(j.status));

      setLiveBaseline(baselineFromLookup(j, slug, nm, loc));

      setProfile((p: any) => ({
        ...p,

        name: nm || p.name,
        slug: slug || p.slug,
        location: loc || p.location,

        pronouns: String(j?.pronouns || p.pronouns || ""),
        roles: String(j?.roles || p.roles || ""),
        identityTags: String(j?.identityTags || p.identityTags || ""),
        practiceTags: String(j?.practiceTags || p.practiceTags || ""),
        exploreCareTags: String(j?.exploreCareTags || p.exploreCareTags || ""),
        languages: String(j?.languages || p.languages || ""),
        currentTitle: String(j?.currentTitle || p.currentTitle || ""),
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
        newsletter: String(j?.newsletter || p.newsletter || ""),
        publicEmail: String(j?.publicEmail || p.publicEmail || ""),
        showWebsite: String(j?.showWebsite ?? p.showWebsite ?? ""),
        showPublicEmail: String(j?.showPublicEmail ?? p.showPublicEmail ?? ""),

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
        upcomingEventDescription: String(j?.upcomingEventDescription || p.upcomingEventDescription || ""),
        upcomingEventCity: String(j?.upcomingEventCity || p.upcomingEventCity || ""),
        upcomingEventStateCountry: String(j?.upcomingEventStateCountry || p.upcomingEventStateCountry || ""),
        upcomingEventMediaType: String(j?.upcomingEventMediaType || p.upcomingEventMediaType || ""),
        upcomingEventMediaUrl: String(j?.upcomingEventMediaUrl || p.upcomingEventMediaUrl || ""),
        upcomingEventMediaAlt: String(j?.upcomingEventMediaAlt || p.upcomingEventMediaAlt || ""),
        upcomingEventVideoAutoplay: String(j?.upcomingEventVideoAutoplay || p.upcomingEventVideoAutoplay || ""),

        backgroundStyle: String(j?.backgroundStyle || p.backgroundStyle || "kraft"),
        // normalize into Live-cell shape (string "true" or "")
        isBiCoastal: boolCell(j?.isBiCoastal || p.isBiCoastal),
        secondLocation: String(j?.secondLocation || p.secondLocation || ""),

        currentHeadshotUrl: String(j?.currentHeadshotUrl || p.currentHeadshotUrl || ""),
        currentHeadshotId: String(j?.currentHeadshotId || p.currentHeadshotId || ""),
        featuredAlbumId: String(j?.featuredAlbumId || p.featuredAlbumId || ""),
        featuredReelId: String(j?.featuredReelId || p.featuredReelId || ""),
        featuredEventId: String(j?.featuredEventId || p.featuredEventId || ""),

        storyTitle: String(j?.storyTitle || p.storyTitle || ""),
        storyProgram: String(j?.storyProgram || p.storyProgram || ""),
        storyLocationName: String(j?.storyLocationName || p.storyLocationName || ""),
        storyYears: String(j?.storyYears || p.storyYears || ""),
        storyPartners: String(j?.storyPartners || p.storyPartners || ""),
        storyShortStory: String(j?.storyShortStory || p.storyShortStory || ""),
        storyQuote: String(j?.storyQuote || p.storyQuote || ""),
        storyQuoteAttribution: String(j?.storyQuoteAttribution || p.storyQuoteAttribution || ""),
        storyMediaUrl: String(j?.storyMediaUrl || p.storyMediaUrl || ""),
        storyMoreInfoUrl: String(j?.storyMoreInfoUrl || p.storyMoreInfoUrl || ""),
        storyCountry: String(j?.storyCountry || p.storyCountry || ""),
        storyShowOnMap: boolCell(j?.storyShowOnMap || p.storyShowOnMap),
        storyKey: String(j?.storyKey || p.storyKey || ""),
      }));

      if (j?.assets) setAssets(j.assets as PointerAssets);
    } catch {
      /* ignore */
    }
  };

  // ✅ Lookup allowed if:
  // - we have a target id (admin impersonation or self), OR
  // - we have a forced slug, OR
  // - we have email fallback (only when no target id)
  const canLookup =
    Boolean(lookupUrl) &&
    (Boolean(stableAlumniId) || Boolean(forceSlug) || Boolean(String(email || "").trim()));

  if (canLookup) run();
}, [lookupUrl, stableAlumniId, forceSlug, email]);

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
      const fileId = String((json as any)?.fileId || "").trim();
      const { resolve } = headshotUploadResolver.current;
      headshotUploadResolver.current = null;
      resolve({ url: String(url || "").trim(), fileId });
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
    showToastRef.current?.(err?.message || `Failed uploading ${task.file.name}`, "error");
  },

        onQueueEmpty: () => {
          // If uploadHeadshotViaQueue was awaiting but the queue drained without
          // completing the headshot (e.g., canceled), reject to unblock the caller.
          if (headshotUploadResolver.current) {
            const { reject } = headshotUploadResolver.current;
            headshotUploadResolver.current = null;
            reject(Object.assign(new Error("Upload canceled"), { canceled: true }));
          }
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
    showWebsite: String((profile as any).showWebsite ?? ""),
    showPublicEmail: String((profile as any).showPublicEmail ?? ""),
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
  (profile as any).showWebsite,
  (profile as any).showPublicEmail,
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

/**
 * ✅ Current Update save (tweet-style)
 * Calls /api/alumni/update (writes Live + appends Profile-Changes + optionally DAT_Testimonials)
 */
const saveCurrentUpdate = async (text: string, promptUsed = ""): Promise<string | null> => {
  const id = String(stableAlumniId || "").trim();
  if (!id) {
    showToastRef.current?.("Profile not loaded yet.", "error");
    return null;
  }



  const res = await fetch("/api/alumni/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      alumniId: id,
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

    showToastRef.current?.("Posted ✅");
    await refreshFeed();

    return id;
  } catch (err: any) {
    showToastRef.current?.(err?.message || "Update failed", "error");
    return null;
  }
};

async function uploadHeadshotViaQueue(opts: { file: File; alumniId: string }) {
  const { file, alumniId } = opts;
  if (!alumniId) throw new Error("Missing alumniId for upload.");

  const uploader = uploaderRef.current;
  if (!uploader) throw new Error("Uploader not ready.");

  if (headshotUploadResolver.current) {
    throw new Error("Headshot upload already in progress.");
  }

  const uploadResult = new Promise<{ url: string; fileId: string }>((resolve, reject) => {
    headshotUploadResolver.current = { resolve, reject };
  });

  uploader.enqueue({
    kind: "headshot",
    files: [file],
    formFields: { alumniId },
  });

  uploader.start();

  return await uploadResult; // resolves with { url, fileId }; rejects on upload error
}



async function rehydrate() {
  // Refresh using the same resolver as initial load (target alumniId first; email last).
  if (!lookupUrl) return;


  try {
    const url = lookupUrl.startsWith("/") ? lookupUrl : `/${lookupUrl}`;
    let r = await fetch(url, { cache: "no-store", credentials: "include" });

    // In production, the API's alumniId lookup returns 403 for non-admin users.
    // lookupUrl will have switched to the alumniId form once stableAlumniId is known,
    // so rehydrate() would silently no-op on every post-save refresh for those users,
    // leaving profile.currentHeadshotId stale and triggering the phantom synthetic slot
    // in HeadshotChooser. Fall back to the email path, which is always self-gated.
    if (r.status === 403 && String(email || "").trim()) {
      const emailFallback = `/api/alumni/lookup?email=${encodeURIComponent(String(email).trim())}&nocache=1`;
      r = await fetch(emailFallback, { cache: "no-store", credentials: "include" });
    }

    if (!r.ok) return;

    const j = await r.json();

    if (j?.status) setStatus(String(j.status));
    if (j?.assets) setAssets(j.assets as PointerAssets);

    const slug = String(j?.canonicalSlug || j?.slug || "").trim();

    // ✅ Same fallback: slug may BE the alumniId
    // (optional) if you want a separate "story list slug", add state for it.
    // Otherwise do nothing here.
    const s = slugFromLookupPayload(j);
    if (s) setCurrentSlug(s);



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
        practiceTags: String(j?.practiceTags || p.practiceTags || ""),
        exploreCareTags: String(j?.exploreCareTags || p.exploreCareTags || ""),
        languages: String(j?.languages || p.languages || ""),
        currentTitle: String(j?.currentTitle || p.currentTitle || ""),
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
        newsletter: String(j?.newsletter || p.newsletter || ""),
        publicEmail: String(j?.publicEmail || p.publicEmail || ""),
        showWebsite: String(j?.showWebsite ?? p.showWebsite ?? ""),
        showPublicEmail: String(j?.showPublicEmail ?? p.showPublicEmail ?? ""),

        programs: String(j?.programs || p.programs || ""),
        tags: String(j?.tags || p.tags || ""),
        statusFlags: String(j?.statusFlags || p.statusFlags || ""),
        spotlight: String(j?.spotlight || p.spotlight || ""),

        currentUpdateText: String(j?.currentUpdateText || p.currentUpdateText || ""),
        currentUpdateLink: String(j?.currentUpdateLink || p.currentUpdateLink || ""),
        currentUpdateExpiresAt: String(j?.currentUpdateExpiresAt || p.currentUpdateExpiresAt || ""),

        upcomingEventTitle:         String(j?.upcomingEventTitle         || p.upcomingEventTitle         || ""),
        upcomingEventLink:          String(j?.upcomingEventLink          || p.upcomingEventLink          || ""),
        upcomingEventDate:          String(j?.upcomingEventDate          || p.upcomingEventDate          || ""),
        upcomingEventExpiresAt:     String(j?.upcomingEventExpiresAt     || p.upcomingEventExpiresAt     || ""),
        upcomingEventDescription:   String(j?.upcomingEventDescription   || p.upcomingEventDescription   || ""),
        upcomingEventCity:          String(j?.upcomingEventCity          || p.upcomingEventCity          || ""),
        upcomingEventStateCountry:  String(j?.upcomingEventStateCountry  || p.upcomingEventStateCountry  || ""),
        featuredEventId:            String(j?.featuredEventId            || p.featuredEventId            || ""),
        upcomingEventMediaType:     String(j?.upcomingEventMediaType     || p.upcomingEventMediaType     || ""),
        upcomingEventMediaUrl:      String(j?.upcomingEventMediaUrl      || p.upcomingEventMediaUrl      || ""),
        upcomingEventMediaAlt:      String(j?.upcomingEventMediaAlt      || p.upcomingEventMediaAlt      || ""),
        upcomingEventVideoAutoplay: String(j?.upcomingEventVideoAutoplay || p.upcomingEventVideoAutoplay || ""),

        currentHeadshotUrl: String(j?.currentHeadshotUrl || p.currentHeadshotUrl || ""),
        currentHeadshotId: String(j?.currentHeadshotId || p.currentHeadshotId || ""),
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
        storyQuoteAttribution: String(j?.storyQuoteAttribution || p.storyQuoteAttribution || ""),
        storyMediaUrl: String(j?.storyMediaUrl || p.storyMediaUrl || ""),
        storyMoreInfoUrl: String(j?.storyMoreInfoUrl || p.storyMoreInfoUrl || ""),
        storyCountry: String(j?.storyCountry || p.storyCountry || ""),
        // ✅ normalize into Live-cell shape
        storyShowOnMap: boolCell(j?.storyShowOnMap || p.storyShowOnMap),
        storyKey: String(j?.storyKey || p.storyKey || ""),

      };

      return next;
    });

  } catch {
    /* ignore */
  }
}

async function saveStoryMapViaWriter(opts?: { clearAfter?: boolean }) {
  const targetId = String(stableAlumniId || "").trim();
  if (!targetId) {
    showToastRef.current?.("Profile not loaded yet.", "error");
    return;
  }

  const viewerId = String(viewerAlumniId || "").trim();
  if (!viewerId) {
    showToastRef.current?.("You must be signed in to publish.", "error");
    return;
  }

  setLoading(true);
  try {
    const keyNow = String(profile?.storyKey || "").trim();

    const required = [
      profile.storyTitle,
      profile.storyProgram,
      profile.storyLocationName,
      profile.storyCountry,
    ].map((x) => String(x || "").trim());

    if (required.some((x) => !x)) {
      showToastRef.current?.("Please fill Title, Program, Location Name, and Country.", "error");
      return;
    }
    const mode = keyNow ? "edit" : "create";

    // 1) Save the StoryMap buffer into Profile-Live first (writer reads from Profile-Live)
    const alumniSaveRes = await fetch("/api/alumni/save", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      alumniId: targetId,
      changes: {
          storyTitle: String(profile.storyTitle || "").trim(),
          storyProgram: String(profile.storyProgram || "").trim(),
          storyLocationName: String(profile.storyLocationName || "").trim(),
          storyYears: String(profile.storyYears || "").trim(),
          storyPartners: String(profile.storyPartners || "").trim(),
          storyShortStory: String(profile.storyShortStory || "").trim(),
          storyQuote: String(profile.storyQuote || "").trim(),
          storyQuoteAttribution: String(profile.storyQuoteAttribution || "").trim(),
          storyMediaUrl: String(profile.storyMediaUrl || "").trim(),
          storyMoreInfoUrl: String(profile.storyMoreInfoUrl || "").trim(),
          storyCountry: String(profile.storyCountry || "").trim(),
          storyShowOnMap: boolCell(profile.storyShowOnMap),

          // pointer + edit session
          storyKey: keyNow || "",
          storyTimeStamp: NOW_ISO(),
        },
        submittedByEmail: email || "",
        note: "story buffer save (pre-publish)",
      }),
    });

    const alumniSaveJson = await alumniSaveRes.json().catch(() => ({}));
    if (!alumniSaveRes.ok || !alumniSaveJson?.ok) {
      throw new Error(alumniSaveJson?.error || `Story buffer save failed (${alumniSaveRes.status})`);
    }
    // 2) Call Story Writer API to publish/edit
    const res = await fetch("/api/map/write-story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alumniId: targetId,

        // editor attribution (viewer)
        editorAlumniId: viewerId,
        editorSlug: String(currentSlug || profile.slug || "").trim() || "unknown",

        mode,
        storyKey: keyNow || undefined,
      }),
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j?.ok) throw new Error(j?.error || `Story publish failed (${res.status})`);

    const wasEditing = !!keyNow;
    showToastRef.current?.(wasEditing ? "Story updated ✅" : "Story published ✅", "success");

    const nextKey = String(j?.storyKey || j?.data?.storyKey || "").trim();

    if (nextKey) {
      // ✅ Persist pointer in Profile-Live buffer space
      setProfile((p: any) => ({
        ...p,
        storyKey: nextKey,
        // ✅ show "this is the current edit session"
        storyTimeStamp: NOW_ISO(),
      }));
    }

    // ✅ Persist pointer to Profile-Live so it survives reload
    await fetch("/api/alumni/save", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alumniId: targetId,
        changes: {
          storyKey: nextKey,
          storyTimeStamp: NOW_ISO(),
        },
        submittedByEmail: email || "",
        note: "story pointer save (post-publish)",
        skipChangeLog: true,
      }),
    });


    await refreshMyStories(targetId);

    // keep Profile-Live story fields out of canonical logic:
    // do NOT call /api/alumni/save. Optionally clear the buffer.
    if (opts?.clearAfter) {
      clearStoryEditor();
    }

  } catch (err: any) {
    showToastRef.current?.(err?.message || "Story publish failed", "error");
  } finally {
    setLoading(false);
  }
}

/* per-category save + uploads */
async function saveCategory({
  tag,
  fieldKeys = [],
  uploadKinds = [],
  afterSave,
  profileOverride,
}: {
  tag: string;
  fieldKeys?: string[];
  uploadKinds?: UploadKind[];
  afterSave?: () => void;
  profileOverride?: any;
}) {
  const alumniId = String(stableAlumniId || "").trim();
  if (!alumniId) {
    showToastRef.current?.("Profile not loaded yet.", "error");
    return;
  }

const submittedBy = String(email || "").trim();
const viewerId = String(viewerAlumniId || "").trim(); // available for admin-only logging if desired

  // ------------------------------------------------------------
  // ✅ Story Map: canonical writer ONLY (no /api/alumni/save)
  // ------------------------------------------------------------
  const tagKey = String(tag).trim().toLowerCase();
  if (activeModule === "StoryMap" || tagKey === "story map" || tagKey === "storymap") {
    await saveStoryMapViaWriter();
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
    const baseFields: Record<string, string> = { alumniId: stableAlumniId };
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
  showToastRef.current?.("Nothing to save.", "success");
  setLoading(false);
  return;
}

if (hasUploads) {
  if (queueEmptyResolver.current) {
    throw new Error("Upload queue is already being awaited.");
  }

  const waitForQueue = new Promise<void>((resolve) => {
    queueEmptyResolver.current = () => {
      queueEmptyResolver.current = null;
      resolve();
    };
  });
  uploader.start();
  await waitForQueue;

  // Guard: if no tasks for these kinds actually completed (e.g. user canceled),
  // don't treat the emptied queue as success — leave staged files intact.
  const anyCompleted = uploader.getTasks().some(
    (t) => uploadKinds.includes(t.kind) && t.status === "completed"
  );
  if (!anyCompleted) {
    setLoading(false);
    return;
  }

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

    showToastRef.current?.("Upload complete ✅");
    await rehydrate();
    return;
  }
}


    // CONTACT: ensure primarySocial is in sync before save
    let profileForSave: any = profileOverride ?? profile;

    if (tagKey === "contact") {
      const next = { ...(profileForSave as any), primarySocial };
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
      showToastRef.current?.(firstMsg, "error");
      setLoading(false);
      return;
    }

    const baseline =
      liveBaseline ?? (baselineFromLookup({}, originalSlug || currentSlug, name, location) as any);

    const changesAll = buildLiveChanges(baseline as any, mergedLive as any) as Record<string, any>;

    const wanted = new Set(fieldKeys);
    const changes = Object.fromEntries(Object.entries(changesAll).filter(([k]) => wanted.has(k)));
    
    if (Object.keys(changes).length === 0) {
      showToastRef.current?.("No changes to save.", "success");
      setLoading(false);
      return;
    }

    const body = {
      alumniId: stableAlumniId,
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
    showToastRef.current?.(`Category saved — profile updated.`);
    await rehydrate();
  } catch (err: any) {
    showToastRef.current?.(err?.message || "Something went wrong", "error");
  } finally {
    setLoading(false);
  }
}




return (
  <div className="alumni-update">
    {/* HERO */}
    <div
      style={{
        position: "relative",
        height: "95vh",
        overflow: "hidden",
        zIndex: 15,
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
      <div style={{ position: "absolute", bottom: "1rem", right: "5%", zIndex: 20 }}>
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
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/" })}
          onMouseEnter={() => setSignOutHover(true)}
          onMouseLeave={() => setSignOutHover(false)}
          style={{
            display: "block",
            marginLeft: "auto",
            marginTop: 6,
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            background: signOutHover ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)",
            color: signOutHover ? "rgba(242,242,242,1)" : "rgba(242,242,242,0.6)",
            border: signOutHover
              ? "1px solid rgba(242,242,242,0.55)"
              : "1px solid rgba(242,242,242,0.25)",
            borderRadius: 4,
            cursor: "pointer",
            padding: "4px 12px",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            transition: "background 0.15s, color 0.15s, border-color 0.15s",
            outline: "none",
          }}
        >
          Sign out
        </button>
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
        <Feed
          email={email}
          isAdmin={Boolean(isAdmin)}
          stableAlumniId={stableAlumniId}
          feed={feed}
          feedLoading={feedLoading}
          postCurrentUpdate={postCurrentUpdate}
          undoPostedUpdate={undoPostedUpdate}
          openEventAndScroll={openEventAndScroll}
          showToastRef={showToastRef}
          isLoaded={isLoaded}
          COLOR={COLOR}
          explainStyleLight={explainStyleLight}
        />
</div>

{/* ====== PROFILE STUDIO (replaces MediaHub container) ====== */}

{isAdmin && impersonating && alumniId ? (
  <div className="flex justify-center mb-8">
    <div
      style={{
        backgroundColor: "rgba(255, 204, 0, 0.6)", // soft DAT yellow
        color: "#244123",
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        fontWeight: 700,
        fontSize: "1.2rem",
        letterSpacing: "0.14em",
        padding: "14px 28px",   // ← clear, visible padding
        borderRadius: "18px",
        marginBottom: "1rem",
      }}
    >
      ATTN ADMIN: Now editing as {alumniId}
    </div>
  </div>
) : null}


<div
  style={{
    margin: "0.25rem 0 3.25rem",
    paddingLeft: "clamp(0.25rem, 5vw, 4rem)",
    paddingRight: "clamp(0.25rem, 5vw, 4rem)",
    boxSizing: "border-box",
  }}
>
  <div
    style={{
      background: "rgba(36, 17, 35, 0.22)",
      borderRadius: 16,
      padding: "16px 16px 18px",
      color: COLOR.snow,
    }}
  >
    <div className="mx-auto w-full max-w-6xl">
      <style>{`
      @keyframes datSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
      fontSize: 14,
      textTransform: "uppercase",
      fontWeight: 700,
      letterSpacing: ".1em",
      opacity: 0.9,
      marginBottom: 12,
      paddingLeft: 2,
      paddingRight: 2,
    }}
  >
    <span>Profile Studio</span>

    {loading ? (
      <span
        aria-label="Loading"
        style={{
          width: 14,
          height: 14,
          borderRadius: 999,
          border: "2px solid rgba(255,255,255,0.25)",
          borderTopColor: "rgba(255,255,255,0.9)",
          animation: "datSpin 0.8s linear infinite",
        }}
      />
    ) : null}
  </div>

<div
  key={`${stableAlumniId}:${studioMountKey}`}
>
  <ProfileStudio
    defaultTab={studioTab}
    onTabChange={setStudioTab}
    loading={loading}
    onOpenPicker={(k) => openPicker(k)}
    adminHref={isAdmin ? "/admin/invites" : undefined}
    basicsPanel={
      <BasicsPanel
        explainStyleLocal={explainStyleLocal}
        subheadChipStyle={subheadChipStyle}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
        inputLockedStyle={inputLockedStyle}
        datButtonLocal={datButtonLocal}
        COLOR={COLOR}
        loading={loading}
        isDirty={basicsDirty}
        autoDetected={autoDetected}
        currentSlug={currentSlug}
        name={name}
        setName={setName}
        nameLocked={nameLocked}
        setNameLocked={setNameLocked}
        location={location}
        setLocation={setLocation}
        profile={profile}
        setProfile={setProfile}
        headshotFile={headshotFile}
        setHeadshotFile={setHeadshotFile}
        headshotPreviewUrl={headshotPreviewUrl}
        extraHeadshotFiles={extraHeadshotFiles}
        onExtraHeadshotFiles={setExtraHeadshotFiles}
        toast={toastNow}
        openPicker={openPicker}
        onSave={handleSaveBasics}
        savedRecently={basicsSavedRecently}
        alumniId={stableAlumniId}
        onHeadshotFeatured={async (fileId) => {
          setAssets((a) => ({ ...a, [POINTER_MAP["headshot"]]: fileId }));
          showToastRef.current?.("Headshot updated — profile basics will reflect the change shortly.");
          await rehydrate();
        }}
      />
    }
    identityPanel={
      <IdentityPanel
        explainStyleLocal={explainStyleLocal}
        subheadChipStyle={subheadChipStyle}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
        datButtonLocal={datButtonLocal}
        loading={loading}
        isDirty={identityDirty}
        profile={profile}
        setProfile={setProfile}
        renderFieldsOrNull={renderFieldsOrNull}
        MODULES={MODULES as any}
        saveCategory={saveCategory as any}
        savedRecently={identitySavedRecently}
        onSaved={() => {
          if (identitySavedTimeoutRef.current) clearTimeout(identitySavedTimeoutRef.current);
          setIdentitySavedRecently(true);
          identitySavedTimeoutRef.current = setTimeout(() => setIdentitySavedRecently(false), 2500);
        }}
      />
    }
    mediaPanel={
      <MediaPanel
        explainStyleLocal={explainStyleLocal}
        subheadChipStyle={subheadChipStyle}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
        datButtonLocal={datButtonLocal}
        loading={loading}
        albumName={albumName}
        setAlbumName={setAlbumName}
        albumFiles={albumFiles}
        setAlbumFiles={setAlbumFiles}
        reelFiles={reelFiles}
        setReelFiles={setReelFiles}
        openPicker={openPicker}
        showToastError={(msg) => showToastRef.current?.(msg, "error")}
        saveCategory={saveCategory as any}
      />
    }
    contactPanel={
      <ContactPanel
        explainStyleLocal={explainStyleLocal}
        subheadChipStyle={subheadChipStyle}
        datButtonLocal={datButtonLocal}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
        loading={loading}
        isDirty={contactDirty}
        primarySocial={primarySocial}
        setPrimarySocial={setPrimarySocial}
        profile={profile}
        setProfile={setProfile}
        saveCategory={saveCategory as any}
        contactFieldKeys={MODULES["Contact"].fieldKeys}
        onClearDraft={() => contactDraft.clearDraft()}
        savedRecently={contactSavedRecently}
        onSaved={() => {
          if (contactSavedTimeoutRef.current) clearTimeout(contactSavedTimeoutRef.current);
          setContactSavedRecently(true);
          contactSavedTimeoutRef.current = setTimeout(() => setContactSavedRecently(false), 2500);
        }}
      />
    }
    storyPanel={
      <StoryPanel
        loading={loading}
        explainStyleLocal={explainStyleLocal}
        datButtonLocal={datButtonLocal}
        datButtonGhost={datButtonGhost}
        subheadChipStyle={subheadChipStyle}
        profile={profile}
        setProfile={setProfile}
        clearStoryEditor={clearStoryEditor}
        saveStoryMapViaWriter={saveStoryMapViaWriter}
        myStories={myStories}
        myStoriesLoading={myStoriesLoading}
        refreshMyStories={refreshMyStories}
        onSelectStoryFromMyStories={onSelectStoryFromMyStories}
        renderFieldsOrNull={renderFieldsOrNull}
        storyMapEditKeys={StoryMapEditKeys}
        manualFallback={
          <ManualStoryMapFallback
            profile={profile}
            setProfile={setProfile}
            labelStyle={labelStyle}
            inputStyle={inputStyle}
            explainStyleLocal={explainStyleLocal}
          />
        }
      />
    }
    eventPanel={
      <EventPanel
        loading={loading}
        explainStyleLocal={explainStyleLocal}
        subheadChipStyle={subheadChipStyle}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
        datButtonLocal={datButtonLocal}
        profile={profile}
        setProfile={setProfile}
        renderFieldsOrNull={renderFieldsOrNull}
        eventEditKeys={UpcomingEventEditKeys}
        saveCategory={saveCategory as any}
        eventFieldKeys={UpcomingEventEditKeys}
        eventFile={eventFiles[0] ?? null}
        onEventFileChange={(f) => setEventFiles(f ? [f] : [])}
        savedRecently={eventSavedRecently}
        onSaved={() => {
          if (eventSavedTimeoutRef.current) clearTimeout(eventSavedTimeoutRef.current);
          setEventSavedRecently(true);
          eventSavedTimeoutRef.current = setTimeout(() => setEventSavedRecently(false), 2500);
        }}
        manualFallback={
          <ManualUpcomingEventFallback
            profile={profile}
            setProfile={setProfile}
            labelStyle={labelStyle}
            inputStyle={inputStyle}
            explainStyleLocal={explainStyleLocal}
          />
        }
      />
    }

  />
</div>


    {/* Keep your progress + Controls + FailedList rendering below the Studio (unchanged) */}
    <UploadProgressSection
      progress={progress}
      failed={failed}
      loading={loading}
      uploaderRef={uploaderRef}
      stableAlumniId={stableAlumniId}
      datButtonGhost={datButtonGhost}
      COLOR={COLOR}
      setFailed={setFailed}
    />
  </div>
</div>


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
  title={pickerKind === "headshot" ? "Choose a past headshot" : `Choose ${pickerKind}`}
  onFeatured={async (fileId?: string) => {
    if (fileId) {
      const key = POINTER_MAP[pickerKind];
      setAssets((a) => ({ ...a, [key]: fileId }));
    }
    const msg = pickerKind === "headshot"
      ? "Headshot updated — profile basics will reflect the change shortly."
      : "Featured media updated.";
    showToastRef.current?.(msg);
    await rehydrate();
  }}
/>

{/* Toast */}
{toast ? <Toast msg={toast.msg} type={toast.type} /> : null}


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

  /* Identity panel: pronouns + languages stack on mobile */
  @media (max-width: 600px) {
    .alumni-update .identity-pair-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Layer picker card header hover */
  .alumni-update .layer-card-header {
    transition: background 0.15s ease;
  }
  .alumni-update .layer-card-header:hover {
    background: rgba(255, 255, 255, 0.06) !important;
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

