import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createUpgradeRequestSchema } from '../validators/upgrade.schema.js';
import { createUpgradeRequest, listMyUpgradeRequests, getPaymentInfo } from '../controllers/upgrade.controller.js';

const router = Router();

router.get('/payment-info', getPaymentInfo);
router.use(verifyToken);
router.post('/', validate(createUpgradeRequestSchema), createUpgradeRequest);
router.get('/', listMyUpgradeRequests);

export default router;
