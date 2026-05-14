import { Link } from "wouter";
import { Star, Film, Tv } from "lucide-react";
import { getPosterUrl } from "@/lib/tmdb";
import { MediaItem } from "@workspace/api-client-react";
import { motion } from "framer-motion";

interface MediaCardProps {
  item: MediaItem;
}

export function MediaCard({ item }: MediaCardProps) {
  const type = item.mediaType || (item.title ? "movie" : "tv");
  const year = ((item.releaseDate || item.firstAirDate) || "").split("-")[0];
  const href = `/${type}/${item.id}`;
  const title = item.title || item.name;

  return (
    <Link href={href}>
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="group relative flex flex-col gap-2 cursor-pointer"
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-white/5 border border-white/5 shadow-xl">
          <img
            src={getPosterUrl(item.posterPath, "w500")}
            alt={title || ""}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
          
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-primary font-bold text-xs px-2 py-1 rounded flex items-center gap-1 border border-white/10">
            <Star className="w-3 h-3 fill-current" />
            {item.voteAverage?.toFixed(1)}
          </div>

          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white/90 text-xs px-2 py-1 rounded border border-white/10">
            {type === "tv" ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
          </div>
        </div>

        <div className="flex flex-col px-1">
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">{year}</p>
        </div>
      </motion.div>
    </Link>
  );
}
