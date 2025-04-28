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
 *     parameters:
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of recent repositories
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of trending repositories
 *       500:
 *         $ref: '#/components/responses/ServerError'
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

/**
 * @swagger
 * /api/repositories:
 *   get:
 *     summary: List repositories with filtering
 *     tags: [Repositories]
 *     parameters:
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: Filter by username
 *       - in: query
 *         name: orgName
 *         schema:
 *           type: string
 *         description: Filter by organization name
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: Filter by public/private status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, name]
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort order
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/ownerTypeParam'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/RepositoryListResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// List repositories
router.get(
  '/',
  [
    query('username').optional().isString(),
    query('orgName').optional().isString(),
    query('isPublic').optional().isBoolean(),
    query('ownerType').optional().isIn(['user', 'organization']).withMessage('Owner type must be user or organization'),
    query('sort').optional().isIn(['created_at', 'updated_at', 'name']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['ASC', 'DESC']).withMessage('Invalid order direction'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest,
  ],
  repositoryController.listRepositories
);

/**
 * @swagger
 * /api/repositories:
 *   post:
 *     summary: Create a new repository
 *     tags: [Repositories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - ownerType
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *               ownerType:
 *                 type: string
 *                 enum: [user, organization]
 *               orgId:
 *                 type: string
 *                 format: uuid
 *                 description: Required if ownerType is organization
 *     responses:
 *       201:
 *         description: Repository created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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
 *     summary: Get repositories for a specific user
 *     tags: [UserRepositories]
 *     parameters:
 *       - $ref: '#/components/parameters/usernameParam'
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of user repositories
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/user/:username', repositoryController.getUserRepositories);

/**
 * @swagger
 * /api/repositories/{id}:
 *   get:
 *     summary: Get repository by ID
 *     tags: [Repositories]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/RepositoryResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Get repository by ID
router.get(
  '/:id',
  param('id').isUUID(4).withMessage('Invalid repository ID'),
  validateRequest,
  repositoryController.getRepositoryById
);

/**
 * @swagger
 * /api/repositories/{id}:
 *   put:
 *     summary: Update repository
 *     tags: [Repositories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Repository updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - user does not have permission
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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

/**
 * @swagger
 * /api/repositories/{id}:
 *   delete:
 *     summary: Delete repository
 *     tags: [Repositories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Repository deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - user does not have permission
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Delete repository
router.delete(
  '/:id',
  authenticate,
  param('id').isUUID(4).withMessage('Invalid repository ID'),
  validateRequest,
  authorizeRepository,
  repositoryController.deleteRepository
);

// Add star/unstar routes
/**
 * @swagger
 * /api/repositories/{id}/star:
 *   post:
 *     summary: Star a repository
 *     tags: [Repositories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Repository starred
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/:id/star', authenticate, repositoryController.starRepository);

/**
 * @swagger
 * /api/repositories/{id}/unstar:
 *   delete:
 *     summary: Unstar a repository
 *     tags: [Repositories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Repository unstarred
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id/unstar', authenticate, repositoryController.unstarRepository);

export default router; 