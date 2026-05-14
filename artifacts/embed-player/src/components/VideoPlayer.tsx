import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
  ChevronUp,
  ChevronDown,
  SkipForward,
  SkipBack,
  Loader2,
} from "lucide-react";

export interface VideoSource {
  url: string;
  quality: string;
  type: "hls" | "mp4" | "dash";
  label?: string;
}

export interface SubtitleTrack {
  url: string;
  language: string;
  label: string;
  default?: boolean;
}

interface VideoPlayerProps {
  sources: VideoSource[];
  subtitles?: SubtitleTrack[];
  autoplay?: boolean;
  onEnded?: () => void;
  poster?: string;
  title?: string;
}

function formatTime(s: number) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({
  sources,
  subtitles = [],
  autoplay = false,
  onEnded,
  poster,
  title,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSource, setActiveSource] = useState(0);
  const [activeSubtitle, setActiveSubtitle] = useState<number>(-1);
  const [hlsLevels, setHlsLevels] = useState<{ height: number; bitrate: number }[]>([]);
  const [activeLevel, setActiveLevel] = useState(-1); // -1 = auto
  const [showSettings, setShowSettings] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [noSource, setNoSource] = useState(false);

  const currentSrc = sources[activeSource];

  // Load video source
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSrc) {
      setNoSource(true);
      return;
    }
    setNoSource(false);
    setIsLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (currentSrc.type === "hls" && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(currentSrc.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setHlsLevels(data.levels.map((l) => ({ height: l.height, bitrate: l.bitrate })));
        setActiveLevel(-1);
        if (autoplay) video.play().catch(() => {});
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => setActiveLevel(data.level));
      hlsRef.current = hls;
    } else {
      video.src = currentSrc.url;
      setHlsLevels([]);
      if (autoplay) video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [activeSource, currentSrc, autoplay]);

  // Default subtitle
  useEffect(() => {
    const def = subtitles.findIndex((s) => s.default);
    setActiveSubtitle(def >= 0 ? def : -1);
  }, [subtitles]);

  // Video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onDurationChange = () => setDuration(video.duration);
    const onEnded_ = () => { setPlaying(false); onEnded?.(); };
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("ended", onEnded_);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("ended", onEnded_);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [onEnded]);

  // Controls auto-hide
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Number(e.target.value);
  }, []);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const v = Number(e.target.value);
    video.volume = v;
    video.muted = v === 0;
    setVolume(v);
    setMuted(v === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
  }, []);

  const skip = useCallback((sec: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + sec));
  }, []);

  const setQuality = useCallback((level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setActiveLevel(level);
    }
    setShowQualityMenu(false);
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  if (noSource || sources.length === 0) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-4 text-white/50">
        <Play className="w-16 h-16 opacity-20" />
        <div className="text-center">
          <p className="text-lg font-semibold text-white/70">Sumber Video Belum Dikonfigurasi</p>
          <p className="text-sm mt-1 max-w-xs">
            Tambahkan extractor di{" "}
            <code className="text-primary/80">artifacts/api-server/src/lib/scraper-extractor.ts</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black select-none"
      onMouseMove={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
      onClick={() => {
        if (showSettings || showSubMenu || showQualityMenu) {
          setShowSettings(false); setShowSubMenu(false); setShowQualityMenu(false);
        } else {
          togglePlay();
          showControlsTemporarily();
        }
      }}
      data-testid="video-player"
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        playsInline
        data-testid="video-element"
      >
        {/* Native subtitle tracks */}
        {subtitles.map((sub, i) => (
          <track
            key={i}
            kind="subtitles"
            src={sub.url}
            srcLang={sub.language}
            label={sub.label}
            default={i === activeSubtitle}
          />
        ))}
      </video>

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-12 h-12 text-primary animate-spin opacity-80" />
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${showControls || !playing ? "opacity-100" : "opacity-0"}`}
        style={{ background: showControls ? "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 40%, transparent 70%, rgba(0,0,0,0.5) 100%)" : "none" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <span className="text-white font-semibold text-sm truncate max-w-[60%]">{title}</span>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Quality */}
            <div className="relative">
              <button
                className="flex items-center gap-1 text-white/80 hover:text-white text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition"
                onClick={() => { setShowQualityMenu(p => !p); setShowSubMenu(false); setShowSettings(false); }}
                data-testid="button-quality"
              >
                {activeLevel === -1 ? "Auto" : hlsLevels[activeLevel] ? `${hlsLevels[activeLevel].height}p` : "Auto"}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showQualityMenu && (
                <div className="absolute top-full right-0 mt-1 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50 min-w-[100px]">
                  <button className={`w-full text-left text-xs px-3 py-2 hover:bg-white/10 ${activeLevel === -1 ? "text-primary" : "text-white/80"}`} onClick={() => setQuality(-1)}>Auto</button>
                  {hlsLevels.map((l, i) => (
                    <button key={i} className={`w-full text-left text-xs px-3 py-2 hover:bg-white/10 ${activeLevel === i ? "text-primary" : "text-white/80"}`} onClick={() => setQuality(i)}>
                      {l.height}p
                    </button>
                  ))}
                  {hlsLevels.length === 0 && sources.length > 1 && sources.map((s, i) => (
                    <button key={i} className={`w-full text-left text-xs px-3 py-2 hover:bg-white/10 ${activeSource === i ? "text-primary" : "text-white/80"}`} onClick={() => { setActiveSource(i); setShowQualityMenu(false); }}>
                      {s.quality}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtitle */}
            {subtitles.length > 0 && (
              <div className="relative">
                <button
                  className={`p-1.5 rounded hover:bg-white/10 transition ${activeSubtitle >= 0 ? "text-primary" : "text-white/80"}`}
                  onClick={() => { setShowSubMenu(p => !p); setShowSettings(false); setShowQualityMenu(false); }}
                  data-testid="button-subtitle"
                >
                  <Subtitles className="w-4 h-4" />
                </button>
                {showSubMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50 min-w-[140px]">
                    <button className={`w-full text-left text-xs px-3 py-2 hover:bg-white/10 ${activeSubtitle === -1 ? "text-primary" : "text-white/80"}`} onClick={() => { setActiveSubtitle(-1); setShowSubMenu(false); }}>Off</button>
                    {subtitles.map((sub, i) => (
                      <button key={i} className={`w-full text-left text-xs px-3 py-2 hover:bg-white/10 ${activeSubtitle === i ? "text-primary" : "text-white/80"}`} onClick={() => { setActiveSubtitle(i); setShowSubMenu(false); }}>
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings */}
            <button
              className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition"
              onClick={() => { setShowSettings(p => !p); setShowSubMenu(false); setShowQualityMenu(false); }}
              data-testid="button-settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center play/pause */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {!playing && !isLoading && (
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="flex flex-col gap-2 px-4 pb-3" onClick={(e) => e.stopPropagation()}>
          {/* Progress bar */}
          <div className="relative h-1 group cursor-pointer">
            <div className="absolute inset-0 bg-white/20 rounded-full" />
            <div className="absolute inset-y-0 left-0 bg-white/30 rounded-full" style={{ width: `${bufferedPct}%` }} />
            <div className="absolute inset-y-0 left-0 bg-primary rounded-full" style={{ width: `${progress}%` }} />
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
              data-testid="input-seek"
            />
          </div>

          {/* Buttons row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/pause */}
              <button className="text-white hover:text-white/80 transition p-1" onClick={togglePlay} data-testid="button-play">
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
              </button>
              {/* Skip */}
              <button className="text-white/70 hover:text-white transition p-1 hidden sm:block" onClick={() => skip(-10)} data-testid="button-skip-back">
                <SkipBack className="w-4 h-4" />
              </button>
              <button className="text-white/70 hover:text-white transition p-1 hidden sm:block" onClick={() => skip(10)} data-testid="button-skip-fwd">
                <SkipForward className="w-4 h-4" />
              </button>
              {/* Volume */}
              <div className="flex items-center gap-1.5 group/vol">
                <button className="text-white/70 hover:text-white transition p-1" onClick={toggleMute} data-testid="button-mute">
                  {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={handleVolume}
                  className="w-16 accent-primary hidden sm:block cursor-pointer"
                  data-testid="input-volume"
                />
              </div>
              {/* Time */}
              <span className="text-white/60 text-xs tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Fullscreen */}
            <button className="text-white/70 hover:text-white transition p-1" onClick={toggleFullscreen} data-testid="button-fullscreen">
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
