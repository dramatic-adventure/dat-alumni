import Image from "next/image";

interface SafeImageProps {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function SafeImage({
  src,
  alt,
  width = 300,
  height = 300,
  className = "",
}: SafeImageProps) {
  const fallback = "/images/default-headshot.png";
  let validSrc = fallback;

  try {
    if (src && src.trim() !== "") {
      new URL(src); // validate URL
      validSrc = src;
    }
  } catch {
    // fallback remains
  }

  return (
    <Image
      src={validSrc}
      alt={alt || "Headshot"}
      width={width}
      height={height}
      className={className}
    />
  );
}
