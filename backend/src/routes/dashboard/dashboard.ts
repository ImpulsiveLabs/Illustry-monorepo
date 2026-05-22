import { Router, type Router as ExpressRouter } from 'express';
import multer from 'multer';
import * as dashboardAPI from '../../api/dashboard/dashboard';
import {
  requireAuthenticatedUser,
  requireCsrf,
  requireVerifiedEmail
} from '../../auth/middleware';
import { UPLOAD_CONSTRAINTS, createMulterFileFilter } from '../../utils/upload-constraints';

const router: ExpressRouter = Router();
const exportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_CONSTRAINTS['export-template'].maxBytes },
  fileFilter: createMulterFileFilter('export-template')
});
const exportTemplateUpload = exportUpload.fields([
  { name: 'templateExcel', maxCount: 1 },
  { name: 'templatePdf', maxCount: 1 },
  { name: 'templateWord', maxCount: 1 },
  { name: 'templatePpt', maxCount: 1 },
  { name: 'templateFile', maxCount: 1 }
]);

router.use(requireAuthenticatedUser, requireVerifiedEmail);

router.post('/api/dashboard', requireCsrf, dashboardAPI.create);
router.post('/api/dashboards', dashboardAPI.browse);
router.post('/api/dashboard/export/excel', requireCsrf, dashboardAPI.exportExcel);
router.post('/api/dashboard/export/bundle', requireCsrf, exportTemplateUpload as any, dashboardAPI.exportBundle);
router.get('/api/dashboard/shared/:shareId', dashboardAPI.findShared);
router.put('/api/dashboard/share', requireCsrf, dashboardAPI.share);
router.delete('/api/dashboard/share', requireCsrf, dashboardAPI.revokeShare);
router.post('/api/dashboard/share/respond', requireCsrf, dashboardAPI.respondToShareInvite);
router.post('/api/dashboard/:name', dashboardAPI.findOne);
router.put('/api/dashboard', requireCsrf, dashboardAPI.update);
router.delete('/api/dashboard', requireCsrf, dashboardAPI._delete);

export default router;
