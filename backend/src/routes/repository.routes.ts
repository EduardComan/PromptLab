import { Router } from 'express';
import { body, param, query } from 'express-validator';
import repositoryController from '../controllers/repository.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import { authorizeRepository } from '../middleware/authorize';

const router = Router();

// Create repository
router.post(
  '/',
  authenticate,
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('description').optional().isString(),
    body('isPublic').optional().isBoolean(),
    body('ownerType').isIn(['user', 'organization']).withMessage('Owner type must be user or organization'),
    body('orgId').optional().isUUID(4).withMessage('Invalid organization ID'),
    validateRequest,
  ],
  repositoryController.createRepository
);

// Get repository by ID
router.get(
  '/:id',
  param('id').isUUID(4).withMessage('Invalid repository ID'),
  validateRequest,
  repositoryController.getRepositoryById
);

// Update repository
router.put(
  '/:id',
  authenticate,
  [
    param('id').isUUID(4).withMessage('Invalid repository ID'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('description').optional().isString(),
    body('isPublic').optional().isBoolean(),
    validateRequest,
  ],
  authorizeRepository,
  repositoryController.updateRepository
);

// Delete repository
router.delete(
  '/:id',
  authenticate,
  param('id').isUUID(4).withMessage('Invalid repository ID'),
  validateRequest,
  authorizeRepository,
  repositoryController.deleteRepository
);

// List repositories
router.get(
  '/',
  [
    query('username').optional().isString(),
    query('orgName').optional().isString(),
    query('isPublic').optional().isBoolean(),
    query('sort').optional().isIn(['created_at', 'updated_at', 'name']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['ASC', 'DESC']).withMessage('Invalid order direction'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest,
  ],
  repositoryController.listRepositories
);

// Add collaborator
router.post(
  '/collaborators',
  authenticate,
  [
    body('repoId').isUUID(4).withMessage('Invalid repository ID'),
    body('userId').isUUID(4).withMessage('Invalid user ID'),
    body('role').isIn(['editor', 'viewer', 'admin']).withMessage('Invalid role'),
    validateRequest,
  ],
  authorizeRepository,
  repositoryController.addCollaborator
);

// Remove collaborator
router.delete(
  '/collaborators/:repoId/:userId',
  authenticate,
  [
    param('repoId').isUUID(4).withMessage('Invalid repository ID'),
    param('userId').isUUID(4).withMessage('Invalid user ID'),
    validateRequest,
  ],
  authorizeRepository,
  repositoryController.removeCollaborator
);

// List collaborators
router.get(
  '/collaborators/:repoId',
  authenticate,
  param('repoId').isUUID(4).withMessage('Invalid repository ID'),
  validateRequest,
  authorizeRepository,
  repositoryController.listCollaborators
);

export default router; 