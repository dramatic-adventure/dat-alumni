// components/alumni/ImageCarousel.tsx

export default function ImageCarousel({ images }: { images: string[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {images.map((url, idx) => (
        <img
          key={idx}
          src={url}
          alt={`Image ${idx + 1}`}
          className="rounded shadow"
        />
      ))}
    </div>
  );
}
