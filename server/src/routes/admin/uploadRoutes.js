import { Router } from 'express';
import { uploadImage, uploadVideo, uploadFont, uploadSvg, handleUpload } from '../../middleware/upload.js';
import {
  uploadImageAsset,
  uploadVideoAsset,
  uploadFontAsset,
  uploadSvgAsset,
} from '../../controllers/admin/uploadController.js';

const router = Router();

router.post('/image', handleUpload(uploadImage), uploadImageAsset);
router.post('/video', handleUpload(uploadVideo), uploadVideoAsset);
router.post('/font', handleUpload(uploadFont), uploadFontAsset);
router.post('/svg', handleUpload(uploadSvg), uploadSvgAsset);

export default router;
