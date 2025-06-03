import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';
import axios from 'axios';
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
              select: { id: true, username: true }
            },
            owner_org: {
              select: { id: true, name: true }
            },
            _count: {
              select: { collaborators: true }
            }
          }
        },
        versions: {
          orderBy: { version_number: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
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

    const repository = prompt.repository;
    
    // If the repo is public, allow access
    if (repository.is_public) {
      res.status(200).json({ prompt });
      return;
    }
    
    // If the repo is private, check access
    const userId = req.user?.id;
    
    // If no user is authenticated, deny access
    if (!userId) {
      res.status(401).json({ message: 'Authentication required for this private prompt' });
      return;
    }

    // Ensure proper string comparison for IDs
    const requestUserId = userId.toString();
    const ownerUserId = repository.owner_user?.id?.toString();
    const isOwner = ownerUserId && requestUserId === ownerUserId;
    
    const isOrgMember = repository.owner_org
      ? !!(await prisma.orgMembership.findFirst({
          where: {
            org_id: repository.owner_org.id,
            user_id: userId
          }
        }))
      : false;
      
    const isCollaborator = !!(await prisma.repoCollaborator.findFirst({
      where: {
        repo_id: repository.id,
        user_id: userId
      }
    }));
    
    if (!isOwner && !isOrgMember && !isCollaborator) {
      res.status(403).json({ message: 'You do not have permission to access this prompt' });
      return;
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
          ...(description !== undefined && { description })
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
            content: content,
            commit_message: commitMessage || `Updated version ${versionNumber}`,
            author_id: userId,
            version_number: versionNumber,
            metadata_json: metadata_json
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
            description: true
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
// export const executePrompt = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { promptId } = req.params;
//     const { rendered_prompt, input_variables, parameters } = req.body;
//     const userId = req.user?.id;
    
//     // Get the prompt
//     const prompt = await prisma.prompt.findUnique({
//       where: { id: promptId }
//     });
//     if (!prompt) {
//       res.status(404).json({ message: 'Prompt not found' });
//       return;
//     }
    
//     // Get the latest version
//     const promptVersion = await prisma.promptVersion.findFirst({
//       where: { prompt_id: promptId },
//       orderBy: { version_number: 'desc' }
//     });
    
//     if (!promptVersion) {
//       res.status(404).json({ message: 'No versions found for this prompt' });
//       return;
//     }
    
//     // Call the Python microservice for prompt execution (mock for now)
//     // In a real implementation, this would call an external service
//     try {
//       const result = {
//         response: `This is a mock AI response for the prompt: "${rendered_prompt.substring(0, 100)}${rendered_prompt.length > 100 ? '...' : ''}"
        
// Based on the parameters provided, here's a thoughtful response that demonstrates the AI's understanding of the prompt and the context provided through the input variables.`,
//         model: parameters?.model || 'gpt-3.5-turbo',
//         tokens_used: Math.floor(Math.random() * 200) + 50,
//         processing_time_ms: Math.floor(Math.random() * 500) + 100,
//       };
      
//       // Log the run
//       const promptRun = await prisma.promptRun.create({
//         data: {
//           prompt_id: promptId,
//           version_id: promptVersion.id,
//           user_id: userId,
//           model: result.model,
//           input_variables: input_variables,
//           rendered_prompt: rendered_prompt,
//           output: result.response,
//           success: true,
//           metadata: {
//             tokens_used: result.tokens_used,
//             processing_time_ms: result.processing_time_ms,
//             model_settings: parameters || {}
//           }
//         }
//       });
      
//       res.status(200).json({
//         message: 'Prompt executed successfully',
//         response: result.response,
//         result,
//         run_id: promptRun.id
//       });
//     } catch (execError: any) {
//       // Log the error run
//       await prisma.promptRun.create({
//         data: {
//           prompt_id: promptId,
//           version_id: promptVersion.id,
//           user_id: userId,
//           model: parameters?.model || 'gpt-3.5-turbo',
//           input_variables: input_variables,
//           rendered_prompt: rendered_prompt,
//           success: false,
//           error_message: execError.message,
//           metadata: {
//             model_settings: parameters || {}
//           }
//         }
//       });
      
//       throw execError;
//     }
//   } catch (error: any) {
//     logger.error('Error executing prompt:', error);
//     res.status(500).json({
//       message: 'Error executing prompt',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

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

// Create a new prompt
export const createPrompt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { repository_id, title, description, content, metadata_json } = req.body;
    const userId = req.user.id;
    
    // Use Prisma transaction to create prompt and initial version
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Check if repository exists
      const repository = await tx.repository.findUnique({
        where: { id: repository_id }
      });
      
      if (!repository) {
        throw new Error('Repository not found');
      }
      
      // Create the prompt
      const prompt = await tx.prompt.create({
        data: {
          repository_id,
          title,
          description: description || ''
        }
      });
      
      // Create initial version
      const version = await tx.promptVersion.create({
        data: {
          prompt_id: prompt.id,
          content: content || '',
          commit_message: 'Initial version',
          author_id: userId,
          version_number: 1,
          metadata_json: metadata_json || null
        }
      });
      
      return { prompt, version };
    });
    
    res.status(201).json({
      message: 'Prompt created successfully',
      prompt: {
        id: result.prompt.id,
        title: result.prompt.title,
        description: result.prompt.description,
        repository_id: result.prompt.repository_id,
        created_at: result.prompt.created_at
      },
      version: {
        id: result.version.id,
        version_number: result.version.version_number
      }
    });
  } catch (error: any) {
    logger.error('Error creating prompt:', error);
    if (error.message === 'Repository not found') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({
        message: 'Error creating prompt',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// Get merge requests for a prompt
export const getPromptMergeRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promptId } = req.params;
    
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId }
    });
    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found' });
      return;
    }
    
    const mergeRequests = await prisma.mergeRequest.findMany({
      where: { prompt_id: promptId },
      include: {
        creator: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    
    res.status(200).json({ mergeRequests });
  } catch (error: any) {
    logger.error('Error fetching merge requests:', error);
    res.status(500).json({
      message: 'Error fetching merge requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get a specific merge request
export const getMergeRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mergeRequestId } = req.params;
    
    const mergeRequest = await prisma.mergeRequest.findUnique({
      where: { id: mergeRequestId },
      include: {
        creator: {
          select: {
            id: true,
            username: true
          }
        },
        prompt: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      }
    });
    
    if (!mergeRequest) {
      res.status(404).json({ message: 'Merge request not found' });
      return;
    }
    
    res.status(200).json({ mergeRequest });
  } catch (error: any) {
    logger.error('Error fetching merge request:', error);
    res.status(500).json({
      message: 'Error fetching merge request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create a new merge request
export const createMergeRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promptId } = req.params;
    const { description, content, metadata_json } = req.body;
    const userId = req.user.id;

    if (!description || !content) {
      res.status(400).json({ message: "Description and content are required." });
      return;
    }

    const prompt = await prisma.prompt.findUnique({ where: { id: promptId } });
    if (!prompt) {
      res.status(404).json({ message: "Prompt not found" });
      return;
    }

    const mergeRequest = await prisma.mergeRequest.create({
      data: {
        prompt_id: promptId,
        description,
        content,
        metadata_json,
        created_by: userId
      } as any
    });

    res.status(201).json({ message: "Merge request created", mergeRequest });
  } catch (error: any) {
    logger.error("Error creating merge request:", error);
    res.status(500).json({
      message: "Error creating merge request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Reject a merge request
export const rejectMergeRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mergeRequestId } = req.params;

    const mergeRequest = await prisma.mergeRequest.findUnique({ where: { id: mergeRequestId } });
    if (!mergeRequest) {
      res.status(404).json({ message: "Merge request not found" });
      return;
    }

    if (mergeRequest.status !== "OPEN") {
      res.status(400).json({ message: "Only OPEN requests can be rejected" });
      return;
    }

    await prisma.mergeRequest.update({
      where: { id: mergeRequestId },
      data: { status: "REJECTED" }
    });

    res.status(200).json({ message: "Merge request rejected" });
  } catch (error: any) {
    logger.error("Error rejecting merge request:", error);
    res.status(500).json({
      message: "Error rejecting merge request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Merge a merge request (creates a new prompt version)
export const mergeMergeRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mergeRequestId } = req.params;
    const userId = req.user.id;

    const mr = await prisma.mergeRequest.findUnique({
      where: { id: mergeRequestId },
      include: { prompt: true }
    });

    if (!mr) {
      res.status(404).json({ message: "Merge request not found" });
      return;
    }

    if (mr.status !== "OPEN") {
      res.status(400).json({ message: "Only OPEN requests can be merged" });
      return;
    }

    const latestVersion = await prisma.promptVersion.findFirst({
      where: { prompt_id: mr.prompt_id },
      orderBy: { version_number: "desc" }
    });

    const versionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

    const newVersion = await prisma.promptVersion.create({
      data: {
        prompt_id: mr.prompt_id,
        content: mr.content,
        metadata_json: mr.metadata_json as any,
        commit_message: mr.description,
        version_number: versionNumber,
        author_id: userId
      }
    });

    // Create a versioned run with actual execution to capture real metrics
    try {
      const parameters = (mr.metadata_json as any)?.parameters || {
        temperature: 0.7,
        top_p: 1.0,
        frequency_penalty: 0.0,
        max_tokens: 500
      };
      
      // Execute the prompt to get real metrics for version tracking
      const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:5000';
      
      const llmRequest = {
        model: 'gemini-1.5-flash',
        prompt: mr.content,
        parameters: parameters
      };
      
      logger.info(`Executing baseline run for version ${versionNumber}`);
      
      let runData: any = {
        prompt_id: mr.prompt_id,
        prompt_version_id: newVersion.id,
        user_id: userId,
        model: 'gemini-1.5-flash',
        prompt_content: mr.content,
        run_type: 'VERSIONED',
        metadata: {
          version_number: versionNumber,
          commit_message: mr.description,
          model_parameters: parameters,
          is_baseline_run: true,
          merged_at: new Date().toISOString()
        }
      };

             try {
         // Call the LLM service to get real metrics
         const llmResponse = await axios.post(`${LLM_SERVICE_URL}/generate`, llmRequest, {
          timeout: 30000 // 30 second timeout
        });

        const { status, output, metrics } = llmResponse.data;
        
        if (status === 'success') {
          // Use real execution results
          runData.output = output;
          runData.success = true;
          runData.metadata = {
            ...runData.metadata,
            processing_time_ms: metrics?.processing_time_ms || 0,
            tokens_input: metrics?.tokens_input || 0,
            tokens_output: metrics?.tokens_output || 0,
            total_tokens: metrics?.total_tokens || 0,
            cost_usd: metrics?.cost_usd || 0,
            cost_input: metrics?.cost_input || 0,
            cost_output: metrics?.cost_output || 0
          };
          logger.info(`Baseline run executed successfully with cost: $${metrics?.cost_usd || 0}`);
        } else {
          throw new Error('LLM service returned error status');
        }
      } catch (llmError) {
        logger.warn('Failed to execute baseline run, creating placeholder:', llmError);
        // Fallback to placeholder if LLM service is unavailable
        runData.output = null;
        runData.success = true;
        runData.error_message = 'Baseline run - LLM service unavailable during merge';
      }

      // Create the versioned run record
      await prisma.promptRun.create({ data: runData });
      
    } catch (runError) {
      logger.warn('Failed to create baseline versioned run:', runError);
      // Don't fail the merge if run creation fails
    }

    await prisma.mergeRequest.update({
      where: { id: mergeRequestId },
      data: {
        status: "MERGED",
        resulting_version_id: newVersion.id,
        merged_at: new Date()
      }
    });

    res.status(200).json({ message: "Merge request merged", version: newVersion });
  } catch (error: any) {
    logger.error("Error merging merge request:", error);
    res.status(500).json({
      message: "Error merging merge request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Get prompt version metrics for evolution analytics
export const getPromptVersionMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promptId } = req.params;

    // Get all versions for this prompt
    const versions = await prisma.promptVersion.findMany({
      where: { prompt_id: promptId },
      orderBy: { version_number: 'asc' },
      include: {
        prompt_runs: {
          where: { 
            run_type: 'VERSIONED',
            success: true 
          },
          select: {
            id: true,
            metadata: true,
            created_at: true,
            model: true
          }
        },
        author: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    // Calculate metrics for each version
    const versionMetrics = versions.map(version => {
      const runs = version.prompt_runs;
      
      // Calculate aggregated metrics from all runs for this version
      const totalCost = runs.reduce((sum, run) => {
        const metadata = run.metadata as any;
        return sum + (metadata?.cost_usd || 0);
      }, 0);

      const totalInputCost = runs.reduce((sum, run) => {
        const metadata = run.metadata as any;
        return sum + (metadata?.cost_input || 0);
      }, 0);

      const totalOutputCost = runs.reduce((sum, run) => {
        const metadata = run.metadata as any;
        return sum + (metadata?.cost_output || 0);
      }, 0);

      const totalInputTokens = runs.reduce((sum, run) => {
        const metadata = run.metadata as any;
        return sum + (metadata?.tokens_input || 0);
      }, 0);

      const totalOutputTokens = runs.reduce((sum, run) => {
        const metadata = run.metadata as any;
        return sum + (metadata?.tokens_output || 0);
      }, 0);

      const totalTokens = runs.reduce((sum, run) => {
        const metadata = run.metadata as any;
        return sum + (metadata?.total_tokens || 0);
      }, 0);

      const avgCost = runs.length > 0 ? totalCost / runs.length : 0;
      const avgInputCost = runs.length > 0 ? totalInputCost / runs.length : 0;
      const avgOutputCost = runs.length > 0 ? totalOutputCost / runs.length : 0;
      const avgInputTokens = runs.length > 0 ? totalInputTokens / runs.length : 0;
      const avgOutputTokens = runs.length > 0 ? totalOutputTokens / runs.length : 0;
      const avgTokens = runs.length > 0 ? totalTokens / runs.length : 0;

      const avgProcessingTime = runs.length > 0 
        ? runs.reduce((sum, run) => {
            const metadata = run.metadata as any;
            return sum + (metadata?.processing_time_ms || 0);
          }, 0) / runs.length
        : 0;

      return {
        version_number: version.version_number,
        version_id: version.id,
        commit_message: version.commit_message,
        created_at: version.created_at,
        author: version.author,
        metrics: {
          total_cost: totalCost,
          avg_cost: avgCost,
          total_input_cost: totalInputCost,
          avg_input_cost: avgInputCost,
          total_output_cost: totalOutputCost,
          avg_output_cost: avgOutputCost,
          total_tokens: totalTokens,
          avg_tokens: avgTokens,
          total_input_tokens: totalInputTokens,
          avg_input_tokens: avgInputTokens,
          total_output_tokens: totalOutputTokens,
          avg_output_tokens: avgOutputTokens,
          avg_processing_time: avgProcessingTime,
          run_count: runs.length
        }
      };
    });

    res.status(200).json({ 
      prompt_id: promptId,
      version_metrics: versionMetrics 
    });
  } catch (error: any) {
    logger.error('Error fetching version metrics:', error);
    res.status(500).json({
      message: 'Error fetching version metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  getPromptById,
  updatePrompt,
  getPromptVersions,
  getPromptVersion,
  // executePrompt,
  getPromptRuns,
  getPromptRun,
  createPrompt,
  getPromptMergeRequests,
  getMergeRequest,
  createMergeRequest,
  rejectMergeRequest,
  mergeMergeRequest,
  getPromptVersionMetrics
}; 