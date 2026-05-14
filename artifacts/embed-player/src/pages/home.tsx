import { useGetTrending, getGetTrendingQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { MediaCard } from "@/components/MediaCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [tab, setTab] = useState<"all" | "movie" | "tv">("all");

  const { data: trendingData, isLoading } = useGetTrending(
    { type: tab, timeWindow: "week" },
    {
      query: {
        queryKey: getGetTrendingQueryKey({ type: tab, timeWindow: "week" }),
      },
    }
  );

  return (
    <div className="min-h-screen bg-grain flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trending Now</h1>
            <p className="text-muted-foreground mt-1">Discover what people are watching</p>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-[400px] max-w-full">
            <TabsList className="grid w-full grid-cols-3 bg-black/40 border border-white/10">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="movie">Movies</TabsTrigger>
              <TabsTrigger value="tv">TV Shows</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {trendingData?.results?.map((item) => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
