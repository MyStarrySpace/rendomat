"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, Image as ImageIcon } from "lucide-react";

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">Stock Images</h2>
              </div>
              <button
                onClick={onClose}
                className="text-purple-300 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for images..."
                  className="w-full bg-white/10 border border-purple-500/30 rounded-lg pl-10 pr-4 py-2 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-6 py-2 rounded-lg transition-colors font-semibold"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
              </button>
            </form>

            <p className="text-purple-300 text-xs mt-2">
              Powered by <a href="https://www.pexels.com" target="_blank" rel="noopener" className="underline hover:text-purple-200">Pexels</a>
            </p>
          </div>

          {/* Image Grid */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {loading && photos.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-20">
                <ImageIcon className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
                <p className="text-purple-300">No images found. Try a different search term.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <motion.div
                      key={photo.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
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
                              className="underline hover:text-purple-300"
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
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-6 py-2 rounded-lg transition-colors font-semibold"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        "Load More"
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
