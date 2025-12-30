import { Router } from 'express';
import logController from '../../src/controllers/admin/logs.controller';
import { pagination } from '../../utils/validations/app.validation';
import {
  statistics,
  logFilters,
  queue,
  id,
  userId,
  cleanup,
} from '../../utils/validations/logs.validation';

const router = Router();

router.get('/queue/:service', queue, logController.queue);
router.get('/statistics', statistics, logController.statistics);

router.get('/', logFilters, logController.all);
router.get('/errors', pagination, logController.errors);
router.get('/user/:userId', userId, pagination, logController.userActivity);
router.get('/:id', id, logController.findById);
router.post('/cleanup', cleanup, logController.cleanup);

export default router;
