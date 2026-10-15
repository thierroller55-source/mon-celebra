import { Router } from 'express';
import { listTemplates } from '../controllers/template.controller.js';

const router = Router();

router.get('/', listTemplates);

export default router;
