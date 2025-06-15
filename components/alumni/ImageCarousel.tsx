interface ImageCarouselProps {
  images?: string[];
  onImageClick?: (index: number) => void;
}

export default function ImageCarousel({ images, onImageClick }: ImageCarouselProps) {
  if (!images || images.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {images.map((url, idx) => (
        <img
          key={idx}
          src={url}
          alt={`Image ${idx + 1}`}
          className="rounded shadow cursor-pointer"
          onClick={() => onImageClick?.(idx)}
        />
      ))}
    </div>
  );
}
