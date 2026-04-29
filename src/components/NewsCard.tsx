"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFullUrl, type NewsItem } from "@/lib/api";
import {
  IoHeartOutline,
  IoHeart,
  IoChatbubbleEllipsesOutline,
  IoBookmarkOutline,
  IoBookmark,
  IoShareSocialOutline,
  IoVolumeMute,
  IoVolumeMedium,
  IoPlay,
} from "react-icons/io5";

interface NewsCardProps {
  item: NewsItem;
  isActive: boolean;
  onProgress?: (p: number) => void;
}

export default function NewsCard({ item, isActive, onProgress }: NewsCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount] = useState(() => Math.floor(Math.random() * 500) + 10);
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.currentTime = 0;
      const p = videoRef.current.play();
      if (p !== undefined) p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const handleTimeUpdate = () => {
    if (videoRef.current && onProgress) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      onProgress(p);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(".tools-panel") || target.closest(".content-area") || target.closest(".mute-btn")) return;
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleLike = (e: React.MouseEvent) => { e.stopPropagation(); setIsLiked(!isLiked); };
  const handleSave = (e: React.MouseEvent) => { e.stopPropagation(); setIsSaved(!isSaved); };
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: item.title, text: item.summary?.[0] || "Check out this news!", url: window.location.href }).catch(console.error);
    }
  };

  const videoSrc = getFullUrl(item.clipUrl ?? null);
  const posterSrc = getFullUrl(item.imageURL ?? null);

  return (
    <div className={`reel ${isActive ? "active" : ""}`} onClick={togglePlay}>
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc ?? undefined}
          muted={isMuted}
          loop
          playsInline
          className="video-bg"
          onTimeUpdate={handleTimeUpdate}
        />
      ) : (
        <img src={posterSrc ?? undefined} alt={item.title} className="video-bg" />
      )}

      <div className="overlay-gradient" />
      <div className="structural-grid" />
      <div className="scanlines" />

      {!isPlaying && (
        <div className="play-indicator">
          <IoPlay />
        </div>
      )}

      <div className="mute-btn" onClick={toggleMute}>
        {isMuted ? <IoVolumeMute /> : <IoVolumeMedium />}
      </div>

      <div className="content-area">
        <div className="dateline">NEWS // LATEST</div>
        <h1 className="headline" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
          {item.title}
        </h1>
        <div className="article-summary-container" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
          <AnimatePresence initial={false}>
            <motion.div
              className={`article-summary ${isExpanded ? "expanded" : "collapsed"}`}
              animate={{ height: isExpanded ? "auto" : "58px" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {item.summary?.map((point, i) => (
                <p key={i} className="summary-point">{point}</p>
              ))}
            </motion.div>
          </AnimatePresence>
          <span className="more-btn">{isExpanded ? "COLLAPSE" : "EXPAND"}</span>
        </div>
        <div className="author-tag">
          <div
            className="author-avatar"
            style={{ backgroundImage: `url(https://ui-avatars.com/api/?name=Khali+AI&background=000&color=fff)` }}
          />
          <div>
            <span style={{ color: "#F4F4F0" }}>BY KHALI AI</span>
            <br />
            <span style={{ color: "#8A8A8A", fontSize: "8px" }}>CHIEF CORRESPONDENT</span>
          </div>
        </div>
      </div>

      <div className="tools-panel">
        <button className="tool-btn" onClick={handleLike}>
          <div className={`tool-icon ${isLiked ? "active" : ""}`}>
            {isLiked ? <IoHeart /> : <IoHeartOutline />}
          </div>
          <span className="tool-value">{isLiked ? likeCount + 1 : likeCount}</span>
        </button>
        <button className="tool-btn" onClick={(e) => { e.stopPropagation(); }}>
          <div className="tool-icon"><IoChatbubbleEllipsesOutline /></div>
          <span className="tool-value">24</span>
        </button>
        <button className="tool-btn" onClick={handleSave}>
          <div className={`tool-icon ${isSaved ? "active" : ""}`}>
            {isSaved ? <IoBookmark /> : <IoBookmarkOutline />}
          </div>
          <span className="tool-value">SAVE</span>
        </button>
        <button className="tool-btn" onClick={handleShare}>
          <div className="tool-icon"><IoShareSocialOutline /></div>
          <span className="tool-value">SHARE</span>
        </button>
      </div>
    </div>
  );
}
