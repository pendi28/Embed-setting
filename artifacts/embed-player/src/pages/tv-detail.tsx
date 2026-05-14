import { useGetTv, getGetTvQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { getBackdropUrl, getPosterUrl } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { Play, Star, Calendar, Tv } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TvDetail() {
  const { id } = useParams<{ id: string }>();
  const tvId = parseInt(id, 10);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  const { data: show, isLoading } = useGetTv(tvId, {
    query: {
      enabled: !!tvId,
      queryKey: getGetTvQueryKey(tvId),
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!show) {
    return <div className="min-h-screen text-center py-24">Show not found</div>;
  }

  const totalSeasons = show.numberOfSeasons ?? 1;
  const seasons = Array.from({ length: totalSeasons }, (_, i) => i + 1);
  const episodes = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))" }}>
      <Navbar />

      <div className="relative w-full h-[60vh] lg:h-[70vh]">
        <div className="absolute inset-0">
          <img
            src={getBackdropUrl(show.backdropPath)}
            alt={show.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="absolute inset-0 container mx-auto px-4 flex items-center">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start max-w-5xl pt-16">
            <div className="shrink-0 hidden md:block">
              <img
                src={getPosterUrl(show.posterPath)}
                alt={show.name}
                className="w-56 rounded-xl shadow-2xl border border-white/10"
              />
            </div>
            <div className="flex flex-col gap-4 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-balance">
                {show.name}
              </h1>

              {show.tagline && (
                <p className="text-lg text-muted-foreground italic">"{show.tagline}"</p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium">
                <div className="flex items-center gap-1 text-primary">
                  <Star className="w-4 h-4 fill-current" />
                  {show.voteAverage?.toFixed(1)}
                </div>
                {show.firstAirDate && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {show.firstAirDate.split("-")[0]}
                  </div>
                )}
                {show.numberOfSeasons && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Tv className="w-4 h-4" />
                    {show.numberOfSeasons} Season{show.numberOfSeasons > 1 ? "s" : ""}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  {show.genres?.map((g) => (
                    <span key={g.id} className="px-2 py-0.5 rounded-full bg-white/10 text-xs border border-white/5">
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-base leading-relaxed text-white/80 max-w-2xl line-clamp-4 md:line-clamp-none">
                {show.overview}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-4 justify-center md:justify-start">
                <Select value={String(season)} onValueChange={(v) => { setSeason(parseInt(v)); setEpisode(1); }}>
                  <SelectTrigger className="w-32 bg-white/10 border-white/20" data-testid="select-season">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((s) => (
                      <SelectItem key={s} value={String(s)}>Season {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={String(episode)} onValueChange={(v) => setEpisode(parseInt(v))}>
                  <SelectTrigger className="w-32 bg-white/10 border-white/20" data-testid="select-episode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {episodes.map((e) => (
                      <SelectItem key={e} value={String(e)}>Episode {e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Link href={`/embed/tv/${show.id}/${season}/${episode}`}>
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base font-bold gap-2 bg-primary hover:bg-primary/90 text-white rounded-full shadow-[0_0_40px_-10px_rgba(225,29,72,0.5)]"
                    data-testid="button-watch"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Watch S{season}E{episode}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
