import { Router } from 'express';
import { publicWriteLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { reportSchema } from '../validators/report.schema.js';
import { createReport } from '../controllers/public.controller.js';

const router = Router();

router.post('/', publicWriteLimiter, validate(reportSchema), createReport);

export default router;
