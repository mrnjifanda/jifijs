import { Router } from 'express';
import userController from '../../src/controllers/app/user.controller';
import * as userValidation from '../../utils/validations/user.validation';

const router = Router();

// Routes utilisateur standard
router.get('/profile', userController.getProfile);
router.put('/profile', userValidation.updateProfile, userController.updateProfile);
router.put('/change-password', userValidation.changePassword, userController.changePassword);
router.get('/login-history', userController.getLoginHistory);
router.post('/logout-other-devices', userController.logoutOtherDevices);

router.delete('/account', userValidation.deleteAccount, userController.deleteAccount);
router.get('/account/stats', userController.getAccountStats);
router.get('/account/export', userController.exportData);

export default router;
