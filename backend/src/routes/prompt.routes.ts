import { Router } from 'express';
import { body, param } from 'express-validator';
import promptController from '../controllers/prompt.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import { authorizeRepository } from '../middleware/authorize';

const router = Router();

router.post(
  '/',
  authenticate,
  [
    body('repository_id').isUUID(4).withMessage('Invalid repository ID'),
    body('title').notEmpty().isString().withMessage('Title is required'),
    body('description').optional().isString(),
    body('content').notEmpty().isString().withMessage('Content is required'),
    body('metadata_json').optional().isObject().withMessage('Metadata must be an object'),
    validateRequest,
  ],
  authorizeRepository,
  promptController.createPrompt
);

router.get(
  '/versions/:versionId',
  param('versionId').isUUID(4).withMessage('Invalid version ID'),
  validateRequest,
  promptController.getPromptVersion
);

router.get(
  '/:id',
  authenticate,
  param('id').isUUID(4).withMessage('Invalid prompt ID'),
  validateRequest,
  promptController.getPromptById
);

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

router.get(
  '/:promptId/versions',
  param('promptId').isUUID(4).withMessage('Invalid prompt ID'),
  validateRequest,
  promptController.getPromptVersions
);

router.get(
  '/:promptId/version-metrics',
  param('promptId').isUUID(4).withMessage('Invalid prompt ID'),
  validateRequest,
  promptController.getPromptVersionMetrics
);

router.get(
  '/:promptId/runs',
  param('promptId').isUUID(4).withMessage('Invalid prompt ID'),
  validateRequest,
  promptController.getPromptRuns
);

router.get(
  '/runs/:runId',
  param('runId').isUUID(4).withMessage('Invalid run ID'),
  validateRequest,
  promptController.getPromptRun
);

router.get(
  '/:promptId/merge-requests',
  param('promptId').isUUID(4).withMessage('Invalid prompt ID'),
  validateRequest,
  promptController.getPromptMergeRequests
);

router.get(
  '/merge-requests/:mergeRequestId',
  param('mergeRequestId').isUUID(4).withMessage('Invalid merge request ID'),
  validateRequest,
  promptController.getMergeRequest
);

router.post(
  '/:promptId/create-merge-request',
  authenticate,
  [
    param('promptId').isUUID(4).withMessage('Invalid prompt ID'),
    body('description').notEmpty().isString().withMessage('Description is required'),
    body('content').notEmpty().isString().withMessage('Content is required'),
    body('metadata_json').optional().isObject().withMessage('Metadata must be a JSON object'),
    validateRequest,
  ],
  promptController.createMergeRequest
);

router.post(
  '/merge-requests/:mergeRequestId/reject',
  authenticate,
  [
    param('mergeRequestId').isUUID(4).withMessage('Invalid merge request ID'),
    validateRequest,
  ],
  promptController.rejectMergeRequest
);

router.post(
  '/merge-requests/:mergeRequestId/merge',
  authenticate,
  [
    param('mergeRequestId').isUUID(4).withMessage('Invalid merge request ID'),
    validateRequest,
  ],
  promptController.mergeMergeRequest
);

export default router; 