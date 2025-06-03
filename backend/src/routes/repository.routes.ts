import { Router } from 'express';
import { body, param, query } from 'express-validator';
import repositoryController from '../controllers/repository.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import { authorizeRepository } from '../middleware/authorize';

const router = Router();

router.get(
  '/',
  [
    query('username').optional().isString(),
    query('orgName').optional().isString(),
    query('isPublic').optional().isIn(['true', 'false']).withMessage('isPublic must be true or false'),
    query('ownerType').optional().isIn(['user', 'organization']).withMessage('Owner type must be user or organization'),
    query('sort').optional().isIn(['created_at', 'updated_at', 'name', 'stars']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('Invalid order direction'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest,
  ],
  repositoryController.listRepositories
);

router.post(
  '/',
  authenticate,
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('description').optional().isString(),
    body('is_public').optional().isBoolean(),
    body('owner_type').isIn(['user', 'organization']).withMessage('Owner type must be user or organization'),
    body('orgId').optional().isUUID(4).withMessage('Invalid organization ID'),
    validateRequest,
  ],
  repositoryController.createRepository
);

router.get('/user/:username', authenticate, repositoryController.getUserRepositories);

router.get(
  '/:id',
  authenticate,
  param('id').isUUID(4).withMessage('Invalid repository ID'),
  validateRequest,
  repositoryController.getRepositoryById
);

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

router.delete(
  '/:id',
  authenticate,
  param('id').isUUID(4).withMessage('Invalid repository ID'),
  validateRequest,
  authorizeRepository,
  repositoryController.deleteRepository
);

router.post('/:id/star', authenticate, repositoryController.starRepository);

router.delete('/:id/unstar', authenticate, repositoryController.unstarRepository);

router.get('/:id/star', authenticate, repositoryController.isRepositoryStarred);

export default router; 