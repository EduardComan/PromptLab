import { Request, Response } from 'express';
import prisma from '../lib/prisma';

interface MetricsData {
  responseTime?: number;
  tokenCount?: number;
  tokenUsage?: number;
  completionRate?: number;
  userSatisfactionScore?: number;
}

/**
 * Get performance metrics for a prompt
 */
export const getPromptPerformance = async (req: Request, res: Response) => {
  try {
    const { promptId } = req.params;
    const { period = 'day' } = req.query;
    
    // Validate period parameter
    if (period && !['day', 'week', 'month'].includes(period as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period parameter. Must be day, week, or month.',
      });
    }

    // Get all runs for the prompt
    const runs = await prisma.promptRun.findMany({
      where: { prompt_id: promptId },
      orderBy: { created_at: 'asc' },
    });

    // Group runs by date based on period
    const groupedRuns = runs.reduce((acc: Record<string, any[]>, run: any) => {
      const date = new Date(run.created_at);
      let key: string;
      
      switch (period) {
        case 'week':
          // Get the week number
          const weekNumber = Math.ceil((date.getDate() + (new Date(date.getFullYear(), date.getMonth(), 1).getDay())) / 7);
          key = `${date.getFullYear()}-${date.getMonth() + 1}-W${weekNumber}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        case 'day':
        default:
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          break;
      }
      
      if (!acc[key]) acc[key] = [];
      acc[key].push(run);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate metrics for each group
    const metrics = Object.entries(groupedRuns).map(([date, groupRuns]) => {
      const totalRuns = (groupRuns as any[]).length;
      const successfulRuns = (groupRuns as any[]).filter((run: any) => run.success).length;
      const successRate = totalRuns > 0 ? successfulRuns / totalRuns : 0;
      
      // Extract metrics from metadata where available
      const metricsArray = (groupRuns as any[])
        .filter((run: any) => run.metadata && typeof run.metadata === 'object')
        .map((run: any) => {
          const metadata = run.metadata as Record<string, any>;
          return metadata.metrics as MetricsData;
        })
        .filter((metrics: any) => metrics !== undefined);
      
      // Calculate averages for available metrics
      const avgResponseTime = calculateAverage(metricsArray, 'responseTime');
      const avgTokenCount = calculateAverage(metricsArray, 'tokenCount');
      const avgTokenUsage = calculateAverage(metricsArray, 'tokenUsage');
      const avgCompletionRate = calculateAverage(metricsArray, 'completionRate');
      const avgSatisfaction = calculateAverage(metricsArray, 'userSatisfactionScore');
      
      return {
        date,
        totalRuns,
        successRate,
        metrics: {
          responseTime: avgResponseTime,
          tokenCount: avgTokenCount,
          tokenUsage: avgTokenUsage,
          completionRate: avgCompletionRate,
          userSatisfactionScore: avgSatisfaction,
        }
      };
    });

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error getting prompt performance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get prompt performance metrics',
      error: (error as Error).message,
    });
  }
};

/**
 * Get run history for a prompt
 */
export const getPromptRunHistory = async (req: Request, res: Response) => {
  try {
    const { promptId } = req.params;
    const { limit = '50', offset = '0', startDate, endDate } = req.query;

    const parsedLimit = parseInt(limit as string, 10);
    const parsedOffset = parseInt(offset as string, 10);

    // Validate limit and offset
    if (isNaN(parsedLimit) || isNaN(parsedOffset) || parsedLimit < 1 || parsedOffset < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit or offset parameters.',
      });
    }

    // Parse dates if provided
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate as string);
      if (isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate parameter.',
        });
      }
    }

    if (endDate) {
      parsedEndDate = new Date(endDate as string);
      if (isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate parameter.',
        });
      }
    }

    // Build where clause
    const where: any = { prompt_id: promptId };
    
    // Add date range filter
    if (parsedStartDate || parsedEndDate) {
      where.created_at = {};
      if (parsedStartDate) where.created_at.gte = parsedStartDate;
      if (parsedEndDate) where.created_at.lte = parsedEndDate;
    }

    // Get the total count
    const totalCount = await prisma.promptRun.count({ where });
    
    // Get runs with filters
    const runs = await prisma.promptRun.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: parsedLimit,
      skip: parsedOffset,
    });

    return res.status(200).json({
      success: true,
      data: runs,
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error('Error getting prompt run history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get prompt run history',
      error: (error as Error).message,
    });
  }
};

/**
 * Get performance comparison between different prompt versions
 */
export const getVersionComparison = async (req: Request, res: Response) => {
  try {
    const { promptId } = req.params;
    const { versionIds } = req.query;

    if (!versionIds) {
      return res.status(400).json({
        success: false,
        message: 'versionIds parameter is required',
      });
    }

    // Parse version IDs from query parameter
    const parsedVersionIds = (versionIds as string).split(',');

    // Get metrics for each version
    const metrics = await Promise.all(
      parsedVersionIds.map(async (versionId) => {
        // Get runs for this version
        const runs = await prisma.promptRun.findMany({
          where: {
            prompt_id: promptId,
            version_id: versionId
          }
        });

        // Count successful runs
        const successfulRuns = runs.filter((run: any) => run.success).length;
        const successRate = runs.length > 0 ? successfulRuns / runs.length : 0;

        // Extract metrics from all runs for this version
        const metricsArray = runs
          .filter((run: any) => run.metadata && typeof run.metadata === 'object')
          .map((run: any) => {
            const metadata = run.metadata as Record<string, any>;
            return metadata.metrics as MetricsData;
          })
          .filter((metrics: any) => metrics !== undefined);

        // Calculate averages for available metrics
        const avgResponseTime = calculateAverage(metricsArray, 'responseTime');
        const avgTokenCount = calculateAverage(metricsArray, 'tokenCount');
        const avgTokenUsage = calculateAverage(metricsArray, 'tokenUsage');
        const avgCompletionRate = calculateAverage(metricsArray, 'completionRate');
        const avgSatisfaction = calculateAverage(metricsArray, 'userSatisfactionScore');

        return {
          versionId,
          totalRuns: runs.length,
          successRate,
          metrics: {
            responseTime: avgResponseTime,
            tokenCount: avgTokenCount,
            tokenUsage: avgTokenUsage,
            completionRate: avgCompletionRate,
            userSatisfactionScore: avgSatisfaction,
          },
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error getting version comparison:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get version comparison metrics',
      error: (error as Error).message,
    });
  }
};

/**
 * Helper function to calculate average of a specific metric across an array of metrics objects
 */
function calculateAverage(metricsArray: MetricsData[], metricName: keyof MetricsData): number | undefined {
  const values = metricsArray
    .map(metrics => metrics[metricName])
    .filter(value => value !== undefined && value !== null) as number[];

  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : undefined;
} 