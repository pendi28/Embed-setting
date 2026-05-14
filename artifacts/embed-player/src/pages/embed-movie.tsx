import { useGetMovieEmbed, getGetMovieEmbedQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useState, useEffect, useCallback, useRef } from "react";
import { getPosterUrl } from "@/lib/tmdb";
import { ArrowLeft, Star, SkipForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoPlayer, { VideoSource, SubtitleTrack } from "@/components/VideoPlayer";

interface ScraperResult {
  sources: VideoSource[];
  subtitles: SubtitleTrack[];
}

export default function EmbedMovie() {
  const { id } = useParams<{ id: string }>();
  const movieId = parseInt(id, 10);

  const [scraperData, setScraperData] = useState<ScraperResult | null>(null);
  const [scraperLoading, setScraperLoading] = useState(true);
  const [autoplay, setAutoplay] = useState(() => {
    try { return localStorage.getItem("autoplay") === "true"; } catch { return false; }
  });
  const [showInfo, setShowInfo] = useState(true);

  const { data: embed } = useGetMovieEmbed(movieId, {
    query: { enabled: !!movieId, queryKey: getGetMovieEmbedQueryKey(movieId) },
  });

  useEffect(() => {
    if (!movieId) return;
    setScraperLoading(true);
    fetch(`/api/scraper/movie/${movieId}`)
      .then((r) => r.json())
      .then((data) => { setScraperData(data); setScraperLoading(false); })
      .catch(() => { setScraperData({ sources: [], subtitles: [] }); setScraperLoading(false); });
  }, [movieId]);

  return (
    <div className="w-screen h-screen bg-black flex flex-col overflow-hidden" data-testid="embed-movie-container">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-950 border-b border-white/5 shrink-0 z-10">
        <Link href={`/movie/${movieId}`}>
          <button className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline truncate max-w-[200px]">{embed?.title ?? "Back"}</span>
          </button>
        </Link>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(e) => {
                setAutoplay(e.target.checked);
                try { localStorage.setItem("autoplay", String(e.target.checked)); } catch {}
              }}
              className="accent-primary w-3.5 h-3.5"
              data-testid="check-autoplay"
            />
            Autoplay
          </label>
          <button
            onClick={() => setShowInfo(p => !p)}
            className="text-xs text-white/40 hover:text-white/70 transition"
          >
            {showInfo ? "Hide Info" : "Show Info"}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex min-h-0">
        {/* Player */}
        <div className="flex-1 min-w-0 relative bg-black">
          {scraperLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <VideoPlayer
              sources={scraperData?.sources ?? []}
              subtitles={scraperData?.subtitles ?? []}
              autoplay={autoplay}
              poster={embed?.posterPath ? `https://image.tmdb.org/t/p/w500${embed.posterPath}` : undefined}
              title={embed?.title}
            />
          )}
        </div>

        {/* Side info */}
        <AnimatePresence>
          {showInfo && embed && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-950 border-l border-white/5 overflow-y-auto overflow-x-hidden shrink-0"
              data-testid="movie-info-panel"
            >
              <div className="p-4 flex flex-col gap-4 w-[280px]">
                <div className="flex gap-3">
                  <img
                    src={getPosterUrl(embed.posterPath)}
                    alt={embed.title}
                    className="w-16 h-24 object-cover rounded-lg border border-white/10 shrink-0 shadow-xl"
                  />
                  <div className="flex flex-col gap-1 min-w-0">
                    <h2 className="font-bold text-sm leading-tight">{embed.title}</h2>
                    {embed.releaseDate && (
                      <p className="text-xs text-white/40">{embed.releaseDate.split("-")[0]}</p>
                    )}
                    <div className="flex items-center gap-1 text-primary text-sm font-semibold mt-1">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {embed.voteAverage?.toFixed(1)}
                    </div>
                    {embed.runtime && (
                      <p className="text-xs text-white/40">{embed.runtime} min</p>
                    )}
                  </div>
                </div>

                {embed.tagline && (
                  <p className="text-xs italic text-white/40 border-l-2 border-primary/40 pl-2">{embed.tagline}</p>
                )}

                <div className="flex flex-wrap gap-1">
                  {embed.genres?.map((g) => (
                    <span key={g.id} className="px-2 py-0.5 rounded-full bg-white/5 text-xs border border-white/10">{g.name}</span>
                  ))}
                </div>

                {embed.overview && (
                  <p className="text-xs leading-relaxed text-white/60">{embed.overview}</p>
                )}

                <div className="border-t border-white/5 pt-3">
                  <p className="text-xs text-white/30 mb-2">Embed Code</p>
                  <code className="text-xs text-white/50 bg-white/5 rounded p-2 block break-all select-all">
                    {typeof window !== "undefined" ? `<iframe src="${window.location.href}" allowfullscreen width="100%" height="100%"></iframe>` : ""}
                  </code>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
