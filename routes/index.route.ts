import { Router } from 'express';
import indexController from '../src/controllers/index.controller';

const router = Router();

router.get('/start', indexController.welcome);

export default router;
