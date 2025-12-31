import { Router } from 'express';
import authController from '../src/controllers/auth.controller';
import * as authValidation from '../utils/validations/auth.validation';
import * as authMiddleware from '../utils/middlewares/auth/auth.middleware';

const router = Router();

router.post('/register', authValidation.register, authController.register);
router.post('/activate-account', authValidation.activate_account, authController.activate_account);

router.post('/login', authValidation.login, authController.login);
router.post('/verify-auth', authMiddleware.isLogin, authController.isLogin);
router.post('/refresh-token', authValidation.activate_account, authController.refresh_token);

router.post('/forgot-password', authValidation.email, authController.forgot_password);
router.post('/verify-otp', authValidation.activate_account, authController.verify_otp);
router.put('/reset-password', authValidation.reset_password, authController.resetPassword);

router.get('/its-not-me/:email', authController.itsNotMe);

export default router;
