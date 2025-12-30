import { Router } from 'express';
import xApiKeyController from '../../src/controllers/admin/x-api-key.controller';

const router = Router();

router.get('/find', xApiKeyController.find);
router.post('/create', xApiKeyController.create);
router.put('/update', xApiKeyController.update);

export default router;
