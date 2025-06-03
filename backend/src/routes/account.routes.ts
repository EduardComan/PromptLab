import { Router } from 'express';
import { body, query } from 'express-validator';
import accountController from '../controllers/account.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import multer from 'multer';
import repositoryController from '../controllers/repository.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

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
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest,
  ],
  accountController.login
);

router.get('/user/:username', accountController.getUserByUsername);

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

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    validateRequest,
  ],
  accountController.listUsers
);
router.get('/user/:username/starred', repositoryController.getUserStarredRepositories);

router.get('/me/starred', authenticate, repositoryController.getMyStarredRepositories);

router.get(
  '/search',
  authenticate,
  [
    query('query').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    validateRequest,
  ],
  accountController.searchUsers
);

export default router; 