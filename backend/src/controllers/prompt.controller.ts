import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';
// Get prompt by ID
export const getPromptById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const prompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        repository: {
          include: {
            owner_user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        },
        versions: {
          orderBy: {
            version_number: 'desc'
          },
          take: 1,
          select: {
            id: true,
            content_snapshot: true,
            version_number: true,
            created_at: true
          }
        }
      }
    });
    
    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found' });
      return;
    }
    
    // Check if the prompt's repository is public or user has access
    const repository = prompt.repository;
    
    if (!repository.is_public) {
      // If not authenticated, deny access
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required for this prompt' });
        return;
      }
      
      // Check if user has access to this repository
      const userId = req.user.id;
      
      // Check if user is repository owner
      const isOwner = repository.owner_user_id === userId;
      
      if (!isOwner) {
        // Check if user is a collaborator
        const collaborator = await prisma.repoCollaborator.findFirst({
          where: {
            repo_id: repository.id,
            user_id: userId
          }
        });
        
        if (!collaborator) {
          res.status(403).json({ message: 'You do not have permission to access this prompt' });
          return;
        }
      }
    }
    
    res.status(200).json({ prompt });
  } catch (error: any) {
    logger.error('Error fetching prompt:', error);
    res.status(500).json({
      message: 'Error fetching prompt',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update prompt
export const updatePrompt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, content, metadata_json, commitMessage } = req.body;
    const userId = req.user.id;
    
    // Use Prisma transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Find the prompt
      const prompt = await tx.prompt.findUnique({
        where: { id }
      });
      
      if (!prompt) {
        throw new Error('Prompt not found');
      }
      
      // Update prompt fields
      const updatedPrompt = await tx.prompt.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(metadata_json !== undefined && { metadata_json })
        }
      });
      
      // If content is provided, create a new version
      if (content !== undefined) {
        // Get the latest version number
        const latestVersion = await tx.promptVersion.findFirst({
          where: { prompt_id: id },
          orderBy: { version_number: 'desc' }
        });
        
        const versionNumber = latestVersion ? latestVersion.version_number + 1 : 1;
        
        // Create a new version
        await tx.promptVersion.create({
          data: {
            prompt_id: id,
            content_snapshot: content,
            commit_message: commitMessage || `Updated version ${versionNumber}`,
            author_id: userId,
            version_number: versionNumber
          }
        });
      }
      
      return updatedPrompt;
    });
    
    res.status(200).json({
      message: 'Prompt updated successfully',
      prompt: {
        id: result.id,
        title: result.title,
        description: result.description,
        updatedAt: result.updated_at
      }
    });
  } catch (error: any) {
    logger.error('Error updating prompt:', error);
    res.status(500).json({
      message: 'Error updating prompt',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all versions of a prompt
export const getPromptVersions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promptId } = req.params;
    
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId }
    });
    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found' });
      return;
    }
    
    const versions = await prisma.promptVersion.findMany({
      where: { prompt_id: promptId },
      include: {
        author: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { version_number: 'desc' }
    });
    
    res.status(200).json({ versions });
  } catch (error: any) {
    logger.error('Error fetching prompt versions:', error);
    res.status(500).json({
      message: 'Error fetching prompt versions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get a specific version of a prompt
export const getPromptVersion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { versionId } = req.params;
    
    const version = await prisma.promptVersion.findUnique({
      where: { id: versionId },
      include: {
        author: {
          select: {
            id: true,
            username: true
          }
        },
        prompt: {
          select: {
            id: true,
            title: true,
            description: true,
            metadata_json: true
          }
        }
      }
    });
    
    if (!version) {
      res.status(404).json({ message: 'Prompt version not found' });
      return;
    }
    
    res.status(200).json({ version });
  } catch (error: any) {
    logger.error('Error fetching prompt version:', error);
    res.status(500).json({
      message: 'Error fetching prompt version',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Execute a prompt (via the Python microservice)
export const executePrompt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promptId, versionId, input_variables, model, model_settings } = req.body;
    const userId = req.user?.id;
    
    // Get the prompt
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId }
    });
    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found' });
      return;
    }
    
    // Get the specific version or latest if not provided
    let promptVersion;
    if (versionId) {
      promptVersion = await prisma.promptVersion.findUnique({
        where: { id: versionId }
      });
      if (!promptVersion) {
        res.status(404).json({ message: 'Prompt version not found' });
        return;
      }
    } else {
      promptVersion = await prisma.promptVersion.findFirst({
        where: { prompt_id: promptId },
        orderBy: { version_number: 'desc' }
      });
      
      if (!promptVersion) {
        res.status(404).json({ message: 'No versions found for this prompt' });
        return;
      }
    }
    
    // Prepare the prompt execution request
    const promptContent = promptVersion.content_snapshot;
    
    // Render the prompt (replace placeholders with values)
    let renderedPrompt = promptContent;
    for (const [key, value] of Object.entries(input_variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      renderedPrompt = renderedPrompt.replace(regex, String(value));
    }
    
    // Call the Python microservice for prompt execution (mock for now)
    // In a real implementation, this would call an external service
    try {
      const result = {
        output: `This is a mock response for the rendered prompt: ${renderedPrompt.substring(0, 50)}...`,
        model: model || 'mock-model',
        tokens_used: 150,
        processing_time_ms: 250,
      };
      
      // Log the run
      const promptRun = await prisma.promptRun.create({
        data: {
          prompt_id: promptId,
          version_id: promptVersion.id,
          user_id: userId,
          model: model || 'mock-model',
          input_variables: input_variables,
          rendered_prompt: renderedPrompt,
          output: result.output,
          success: true,
          metadata: {
            tokens_used: result.tokens_used,
            processing_time_ms: result.processing_time_ms,
            model_settings: model_settings || {}
          }
        }
      });
      
      res.status(200).json({
        message: 'Prompt executed successfully',
        result,
        run_id: promptRun.id
      });
    } catch (execError: any) {
      // Log the error run
      await prisma.promptRun.create({
        data: {
          prompt_id: promptId,
          version_id: promptVersion.id,
          user_id: userId,
          model: model || 'mock-model',
          input_variables: input_variables,
          rendered_prompt: renderedPrompt,
          success: false,
          error_message: execError.message,
          metadata: {
            model_settings: model_settings || {}
          }
        }
      });
      
      throw execError;
    }
  } catch (error: any) {
    logger.error('Error executing prompt:', error);
    res.status(500).json({
      message: 'Error executing prompt',
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

export default {
  getPromptById,
  updatePrompt,
  getPromptVersions,
  getPromptVersion,
  executePrompt,
  getPromptRuns,
  getPromptRun
}; 