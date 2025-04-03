import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface PromptRunMetrics {
  responseTime: number;   // Response time in milliseconds
  tokenCount: number;     // Total tokens used
  tokenUsage: number;     // Token usage ratio (0-1)
  successRate: number;    // Success rate (0-1)
  completionRate: number; // Completion rate (0-1)
  userSatisfactionScore?: number; // Optional user rating (0-5)
}

export interface PromptRunInput {
  promptId: string;
  versionId?: string;
  userId?: string;
  model: string;
  inputVariables: Record<string, any>;
  renderedPrompt?: string;
  output?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  metrics?: PromptRunMetrics;
}

export interface PromptRunQueryOptions {
  promptId?: string;
  versionId?: string;
  userId?: string;
  model?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

class PromptRun {
  /**
   * Create a new prompt run record
   */
  static async create(data: PromptRunInput) {
    const { metrics, ...runData } = data;
    
    // Include metrics in metadata if provided
    const metadata = {
      ...data.metadata,
      ...(metrics && { metrics }),
    };

    return prisma.prompt_runs.create({
      data: {
        id: uuidv4(),
        prompt_id: data.promptId,
        version_id: data.versionId,
        user_id: data.userId,
        model: data.model,
        input_variables: data.inputVariables,
        rendered_prompt: data.renderedPrompt,
        output: data.output,
        success: data.success,
        error_message: data.errorMessage,
        metadata: metadata,
        created_at: new Date(),
      },
    });
  }

  /**
   * Get a single prompt run by ID
   */
  static async getById(id: string) {
    return prisma.prompt_runs.findUnique({
      where: { id },
    });
  }

  /**
   * Get prompt runs with filters
   */
  static async getPromptRuns(options: PromptRunQueryOptions = {}) {
    const {
      promptId,
      versionId,
      userId,
      model,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = options;

    // Build where clause based on filters
    const where: any = {};
    
    if (promptId) where.prompt_id = promptId;
    if (versionId) where.version_id = versionId;
    if (userId) where.user_id = userId;
    if (model) where.model = model;

    // Date range filter
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = startDate;
      if (endDate) where.created_at.lte = endDate;
    }

    return prisma.prompt_runs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get performance metrics for a prompt
   */
  static async getPerformanceMetrics(promptId: string, period: 'day' | 'week' | 'month' = 'day') {
    // Get all runs for the prompt
    const runs = await prisma.prompt_runs.findMany({
      where: { prompt_id: promptId },
      orderBy: { created_at: 'asc' },
    });

    // Group runs by date based on period
    const groupedRuns = runs.reduce((acc: Record<string, any[]>, run) => {
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
    }, {});

    // Calculate metrics for each group
    return Object.entries(groupedRuns).map(([date, runs]) => {
      const totalRuns = runs.length;
      const successfulRuns = runs.filter(run => run.success).length;
      const successRate = totalRuns > 0 ? successfulRuns / totalRuns : 0;
      
      // Extract metrics from metadata where available
      const metricsArray = runs
        .filter(run => run.metadata && (run.metadata as any).metrics)
        .map(run => (run.metadata as any).metrics as PromptRunMetrics);
      
      // Calculate averages for available metrics
      const responseTimeValues = metricsArray.map(m => m.responseTime).filter(Boolean);
      const tokenCountValues = metricsArray.map(m => m.tokenCount).filter(Boolean);
      const tokenUsageValues = metricsArray.map(m => m.tokenUsage).filter(Boolean);
      const completionRateValues = metricsArray.map(m => m.completionRate).filter(Boolean);
      const satisfactionValues = metricsArray.map(m => m.userSatisfactionScore).filter(Boolean);
      
      const avgResponseTime = responseTimeValues.length > 0 
        ? responseTimeValues.reduce((sum, val) => sum + val, 0) / responseTimeValues.length
        : undefined;
        
      const avgTokenCount = tokenCountValues.length > 0
        ? tokenCountValues.reduce((sum, val) => sum + val, 0) / tokenCountValues.length
        : undefined;
        
      const avgTokenUsage = tokenUsageValues.length > 0
        ? tokenUsageValues.reduce((sum, val) => sum + val, 0) / tokenUsageValues.length
        : undefined;
        
      const avgCompletionRate = completionRateValues.length > 0
        ? completionRateValues.reduce((sum, val) => sum + val, 0) / completionRateValues.length
        : undefined;
        
      const avgSatisfaction = satisfactionValues.length > 0
        ? satisfactionValues.reduce((sum, val) => sum + val, 0) / satisfactionValues.length
        : undefined;
      
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
  }
}

export default PromptRun; 