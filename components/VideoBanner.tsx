"use client";

export interface VideoBannerProps {
  enabled: boolean;
  type: "youtube" | "upload" | "image";
  youtubeUrl?: string;
  uploadedUrl?: string;
  imageUrl?: string;
}

/**
 * Extracts YouTube video ID from various URL formats
 * Supports: youtube.com/watch, youtu.be, youtube.com/embed, youtube.com/shorts
 */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function VideoBanner({
  enabled,
  type,
  youtubeUrl,
  uploadedUrl,
  imageUrl,
}: VideoBannerProps) {
  // Don't render if not enabled
  if (!enabled) return null;

  // YouTube embed
  if (type === "youtube" && youtubeUrl) {
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) return null;

    // YouTube embed URL with autoplay, mute, loop, no controls
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`;

    return (
      <div className="w-full aspect-video">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          style={{ pointerEvents: "none", border: "none" }}
          title="Video Banner"
        />
      </div>
    );
  }

  // Uploaded video
  if (type === "upload" && uploadedUrl) {
    return (
      <div className="w-full">
        <video
          src={uploadedUrl}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-auto"
        />
      </div>
    );
  }

  // Image
  if (type === "image" && imageUrl) {
    return (
      <div className="w-full">
        <img
          src={imageUrl}
          alt="Banner"
          className="w-full h-auto"
        />
      </div>
    );
  }

  return null;
}
