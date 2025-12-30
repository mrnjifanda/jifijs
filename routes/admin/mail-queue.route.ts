import { Router } from 'express';
import mailQueueController from '../../src/controllers/admin/mail-queue.controller';

const router = Router();

router.get('/stats', mailQueueController.stats);
router.get('/failed', mailQueueController.failedJobs);
router.post('/retry/:jobId', mailQueueController.retryJob);
router.post('/retry-all', mailQueueController.retryAllJobs);
router.delete('/failed/:jobId', mailQueueController.removeJob);
router.post('/clean', mailQueueController.cleanJobs);

export default router;
