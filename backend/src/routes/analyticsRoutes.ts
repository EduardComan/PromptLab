import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route   GET /api/analytics/prompts/:promptId/performance
 * @desc    Get prompt performance metrics
 * @access  Private
 */
router.get(
  '/prompts/:promptId/performance',
  authMiddleware,
  analyticsController.getPromptPerformance
);

/**
 * @route   GET /api/analytics/prompts/:promptId/runs
 * @desc    Get prompt run history
 * @access  Private
 */
router.get(
  '/prompts/:promptId/runs',
  authMiddleware,
  analyticsController.getPromptRunHistory
);

/**
 * @route   GET /api/analytics/prompts/:promptId/versions/compare
 * @desc    Compare performance between different versions
 * @access  Private
 */
router.get(
  '/prompts/:promptId/versions/compare',
  authMiddleware,
  analyticsController.getVersionComparison
);

export default router; 