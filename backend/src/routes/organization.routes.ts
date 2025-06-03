import { Router } from 'express';
import { body, param, query } from 'express-validator';
import organizationController from '../controllers/organization.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import multer from 'multer';
import { authorizeOrganization } from '../middleware/authorize';
import repositoryController from '../controllers/repository.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('query').optional().isString(),
    validateRequest,
  ],
  organizationController.listOrganizations
);

router.post(
  '/',
  authenticate,
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('display_name').trim().isLength({ min: 2, max: 100 }).withMessage('Display name must be between 2 and 100 characters'),
    body('description').optional().isString(),
    validateRequest,
  ],
  organizationController.createOrganization
);

router.get('/me', authenticate, organizationController.getUserOrganizations);

router.get(
  '/name/:name',
  param('name').isString().withMessage('Invalid organization name'),
  validateRequest,
  organizationController.getOrganizationByName
);

router.get(
  '/:id',
  param('id').isString().withMessage('Invalid organization id'),
  validateRequest,
  organizationController.getOrganizationById
);

router.put(
  '/:id',
  authenticate,
  [
    param('id').isString().withMessage('Invalid organization id'),
    body('display_name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Display name must be between 2 and 100 characters'),
    body('description').optional().isString(),
    validateRequest,
  ],
  authorizeOrganization,
  organizationController.updateOrganization
);

router.delete('/:id', authenticate, organizationController.deleteOrganization);

router.post(
  '/:id/logo',
  authenticate,
  upload.single('image'),
  organizationController.uploadOrganizationLogo
);

router.get(
  '/:id/repositories',
  param('id').isString().withMessage('Invalid organization id'),
  validateRequest,
  organizationController.getOrganizationRepositories
);

router.post(
  '/:id/repositories',
  authenticate,
  [
    param('id').isString().withMessage('Invalid organization id'),
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Repository name must be between 2 and 100 characters'),
    body('description').optional().isString(),
    body('isPublic').optional().isBoolean(),
    validateRequest,
  ],
  repositoryController.createRepository
);

router.get(
  '/:id/members',
  param('id').isString().withMessage('Invalid organization id'),
  validateRequest,
  organizationController.getOrganizationMembers
);

router.post(
  '/:id/invite',
  authenticate,
  [
    param('id').isString().withMessage('Invalid organization id'),
    body('username').isString().withMessage('Username is required'),
    body('role').isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER'),
    validateRequest,
  ],
  organizationController.inviteUserToOrganization
);

router.post(
  '/:id/members/:username',
  authenticate,
  [
    param('id').isString().withMessage('Invalid organization id'),
    param('username').isString().withMessage('Invalid username'),
    body('role').isIn(['member', 'admin']).withMessage('Role must be either member or admin'),
    validateRequest,
  ],
  authorizeOrganization,
  organizationController.inviteUserToOrganization
);

router.delete(
  '/:id/leave',
  authenticate,
  param('id').isString().withMessage('Invalid organization id'),
  validateRequest,
  organizationController.leaveOrganization
);

router.put(
  '/:id/members/:userId',
  authenticate,
  [
    param('id').isString().withMessage('Invalid organization id'),
    param('userId').isString().withMessage('Invalid user id'),
    body('role').isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER'),
    validateRequest,
  ],
  organizationController.updateMemberRole
);

router.delete(
  '/:id/members/:userId',
  authenticate,
  [
    param('id').isString().withMessage('Invalid organization id'),
    param('userId').isString().withMessage('Invalid user id'),
    validateRequest,
  ],
  organizationController.removeMember
);

export default router;
