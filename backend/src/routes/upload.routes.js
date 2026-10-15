import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import {
  uploadImageController,
  deleteImageController,
  storageInfo,
} from '../controllers/upload.controller.js';

const router = Router();

router.get('/info', storageInfo);
router.post('/image', verifyToken, uploadSingle, uploadImageController);
router.delete('/image', verifyToken, deleteImageController);

export default router;
