// app/api/instagram-feed/route.ts
//
// Returns up to 8 recent images from @dramaticadventure's Instagram feed.
//
// When INSTAGRAM_ACCESS_TOKEN is set this hits the Instagram Graph API and
// returns the latest media with their permalink URLs so every photo links
// back to the specific Instagram post.
//
// When the env var is missing (or the fetch fails) it returns the same static
// fallback images the component already uses, so the strip always renders.
//
// ── HOW TO GET AN ACCESS TOKEN ────────────────────────────────────────────────
//  1. Make sure @dramaticadventure is a Professional (Business/Creator) account.
//  2. Go to https://developers.facebook.com → create an App → add Instagram product.
//  3. Generate a User Access Token with instagram_basic + pages_show_list scopes.
//  4. Exchange it for a long-lived token (valid 60 days, renewable):
//       GET https://graph.instagram.com/access_token
//         ?grant_type=ig_exchange_token
//         &client_secret={app_secret}
//         &access_token={short_lived_token}
//  5. Add to Netlify env vars (and .env.local for dev):
//       INSTAGRAM_ACCESS_TOKEN=<long_lived_token>
//  6. Renew before expiry with:
//       GET https://graph.instagram.com/refresh_access_token
//         ?grant_type=ig_refresh_token
//         &access_token={current_long_lived_token}
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

export const revalidate = 3600; // re-fetch at most once per hour

type IgMediaItem = {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

type IgApiResponse = {
  data: IgMediaItem[];
  paging?: { cursors?: { after?: string }; next?: string };
};

const STATIC_FALLBACK = [
  { src: "/images/teaching-amazon.jpg",                               alt: "Teaching in the Amazon" },
  { src: "/images/performing-zanzibar.jpg",                           alt: "Performing in Zanzibar" },
  { src: "/images/teaching-andes.jpg",                                alt: "Teaching in the Andes" },
  { src: "/images/rehearsing-nitra.jpg",                              alt: "Rehearsing in Nitra" },
  { src: "/images/Andean_Mask_Work.jpg",                              alt: "Andean mask work" },
  { src: "/images/projects/archive/ACTion-Tanzania-3-hike.webp",     alt: "ACTion Tanzania" },
  { src: "/images/projects/archive/Creative-Trek-Zimbabwe.webp",     alt: "Creative Trek Zimbabwe" },
  { src: "/images/theatre/archive/esmeraldas_dumbshow.webp",         alt: "Theatre in Esmeraldas" },
];

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json({ images: STATIC_FALLBACK, source: "static" });
  }

  try {
    const fields = "id,media_type,media_url,thumbnail_url,permalink,timestamp";
    const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=20&access_token=${token}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      const err = await res.text();
      console.error("[instagram-feed] API error:", res.status, err);
      return NextResponse.json({ images: STATIC_FALLBACK, source: "static-fallback" });
    }

    const body: IgApiResponse = await res.json();

    // Keep only image types (skip Stories which don't return media_url)
    const images = body.data
      .filter((item) => item.media_type === "IMAGE" || item.media_type === "CAROUSEL_ALBUM")
      .slice(0, 8)
      .map((item) => ({
        src: item.media_url,
        alt: "Dramatic Adventure Theatre on Instagram",
        href: item.permalink,
      }));

    if (images.length < 4) {
      return NextResponse.json({ images: STATIC_FALLBACK, source: "static-fallback" });
    }

    return NextResponse.json({ images, source: "instagram" });
  } catch (err) {
    console.error("[instagram-feed] fetch failed:", err);
    return NextResponse.json({ images: STATIC_FALLBACK, source: "static-fallback" });
  }
}
