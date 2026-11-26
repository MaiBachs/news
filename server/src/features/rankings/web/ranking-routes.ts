import { Router } from 'express';
import type { createRankingService } from '../application/ranking-service.js';

export function rankingRoutes(service: ReturnType<typeof createRankingService>) {
  const router = Router();
  router.get('/latest', (_request, response) => response.json(service.latest()));
  return router;
}
