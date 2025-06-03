import { Request, Response } from 'express';
import axios from 'axios';
import prisma from '../lib/prisma';
import logger from '../utils/logger';

// Environment variable for the LLM service URL
const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:5000';

// Get available LLM models
export const getAvailableModels = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Call the LLM service to get available models
    const response = await axios.get(`${LLM_SERVICE_URL}/models`);
    
    res.status(200).json({
      models: response.data.models
    });
  } catch (error: any) {
    logger.error('Error fetching available models:', error);
    
    // Provide fallback models if service is unavailable
    const fallbackModels = [
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'Google',
        description: 'Google\'s fast multimodal model with great performance for diverse tasks',
        default_parameters: {
          temperature: 0.7,
          top_p: 1.0,
          max_tokens: 256,
          frequency_penalty: 0.0
        }
      }
    ];
    
    res.status(200).json({
      models: fallbackModels
    });
  }
};

// Execute a prompt in playground mode
export const executePrompt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promptId, prompt, model, parameters, input, promptVersionId, runType } = req.body;
    const userId = req.user?.id;
    
    // Validate required fields
    if (!model) {
      res.status(400).json({ 
        status: 'error',
        message: 'Model is required' 
      });
      return;
    }
    
    if (!prompt) {
      res.status(400).json({ 
        status: 'error',
        message: 'Prompt content is required' 
      });
      return;
    }
    
    // Prepare the request to the LLM service (matching Flask API structure)
    const llmRequest = {
      model,
      prompt,
      parameters: parameters
    };
    
    logger.info(`Executing prompt with model ${model}`);
    logger.debug('LLM Request:', llmRequest);
    
    // Call the LLM service
    const llmResponse = await axios.post(`${LLM_SERVICE_URL}/generate`, llmRequest, {
      timeout: 60000 // 60 second timeout
    });
    
    // Extract the response data (matching Flask API response structure)
    const { status, output, metrics, log } = llmResponse.data;
    
    // Debug logging for cost metrics
    logger.info('Received metrics from LLM service:', JSON.stringify(metrics, null, 2));
    
    if (status !== 'success') {
      res.status(500).json({
        status: 'error',
        message: 'LLM service returned error',
        error: output || 'Unknown error from LLM service'
      });
      return;
    }

    // Debug logging for cost values specifically
    logger.info('Cost breakdown:', {
      cost_input: metrics?.cost_input,
      cost_output: metrics?.cost_output,
      cost_usd: metrics?.cost_usd,
      tokens_input: metrics?.tokens_input,
      tokens_output: metrics?.tokens_output
    });
    
    // Create a prompt run record
    const promptRun = await prisma.promptRun.create({
      data: {
        prompt_id: promptId || null, // Optional - for tracking if provided
        prompt_version_id: promptVersionId || null, // Optional - for versioned runs
        user_id: userId,
        model,
        input_variables: input || null,
        prompt_content: prompt,
        output,
        success: true,
        run_type: runType || 'PLAYGROUND', // Default to PLAYGROUND if not specified
        metadata: {
          processing_time_ms: metrics?.processing_time_ms,
          tokens_input: metrics?.tokens_input,
          tokens_output: metrics?.tokens_output,
          total_tokens: metrics?.total_tokens,
          cost_usd: metrics?.cost_usd,
          cost_input: metrics?.cost_input,
          cost_output: metrics?.cost_output,
          model_parameters: parameters || {},
          prompt_content: prompt, // Also store in metadata for easy access
          log: log || []
        }
      }
    });

    // Debug logging for saved data
    logger.info('Saved prompt run metadata:', JSON.stringify(promptRun.metadata, null, 2));
    
    res.status(200).json({
      status: 'success',
      run_id: promptRun.id,
      output,
      model,
      metrics,
      log
    });
  } catch (error: any) {
    logger.error('Error executing prompt:', error);
    
    // Handle LLM service errors
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorData = error.response.data;
        
        // Try to create a failed run record
        try {
          if (req.body.promptId || req.body.prompt) {
            await prisma.promptRun.create({
              data: {
                prompt_id: req.body.promptId || null,
                prompt_version_id: req.body.promptVersionId || null,
                user_id: req.user?.id,
                model: req.body.model || 'unknown',
                input_variables: req.body.input || null,
                prompt_content: req.body.prompt || '',
                success: false,
                error_message: errorData?.error || error.message,
                run_type: req.body.runType || 'PLAYGROUND',
                metadata: {
                  processing_time_ms: errorData?.metrics?.processing_time_ms,
                  model_parameters: req.body.parameters || {},
                  prompt_content: req.body.prompt || ''
                }
              }
            });
          }
        } catch (dbError) {
          logger.error('Failed to create error run record:', dbError);
        }
        
        res.status(error.response.status).json({
          status: 'error',
          message: 'Error from LLM service',
          error: errorData?.error || error.message
        });
        return;
      } else if (error.request) {
        // The request was made but no response was received
        res.status(503).json({
          status: 'error',
          message: 'LLM service unavailable',
          error: 'Service unavailable'
        });
        return;
      }
    }
    
    // Generic error
    res.status(500).json({
      status: 'error',
      message: 'Error executing prompt',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Optimize a prompt using AI-powered self-supervised optimization
export const optimizePrompt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, instructions, model, temperature, max_tokens } = req.body;
    const userId = req.user?.id;
    
    // Validate required fields
    if (!prompt) {
      res.status(400).json({ 
        status: 'error',
        message: 'Prompt content is required' 
      });
      return;
    }
    
    if (!instructions) {
      res.status(400).json({ 
        status: 'error',
        message: 'Optimization instructions are required' 
      });
      return;
    }
    
    // Prepare the request to the LLM service optimization endpoint
    const optimizationRequest = {
      prompt,
      instructions,
      model: model || 'gemini-1.5-flash',
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 500
    };
    
    logger.info(`Optimizing prompt with model ${optimizationRequest.model} for user ${userId}`);
    logger.info(`Original prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`);
    logger.info(`Optimization instructions: "${instructions}"`);
    logger.debug('Optimization Request:', optimizationRequest);
    
    // Call the LLM service optimization endpoint
    const optimizationResponse = await axios.post(`${LLM_SERVICE_URL}/optimize-prompt`, optimizationRequest, {
      timeout: 180000 // 3 minute timeout for optimization (increased due to response generation)
    });
    
    // Extract the response data
    const optimizationResult = optimizationResponse.data;
    
    logger.info(`Optimization completed for user ${userId}:`, {
      optimization_id: optimizationResult.optimization_id,
      processing_time: optimizationResult.metrics?.processing_time_ms,
      original_length: optimizationResult.metrics?.original_length,
      optimized_length: optimizationResult.metrics?.optimized_length,
      length_change: optimizationResult.metrics?.length_change,
      iterations: optimizationResult.metrics?.iterations,
      candidates_generated: optimizationResult.metrics?.total_candidates_generated
    });
    
    // Log the comparison results
    if (optimizationResult.original_prompt && optimizationResult.optimized_prompt) {
      const originalPreview = optimizationResult.original_prompt.substring(0, 80);
      const optimizedPreview = optimizationResult.optimized_prompt.substring(0, 80);
      const originalResponsePreview = optimizationResult.original_response ? optimizationResult.original_response.substring(0, 80) : 'N/A';
      const optimizedResponsePreview = optimizationResult.optimized_response ? optimizationResult.optimized_response.substring(0, 80) : 'N/A';
      
      logger.info(`Prompt comparison for user ${userId}:`, {
        original_prompt_preview: `${originalPreview}${optimizationResult.original_prompt.length > 80 ? '...' : ''}`,
        optimized_prompt_preview: `${optimizedPreview}${optimizationResult.optimized_prompt.length > 80 ? '...' : ''}`,
        original_response_preview: `${originalResponsePreview}${(optimizationResult.original_response?.length || 0) > 80 ? '...' : ''}`,
        optimized_response_preview: `${optimizedResponsePreview}${(optimizationResult.optimized_response?.length || 0) > 80 ? '...' : ''}`
      });
    }
    
    if (optimizationResult.status !== 'success') {
      logger.error(`Optimization failed for user ${userId}:`, {
        error: optimizationResult.error,
        optimization_id: optimizationResult.optimization_id
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Optimization service returned error',
        error: optimizationResult.error || 'Unknown error from optimization service',
        optimization_id: optimizationResult.optimization_id
      });
      return;
    }
    
    logger.info(`Successfully completed optimization ${optimizationResult.optimization_id} for user ${userId}`);
    
    // Return the optimization results directly to the frontend
    res.status(200).json(optimizationResult);
  } catch (error: any) {
    logger.error('Error optimizing prompt:', error);
    
    // Handle LLM service errors
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorData = error.response.data;
        
        logger.error('Optimization service error:', {
          status: error.response.status,
          error: errorData?.error,
          optimization_id: errorData?.optimization_id
        });
        
        res.status(error.response.status).json({
          status: 'error',
          message: 'Error from optimization service',
          error: errorData?.error || error.message,
          optimization_id: errorData?.optimization_id || null
        });
        return;
      } else if (error.request) {
        // The request was made but no response was received
        logger.error('Optimization service unavailable - no response received');
        res.status(503).json({
          status: 'error',
          message: 'Optimization service unavailable',
          error: 'Service unavailable - please ensure the LLM service is running'
        });
        return;
      }
    }
    
    // Generic error
    logger.error('Generic optimization error:', {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Error optimizing prompt',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get a specific prompt run
export const getPromptRun = async (req: Request, res: Response): Promise<void> => {
  try {
    const { runId } = req.params;
    
    const run = await prisma.promptRun.findUnique({
      where: { id: runId },
      include: {
        prompt: {
          select: {
            id: true,
            title: true
          }
        },
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
    
    if (!run) {
      res.status(404).json({ 
        status: 'error',
        message: 'Prompt run not found' 
      });
      return;
    }
    
    res.status(200).json({ 
      status: 'success',
      run 
    });
  } catch (error: any) {
    logger.error('Error fetching prompt run:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching prompt run',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get prompt run history
export const getPromptRuns = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promptId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    const limitNum = Number(limit);
    const offset = (Number(page) - 1) * limitNum;
    
    // Build where clause - if promptId is provided, filter by it
    const whereClause = promptId ? { prompt_id: promptId } : {};
    
    const totalCount = await prisma.promptRun.count({
      where: whereClause
    });
    
    const runs = await prisma.promptRun.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      take: limitNum,
      skip: offset,
      include: {
        prompt: {
          select: {
            id: true,
            title: true
          }
        },
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
    
    res.status(200).json({
      status: 'success',
      runs,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error: any) {
    logger.error('Error fetching prompt runs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching prompt runs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export default {
  getAvailableModels,
  executePrompt,
  optimizePrompt,
  getPromptRun,
  getPromptRuns
}; 