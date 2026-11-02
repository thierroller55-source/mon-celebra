import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateMeSchema, changePasswordSchema } from '../validators/auth.schema.js';
import { getMe, updateMe, changePassword } from '../controllers/user.controller.js';
import { forbidPlanFieldsOnMe } from '../middleware/planFieldsGuard.js';

const router = Router();

router.use(verifyToken);

router.get('/', getMe);
router.patch('/', forbidPlanFieldsOnMe, validate(updateMeSchema), updateMe);
router.post('/password', validate(changePasswordSchema), changePassword);

export default router;
