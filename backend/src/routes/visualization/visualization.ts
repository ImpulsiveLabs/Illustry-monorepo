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

router.post('/api/office/visualization/preview', VisualizationAPI.previewOfficeVisualization);

router.use(requireAuthenticatedUser, requireVerifiedEmail);

router.post('/api/visualization', requireCsrf, finalupload as any, VisualizationAPI.createOrUpdate);
router.put('/api/visualization', requireCsrf, VisualizationAPI.update);
router.post('/api/visualizations', VisualizationAPI.browse);
router.post('/api/visualization/export/excel', requireCsrf, VisualizationAPI.exportExcel);
router.post('/api/visualization/export/bundle', requireCsrf, VisualizationAPI.exportBundle);
router.put('/api/visualizations/theme', requireCsrf, VisualizationAPI.syncTheme);
router.get('/api/visualization/shared/:shareId', VisualizationAPI.findShared);
router.get('/api/visualization/shared-dashboard/:dashboardShareId', VisualizationAPI.findSharedThroughDashboard);
router.put('/api/visualization/share', requireCsrf, VisualizationAPI.share);
router.delete('/api/visualization/share', requireCsrf, VisualizationAPI.revokeShare);
router.post('/api/visualization/share/respond', requireCsrf, VisualizationAPI.respondToShareInvite);
router.post('/api/visualization/:name', VisualizationAPI.findOne);
router.delete('/api/visualization', requireCsrf, VisualizationAPI._delete);
export default router;
