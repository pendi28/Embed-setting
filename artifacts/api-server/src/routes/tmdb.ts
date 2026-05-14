import { Router, type IRouter } from "express";
import {
  SearchMediaQueryParams,
  SearchMediaResponse,
  GetMovieParams,
  GetMovieResponse,
  GetTvParams,
  GetTvResponse,
  GetMovieVideosParams,
  GetMovieVideosResponse,
  GetTvVideosParams,
  GetTvVideosResponse,
  GetTrendingQueryParams,
  GetTrendingResponse,
  GetMovieEmbedParams,
  GetMovieEmbedResponse,
  GetTvEmbedParams,
  GetTvEmbedResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

async function tmdbFetch(path: string, params: Record<string, string> = {}) {
  if (!API_KEY) throw new Error("TMDB_API_KEY not set");
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB error ${res.status}: ${res.statusText}`);
  return res.json() as Promise<Record<string, unknown>>;
}

function mapMedia(item: Record<string, unknown>) {
  return {
    id: item.id,
    title: item.title ?? null,
    name: item.name ?? null,
    overview: item.overview ?? null,
    posterPath: item.poster_path ?? null,
    backdropPath: item.backdrop_path ?? null,
    voteAverage: item.vote_average ?? 0,
    releaseDate: item.release_date ?? null,
    firstAirDate: item.first_air_date ?? null,
    mediaType: item.media_type ?? null,
    popularity: item.popularity ?? 0,
  };
}

function mapGenres(genres: unknown[]) {
  return (genres ?? []).map((g: unknown) => {
    const genre = g as Record<string, unknown>;
    return { id: genre.id, name: genre.name };
  });
}

function mapVideos(results: unknown[]) {
  return (results ?? []).map((v: unknown) => {
    const video = v as Record<string, unknown>;
    return {
      id: video.id as string,
      key: video.key as string,
      name: video.name as string,
      site: video.site as string,
      type: video.type as string,
      official: video.official as boolean,
    };
  });
}

function pickTrailer(videos: ReturnType<typeof mapVideos>) {
  const official = videos.find(
    (v) => v.site === "YouTube" && v.type === "Trailer" && v.official,
  );
  const anyTrailer = videos.find(
    (v) => v.site === "YouTube" && v.type === "Trailer",
  );
  const anyYT = videos.find((v) => v.site === "YouTube");
  const picked = official ?? anyTrailer ?? anyYT ?? null;
  return picked ? { key: picked.key, name: picked.name } : null;
}

// Search
router.get("/tmdb/search", async (req, res): Promise<void> => {
  const query = SearchMediaQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { query: q, type, page } = query.data;
  const endpoint =
    type === "movie" ? "/search/movie" : type === "tv" ? "/search/tv" : "/search/multi";
  const data = await tmdbFetch(endpoint, {
    query: q,
    page: String(page ?? 1),
  });
  const results = (data.results as Record<string, unknown>[]).map(mapMedia);
  res.json(
    SearchMediaResponse.parse({
      results,
      totalResults: data.total_results,
      totalPages: data.total_pages,
      page: data.page,
    }),
  );
});

// Movie detail
router.get("/tmdb/movie/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetMovieParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const data = await tmdbFetch(`/movie/${params.data.id}`);
  res.json(
    GetMovieResponse.parse({
      id: data.id,
      title: data.title,
      overview: data.overview ?? null,
      posterPath: data.poster_path ?? null,
      backdropPath: data.backdrop_path ?? null,
      voteAverage: data.vote_average ?? 0,
      releaseDate: data.release_date ?? null,
      runtime: data.runtime ?? null,
      genres: mapGenres(data.genres as unknown[]),
      tagline: data.tagline ?? null,
      status: data.status ?? null,
      budget: data.budget ?? null,
      revenue: data.revenue ?? null,
    }),
  );
});

// TV detail
router.get("/tmdb/tv/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTvParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const data = await tmdbFetch(`/tv/${params.data.id}`);
  res.json(
    GetTvResponse.parse({
      id: data.id,
      name: data.name,
      overview: data.overview ?? null,
      posterPath: data.poster_path ?? null,
      backdropPath: data.backdrop_path ?? null,
      voteAverage: data.vote_average ?? 0,
      firstAirDate: data.first_air_date ?? null,
      numberOfSeasons: data.number_of_seasons ?? null,
      numberOfEpisodes: data.number_of_episodes ?? null,
      genres: mapGenres(data.genres as unknown[]),
      tagline: data.tagline ?? null,
      status: data.status ?? null,
    }),
  );
});

// Movie videos
router.get("/tmdb/movie/:id/videos", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetMovieVideosParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const data = await tmdbFetch(`/movie/${params.data.id}/videos`);
  res.json(
    GetMovieVideosResponse.parse({
      results: mapVideos(data.results as unknown[]),
    }),
  );
});

// TV videos
router.get("/tmdb/tv/:id/videos", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTvVideosParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const data = await tmdbFetch(`/tv/${params.data.id}/videos`);
  res.json(
    GetTvVideosResponse.parse({
      results: mapVideos(data.results as unknown[]),
    }),
  );
});

// Trending
router.get("/tmdb/trending", async (req, res): Promise<void> => {
  const query = GetTrendingQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { type, timeWindow } = query.data;
  const mediaType = type ?? "all";
  const window = timeWindow ?? "week";
  const data = await tmdbFetch(`/trending/${mediaType}/${window}`);
  const results = (data.results as Record<string, unknown>[]).map(mapMedia);
  res.json(
    GetTrendingResponse.parse({
      results,
      totalResults: (data.total_results as number) ?? results.length,
      totalPages: (data.total_pages as number) ?? 1,
      page: (data.page as number) ?? 1,
    }),
  );
});

// Movie embed (details + trailer combined)
router.get("/tmdb/movie/:id/embed", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetMovieEmbedParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [detail, videos] = await Promise.all([
    tmdbFetch(`/movie/${params.data.id}`),
    tmdbFetch(`/movie/${params.data.id}/videos`),
  ]);
  const trailer = pickTrailer(mapVideos(videos.results as unknown[]));
  res.json(
    GetMovieEmbedResponse.parse({
      id: detail.id,
      mediaType: "movie",
      title: detail.title,
      overview: detail.overview ?? null,
      posterPath: detail.poster_path ?? null,
      backdropPath: detail.backdrop_path ?? null,
      voteAverage: detail.vote_average ?? 0,
      releaseDate: detail.release_date ?? null,
      runtime: detail.runtime ?? null,
      genres: mapGenres(detail.genres as unknown[]),
      tagline: detail.tagline ?? null,
      trailerKey: trailer?.key ?? null,
      trailerName: trailer?.name ?? null,
      numberOfSeasons: null,
      numberOfEpisodes: null,
    }),
  );
});

// TV embed (details + trailer combined)
router.get("/tmdb/tv/:id/embed", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTvEmbedParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [detail, videos] = await Promise.all([
    tmdbFetch(`/tv/${params.data.id}`),
    tmdbFetch(`/tv/${params.data.id}/videos`),
  ]);
  const trailer = pickTrailer(mapVideos(videos.results as unknown[]));
  res.json(
    GetTvEmbedResponse.parse({
      id: detail.id,
      mediaType: "tv",
      title: detail.name,
      overview: detail.overview ?? null,
      posterPath: detail.poster_path ?? null,
      backdropPath: detail.backdrop_path ?? null,
      voteAverage: detail.vote_average ?? 0,
      releaseDate: detail.first_air_date ?? null,
      runtime: null,
      genres: mapGenres(detail.genres as unknown[]),
      tagline: detail.tagline ?? null,
      trailerKey: trailer?.key ?? null,
      trailerName: trailer?.name ?? null,
      numberOfSeasons: detail.number_of_seasons ?? null,
      numberOfEpisodes: detail.number_of_episodes ?? null,
    }),
  );
});

export default router;
