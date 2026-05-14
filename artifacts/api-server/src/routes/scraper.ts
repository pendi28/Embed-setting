import { Router, type IRouter } from "express";
import { extractVideoSources } from "../lib/scraper-extractor";

const router: IRouter = Router();

// GET /api/scraper/movie/:id
router.get("/scraper/movie/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const tmdbId = parseInt(raw, 10);
  if (isNaN(tmdbId)) {
    res.status(400).json({ error: "Invalid TMDB ID" });
    return;
  }
  const result = await extractVideoSources(tmdbId);
  res.json(result);
});

// GET /api/scraper/tv/:id/:season/:episode
router.get("/scraper/tv/:id/:season/:episode", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawSeason = Array.isArray(req.params.season) ? req.params.season[0] : req.params.season;
  const rawEp = Array.isArray(req.params.episode) ? req.params.episode[0] : req.params.episode;

  const tmdbId = parseInt(rawId, 10);
  const season = parseInt(rawSeason, 10);
  const episode = parseInt(rawEp, 10);

  if (isNaN(tmdbId) || isNaN(season) || isNaN(episode)) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }

  const result = await extractVideoSources(tmdbId, season, episode);
  res.json(result);
});

export default router;
