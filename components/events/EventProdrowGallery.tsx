"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

/** Returns true when window width is ≤ 640px (mobile). SSR-safe. */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}
import Link from "next/link";
import Lightbox from "@/components/shared/Lightbox";

export type ProdrowImage = { src: string; alt?: string };

interface EventProdrowGalleryProps {
  /** Main production photos */
  images: ProdrowImage[];
  /** Photo credit string (e.g. "Jane Smith") */
  photoCredit?: string;
  /** Optional link on the photo credit name */
  photographerHref?: string;
  /** Link to full album */
  albumHref?: string;
  albumLabel?: string;
  /** Maximum images shown before "See More" — defaults to 3 (one row) */
  maxVisible?: number;
  /** Optional "From the Field" / BTS second gallery */
  fieldImages?: ProdrowImage[];
  fieldGalleryTitle?: string;
  /** Spanish version of the field gallery title */
  fieldGalleryTitleEs?: string;
  fieldAlbumHref?: string;
  /** Whether the page is bilingual (ES/EN toggle active) */
  bilingual?: boolean;
  /** Alternate (non-English) language code for the page, e.g. "es" or "sk" */
  altLang?: string;
}

function cleanStr(val: string | null | undefined): string | undefined {
  const s = val?.trim();
  return s || undefined;
}

function cleanHref(val: string | null | undefined): string | undefined {
  const s = val?.trim();
  if (!s || s === "#") return undefined;
  return s;
}

/* Alternate-language chrome labels. "es" preserves the original Spanish UI;
   languages without an entry fall back to the English label. */
const GALLERY_CHROME: Record<string, Record<string, string>> = {
  es: {
    productionGallery: "Galer\u00eda de Producci\u00f3n",
    photosBy: "Fotos por",
    seeLess: "VER MENOS",
    seeMore: "VER M\u00c1S",
    openAlbum: "ABRIR \u00c1LBUM COMPLETO",
  },
  sk: {
    productionGallery: "Fotogal\u00e9ria",
    photosBy: "Foto:",
    seeLess: "ZOBRAZI\u0164 MENEJ",
    seeMore: "ZOBRAZI\u0164 VIAC",
    openAlbum: "OTVORI\u0164 CEL\u00dd ALBUM",
  },
};

/* ─── Main production gallery (3-col grid) ───────────────────────────────── */
function PhotoRowSection({
  images,
  photoCredit,
  photographerHref,
  albumHref,
  albumLabel,
  maxVisible = 3,
  bilingual,
  altLang = "es",
}: {
  images: ProdrowImage[];
  photoCredit?: string;
  photographerHref?: string;
  albumHref?: string;
  albumLabel?: string;
  maxVisible?: number;
  bilingual?: boolean;
  altLang?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();
  const effectiveMax = isMobile ? 2 : maxVisible;

  const safeImages = useMemo(() => {
    return (images ?? []).flatMap((img) => {
      const src = cleanStr(img?.src);
      if (!src) return [];
      return [{ src, alt: cleanStr(img?.alt) ?? "" }];
    });
  }, [images]);

  if (!safeImages.length) return null;

  const hasMore = safeImages.length > effectiveMax;
  const visible = expanded ? safeImages : safeImages.slice(0, effectiveMax);
  const photographerSafe = cleanStr(photoCredit);
  const photographerHrefSafe = cleanHref(photographerHref);
  const albumHrefSafe = cleanHref(albumHref);
  const baseLabel = cleanStr(albumLabel) ?? "OPEN FULL ALBUM";

  return (
    <div className="evd-prodrow-block" aria-label="Production Gallery">
      <div className="evd-prodrow-head">
        <h3 className="evd-prodrow-title">
          {bilingual ? (
            <>
              <span className="evd-bilingual-wrap-default">Production Gallery</span>
              <span className={`evd-bilingual-wrap-alt evd-bilingual-${altLang}`}>{GALLERY_CHROME[altLang]?.productionGallery ?? "Production Gallery"}</span>
            </>
          ) : "Production Gallery"}
        </h3>
        {photographerSafe && (
          <div className="evd-prodrow-credit">
            {bilingual ? (
              <>
                <span className="evd-bilingual-wrap-default">Photos by{" "}</span>
                <span className={`evd-bilingual-wrap-alt evd-bilingual-${altLang}`}>{GALLERY_CHROME[altLang]?.photosBy ?? "Photos by"}{" "}</span>
              </>
            ) : "Photos by "}
            {photographerHrefSafe ? (
              <Link href={photographerHrefSafe} className="evd-prodrow-album">
                {photographerSafe}
              </Link>
            ) : (
              photographerSafe
            )}
          </div>
        )}
      </div>

      <div className="evd-prodrow-grid" role="list">
        {visible.map((img, i) => (
          <button
            key={`${img.src}-${i}`}
            className="evd-prodrow-card"
            onClick={() => setOpen(i)}
            aria-label={`Open photo ${i + 1}`}
            type="button"
            role="listitem"
          >
            <div className="evd-prodrow-img-shell">
              <Image
                src={img.src}
                alt={img.alt || "Production photo"}
                fill
                sizes="(max-width: 640px) 44vw, (max-width: 1200px) 30vw, 380px"
                className="object-cover"
              />
            </div>
          </button>
        ))}
      </div>

      <div className="evd-prodrow-footer">
        <div>
          {hasMore && (
            <button
              type="button"
              className="evd-prodrow-toggle"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {bilingual ? (
                expanded ? (
                  <>
                    <span className="evd-bilingual-wrap-default">SEE LESS</span>
                    <span className={`evd-bilingual-wrap-alt evd-bilingual-${altLang}`}>{GALLERY_CHROME[altLang]?.seeLess ?? "SEE LESS"}</span>
                  </>
                ) : (
                  <>
                    <span className="evd-bilingual-wrap-default">SEE MORE</span>
                    <span className={`evd-bilingual-wrap-alt evd-bilingual-${altLang}`}>{GALLERY_CHROME[altLang]?.seeMore ?? "SEE MORE"}</span>
                  </>
                )
              ) : (expanded ? "SEE LESS" : "SEE MORE")}
            </button>
          )}
        </div>
        <div>
          {albumHrefSafe && (
            <a
              href={albumHrefSafe}
              className="evd-prodrow-album"
              target="_blank"
              rel="noopener noreferrer"
            >
              {bilingual ? (
                <>
                  <span className="evd-bilingual-wrap-default">{baseLabel} ↗</span>
                  <span className={`evd-bilingual-wrap-alt evd-bilingual-${altLang}`}>{GALLERY_CHROME[altLang]?.openAlbum ?? "OPEN FULL ALBUM"} ↗</span>
                </>
              ) : `${baseLabel} ↗`}
            </a>
          )}
        </div>
      </div>

      {open !== null && (
        <Lightbox
          images={safeImages.map((i) => i.src)}
          startIndex={open}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

/* ─── Field / BTS gallery (3-col desktop, 2-col mobile) ──────────────────── */
function FieldGridSection({
  images,
  title,
  titleEs,
  albumHref,
  bilingual,
  altLang = "es",
}: {
  images: ProdrowImage[];
  title?: string;
  titleEs?: string;
  albumHref?: string;
  bilingual?: boolean;
  altLang?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();
  const effectiveMax = isMobile ? 2 : 3;

  const safeTitle = cleanStr(title) ?? "From the Field";
  const safeTitleEs = cleanStr(titleEs) ?? "Del Campo";

  const safeImages = useMemo(() => {
    return (images ?? []).flatMap((img) => {
      const src = cleanStr(img?.src);
      if (!src) return [];
      return [{ src, alt: cleanStr(img?.alt) ?? "" }];
    });
  }, [images]);

  if (!safeImages.length) return null;

  const hasMore = safeImages.length > effectiveMax;
  const visible = expanded ? safeImages : safeImages.slice(0, effectiveMax);
  const albumHrefSafe = cleanHref(albumHref);

  return (
    <div className="evd-fieldgrid-block" aria-label={safeTitle}>
      <h3 className="evd-about-head" style={{ marginTop: "1.5rem" }}>
        {bilingual ? (
          <>
            <span className="evd-bilingual-wrap-default">{safeTitle}</span>
            <span className={`evd-bilingual-wrap-alt evd-bilingual-${altLang}`}>{altLang === "es" && safeTitleEs ? safeTitleEs : safeTitle}</span>
          </>
        ) : safeTitle}
      </h3>

      <div className="evd-fieldgrid-track" role="list">
        {visible.map((img, i) => (
          <button
            key={`${img.src}-${i}`}
            className="evd-fieldgrid-card"
            onClick={() => setOpen(i)}
            aria-label={`Open photo ${i + 1}`}
            type="button"
            role="listitem"
          >
            <div className="evd-fieldgrid-img-shell">
              <Image
                src={img.src}
                alt={img.alt || safeTitle}
                fill
                sizes="(max-width: 640px) 44vw, (max-width: 1200px) 30vw, 380px"
                className="object-cover"
              />
            </div>
          </button>
        ))}
      </div>

      <div className="evd-fieldgrid-footer">
        {hasMore && (
          <button
            type="button"
            className="evd-prodrow-toggle"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            style={{ marginRight: "auto" }}
          >
            {bilingual ? (
              expanded ? (
                <>
                  <span className="evd-bilingual-wrap-default">SEE LESS</span>
                  <span className={`evd-bilingual-wrap-alt evd-bilingual-${altLang}`}>{GALLERY_CHROME[altLang]?.seeLess ?? "SEE LESS"}</span>
                </>
              ) : (
                <>
                  <span className="evd-bilingual-wrap-default">SEE MORE</span>
                  <span className={`evd-bilingual-wrap-alt evd-bilingual-${altLang}`}>{GALLERY_CHROME[altLang]?.seeMore ?? "SEE MORE"}</span>
                </>
              )
            ) : (expanded ? "SEE LESS" : "SEE MORE")}
          </button>
        )}
        {albumHrefSafe && (
          <a
            href={albumHrefSafe}
            className="evd-prodrow-album"
            target="_blank"
            rel="noopener noreferrer"
          >
            {bilingual ? (
              <>
                <span className="evd-bilingual-wrap-default">OPEN FULL ALBUM ↗</span>
                <span className={`evd-bilingual-wrap-alt evd-bilingual-${altLang}`}>{GALLERY_CHROME[altLang]?.openAlbum ?? "OPEN FULL ALBUM"} ↗</span>
              </>
            ) : "OPEN FULL ALBUM ↗"}
          </a>
        )}
      </div>

      {open !== null && (
        <Lightbox
          images={safeImages.map((i) => i.src)}
          startIndex={open}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

/* ─── Combined export ─────────────────────────────────────────────────────── */
export default function EventProdrowGallery({
  images,
  photoCredit,
  photographerHref,
  albumHref,
  albumLabel,
  maxVisible = 3,
  fieldImages,
  fieldGalleryTitle,
  fieldGalleryTitleEs,
  fieldAlbumHref,
  bilingual,
  altLang = "es",
}: EventProdrowGalleryProps) {
  const hasMain = (images?.length ?? 0) > 0;
  const hasField = (fieldImages?.length ?? 0) > 0;

  if (!hasMain && !hasField) return null;

  return (
    <>
      {hasMain && (
        <PhotoRowSection
          images={images}
          photoCredit={photoCredit}
          photographerHref={photographerHref}
          albumHref={albumHref}
          albumLabel={albumLabel}
          maxVisible={maxVisible}
          bilingual={bilingual}
          altLang={altLang}
        />
      )}
      {hasField && (
        <FieldGridSection
          images={fieldImages!}
          title={fieldGalleryTitle}
          titleEs={fieldGalleryTitleEs}
          albumHref={fieldAlbumHref}
          bilingual={bilingual}
          altLang={altLang}
        />
      )}
    </>
  );
}
