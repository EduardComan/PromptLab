import { Router } from 'express';
import { body, param, query } from 'express-validator';
import promptExecutionController from '../controllers/prompt-execution.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import { authorizeRepository } from '../middleware/authorize';

const router = Router();

// Get available LLM models
router.get(
  '/models',
  promptExecutionController.getAvailableModels
);

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

// Get a specific prompt run
router.get(
  '/runs/:runId',
  authenticate,
  param('runId').isUUID(4).withMessage('Invalid run ID'),
  validateRequest,
  promptExecutionController.getPromptRun
);

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