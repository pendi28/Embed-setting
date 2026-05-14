import { Link, useLocation } from "wouter";
import { Search, Film, Tv, Play } from "lucide-react";
import { Input } from "./ui/input";
import { useState } from "react";
import { useSearchMedia, getSearchMediaQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getPosterUrl } from "@/lib/tmdb";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { useDebounce } from "@/hooks/use-debounce";

export function Navbar() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: searchResults, isLoading } = useSearchMedia(
    { query: debouncedSearch, type: "multi" },
    {
      query: {
        enabled: debouncedSearch.length > 1,
        queryKey: getSearchMediaQueryKey({ query: debouncedSearch, type: "multi" }),
      },
    }
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
          <Play className="w-6 h-6 fill-current" />
          <span className="font-bold text-lg tracking-tight uppercase">ZxcStream</span>
        </Link>

        <div className="flex-1 max-w-md relative">
          <Popover open={open && debouncedSearch.length > 1} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search movies & TV shows..."
                  className="w-full pl-9 bg-white/5 border-white/10 focus-visible:ring-primary rounded-full"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (e.target.value.length > 1) setOpen(true);
                  }}
                  onFocus={() => {
                    if (debouncedSearch.length > 1) setOpen(true);
                  }}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[var(--radix-popover-trigger-width)] p-0 bg-card/95 backdrop-blur-xl border-white/10 max-h-[60vh] overflow-y-auto"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
              ) : searchResults?.results && searchResults.results.length > 0 ? (
                <div className="flex flex-col">
                  {searchResults.results.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                      onClick={() => {
                        setOpen(false);
                        setSearch("");
                        setLocation(`/${item.mediaType || "movie"}/${item.id}`);
                      }}
                    >
                      <img 
                        src={getPosterUrl(item.posterPath, "w500")} 
                        alt={item.title || item.name || ""} 
                        className="w-10 h-14 object-cover rounded shadow-sm"
                      />
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium text-sm truncate">{item.title || item.name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {item.mediaType === "tv" ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                          {((item.releaseDate || item.firstAirDate) || "").split("-")[0]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : debouncedSearch.length > 1 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No results found</div>
              ) : null}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </nav>
  );
}
