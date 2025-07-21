"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import Lightbox from "@/components/shared/Lightbox";

// ✅ Types
interface JourneyCard {
  title: string;
  mediaUrl: string;
  category: "DAT Memory" | "Creative Work" | "What I’m Up To" | "What’s Next";
  link?: string;
}

export default function MyJourney() {
  // ✅ Placeholder Data (CSV integration coming later)
  const featuredHighlight = {
    title: "Theatre Workshop",
    date: "August 15, 2025",
    imageUrl: "https://images.unsplash.com/photo-1526285759904-71d1170ed2ac",
    link: "#",
    type: "event",
  };

  const quickLinks = {
    website: "https://www.jessebaxter.com",
    instagram: "https://instagram.com/dramaticadventure",
    imdb: "#",
  };

  const journeyCards: JourneyCard[] = [
    {
      title: "RAW 2025, Ecuador",
      mediaUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0",
      category: "DAT Memory",
    },
    {
      title: "Scene from Julius Caesar",
      mediaUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
      category: "Creative Work",
    },
    {
      title: "Coaching Session Reel",
      mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4", // ✅ video example
      category: "What I’m Up To",
    },
    {
      title: "New Play Development",
      mediaUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2",
      category: "What’s Next",
    },
  ];

  // ✅ Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const mediaUrls = journeyCards.map((card) => card.mediaUrl);

  return (
    <section className="bg-[#f5f1eb] py-12 px-6 md:px-12 rounded-lg shadow-sm h-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-[var(--dat-color-dark)] mb-6">
        Where My Journey Has Taken Me
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* ✅ LEFT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* Highlight Card */}
          <div className="rounded-xl overflow-hidden shadow-md bg-white">
            <div className="relative w-full h-56 md:h-64">
              <Image
                src={featuredHighlight.imageUrl}
                alt={featuredHighlight.title}
                fill
                style={{ objectFit: "cover" }}
              />
              <span className="absolute top-3 left-3 bg-[var(--dat-color-accent)] text-white text-xs font-bold px-3 py-1 rounded">
                Upcoming Event
              </span>
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold">{featuredHighlight.title}</h3>
              <p className="text-sm text-gray-600">{featuredHighlight.date}</p>
              <Link
                href={featuredHighlight.link}
                className="mt-3 inline-block bg-[var(--dat-color-accent)] text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-[var(--dat-color-dark)] transition"
              >
                RSVP
              </Link>
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="rounded-xl bg-white shadow-md p-4 flex items-center justify-around">
            {quickLinks.website && (
              <Link
                href={quickLinks.website}
                target="_blank"
                className="text-sm font-semibold text-[var(--dat-color-dark)] hover:text-[var(--dat-color-accent)]"
              >
                Website
              </Link>
            )}
            {quickLinks.instagram && (
              <Link
                href={quickLinks.instagram}
                target="_blank"
                className="text-sm font-semibold text-[var(--dat-color-dark)] hover:text-[var(--dat-color-accent)]"
              >
                Instagram
              </Link>
            )}
            {quickLinks.imdb && (
              <Link
                href={quickLinks.imdb}
                target="_blank"
                className="text-sm font-semibold text-[var(--dat-color-dark)] hover:text-[var(--dat-color-accent)]"
              >
                IMDb
              </Link>
            )}
          </div>
        </div>

        {/* ✅ RIGHT COLUMN: Swipeable Cards */}
        <div className="relative max-w-xl">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            className="w-full"
          >
            {journeyCards.map((card, index) => (
              <SwiperSlide key={index}>
                <div
                  className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer"
                  onClick={() => {
                    setIsLightboxOpen(true);
                    setLightboxIndex(index);
                  }}
                >
                  {/* ✅ Image or Video in a Card */}
                  <div className="w-full h-64 bg-black flex items-center justify-center overflow-hidden">
                    {card.mediaUrl.endsWith(".mp4") ? (
                      <video
                        src={card.mediaUrl}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={card.mediaUrl}
                        alt={card.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="p-4">
                    <span className="inline-block text-xs font-bold px-3 py-1 rounded bg-[var(--dat-color-accent)] text-white mb-2">
                      {card.category}
                    </span>
                    <h4 className="text-lg font-semibold">{card.title}</h4>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* ✅ Lightbox */}
      {isLightboxOpen && (
        <Lightbox
          images={mediaUrls}
          startIndex={lightboxIndex}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </section>
  );
}
