import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  reportStatusSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  templateCreateSchema,
  templateUpdateSchema,
} from '../validators/admin.schema.js';
import {
  getStats,
  listUsers,
  blockUser,
  unblockUser,
  deleteUser,
  listEvents,
  deleteEvent,
  listReports,
  updateReport,
  listCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  listTemplatesAdmin,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  emailHealth,
} from '../controllers/admin.controller.js';

const router = Router();

router.use(verifyToken, requireAdmin);

router.get('/stats', getStats);

router.post('/email-health', emailHealth);

router.get('/users', listUsers);
router.patch('/users/:id/block', blockUser);
router.patch('/users/:id/unblock', unblockUser);
router.delete('/users/:id', deleteUser);

router.get('/events', listEvents);
router.delete('/events/:id', deleteEvent);

router.get('/reports', listReports);
router.patch('/reports/:id', validate(reportStatusSchema), updateReport);

router.get('/categories', listCategoriesAdmin);
router.post('/categories', validate(categoryCreateSchema), createCategory);
router.put('/categories/:id', validate(categoryUpdateSchema), updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/templates', listTemplatesAdmin);
router.post('/templates', validate(templateCreateSchema), createTemplate);
router.put('/templates/:id', validate(templateUpdateSchema), updateTemplate);
router.delete('/templates/:id', deleteTemplate);

export default router;
