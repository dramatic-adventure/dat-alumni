"use client";

interface ContactWidgetProps {
  email?: string;
  website?: string;
  socials?: string[];
}

export default function ContactWidget({
  email,
  website,
  socials = [],
}: ContactWidgetProps) {
  const hasContactInfo = !!(email || website || socials.length > 0);

  if (!hasContactInfo) return null;

  return (
    <div
      className="relative w-full h-full"
      style={{
        pointerEvents: "none", // disables interaction since nothing is shown
      }}
    >
      {/* Contact display removed – placeholder only */}
    </div>
  );
}
