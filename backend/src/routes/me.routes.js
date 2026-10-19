import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateMeSchema, changePasswordSchema } from '../validators/auth.schema.js';
import { getMe, updateMe, changePassword } from '../controllers/user.controller.js';

const router = Router();

router.use(verifyToken);

router.get('/', getMe);
router.patch('/', validate(updateMeSchema), updateMe);
router.post('/password', validate(changePasswordSchema), changePassword);

export default router;
