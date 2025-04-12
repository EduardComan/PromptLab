import { Router } from 'express';
import { body, param, query } from 'express-validator';
import promptExecutionController from '../controllers/prompt-execution.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import { authorizeRepository } from '../middleware/authorize';

const router = Router();

/**
 * @swagger
 * /api/execution/models:
 *   get:
 *     summary: Get available language models
 *     tags: [Execution]
 *     responses:
 *       200:
 *         description: List of available language models retrieved successfully
 *       500:
 *         description: Server error
 */
// Get available LLM models
router.get(
  '/models',
  promptExecutionController.getAvailableModels
);

/**
 * @swagger
 * /api/execution/run:
 *   post:
 *     summary: Execute a prompt
 *     tags: [Execution]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - model
 *             properties:
 *               promptId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of an existing prompt to execute
 *               versionId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of a specific prompt version to execute
 *               model:
 *                 type: string
 *                 description: Language model to use for execution
 *               input:
 *                 type: object
 *                 description: Input variables for the prompt
 *               parameters:
 *                 type: object
 *                 description: Configuration parameters for the model
 *     responses:
 *       200:
 *         description: Prompt executed successfully
 *       400:
 *         description: Invalid inputs
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Execute a prompt
router.post(
  '/run',
  authenticate,
  [
    body('promptId').optional().isUUID(4).withMessage('Invalid prompt ID'),
    body('versionId').optional().isUUID(4).withMessage('Invalid version ID'),
    body('model').notEmpty().withMessage('Model is required'),
    body('input').optional().isObject().withMessage('Input must be an object'),
    body('parameters').optional().isObject().withMessage('Parameters must be an object'),
    validateRequest,
  ],
  promptExecutionController.executePrompt
);

/**
 * @swagger
 * /api/execution/runs/{runId}:
 *   get:
 *     summary: Get a specific prompt run
 *     tags: [Execution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: runId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the prompt run
 *     responses:
 *       200:
 *         description: Run details retrieved successfully
 *       400:
 *         description: Invalid run ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Run not found
 *       500:
 *         description: Server error
 */
// Get a specific prompt run
router.get(
  '/runs/:runId',
  authenticate,
  param('runId').isUUID(4).withMessage('Invalid run ID'),
  validateRequest,
  promptExecutionController.getPromptRun
);

/**
 * @swagger
 * /api/execution/prompt/{promptId}/runs:
 *   get:
 *     summary: Get run history for a specific prompt
 *     tags: [Execution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: promptId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the prompt
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Run history retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user does not have access to this repository
 *       500:
 *         description: Server error
 */
// Get prompt run history for a specific prompt
router.get(
  '/prompt/:promptId/runs',
  authenticate,
  [
    param('promptId').isUUID(4).withMessage('Invalid prompt ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest,
  ],
  authorizeRepository,
  promptExecutionController.getPromptRuns
);

export default router; 