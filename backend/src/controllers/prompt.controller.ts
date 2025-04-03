import { Request, Response } from 'express';
import { Prompt, PromptVersion, Repository, Account, sequelize } from '../models';
import logger from '../utils/logger';

// Get prompt by ID
export const getPromptById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const prompt = await Prompt.findByPk(id, {
      include: [
        {
          model: Repository,
          as: 'repository',
          attributes: ['id', 'name', 'is_public'],
          include: [
            {
              model: Account,
              as: 'owner_user',
              attributes: ['id', 'username']
            }
          ]
        },
        {
          model: PromptVersion,
          as: 'versions',
          limit: 1,
          order: [['version_number', 'DESC']],
          attributes: ['id', 'content_snapshot', 'version_number', 'created_at']
        }
      ]
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
        const collaborator = await RepoCollaborator.findOne({
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
  } catch (error) {
    logger.error('Error fetching prompt:', error);
    res.status(500).json({
      message: 'Error fetching prompt',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update prompt
export const updatePrompt = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { title, description, content, metadata_json, commitMessage } = req.body;
    const userId = req.user.id;
    
    // Find the prompt
    const prompt = await Prompt.findByPk(id, { transaction });
    
    if (!prompt) {
      await transaction.rollback();
      res.status(404).json({ message: 'Prompt not found' });
      return;
    }
    
    // Update prompt fields
    if (title !== undefined) prompt.title = title;
    if (description !== undefined) prompt.description = description;
    if (metadata_json !== undefined) prompt.metadata_json = metadata_json;
    
    await prompt.save({ transaction });
    
    // If content is provided, create a new version
    if (content !== undefined) {
      // Get the latest version number
      const latestVersion = await PromptVersion.findOne({
        where: { prompt_id: id },
        order: [['version_number', 'DESC']],
        transaction
      });
      
      const versionNumber = latestVersion ? latestVersion.version_number + 1 : 1;
      
      // Create a new version
      await PromptVersion.create({
        prompt_id: id,
        content_snapshot: content,
        commit_message: commitMessage || `Updated version ${versionNumber}`,
        author_id: userId,
        version_number: versionNumber
      }, { transaction });
    }
    
    await transaction.commit();
    
    res.status(200).json({
      message: 'Prompt updated successfully',
      prompt: {
        id: prompt.id,
        title: prompt.title,
        description: prompt.description,
        updatedAt: prompt.updated_at
      }
    });
  } catch (error) {
    await transaction.rollback();
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
    
    const prompt = await Prompt.findByPk(promptId);
    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found' });
      return;
    }
    
    const versions = await PromptVersion.findAll({
      where: { prompt_id: promptId },
      include: [
        {
          model: Account,
          as: 'author',
          attributes: ['id', 'username']
        }
      ],
      order: [['version_number', 'DESC']]
    });
    
    res.status(200).json({ versions });
  } catch (error) {
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
    
    const version = await PromptVersion.findByPk(versionId, {
      include: [
        {
          model: Account,
          as: 'author',
          attributes: ['id', 'username']
        },
        {
          model: Prompt,
          as: 'prompt',
          attributes: ['id', 'title', 'description', 'metadata_json']
        }
      ]
    });
    
    if (!version) {
      res.status(404).json({ message: 'Prompt version not found' });
      return;
    }
    
    res.status(200).json({ version });
  } catch (error) {
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
    const prompt = await Prompt.findByPk(promptId);
    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found' });
      return;
    }
    
    // Get the specific version or latest if not provided
    let promptVersion;
    if (versionId) {
      promptVersion = await PromptVersion.findByPk(versionId);
      if (!promptVersion) {
        res.status(404).json({ message: 'Prompt version not found' });
        return;
      }
    } else {
      promptVersion = await PromptVersion.findOne({
        where: { prompt_id: promptId },
        order: [['version_number', 'DESC']]
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
      const promptRun = await PromptRun.create({
        prompt_id: promptId,
        version_id: promptVersion.id,
        user_id: userId,
        model: model || 'mock-model',
        input_variables,
        rendered_prompt: renderedPrompt,
        output: result.output,
        success: true,
        metadata: {
          tokens_used: result.tokens_used,
          processing_time_ms: result.processing_time_ms,
          model_settings: model_settings || {}
        }
      });
      
      res.status(200).json({
        message: 'Prompt executed successfully',
        result,
        run_id: promptRun.id
      });
    } catch (execError) {
      // Log the error run
      await PromptRun.create({
        prompt_id: promptId,
        version_id: promptVersion.id,
        user_id: userId,
        model: model || 'mock-model',
        input_variables,
        rendered_prompt: renderedPrompt,
        success: false,
        error_message: execError.message,
        metadata: {
          model_settings: model_settings || {}
        }
      });
      
      throw execError;
    }
  } catch (error) {
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
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const { count, rows } = await PromptRun.findAndCountAll({
      where: { prompt_id: promptId },
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

// Get a specific prompt run
export const getPromptRun = async (req: Request, res: Response): Promise<void> => {
  try {
    const { runId } = req.params;
    
    const run = await PromptRun.findByPk(runId, {
      include: [
        {
          model: Prompt,
          as: 'prompt',
          attributes: ['id', 'title']
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

export default {
  getPromptById,
  updatePrompt,
  getPromptVersions,
  getPromptVersion,
  executePrompt,
  getPromptRuns,
  getPromptRun
}; 