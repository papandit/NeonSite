import { Router } from 'express';
import { uploadImage, uploadFont, uploadSvg, handleUpload } from '../../middleware/upload.js';
import {
  uploadImageAsset,
  uploadFontAsset,
  uploadSvgAsset,
} from '../../controllers/admin/uploadController.js';

const router = Router();

router.post('/image', handleUpload(uploadImage), uploadImageAsset);
router.post('/font', handleUpload(uploadFont), uploadFontAsset);
router.post('/svg', handleUpload(uploadSvg), uploadSvgAsset);

export default router;
