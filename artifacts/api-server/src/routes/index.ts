import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tmdbRouter from "./tmdb";
import scraperRouter from "./scraper";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tmdbRouter);
router.use(scraperRouter);

export default router;
