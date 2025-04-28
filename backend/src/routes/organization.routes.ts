import { Router } from 'express';
import { body, query, param } from 'express-validator';
import organizationController from '../controllers/organization.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import multer from 'multer';
import { authorizeOrganization } from '../middleware/authorize';
import repositoryController from '../controllers/repository.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: List all organizations
 *     tags: [Organizations]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of organizations
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    validateRequest,
  ],
  organizationController.getPopularOrganizations
);

/**
 * @swagger
 * /api/organizations:
 *   post:
 *     summary: Create a new organization
 *     tags: [Organizations]
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
 *               - display_name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               display_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Organization created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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

/**
 * @swagger
 * /api/organizations/me:
 *   get:
 *     summary: Get current user's organizations
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's organizations
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/me', authenticate, organizationController.getUserOrganizations);

/**
 * @swagger
 * /api/organizations/popular:
 *   get:
 *     summary: Get popular organizations
 *     tags: [Organizations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results to return
 *     responses:
 *       200:
 *         description: List of popular organizations
 *       500:
 *         description: Server error
 */
router.get(
  '/popular',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    validateRequest,
  ],
  organizationController.getPopularOrganizations
);

/**
 * @swagger
 * /api/organizations/{name}:
 *   get:
 *     summary: Get organization by name
 *     tags: [Organizations]
 *     parameters:
 *       - $ref: '#/components/parameters/orgNameParam'
 *     responses:
 *       200:
 *         description: Organization details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/:name',
  param('name').isString().withMessage('Invalid organization name'),
  validateRequest,
  organizationController.getOrganizationByName
);

/**
 * @swagger
 * /api/organizations/{name}:
 *   put:
 *     summary: Update organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/orgNameParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Organization updated successfully
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
router.put(
  '/:name',
  authenticate,
  [
    param('name').isString().withMessage('Invalid organization name'),
    body('display_name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Display name must be between 2 and 100 characters'),
    body('description').optional().isString(),
    validateRequest,
  ],
  authorizeOrganization,
  organizationController.updateOrganization
);

/**
 * @swagger
 * /api/organizations/{name}/repositories:
 *   get:
 *     summary: Get repositories for a specific organization
 *     tags: [OrganizationRepositories]
 *     parameters:
 *       - $ref: '#/components/parameters/orgNameParam'
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
${orgRepositoryListSchema}
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:name/repositories', organizationController.getOrganizationRepositories);

/**
 * @swagger
 * /api/organizations/{name}/repositories:
 *   post:
 *     summary: Create a repository in an organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/orgNameParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
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
 *     responses:
 *       201:
 *         description: Repository created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - user is not a member of this organization
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/:name/repositories',
  authenticate,
  [
    param('name').isString().withMessage('Invalid organization name'),
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Repository name must be between 2 and 100 characters'),
    body('description').optional().isString(),
    body('isPublic').optional().isBoolean(),
    validateRequest,
  ],
  repositoryController.createRepository
);

/**
 * @swagger
 * /api/organizations/{name}/members:
 *   get:
 *     summary: List organization members
 *     tags: [Organizations]
 *     parameters:
 *       - $ref: '#/components/parameters/orgNameParam'
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of organization members
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:name/members', organizationController.getOrganizationMembers);

/**
 * @swagger
 * /api/organizations/{name}/members/{username}:
 *   post:
 *     summary: Add member to organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/orgNameParam'
 *       - $ref: '#/components/parameters/usernameParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [member, admin]
 *                 default: member
 *     responses:
 *       201:
 *         description: Member added successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - user does not have permission
 *       404:
 *         description: Organization or user not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/:name/members/:username',
  authenticate,
  [
    param('name').isString().withMessage('Invalid organization name'),
    param('username').isString().withMessage('Invalid username'),
    body('role').isIn(['member', 'admin']).withMessage('Role must be either member or admin'),
    validateRequest,
  ],
  authorizeOrganization,
  organizationController.inviteUserToOrganization
);

/**
 * @swagger
 * /api/organizations/{name}/members/{username}:
 *   delete:
 *     summary: Remove member from organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/orgNameParam'
 *       - $ref: '#/components/parameters/usernameParam'
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - user does not have permission
 *       404:
 *         description: Organization, user or membership not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete(
  '/:name/members/:username',
  authenticate,
  [
    param('name').isString().withMessage('Invalid organization name'),
    param('username').isString().withMessage('Invalid username'),
    validateRequest,
  ],
  authorizeOrganization,
  organizationController.removeMember
);

/**
 * @swagger
 * /api/organizations/{id}:
 *   delete:
 *     summary: Delete organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organization deleted
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, organizationController.deleteOrganization);

/**
 * @swagger
 * /api/organizations/{id}/logo:
 *   post:
 *     summary: Upload organization logo
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo uploaded
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/logo',
  authenticate,
  upload.single('image'),
  organizationController.uploadOrganizationLogo
);

/**
 * @swagger
 * /api/organizations/{id}/leave:
 *   delete:
 *     summary: Leave an organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Left organization
 *       403:
 *         description: Unauthorized (owner cannot leave)
 *       404:
 *         description: Not a member or organization not found
 *       500:
 *         description: Server error
 */
router.delete('/:id/leave', authenticate, organizationController.leaveOrganization);

/**
 * @swagger
 * /api/organizations/{id}/members/{userId}:
 *   put:
 *     summary: Update member role
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MEMBER]
 *     responses:
 *       200:
 *         description: Member role updated
 *       400:
 *         description: Invalid role
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Member or organization not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id/members/:userId',
  authenticate,
  [
    body('role').isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER'),
    validateRequest,
  ],
  organizationController.updateMemberRole
);

/**
 * @swagger
 * /api/organizations/{id}/members/{userId}:
 *   delete:
 *     summary: Remove member from organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Member or organization not found
 *       500:
 *         description: Server error
 */
router.delete('/:id/members/:userId', authenticate, organizationController.removeMember);

export default router; 