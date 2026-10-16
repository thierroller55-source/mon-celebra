import { Router } from 'express';
import {
  searchGeoController,
  resolveMapLinkController,
} from '../controllers/geo.controller.js';

const router = Router();

router.get('/search', searchGeoController);
router.get('/resolve-link', resolveMapLinkController);

export default router;
