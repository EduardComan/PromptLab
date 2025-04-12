import { Router } from 'express';
import { body, param, query } from 'express-validator';
import repositoryController from '../controllers/repository.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import { authorizeRepository } from '../middleware/authorize';

const router = Router();

/**
 * @swagger
 * /api/repositories/recent:
 *   get:
 *     summary: Get recent repositories (includes private repos for authenticated users)
 *     tags: [Repositories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of repositories to return
 *     responses:
 *       200:
 *         description: List of recent repositories
 *       500:
 *         description: Server error
 */
// Get recent repositories
router.get(
  '/recent',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    validateRequest,
  ],
  repositoryController.getRecentRepositories
);

/**
 * @swagger
 * /api/repositories/trending:
 *   get:
 *     summary: Get trending (most recent) public repositories
 *     tags: [Repositories]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of repositories to return
 *     responses:
 *       200:
 *         description: List of trending repositories
 *       500:
 *         description: Server error
 */
// Get trending repositories
router.get(
  '/trending',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    validateRequest,
  ],
  repositoryController.getTrendingRepositories
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

/**
 * @swagger
 * /api/repositories/user/{username}:
 *   get:
 *     summary: Get repositories for a specific user (profile page)
 *     tags: [Repositories]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of repositories per page
 *     responses:
 *       200:
 *         description: List of user repositories
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get(
  '/user/:username',
  [
    param('username').isString().withMessage('Invalid username'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    validateRequest,
  ],
  repositoryController.getUserRepositories
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

export default router; 