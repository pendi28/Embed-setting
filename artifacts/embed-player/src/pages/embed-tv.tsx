import { useGetTvEmbed, getGetTvEmbedQueryKey, useGetTv, getGetTvQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { getPosterUrl } from "@/lib/tmdb";
import { ArrowLeft, Star, SkipForward, SkipBack, ChevronDown, Tv } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoPlayer, { VideoSource, SubtitleTrack } from "@/components/VideoPlayer";

interface ScraperResult {
  sources: VideoSource[];
  subtitles: SubtitleTrack[];
}

export default function EmbedTv() {
  const { id, season: seasonParam, episode: episodeParam } = useParams<{
    id: string;
    season: string;
    episode: string;
  }>();

  const tvId = parseInt(id, 10);
  const [season, setSeason] = useState(parseInt(seasonParam, 10) || 1);
  const [episode, setEpisode] = useState(parseInt(episodeParam, 10) || 1);
  const [, setLocation] = useLocation();

  const [scraperData, setScraperData] = useState<ScraperResult | null>(null);
  const [scraperLoading, setScraperLoading] = useState(true);
  const [autoplay, setAutoplay] = useState(() => {
    try { return localStorage.getItem("autoplay") === "true"; } catch { return false; }
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: embed } = useGetTvEmbed(tvId, {
    query: { enabled: !!tvId, queryKey: getGetTvEmbedQueryKey(tvId) },
  });

  const { data: tvDetail } = useGetTv(tvId, {
    query: { enabled: !!tvId, queryKey: getGetTvQueryKey(tvId) },
  });

  const totalSeasons = tvDetail?.numberOfSeasons ?? embed?.numberOfSeasons ?? 1;
  const episodeCount = 30; // default max per season

  // Sync URL params → state
  useEffect(() => {
    setSeason(parseInt(seasonParam, 10) || 1);
    setEpisode(parseInt(episodeParam, 10) || 1);
  }, [seasonParam, episodeParam]);

  // Store last watched in localStorage
  useEffect(() => {
    try { localStorage.setItem(`tv-${tvId}-last`, `${season}-${episode}`); } catch {}
  }, [tvId, season, episode]);

  // Fetch scraper sources
  useEffect(() => {
    if (!tvId) return;
    setScraperLoading(true);
    fetch(`/api/scraper/tv/${tvId}/${season}/${episode}`)
      .then((r) => r.json())
      .then((data) => { setScraperData(data); setScraperLoading(false); })
      .catch(() => { setScraperData({ sources: [], subtitles: [] }); setScraperLoading(false); });
  }, [tvId, season, episode]);

  const navigate = useCallback((s: number, e: number) => {
    setLocation(`/embed/tv/${tvId}/${s}/${e}`);
  }, [tvId, setLocation]);

  const nextEpisode = useCallback(() => {
    const nextEp = episode + 1;
    const nextSeason = nextEp > episodeCount ? season + 1 : season;
    const nextEpNum = nextEp > episodeCount ? 1 : nextEp;
    if (nextSeason > totalSeasons) return;
    navigate(nextSeason, nextEpNum);
  }, [episode, season, totalSeasons, episodeCount, navigate]);

  const prevEpisode = useCallback(() => {
    if (episode > 1) navigate(season, episode - 1);
    else if (season > 1) navigate(season - 1, episodeCount);
  }, [episode, season, episodeCount, navigate]);

  // Autoplay countdown
  const handleVideoEnded = useCallback(() => {
    if (!autoplay) return;
    setCountdown(5);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c === null || c <= 1) {
          clearInterval(countdownRef.current!);
          nextEpisode();
          return null;
        }
        return c - 1;
      });
    }, 1000);
  }, [autoplay, nextEpisode]);

  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(null);
  }, []);

  const toggleAutoplay = useCallback((val: boolean) => {
    setAutoplay(val);
    try { localStorage.setItem("autoplay", String(val)); } catch {}
    if (!val) cancelCountdown();
  }, [cancelCountdown]);

  const hasNextEp = episode < episodeCount || season < totalSeasons;
  const hasPrevEp = episode > 1 || season > 1;

  return (
    <div className="w-screen h-screen bg-black flex flex-col overflow-hidden" data-testid="embed-tv-container">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-950 border-b border-white/5 shrink-0 z-10">
        <button
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
          onClick={() => setLocation(`/tv/${tvId}`)}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline truncate max-w-[160px]">{embed?.title ?? "Back"}</span>
        </button>

        {/* Episode nav */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            className="p-1 text-white/40 hover:text-white transition disabled:opacity-20"
            onClick={prevEpisode}
            disabled={!hasPrevEp}
            data-testid="button-prev-episode"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Season/Episode selector */}
          <div className="relative">
            <button
              className="flex items-center gap-1 text-white/70 hover:text-white text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/15 transition"
              onClick={() => setShowEpisodeList(p => !p)}
              data-testid="button-episode-selector"
            >
              S{season} E{episode}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showEpisodeList && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden"
                style={{ width: 280, maxHeight: 400 }}>
                <div className="p-2 border-b border-white/5 flex gap-1 overflow-x-auto">
                  {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSeason(s); setEpisode(1); }}
                      className={`shrink-0 px-3 py-1 rounded text-xs font-medium transition ${s === season ? "bg-primary text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                    >
                      S{s}
                    </button>
                  ))}
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
                  {Array.from({ length: episodeCount }, (_, i) => i + 1).map((e) => (
                    <button
                      key={e}
                      onClick={() => { navigate(season, e); setShowEpisodeList(false); }}
                      className={`w-full text-left text-xs px-4 py-2.5 hover:bg-white/5 transition flex items-center gap-2 ${e === episode ? "text-primary font-semibold" : "text-white/70"}`}
                      data-testid={`episode-item-${e}`}
                    >
                      <Tv className="w-3 h-3 shrink-0" />
                      Episode {e}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            className="p-1 text-white/40 hover:text-white transition disabled:opacity-20"
            onClick={nextEpisode}
            disabled={!hasNextEp}
            data-testid="button-next-episode"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(e) => toggleAutoplay(e.target.checked)}
              className="accent-primary w-3.5 h-3.5"
              data-testid="check-autoplay"
            />
            Autoplay
          </label>
          <button onClick={() => setShowInfo(p => !p)} className="text-xs text-white/40 hover:text-white/70 transition hidden sm:block">
            {showInfo ? "Hide Info" : "Info"}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex min-h-0 relative">
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
              onEnded={handleVideoEnded}
              poster={embed?.posterPath ? `https://image.tmdb.org/t/p/w500${embed.posterPath}` : undefined}
              title={embed ? `${embed.title} — S${season}E${episode}` : undefined}
            />
          )}

          {/* Autoplay countdown overlay */}
          <AnimatePresence>
            {countdown !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 z-20"
              >
                <p className="text-white text-lg font-semibold">Episode berikutnya dalam</p>
                <div className="w-20 h-20 rounded-full border-4 border-primary flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary">{countdown}</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={nextEpisode}
                    className="px-5 py-2 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90 transition"
                    data-testid="button-play-now"
                  >
                    Putar Sekarang
                  </button>
                  <button
                    onClick={cancelCountdown}
                    className="px-5 py-2 bg-white/10 text-white rounded-full text-sm hover:bg-white/20 transition"
                    data-testid="button-cancel-autoplay"
                  >
                    Batal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
              data-testid="tv-info-panel"
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
                    <p className="text-xs text-primary font-medium">S{season} E{episode}</p>
                    {embed.releaseDate && (
                      <p className="text-xs text-white/40">{embed.releaseDate.split("-")[0]}</p>
                    )}
                    <div className="flex items-center gap-1 text-primary text-sm font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {embed.voteAverage?.toFixed(1)}
                    </div>
                    {embed.numberOfSeasons && (
                      <p className="text-xs text-white/40">{embed.numberOfSeasons} Season{embed.numberOfSeasons > 1 ? "s" : ""}</p>
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
                  <p className="text-xs leading-relaxed text-white/60 line-clamp-6">{embed.overview}</p>
                )}

                {/* Quick episode grid */}
                <div className="border-t border-white/5 pt-3">
                  <p className="text-xs text-white/30 mb-2">Season {season} — Episode</p>
                  <div className="grid grid-cols-5 gap-1">
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((e) => (
                      <button
                        key={e}
                        onClick={() => navigate(season, e)}
                        className={`text-xs py-1.5 rounded transition ${e === episode ? "bg-primary text-white font-bold" : "bg-white/5 text-white/50 hover:bg-white/15"}`}
                        data-testid={`quick-ep-${e}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

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
