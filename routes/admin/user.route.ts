import { Router } from 'express';
import adminUserController from '../../src/controllers/admin/user.controller';
import {
  createUser,
  updateUser,
  updateUserRole,
  resetPassword,
  sendEmail,
  sendBulkEmail,
  mongoId,
} from '../../utils/validations/user.validation';

const router = Router();

// Liste et recherche
router.get('/', adminUserController.getAllUsers);
router.get('/search', adminUserController.searchUsers);
router.get('/stats', adminUserController.getUserStats);
router.get('/activity', adminUserController.getRecentActivity);
router.get('/export', adminUserController.exportUsers);

// CRUD utilisateurs
router.post('/create', createUser, adminUserController.createUser);
router.get('/find/:id', mongoId, adminUserController.getUserById);
router.put('/update/:id', mongoId, updateUser, adminUserController.updateUser);
router.delete('/delete/:id', mongoId, adminUserController.deactivateUser);
router.delete('/delete/:id/permanent', mongoId, adminUserController.permanentlyDeleteUser);

// Gestion des utilisateurs
router.put('/reactivate/:id', mongoId, adminUserController.reactivateUser);
router.put('/role/:id', mongoId, updateUserRole, adminUserController.updateUserRole);
router.put(
  '/reset-password/:id',
  mongoId,
  resetPassword,
  adminUserController.resetUserPassword
);
router.post('/force-logout/:id', mongoId, adminUserController.forceLogoutUser);

// Communication
router.post('/send-email/:id', mongoId, sendEmail, adminUserController.sendEmailToUser);
router.post('/bulk-email', sendBulkEmail, adminUserController.sendBulkEmail);

export default router;
