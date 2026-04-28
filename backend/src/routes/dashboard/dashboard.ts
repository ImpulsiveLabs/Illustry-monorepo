import { Router, type Router as ExpressRouter } from 'express';
import * as dashboardAPI from '../../api/dashboard/dashboard';
import {
  requireAuthenticatedUser,
  requireCsrf,
  requireVerifiedEmail
} from '../../auth/middleware';

const router: ExpressRouter = Router();

router.use(requireAuthenticatedUser, requireVerifiedEmail);

router.post('/api/dashboard', requireCsrf, dashboardAPI.create);
router.post('/api/dashboards', dashboardAPI.browse);
router.post('/api/dashboard/:name', dashboardAPI.findOne);
router.put('/api/dashboard', requireCsrf, dashboardAPI.update);
router.delete('/api/dashboard', requireCsrf, dashboardAPI._delete);

export default router;
