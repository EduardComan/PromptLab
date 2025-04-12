import { Router } from 'express';
import { body, query } from 'express-validator';
import organizationController from '../controllers/organization.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: Get organizations by search query
 *     tags: [Organizations]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results to return
 *     responses:
 *       200:
 *         description: List of organizations
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  [
    query('query').optional().isString().withMessage('Query must be a string'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    validateRequest,
  ],
  organizationController.searchOrganizations
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
 *               display_name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Organization created
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authenticate,
  [
    body('name').isString().isLength({ min: 3, max: 30 }).withMessage('Name must be between 3 and 30 characters'),
    body('display_name').isString().isLength({ min: 3, max: 50 }).withMessage('Display name must be between 3 and 50 characters'),
    body('description').optional().isString().withMessage('Description must be a string'),
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
 * /api/organizations/{id}:
 *   get:
 *     summary: Get organization by ID
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organization details
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.get('/:id', organizationController.getOrganizationById);

/**
 * @swagger
 * /api/organizations/name/{name}:
 *   get:
 *     summary: Get organization by name
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organization details
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.get('/name/:name', organizationController.getOrganizationByName);

/**
 * @swagger
 * /api/organizations/{id}:
 *   put:
 *     summary: Update organization
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Organization updated
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  authenticate,
  [
    body('display_name').optional().isString().isLength({ min: 3, max: 50 }).withMessage('Display name must be between 3 and 50 characters'),
    body('description').optional().isString().withMessage('Description must be a string'),
    validateRequest,
  ],
  organizationController.updateOrganization
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
 * /api/organizations/{id}/members:
 *   get:
 *     summary: Get organization members
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of organization members
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.get('/:id/members', organizationController.getOrganizationMembers);

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

/**
 * @swagger
 * /api/organizations/{id}/repositories:
 *   get:
 *     summary: Get organization repositories
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of organization repositories
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.get('/:id/repositories', organizationController.getOrganizationRepositories);

/**
 * @swagger
 * /api/organizations/{id}/invite:
 *   post:
 *     summary: Invite user to organization
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MEMBER]
 *                 default: MEMBER
 *     responses:
 *       200:
 *         description: User invited
 *       400:
 *         description: User already a member or invalid role
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: User or organization not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/invite',
  authenticate,
  [
    body('username').isString().withMessage('Username must be a string'),
    body('role').optional().isIn(['ADMIN', 'MEMBER']).withMessage('Role must be either ADMIN or MEMBER'),
    validateRequest,
  ],
  organizationController.inviteUserToOrganization
);

export default router; 