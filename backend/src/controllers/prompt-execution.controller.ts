import { Request, Response } from 'express';
import axios from 'axios';
import { PromptVersion, Prompt, PromptRun, Account, sequelize } from '../models';
import logger from '../utils/logger';

// Environment variable for the LLM service URL
const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:5000';

// Get available LLM models
export const getAvailableModels = async (req: Request, res: Response): Promise<void> => {
  try {
    // Call the LLM service to get available models
    const response = await axios.get(`${LLM_SERVICE_URL}/models`);
    
    res.status(200).json({
      models: response.data.models
    });
  } catch (error) {
    logger.error('Error fetching available models:', error);
    res.status(500).json({
      message: 'Error fetching available models',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Execute a prompt
export const executePrompt = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const { promptId, versionId, input, model, parameters } = req.body;
    const userId = req.user?.id;
    
    // Validate required fields
    if (!promptId && !versionId) {
      await transaction.rollback();
      res.status(400).json({ message: 'Either promptId or versionId is required' });
      return;
    }
    
    if (!model) {
      await transaction.rollback();
      res.status(400).json({ message: 'Model is required' });
      return;
    }
    
    // Get the prompt version
    let promptVersion;
    if (versionId) {
      promptVersion = await PromptVersion.findByPk(versionId, {
        include: [
          {
            model: Prompt,
            as: 'prompt'
          }
        ],
        transaction
      });
      
      if (!promptVersion) {
        await transaction.rollback();
        res.status(404).json({ message: 'Prompt version not found' });
        return;
      }
    } else {
      // Get latest version of the prompt
      promptVersion = await PromptVersion.findOne({
        where: { 
          prompt_id: promptId 
        },
        include: [
          {
            model: Prompt,
            as: 'prompt'
          }
        ],
        order: [['version_number', 'DESC']],
        transaction
      });
      
      if (!promptVersion) {
        await transaction.rollback();
        res.status(404).json({ message: 'No versions found for this prompt' });
        return;
      }
    }
    
    // Get the prompt from the version
    const prompt = promptVersion.prompt;
    
    // Check if the prompt has chat format (messages array) or text format
    const isChatFormat = Array.isArray(promptVersion.content);
    
    // Prepare the request to the LLM service
    let llmRequest;
    let llmEndpoint;
    
    if (isChatFormat) {
      // Handle chat format - replace variables in messages
      const messages = promptVersion.content.map((message: any) => {
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
    } else {
      // Handle text format - replace variables in the prompt
      let promptText = promptVersion.content;
      
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
    }
    
    // Call the LLM service
    logger.info(`Calling LLM service (${model}) with prompt version ${promptVersion.id}`);
    const llmResponse = await axios.post(`${LLM_SERVICE_URL}${llmEndpoint}`, llmRequest, {
      timeout: 60000 // 60 second timeout
    });
    
    // Extract the response data
    const { output, metrics, status, log } = llmResponse.data;
    
    // Create a prompt run record
    const promptRun = await PromptRun.create({
      prompt_id: prompt.id,
      version_id: promptVersion.id,
      user_id: userId,
      model,
      input_variables: input,
      rendered_prompt: isChatFormat ? JSON.stringify(llmRequest.messages) : llmRequest.prompt,
      output,
      success: status === 'success',
      error_message: status === 'error' ? output : null,
      metrics: {
        processing_time_ms: metrics.processing_time_ms,
        tokens_input: metrics.tokens_input,
        tokens_output: metrics.tokens_output,
        model_parameters: parameters || {}
      },
      created_at: new Date()
    }, { transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      status: 'success',
      run_id: promptRun.id,
      output,
      metrics,
      log
    });
  } catch (error) {
    await transaction.rollback();
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
    
    const run = await PromptRun.findByPk(runId, {
      include: [
        {
          model: Prompt,
          as: 'prompt',
          attributes: ['id', 'name']
        },
        {
          model: PromptVersion,
          as: 'version',
          attributes: ['id', 'version_number']
        },
        {
          model: Account,
          as: 'user',
          attributes: ['id', 'username']
        }
      ]
    });
    
    if (!run) {
      res.status(404).json({ message: 'Prompt run not found' });
      return;
    }
    
    res.status(200).json({ run });
  } catch (error) {
    logger.error('Error fetching prompt run:', error);
    res.status(500).json({
      message: 'Error fetching prompt run',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get prompt run history for a specific prompt
export const getPromptRuns = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promptId } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const { count, rows } = await PromptRun.findAndCountAll({
      where: { prompt_id: promptId },
      include: [
        {
          model: PromptVersion,
          as: 'version',
          attributes: ['id', 'version_number']
        },
        {
          model: Account,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset
    });
    
    res.status(200).json({
      runs: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
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