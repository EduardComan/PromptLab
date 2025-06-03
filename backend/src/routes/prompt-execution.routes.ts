import { Router } from 'express';
import { body, param, query } from 'express-validator';
import promptExecutionController from '../controllers/prompt-execution.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import { authorizeRepository } from '../middleware/authorize';

const router = Router();

router.get(
  '/models',
  promptExecutionController.getAvailableModels
);

router.post(
  '/run',
  authenticate,
  [
    body('promptId').optional().isUUID(4).withMessage('Invalid prompt ID'),
    body('model').notEmpty().withMessage('Model is required'),
    body('prompt').notEmpty().withMessage('Prompt content is required'),
    body('parameters').optional().isObject().withMessage('Parameters must be an object'),
    body('input').optional().isObject().withMessage('Input must be an object'),
    validateRequest,
  ],
  promptExecutionController.executePrompt
);

router.get(
  '/runs/:runId',
  authenticate,
  param('runId').isUUID(4).withMessage('Invalid run ID'),
  validateRequest,
  promptExecutionController.getPromptRun
);

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

router.post(
  '/optimize',
  authenticate,
  [
    body('prompt').notEmpty().withMessage('Prompt content is required'),
    body('instructions').notEmpty().withMessage('Optimization instructions are required'),
    body('model').optional().isString().withMessage('Model must be a string'),
    body('temperature').optional().isFloat({ min: 0, max: 1 }).withMessage('Temperature must be between 0 and 1'),
    body('max_tokens').optional().isInt({ min: 1 }).withMessage('Max tokens must be a positive integer'),
    validateRequest,
  ],
  promptExecutionController.optimizePrompt
);

export default router; 