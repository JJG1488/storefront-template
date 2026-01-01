"use client";

import { useState, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";

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
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Don't render if not enabled
  if (!enabled) return null;

  const toggleMute = () => {
    if (type === "upload" && videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    } else if (type === "youtube" && iframeRef.current) {
      // For YouTube, we need to reload with different mute parameter
      setIsMuted(!isMuted);
    }
  };

  const MuteButton = () => (
    <button
      onClick={toggleMute}
      className="absolute bottom-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
      aria-label={isMuted ? "Unmute video" : "Mute video"}
    >
      {isMuted ? (
        <VolumeX className="w-5 h-5" />
      ) : (
        <Volume2 className="w-5 h-5" />
      )}
    </button>
  );

  // YouTube embed
  if (type === "youtube" && youtubeUrl) {
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) return null;

    // YouTube embed URL with autoplay, loop, no controls
    // mute parameter changes based on state
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;

    return (
      <div className="w-full aspect-video relative">
        <iframe
          ref={iframeRef}
          key={isMuted ? "muted" : "unmuted"} // Force re-render when mute changes
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          style={{ border: "none" }}
          title="Video Banner"
        />
        <MuteButton />
      </div>
    );
  }

  // Uploaded video
  if (type === "upload" && uploadedUrl) {
    return (
      <div className="w-full relative">
        <video
          ref={videoRef}
          src={uploadedUrl}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          className="w-full h-auto"
        />
        <MuteButton />
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
