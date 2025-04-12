import { Router } from 'express';
import { body, param } from 'express-validator';
import promptController from '../controllers/prompt.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import { authorizeRepository } from '../middleware/authorize';

const router = Router();

/**
 * @swagger
 * /api/prompts/versions/{versionId}:
 *   get:
 *     summary: Get a specific version of a prompt
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Version retrieved
 *       404:
 *         description: Version not found
 */
router.get(
  '/versions/:versionId',
  param('versionId').isUUID(4).withMessage('Invalid version ID'),
  validateRequest,
  promptController.getPromptVersion
);

/**
 * @swagger
 * /api/prompts/{id}:
 *   get:
 *     summary: Get prompt by ID
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Prompt found
 *       404:
 *         description: Prompt not found
 */
router.get(
  '/:id',
  param('id').isUUID(4).withMessage('Invalid prompt ID'),
  validateRequest,
  promptController.getPromptById
);

/**
 * @swagger
 * /api/prompts/{id}:
 *   put:
 *     summary: Update a prompt
 *     tags: [Prompts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               content:
 *                 type: string
 *               metadata_json:
 *                 type: object
 *               commitMessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prompt updated successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Prompt not found
 */
router.put(
  '/:id',
  authenticate,
  [
    param('id').isUUID(4).withMessage('Invalid prompt ID'),
    body('title').optional().isString().withMessage('Title must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('content').optional().isString().withMessage('Content must be a string'),
    body('metadata_json').optional().isObject().withMessage('Metadata must be an object'),
    body('commitMessage').optional().isString().withMessage('Commit message must be a string'),
    validateRequest,
  ],
  authorizeRepository,
  promptController.updatePrompt
);

/**
 * @swagger
 * /api/prompts/{promptId}/versions:
 *   get:
 *     summary: Get all versions of a prompt
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: promptId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Versions retrieved
 *       404:
 *         description: Prompt not found
 */
router.get(
  '/:promptId/versions',
  param('promptId').isUUID(4).withMessage('Invalid prompt ID'),
  validateRequest,
  promptController.getPromptVersions
);

export default router; 