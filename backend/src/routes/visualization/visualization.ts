import { Router, type Router as ExpressRouter } from 'express';
import multer from 'multer';
import * as VisualizationAPI from '../../api/visualization/visualization';
import {
  requireAuthenticatedUser,
  requireCsrf,
  requireVerifiedEmail
} from '../../auth/middleware';

const router: ExpressRouter = Router();

const storage = multer.diskStorage({ });
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});
const finalupload = upload.fields([{ name: 'file', maxCount: 10 }]);

router.use(requireAuthenticatedUser, requireVerifiedEmail);

router.post('/api/visualization', requireCsrf, finalupload as any, VisualizationAPI.createOrUpdate);
router.post('/api/visualizations', VisualizationAPI.browse);
router.post('/api/visualization/:name', VisualizationAPI.findOne);
router.delete('/api/visualization', requireCsrf, VisualizationAPI._delete);
export default router;
