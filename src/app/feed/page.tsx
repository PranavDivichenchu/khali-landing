"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { FaSpinner } from "react-icons/fa";
import { fetchFeed, type NewsItem } from "@/lib/api";
import NewsCard from "@/components/NewsCard";
import "./feed.css";

export default function FeedPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const feedRef = useRef<HTMLElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const data = await fetchFeed(offset, 10);
      if (data?.data?.length > 0) {
        setItems((prev) => {
          const ids = new Set(prev.map((x) => x.id));
          const fresh = data.data.filter((x) => !ids.has(x.id));
          return [...prev, ...fresh];
        });
        setOffset((prev) => prev + 10);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load feed", err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, offset]);

  // Initial load
  useEffect(() => { loadMore(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) loadMore();
      });
      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, loadMore]
  );

  const handleScroll = () => {
    if (!feedRef.current) return;
    const index = Math.round(feedRef.current.scrollTop / feedRef.current.clientHeight);
    if (index !== activeItemIndex) setActiveItemIndex(index);
  };

  return (
    <div className="elite-app">
      <div className="app-container">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="brand">
            KH<span>A</span>LI
          </div>
          <div className="status-pill">
            <div className="pulse-dot" />
            Live Feed
          </div>
          <Link href="/" className="back-link">← Home</Link>
        </div>

        {/* Feed */}
        <main className="elite-feed" ref={feedRef} onScroll={handleScroll}>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <div
                ref={isLast ? lastElementRef : null}
                key={item.id || index}
                className="elite-snap-wrapper"
              >
                <NewsCard
                  item={item}
                  isActive={index === activeItemIndex}
                  onProgress={(p) => { if (index === activeItemIndex) setProgress(p); }}
                />
              </div>
            );
          })}

          {loading && (
            <div className="status-screen">
              <FaSpinner className="spinner" />
            </div>
          )}

          {!hasMore && items.length > 0 && (
            <div className="status-screen">
              <p className="end-text">End of Feed.</p>
            </div>
          )}
        </main>

        {/* System Bar */}
        <div className="system-bar">
          <div className="scrubber-track">
            <div className="scrubber-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="ticker">
            <div className="ticker-wrapper">
              {[
                { label: "S&P 500", value: "▲ 1.24%", up: true },
                { label: "NASDAQ", value: "▲ 2.08%", up: true },
                { label: "FTSE 100", value: "▼ 0.45%", up: false },
                { label: "BTC-USD", value: "▲ 4.12%", up: true },
                { label: "CRUDE OIL", value: "▼ 1.10%", up: false },
                { label: "GOLD", value: "▲ 0.88%", up: true },
                { label: "10Y TREASURY", value: "4.12%", up: null },
              ].flatMap((t, i) => [
                <span key={`a-${i}`} className="ticker-item">
                  {t.label}{" "}
                  {t.up !== null && (
                    <span className={t.up ? "market-up" : "market-down"}>{t.value}</span>
                  )}
                </span>,
                <span key={`b-${i}`} className="ticker-item">
                  {t.label}{" "}
                  {t.up !== null && (
                    <span className={t.up ? "market-up" : "market-down"}>{t.value}</span>
                  )}
                </span>,
              ])}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
