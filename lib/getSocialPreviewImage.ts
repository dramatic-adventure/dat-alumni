// lib/getSocialPreviewImage.ts

type Story = {
  imageUrl?: string;
  mediaUrl?: string;
};

export async function getSocialPreviewImage(story: Story): Promise<string> {
  // 1. Use imageUrl if available
  if (story.imageUrl) return story.imageUrl;

  // 2. YouTube Thumbnail Fallback
  const youtubeMatch = story.mediaUrl?.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  // 3. Vimeo oEmbed API (server-safe)
  const vimeoMatch = story.mediaUrl?.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    const vimeoId = vimeoMatch[1];
    try {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`, {
        cache: 'force-cache', // Safe for static generation
      });
      if (res.ok) {
        const data = await res.json();
        return data.thumbnail_url;
      }
    } catch (err) {
      console.error("Vimeo thumbnail fetch failed:", err);
    }
  }

  // 4. Default fallback image
  return "/images/default-og-image.png";
}
