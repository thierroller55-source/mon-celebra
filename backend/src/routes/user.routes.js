import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateMeSchema } from '../validators/auth.schema.js';
import { getMe, updateMe } from '../controllers/user.controller.js';

const router = Router();

router.get('/me', verifyToken, getMe);
router.put('/me', verifyToken, validate(updateMeSchema), updateMe);

export default router;
