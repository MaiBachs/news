import { Router } from 'express';
import type { createFarmCatalog } from '../application/farm-catalog.js';

export function farmRoutes(service: ReturnType<typeof createFarmCatalog>) {
  const router = Router();
  router.get('/', (_request, response) => response.json(service.catalog()));
  return router;
}
