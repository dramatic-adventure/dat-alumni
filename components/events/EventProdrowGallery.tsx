"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
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
  /** Maximum images shown before "See More" */
  maxVisible?: number;
  /** Optional "From the Field" / BTS second gallery */
  fieldImages?: ProdrowImage[];
  fieldGalleryTitle?: string;
  fieldAlbumHref?: string;
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

/* ─── Main production gallery (3-col grid) ───────────────────────────────── */
function PhotoRowSection({
  images,
  photoCredit,
  photographerHref,
  albumHref,
  albumLabel,
  maxVisible = 9,
}: {
  images: ProdrowImage[];
  photoCredit?: string;
  photographerHref?: string;
  albumHref?: string;
  albumLabel?: string;
  maxVisible?: number;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const safeImages = useMemo(() => {
    return (images ?? []).flatMap((img) => {
      const src = cleanStr(img?.src);
      if (!src) return [];
      return [{ src, alt: cleanStr(img?.alt) ?? "" }];
    });
  }, [images]);

  if (!safeImages.length) return null;

  const hasMore = safeImages.length > maxVisible;
  const visible = expanded ? safeImages : safeImages.slice(0, maxVisible);
  const photographerSafe = cleanStr(photoCredit);
  const photographerHrefSafe = cleanHref(photographerHref);
  const albumHrefSafe = cleanHref(albumHref);
  const baseLabel = cleanStr(albumLabel) ?? "OPEN FULL ALBUM";

  return (
    <div className="evd-prodrow-block" aria-label="Production Gallery">
      <div className="evd-prodrow-head">
        <h3 className="evd-prodrow-title">Production Gallery</h3>
        {photographerSafe && (
          <div className="evd-prodrow-credit">
            Photos by{" "}
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
                sizes="(max-width: 640px) 92vw, (max-width: 1200px) 30vw, 380px"
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
              {expanded ? "SEE LESS" : "SEE MORE"}
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
              {baseLabel} ↗
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

/* ─── Field / BTS gallery (2-col grid) ───────────────────────────────────── */
function FieldGridSection({
  images,
  title,
  albumHref,
}: {
  images: ProdrowImage[];
  title?: string;
  albumHref?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const safeTitle = cleanStr(title) ?? "From the Field";

  const safeImages = useMemo(() => {
    return (images ?? []).flatMap((img) => {
      const src = cleanStr(img?.src);
      if (!src) return [];
      return [{ src, alt: cleanStr(img?.alt) ?? "" }];
    });
  }, [images]);

  if (!safeImages.length) return null;

  const hasMore = safeImages.length > 2;
  const visible = expanded ? safeImages : safeImages.slice(0, 2);
  const albumHrefSafe = cleanHref(albumHref);

  return (
    <div className="evd-fieldgrid-block" aria-label={safeTitle}>
      <h3 className="evd-about-head" style={{ marginTop: "1.5rem" }}>{safeTitle}</h3>

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
                sizes="(max-width: 640px) 44vw, 260px"
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
            {expanded ? "SEE LESS" : "SEE MORE"}
          </button>
        )}
        {albumHrefSafe && (
          <a
            href={albumHrefSafe}
            className="evd-prodrow-album"
            target="_blank"
            rel="noopener noreferrer"
          >
            OPEN FULL ALBUM ↗
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
  maxVisible = 9,
  fieldImages,
  fieldGalleryTitle,
  fieldAlbumHref,
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
        />
      )}
      {hasField && (
        <FieldGridSection
          images={fieldImages!}
          title={fieldGalleryTitle}
          albumHref={fieldAlbumHref}
        />
      )}
    </>
  );
}
