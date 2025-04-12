import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * @swagger
 * /api/analytics/prompts/{promptId}/performance:
 *   get:
 *     summary: Get performance metrics for a prompt
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: promptId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the prompt
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *         description: Time period for grouping metrics (default is day)
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 * @route   GET /api/analytics/prompts/:promptId/performance
 * @desc    Get prompt performance metrics
 * @access  Private
 */
router.get(
  '/prompts/:promptId/performance',
  authenticate,
  analyticsController.getPromptPerformance
);

/**
 * @swagger
 * /api/analytics/prompts/{promptId}/runs:
 *   get:
 *     summary: Get run history for a prompt
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: promptId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the prompt
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter runs after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter runs before this date
 *     responses:
 *       200:
 *         description: Run history retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 * @route   GET /api/analytics/prompts/:promptId/runs
 * @desc    Get prompt run history
 * @access  Private
 */
router.get(
  '/prompts/:promptId/runs',
  authenticate,
  analyticsController.getPromptRunHistory
);

/**
 * @swagger
 * /api/analytics/prompts/{promptId}/versions/compare:
 *   get:
 *     summary: Compare performance between different prompt versions
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: promptId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the prompt
 *       - in: query
 *         name: versionIds
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated list of version IDs to compare
 *     responses:
 *       200:
 *         description: Version comparison retrieved successfully
 *       400:
 *         description: Invalid parameters or missing versionIds
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 * @route   GET /api/analytics/prompts/:promptId/versions/compare
 * @desc    Compare performance between different versions
 * @access  Private
 */
router.get(
  '/prompts/:promptId/versions/compare',
  authenticate,
  analyticsController.getVersionComparison
);

export default router; 