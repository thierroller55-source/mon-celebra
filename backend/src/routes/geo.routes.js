import { Router } from 'express';
import { searchGeoController } from '../controllers/geo.controller.js';

const router = Router();

router.get('/search', searchGeoController);

export default router;
