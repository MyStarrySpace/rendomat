"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui";

interface StockPhoto {
  id: number;
  url: string;
  thumbnail: string;
  photographer: string;
  photographer_url: string;
  alt: string;
  avg_color: string;
}

interface StockImageBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  initialQuery?: string;
}

export default function StockImageBrowser({
  isOpen,
  onClose,
  onSelectImage,
  initialQuery = "business",
}: StockImageBrowserProps) {
  const [query, setQuery] = useState(initialQuery);
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      searchImages(initialQuery, 1);
    }
  }, [isOpen]);

  async function searchImages(searchQuery: string, pageNum: number) {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8787/api/stock-images/search?query=${encodeURIComponent(
          searchQuery
        )}&per_page=20&page=${pageNum}`
      );

      if (!response.ok) {
        throw new Error("Failed to search images");
      }

      const data = await response.json();

      if (pageNum === 1) {
        setPhotos(data.photos);
      } else {
        setPhotos((prev) => [...prev, ...data.photos]);
      }

      setHasMore(data.photos.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to search images:", error);
      alert("Failed to load stock images. Make sure PEXELS_API_KEY is set in .env");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      searchImages(query.trim(), 1);
    }
  }

  function handleLoadMore() {
    if (!loading && hasMore) {
      searchImages(query, page + 1);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-[hsl(var(--border))]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-[hsl(var(--accent))]" />
                  <h2 className="headline text-2xl text-[hsl(var(--foreground))]">Stock Images</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-hover))] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--foreground-subtle))]" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for images..."
                    className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] pl-10 pr-4 py-2 text-[hsl(var(--foreground))] placeholder-[hsl(var(--foreground-subtle))] focus:outline-none focus:border-[hsl(var(--accent))]"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
                </Button>
              </form>

              <p className="text-[hsl(var(--foreground-subtle))] text-xs mt-2">
                Powered by <a href="https://www.pexels.com" target="_blank" rel="noopener" className="link-subtle">Pexels</a>
              </p>
            </div>

            {/* Image Grid */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {loading && photos.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 text-[hsl(var(--foreground-muted))] animate-spin" />
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-20">
                  <ImageIcon className="w-16 h-16 text-[hsl(var(--foreground-subtle))] mx-auto mb-4" />
                  <p className="text-[hsl(var(--foreground-muted))]">No images found. Try a different search term.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                      <motion.div
                        key={photo.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative aspect-square overflow-hidden cursor-pointer group border border-[hsl(var(--border))] hover:border-[hsl(var(--accent))] transition-colors"
                        onClick={() => {
                          onSelectImage(photo.url);
                          onClose();
                        }}
                      >
                        <img
                          src={photo.thumbnail}
                          alt={photo.alt}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-white text-xs font-medium truncate">
                              Photo by{" "}
                              <a
                                href={photo.photographer_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-[hsl(var(--accent))]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {photo.photographer}
                              </a>
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Load More */}
                  {hasMore && (
                    <div className="mt-6 text-center">
                      <Button
                        onClick={handleLoadMore}
                        disabled={loading}
                        variant="secondary"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                          </span>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
