import { Router } from 'express';
import * as projectAPI from '../../api/project/project';
import {
  requireAuthenticatedUser,
  requireCsrf,
  requireVerifiedEmail
} from '../../auth/middleware';

const router = Router();

router.use(requireAuthenticatedUser, requireVerifiedEmail);

router.post('/api/project', requireCsrf, projectAPI.create);
router.post('/api/projects', projectAPI.browse);
router.post('/api/project/:name', projectAPI.findOne);
router.put('/api/project', requireCsrf, projectAPI.update);
router.delete('/api/project', requireCsrf, projectAPI._delete);

export default router;
