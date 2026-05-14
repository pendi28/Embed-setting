import { useGetMovie, getGetMovieQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { getBackdropUrl, getPosterUrl } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { Play, Star, Calendar, Clock } from "lucide-react";

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const movieId = parseInt(id, 10);

  const { data: movie, isLoading } = useGetMovie(movieId, {
    query: {
      enabled: !!movieId,
      queryKey: getGetMovieQueryKey(movieId),
    },
  });

  if (isLoading) {
    return <div className="min-h-screen bg-grain flex"><Navbar /></div>;
  }

  if (!movie) {
    return <div className="min-h-screen bg-grain text-center py-24">Movie not found</div>;
  }

  return (
    <div className="min-h-screen bg-grain flex flex-col">
      <Navbar />

      <div className="relative w-full h-[60vh] lg:h-[70vh]">
        <div className="absolute inset-0">
          <img 
            src={getBackdropUrl(movie.backdropPath)} 
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="absolute inset-0 container mx-auto px-4 flex items-center">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start max-w-5xl pt-16">
            <div className="shrink-0 hidden md:block">
              <img 
                src={getPosterUrl(movie.posterPath)} 
                alt={movie.title}
                className="w-64 rounded-xl shadow-2xl border border-white/10"
              />
            </div>
            <div className="flex flex-col gap-4 text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-balance">
                {movie.title}
              </h1>
              
              {movie.tagline && (
                <p className="text-xl text-muted-foreground italic font-serif">"{movie.tagline}"</p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium">
                <div className="flex items-center gap-1 text-primary">
                  <Star className="w-4 h-4 fill-current" />
                  {movie.voteAverage?.toFixed(1)}
                </div>
                {movie.releaseDate && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {movie.releaseDate.split("-")[0]}
                  </div>
                )}
                {movie.runtime && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {movie.runtime} min
                  </div>
                )}
                <div className="flex gap-2">
                  {movie.genres?.map(g => (
                    <span key={g.id} className="px-2 py-0.5 rounded-full bg-white/10 text-xs border border-white/5">
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-lg leading-relaxed text-white/80 max-w-3xl mt-4 line-clamp-4 md:line-clamp-none">
                {movie.overview}
              </p>

              <div className="flex gap-4 mt-6 justify-center md:justify-start">
                <Link href={`/embed/movie/${movie.id}`}>
                  <Button size="lg" className="h-14 px-8 text-lg font-bold gap-2 bg-primary hover:bg-primary/90 text-white rounded-full shadow-[0_0_40px_-10px_rgba(225,29,72,0.5)]">
                    <Play className="w-6 h-6 fill-current" />
                    Watch Now
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
