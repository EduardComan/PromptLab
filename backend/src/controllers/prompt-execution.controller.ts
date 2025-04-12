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
    res.status(500).json({
      message: 'Error fetching available models',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Execute a prompt
export const executePrompt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promptId, versionId, input, model, parameters } = req.body;
    const userId = req.user?.id;
    
    // Validate required fields
    if (!promptId && !versionId) {
      res.status(400).json({ message: 'Either promptId or versionId is required' });
      return;
    }
    
    if (!model) {
      res.status(400).json({ message: 'Model is required' });
      return;
    }
    
    // Get the prompt version
    let promptVersion;
    if (versionId) {
      promptVersion = await prisma.promptVersion.findUnique({
        where: { id: versionId },
        include: {
          prompt: true
        }
      });
      
      if (!promptVersion) {
        res.status(404).json({ message: 'Prompt version not found' });
        return;
      }
    } else {
      // Get latest version of the prompt
      promptVersion = await prisma.promptVersion.findFirst({
        where: { 
          prompt_id: promptId 
        },
        include: {
          prompt: true
        },
        orderBy: { version_number: 'desc' }
      });
      
      if (!promptVersion) {
        res.status(404).json({ message: 'No versions found for this prompt' });
        return;
      }
    }
    
    // Get the prompt from the version
    const prompt = promptVersion.prompt;
    
    // Check if the prompt has chat format (messages array) or text format
    const contentSnapshot = promptVersion.content_snapshot;
    const isChatFormat = contentSnapshot.startsWith('[') && contentSnapshot.endsWith(']');
    let parsedContent;
    
    try {
      if (isChatFormat) {
        parsedContent = JSON.parse(contentSnapshot);
      }
    } catch (err) {
      // If parsing fails, treat as text format
      parsedContent = null;
    }
    
    // Prepare the request to the LLM service
    let llmRequest;
    let llmEndpoint;
    let renderedPrompt;
    
    if (isChatFormat && Array.isArray(parsedContent)) {
      // Handle chat format - replace variables in messages
      const messages = parsedContent.map((message: any) => {
        let content = message.content;
        
        // Replace variables in the content if input is provided
        if (input && typeof input === 'object') {
          for (const [key, value] of Object.entries(input)) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            content = content.replace(regex, String(value));
          }
        }
        
        return {
          role: message.role,
          content
        };
      });
      
      llmEndpoint = '/chat';
      llmRequest = {
        model,
        messages,
        parameters: parameters || {}
      };
      renderedPrompt = JSON.stringify(messages);
    } else {
      // Handle text format - replace variables in the prompt
      let promptText = contentSnapshot;
      
      // Replace variables in the content if input is provided
      if (input && typeof input === 'object') {
        for (const [key, value] of Object.entries(input)) {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
          promptText = promptText.replace(regex, String(value));
        }
      }
      
      llmEndpoint = '/generate';
      llmRequest = {
        model,
        prompt: promptText,
        parameters: parameters || {}
      };
      renderedPrompt = promptText;
    }
    
    // Call the LLM service
    logger.info(`Calling LLM service (${model}) with prompt version ${promptVersion.id}`);
    const llmResponse = await axios.post(`${LLM_SERVICE_URL}${llmEndpoint}`, llmRequest, {
      timeout: 60000 // 60 second timeout
    });
    
    // Extract the response data
    const { output, metrics, status, log } = llmResponse.data;
    
    // Create a prompt run record
    const promptRun = await prisma.promptRun.create({
      data: {
        prompt_id: prompt.id,
        version_id: promptVersion.id,
        user_id: userId,
        model,
        input_variables: input,
        rendered_prompt: renderedPrompt,
        output,
        success: status === 'success',
        error_message: status === 'error' ? output : null,
        metadata: {
          processing_time_ms: metrics?.processing_time_ms,
          tokens_input: metrics?.tokens_input,
          tokens_output: metrics?.tokens_output,
          model_parameters: parameters || {}
        }
      }
    });
    
    res.status(200).json({
      status: 'success',
      run_id: promptRun.id,
      output,
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
        res.status(error.response.status).json({
          status: 'error',
          message: 'Error from LLM service',
          error: error.response.data
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        version: {
          select: {
            id: true,
            version_number: true
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
      res.status(404).json({ message: 'Prompt run not found' });
      return;
    }
    
    res.status(200).json({ run });
  } catch (error: any) {
    logger.error('Error fetching prompt run:', error);
    res.status(500).json({
      message: 'Error fetching prompt run',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    
    const totalCount = await prisma.promptRun.count({
      where: { prompt_id: promptId }
    });
    
    const runs = await prisma.promptRun.findMany({
      where: { prompt_id: promptId },
      orderBy: { created_at: 'desc' },
      take: limitNum,
      skip: offset
    });
    
    res.status(200).json({
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
      message: 'Error fetching prompt runs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  getAvailableModels,
  executePrompt,
  getPromptRun,
  getPromptRuns
}; 