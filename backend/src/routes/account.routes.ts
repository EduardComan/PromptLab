import { Router } from 'express';
import { body } from 'express-validator';
import accountController from '../controllers/account.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Must be a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name').optional().isString().withMessage('Full name must be a string'),
    validateRequest,
  ],
  accountController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Must be a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest,
  ],
  accountController.login
);

router.get('/user/:username', accountController.getUserByUsername);

// Protected routes (require authentication)
router.get('/me', authenticate, accountController.getCurrentUser);

router.put(
  '/profile',
  authenticate,
  [
    body('bio').optional().isString().withMessage('Bio must be a string'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Must be a valid email'),
    body('full_name').optional().isString().withMessage('Full name must be a string'),
    validateRequest,
  ],
  accountController.updateProfile
);

router.put(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validateRequest,
  ],
  accountController.changePassword
);

router.post(
  '/profile-image',
  authenticate,
  upload.single('image'),
  accountController.uploadProfileImage
);

export default router; 