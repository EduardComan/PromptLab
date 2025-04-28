import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';
// Create a new repository
export const createRepository = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, is_public, org_id, default_prompt_title, default_prompt_content } = req.body;
    const userId = req.user.id;
    
    // Validate organization access if org_id is provided
    if (org_id) {
      const orgMember = await prisma.orgMembership.findFirst({
        where: {
          org_id: org_id,
          user_id: userId
        }
      });
      
      if (!orgMember) {
        res.status(403).json({ message: 'You are not a member of this organization' });
        return;
      }
    }
    
    // Use transaction to create repository and default prompt
    const result = await prisma.$transaction(async (tx) => {
      // Create the repository
      const repository = await tx.repository.create({
        data: {
          name,
          description,
          is_public: is_public || false,
          owner_user_id: userId,
          owner_org_id: org_id
        }
      });
      
      // Create a default prompt if title is provided
      let prompt = null;
      let promptVersion = null;
      
      if (default_prompt_title) {
        prompt = await tx.prompt.create({
          data: {
            repository_id: repository.id,
            title: default_prompt_title,
            description: 'Default repository prompt'
          }
        });
        
        promptVersion = await tx.promptVersion.create({
          data: {
            prompt_id: prompt.id,
            content_snapshot: default_prompt_content || '',
            commit_message: 'Initial version',
            author_id: userId,
            version_number: 1
          }
        });
      }
      
      return { repository, prompt, promptVersion };
    });
    
    res.status(201).json({
      message: 'Repository created successfully',
      repository: result.repository,
      default_prompt: result.prompt ? {
        id: result.prompt.id,
        title: result.prompt.title,
        version: {
          id: result.promptVersion?.id,
          version_number: result.promptVersion?.version_number
        }
      } : null
    });
  } catch (error: any) {
    logger.error('Error creating repository:', error);
    res.status(500).json({
      message: 'Error creating repository',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get repository by ID
export const getRepositoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const repository = await prisma.repository.findUnique({
      where: { id },
      include: {
        owner_user: {
          select: {
            id: true,
            username: true
          }
        },
        owner_org: {
          select: {
            id: true,
            name: true
          }
        },
        prompts: {
          select: {
            id: true,
            title: true,
            description: true,
            metadata_json: true,
            created_at: true,
            updated_at: true,
            versions: {
              orderBy: {
                version_number: 'desc'
              },
              take: 1,
              select: {
                id: true,
                version_number: true,
                content_snapshot: true,
                commit_message: true,
                created_at: true,
                author: {
                  select: {
                    id: true,
                    username: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!repository) {
      res.status(404).json({ message: 'Repository not found' });
      return;
    }
    
    // Check if repository is private and user is not authorized
    if (!repository.is_public) {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ message: 'Authentication required for private repositories' });
        return;
      }
      
      // Check if user is owner or collaborator
      const isOwner = repository.owner_user_id === userId;
      let isCollaborator = false;
      let isOrgMember = false;
      
      if (!isOwner) {
        // Check if user is a collaborator
        const collaborator = await prisma.repoCollaborator.findFirst({
          where: {
            repo_id: id,
            user_id: userId
          }
        });
        
        isCollaborator = !!collaborator;
        
        // Check if user is org member (if org owned)
        if (repository.owner_org_id) {
          const membership = await prisma.orgMembership.findFirst({
            where: {
              org_id: repository.owner_org_id,
              user_id: userId
            }
          });
          
          isOrgMember = !!membership;
        }
      }
      
      if (!isOwner && !isCollaborator && !isOrgMember) {
        res.status(403).json({ message: 'You do not have permission to access this repository' });
        return;
      }
    }
    
    // Count stars
    const starCount = await prisma.star.count({
      where: { repo_id: id }
    });
    
    // Check if current user has starred
    let isStarred = false;
    if (req.user?.id) {
      const star = await prisma.star.findFirst({
        where: {
          repo_id: id,
          user_id: req.user.id
        }
      });
      isStarred = !!star;
    }
    
    // Since repository-prompt is 1:1, extract the primary prompt for easier access
    const primaryPrompt = repository.prompts && repository.prompts.length > 0 
      ? repository.prompts[0] 
      : null;
    
    res.status(200).json({
      repository: {
        ...repository,
        primaryPrompt
      },
      metrics: {
        stars: starCount,
        isStarred
      }
    });
  } catch (error: unknown) {
    logger.error('Error fetching repository:', error);
    res.status(500).json({
      message: 'Error fetching repository',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
};

// Update repository
export const updateRepository = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, isPublic } = req.body;
    
    const repository = await prisma.repository.findUnique({
      where: { id }
    });
    
    if (!repository) {
      res.status(404).json({ message: 'Repository not found' });
      return;
    }
    
    // Update fields
    if (name !== undefined) repository.name = name;
    if (description !== undefined) repository.description = description;
    if (isPublic !== undefined) repository.is_public = isPublic;
    
    await prisma.repository.update({
      where: { id },
      data: repository
    });
    
    res.status(200).json({
      message: 'Repository updated successfully',
      repository: {
        id: repository.id,
        name: repository.name,
        description: repository.description,
        is_public: repository.is_public,
        updated_at: repository.updated_at
      }
    });
  } catch (error: unknown) {
    logger.error('Error updating repository:', error);
    res.status(500).json({
      message: 'Error updating repository',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
};

// Delete repository
export const deleteRepository = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const repository = await tx.repository.findUnique({
        where: { id }
      });
      
      if (!repository) {
        throw new Error('Repository not found');
      }
      
      // Delete repository (cascade will handle related entities)
      return await tx.repository.delete({
        where: { id }
      });
    });

    res.status(200).json({
      message: 'Repository deleted successfully'
    });
  } catch (error: unknown) {
    logger.error('Error deleting repository:', error);
    res.status(500).json({
      message: 'Error deleting repository',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
};

// List repositories
export const listRepositories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      sort = 'updated_at', 
      order = 'desc',
      search,
      username,
      orgName,
      isPublic 
    } = req.query;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const limitNum = parseInt(limit as string);
    
    // Build where clause
    const where: any = {};
    
    // Search by name or description
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    // Filter by public/private
    if (isPublic !== undefined) {
      where.is_public = isPublic === 'true';
    }
    
    // Include only public repos if not authenticated
    if (!req.user) {
      where.is_public = true;
    }
    
    // Filter by user
    if (username) {
      const user = await prisma.account.findFirst({
        where: { username: username as string }
      });
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      where.owner_user_id = user.id;
    }
    
    // Filter by organization
    if (orgName) {
      const organization = await prisma.organization.findFirst({
        where: { name: orgName as string }
      });
      
      if (!organization) {
        res.status(404).json({ message: 'Organization not found' });
        return;
      }
      
      where.owner_org_id = organization.id;
    }
    
    // Count total repositories matching criteria
    const count = await prisma.repository.count({ where });
    
    // Get repositories
    const repositories = await prisma.repository.findMany({
      where,
      include: {
        owner_user: {
          select: {
            id: true,
            username: true
          }
        },
        owner_org: {
          select: {
            id: true,
            name: true
          }
        },
        prompts: {
          select: {
            id: true,
            title: true,
            description: true,
            created_at: true,
            updated_at: true,
            versions: {
              orderBy: {
                version_number: 'desc'
              },
              take: 1,
              select: {
                id: true,
                version_number: true,
                created_at: true
              }
            }
          }
        }
      },
      orderBy: {
        [sort as string]: order as string
      },
      take: limitNum,
      skip: offset
    });
    
    // Add primaryPrompt to each repository
    const enhancedRepositories = repositories.map(repo => ({
      ...repo,
      primaryPrompt: repo.prompts && repo.prompts.length > 0 ? repo.prompts[0] : null
    }));
    
    res.status(200).json({
      repositories: enhancedRepositories,
      pagination: {
        total: count,
        page: parseInt(page as string),
        limit: limitNum,
        pages: Math.ceil(count / limitNum)
      }
    });
  } catch (error: unknown) {
    logger.error('Error listing repositories:', error);
    res.status(500).json({
      message: 'Error listing repositories',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
};

// Manage repository collaborators
export const addCollaborator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { repoId, userId, role } = req.body;
    
    // Check if repository exists
    const repository = await prisma.repository.findUnique({
      where: { id: repoId }
    });
    if (!repository) {
      res.status(404).json({ message: 'Repository not found' });
      return;
    }
    
    // Check if user exists
    const user = await prisma.account.findUnique({
      where: { id: userId }
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Check if collaboration already exists
    const existingCollaboration = await prisma.repoCollaborator.findFirst({
      where: {
        repo_id: repoId,
        user_id: userId
      }
    });
    
    if (existingCollaboration) {
      // Update role if already exists
      const updatedCollaboration = await prisma.repoCollaborator.update({
        where: { id: existingCollaboration.id },
        data: { role }
      });
      
      res.status(200).json({
        message: 'Collaborator role updated successfully',
        collaboration: updatedCollaboration
      });
      return;
    }
    
    // Create new collaboration
    const collaboration = await prisma.repoCollaborator.create({
      data: {
        repo_id: repoId,
        user_id: userId,
        role
      }
    });
    
    res.status(201).json({
      message: 'Collaborator added successfully',
      collaboration
    });
  } catch (error: unknown) {
    logger.error('Error adding collaborator:', error);
    res.status(500).json({
      message: 'Error adding collaborator',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
};

// Remove collaborator
export const removeCollaborator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { repoId, userId } = req.params;
    
    // Find collaboration
    const collaboration = await prisma.repoCollaborator.findFirst({
      where: {
        repo_id: repoId,
        user_id: userId
      }
    });
    
    if (!collaboration) {
      res.status(404).json({ message: 'Collaboration not found' });
      return;
    }
    
    // Delete collaboration
    await prisma.repoCollaborator.delete({
      where: { id: collaboration.id }
    });
    
    res.status(200).json({
      message: 'Collaborator removed successfully'
    });
  } catch (error: unknown) {
    logger.error('Error removing collaborator:', error);
    res.status(500).json({
      message: 'Error removing collaborator',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
};

// List collaborators for a repository
export const listCollaborators = async (req: Request, res: Response): Promise<void> => {
  try {
    const { repoId } = req.params;
    
    // Check if repository exists
    const repository = await prisma.repository.findUnique({
      where: { id: repoId }
    });
    if (!repository) {
      res.status(404).json({ message: 'Repository not found' });
      return;
    }
    
    // Get collaborators
    const collaborators = await prisma.repoCollaborator.findMany({
      where: {
        repo_id: repoId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            profile_image_id: true
          }
        }
      }
    });
    
    res.status(200).json({ collaborators });
  } catch (error: unknown) {
    logger.error('Error listing collaborators:', error);
    res.status(500).json({
      message: 'Error listing collaborators',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
};

// Get repositories for a specific user (profile page)
export const getUserRepositories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Find the user by username
    const user = await prisma.account.findFirst({
      where: { username: username as string },
      select: { id: true, username: true }
    });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Build where clause based on auth status
    let where: any = { owner_user_id: user.id };
    
    // Check if the current user is authorized to see private repositories
    const currentUserId = req.user?.id;
    const isOwner = currentUserId === user.id;
    
    // If not the owner, only show public repositories
    if (!isOwner) {
      where.is_public = true;
    }
    
    // Count total repositories for this user
    const count = await prisma.repository.count({ where });
    
    // Get repositories where the user is the owner, respecting visibility
    const repositories = await prisma.repository.findMany({
      where,
      include: {
        owner_user: {
          select: {
            id: true,
            username: true
          }
        },
        owner_org: {
          select: {
            id: true,
            name: true
          }
        },
        prompts: {
          select: {
            id: true,
            title: true,
            description: true,
            created_at: true,
            updated_at: true,
            versions: {
              orderBy: {
                version_number: 'desc'
              },
              take: 1,
              select: {
                id: true,
                version_number: true,
                content_snapshot: true,
                created_at: true
              }
            }
          }
        },
        _count: {
          select: {
            stars: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: {
        updated_at: 'desc'
      }
    });
    
    // Transform the repositories to include primaryPrompt and stars count
    const transformedRepositories = repositories.map(repo => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      is_public: repo.is_public,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      owner_user: repo.owner_user,
      owner_org: repo.owner_org,
      primaryPrompt: repo.prompts && repo.prompts.length > 0 ? repo.prompts[0] : null,
      stars_count: repo._count.stars
    }));
    
    res.status(200).json({
      repositories: transformedRepositories,
      user: {
        id: user.id,
        username: user.username
      },
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error: unknown) {
    logger.error('Error fetching user repositories:', error);
    
    res.status(500).json({
      message: 'Error fetching user repositories',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// Get trending repositories (most recent public repos)
export const getTrendingRepositories = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const repositories = await prisma.repository.findMany({
      where: {
        is_public: true
      },
      include: {
        owner_user: {
          select: {
            id: true,
            username: true
          }
        },
        owner_org: {
          select: {
            id: true,
            name: true
          }
        },
        prompts: {
          select: {
            id: true,
            title: true,
            description: true,
            created_at: true,
            updated_at: true,
            versions: {
              orderBy: {
                version_number: 'desc'
              },
              take: 1,
              select: {
                id: true,
                version_number: true,
                created_at: true
              }
            }
          }
        },
        _count: {
          select: {
            stars: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: limit
    });
    
    // Format response with primaryPrompt field
    const formattedRepos = repositories.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      is_public: repo.is_public,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      owner_user: repo.owner_user,
      owner_org: repo.owner_org,
      primaryPrompt: repo.prompts && repo.prompts.length > 0 ? repo.prompts[0] : null,
      metrics: {
        promptCount: repo.prompts.length,
        starCount: repo._count.stars
      }
    }));
    
    res.status(200).json({
      repositories: formattedRepos
    });
  } catch (error: unknown) {
    logger.error('Error fetching trending repositories:', error);
    res.status(500).json({
      message: 'Error fetching trending repositories',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
};

// Get recent repositories (for authenticated users, includes private repos)
export const getRecentRepositories = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const userId = req.user?.id;
    
    // Build where clause based on auth status
    const where: any = {};
    
    // If not authenticated, only show public repos
    if (!userId) {
      where.is_public = true;
    } else {
      // For authenticated users, show:
      // 1. All public repos
      // 2. Private repos they own
      // 3. Private repos they collaborate on
      where.OR = [
        { is_public: true },
        { 
          is_public: false,
          owner_user_id: userId
        },
        {
          is_public: false,
          collaborators: {
            some: {
              user_id: userId
            }
          }
        }
      ];
    }
    
    const repositories = await prisma.repository.findMany({
      where,
      include: {
        owner_user: {
          select: {
            id: true,
            username: true
          }
        },
        owner_org: {
          select: {
            id: true,
            name: true
          }
        },
        prompts: {
          select: {
            id: true,
            title: true,
            description: true,
            created_at: true,
            updated_at: true,
            versions: {
              orderBy: {
                version_number: 'desc'
              },
              take: 1,
              select: {
                id: true,
                version_number: true,
                created_at: true
              }
            }
          }
        },
        _count: {
          select: {
            stars: true
          }
        }
      },
      orderBy: {
        updated_at: 'desc'
      },
      take: limit
    });
    
    // Format response with primaryPrompt field
    const formattedRepos = repositories.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      is_public: repo.is_public,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      owner_user: repo.owner_user,
      owner_org: repo.owner_org,
      primaryPrompt: repo.prompts && repo.prompts.length > 0 ? repo.prompts[0] : null,
      metrics: {
        promptCount: repo.prompts.length,
        starCount: repo._count.stars
      }
    }));
    
    res.status(200).json({
      repositories: formattedRepos
    });
  } catch (error: unknown) {
    logger.error('Error fetching recent repositories:', error);
    res.status(500).json({
      message: 'Error fetching recent repositories',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
};

// Get repositories starred by a specific user
export const getUserStarredRepositories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Find the user by username
    const user = await prisma.account.findFirst({
      where: { username: username as string },
      select: { id: true, username: true }
    });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Get repositories that the user has starred
    const stars = await prisma.star.findMany({
      where: { user_id: user.id },
      include: {
        repository: {
          include: {
            owner_user: {
              select: {
                id: true,
                username: true
              }
            },
            owner_org: {
              select: {
                id: true,
                name: true
              }
            },
            prompts: {
              select: {
                id: true,
                title: true,
                description: true,
                created_at: true,
                updated_at: true,
                versions: {
                  orderBy: {
                    version_number: 'desc'
                  },
                  take: 1,
                  select: {
                    id: true,
                    version_number: true,
                    created_at: true
                  }
                }
              }
            },
            _count: {
              select: {
                stars: true
              }
            }
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // Count total starred repositories
    const count = await prisma.star.count({
      where: { user_id: user.id }
    });
    
    // Extract repositories from stars with consistent format
    const repositories = stars.map(star => {
      const repo = star.repository;
      return {
        id: repo.id,
        name: repo.name,
        description: repo.description,
        is_public: repo.is_public,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        owner_user: repo.owner_user,
        owner_org: repo.owner_org,
        primaryPrompt: repo.prompts && repo.prompts.length > 0 ? repo.prompts[0] : null,
        metrics: {
          stars: repo._count.stars
        }
      };
    });
    
    res.status(200).json({
      repositories,
      user: {
        id: user.id,
        username: user.username
      },
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error: unknown) {
    logger.error('Error fetching starred repositories:', error);
    
    res.status(500).json({
      message: 'Error fetching starred repositories',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// Get repositories starred by the current authenticated user
export const getMyStarredRepositories = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id; // Already authenticated via middleware
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Get repositories that the user has starred
    const stars = await prisma.star.findMany({
      where: { user_id: userId },
      include: {
        repository: {
          include: {
            owner_user: {
              select: {
                id: true,
                username: true
              }
            },
            owner_org: {
              select: {
                id: true,
                name: true
              }
            },
            prompts: {
              select: {
                id: true,
                title: true,
                description: true,
                created_at: true,
                updated_at: true,
                versions: {
                  orderBy: {
                    version_number: 'desc'
                  },
                  take: 1,
                  select: {
                    id: true,
                    version_number: true,
                    created_at: true
                  }
                }
              }
            },
            _count: {
              select: {
                stars: true
              }
            }
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // Count total starred repositories
    const count = await prisma.star.count({
      where: { user_id: userId }
    });
    
    // Extract repositories from stars with consistent format
    const repositories = stars.map(star => {
      const repo = star.repository;
      return {
        id: repo.id,
        name: repo.name,
        description: repo.description,
        is_public: repo.is_public,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        owner_user: repo.owner_user,
        owner_org: repo.owner_org,
        primaryPrompt: repo.prompts && repo.prompts.length > 0 ? repo.prompts[0] : null,
        metrics: {
          stars: repo._count.stars
        }
      };
    });
    
    // Get user details
    const user = await prisma.account.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    });
    
    res.status(200).json({
      repositories,
      user,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error: unknown) {
    logger.error('Error fetching starred repositories:', error);
    
    res.status(500).json({
      message: 'Error fetching starred repositories',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// Star a repository
export const starRepository = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if repository exists
    const repository = await prisma.repository.findUnique({
      where: { id }
    });
    
    if (!repository) {
      res.status(404).json({ message: 'Repository not found' });
      return;
    }
    
    // Check if already starred
    const existingStar = await prisma.star.findFirst({
      where: {
        repo_id: id,
        user_id: userId
      }
    });
    
    if (existingStar) {
      res.status(200).json({ 
        message: 'Repository already starred',
        alreadyStarred: true 
      });
      return;
    }
    
    // Create star record
    await prisma.star.create({
      data: {
        repo_id: id,
        user_id: userId
      }
    });
    
    // Get updated star count
    const starCount = await prisma.star.count({
      where: { repo_id: id }
    });
    
    res.status(200).json({
      message: 'Repository starred successfully',
      stars: starCount
    });
  } catch (error: unknown) {
    logger.error('Error starring repository:', error);
    res.status(500).json({
      message: 'Error starring repository',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
};

// Unstar a repository
export const unstarRepository = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if repository exists
    const repository = await prisma.repository.findUnique({
      where: { id }
    });
    
    if (!repository) {
      res.status(404).json({ message: 'Repository not found' });
      return;
    }
    
    // Check if starred
    const existingStar = await prisma.star.findFirst({
      where: {
        repo_id: id,
        user_id: userId
      }
    });
    
    if (!existingStar) {
      res.status(200).json({ 
        message: 'Repository not starred',
        notStarred: true 
      });
      return;
    }
    
    // Delete star record
    await prisma.star.delete({
      where: {
        id: existingStar.id
      }
    });
    
    // Get updated star count
    const starCount = await prisma.star.count({
      where: { repo_id: id }
    });
    
    res.status(200).json({
      message: 'Repository unstarred successfully',
      stars: starCount
    });
  } catch (error: unknown) {
    logger.error('Error unstarring repository:', error);
    res.status(500).json({
      message: 'Error unstarring repository',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
};

// Get current user's repositories
export const getMyRepositories = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id; // Already authenticated via middleware
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Build where clause for user-owned repositories only
    const where = { 
      owner_user_id: userId,
      owner_org_id: null // Ensure we're only getting user-owned repositories
    };
    
    // Count total repositories for this user
    const count = await prisma.repository.count({ where });
    
    // Get repositories where the user is the owner
    const repositories = await prisma.repository.findMany({
      where,
      include: {
        owner_user: {
          select: {
            id: true,
            username: true
          }
        },
        prompts: {
          select: {
            id: true,
            title: true,
            description: true,
            created_at: true,
            updated_at: true,
            versions: {
              orderBy: {
                version_number: 'desc'
              },
              take: 1,
              select: {
                id: true,
                version_number: true,
                content_snapshot: true,
                created_at: true
              }
            }
          }
        },
        _count: {
          select: {
            stars: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: {
        updated_at: 'desc'
      }
    });
    
    // Transform the repositories to include primaryPrompt and stars count
    const transformedRepositories = repositories.map(repo => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      is_public: repo.is_public,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      owner_user: repo.owner_user,
      owner_type: 'user', // Explicitly mark as user-owned
      primaryPrompt: repo.prompts && repo.prompts.length > 0 ? repo.prompts[0] : null,
      stars_count: repo._count.stars
    }));
    
    // Get user details
    const user = await prisma.account.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    });
    
    res.status(200).json({
      repositories: transformedRepositories,
      user,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error: unknown) {
    logger.error('Error fetching user repositories:', error);
    
    res.status(500).json({
      message: 'Error fetching user repositories',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// Create a repository for the current user
export const createUserRepository = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, isPublic } = req.body;
    const userId = req.user.id;
    
    // Use transaction to create repository and default prompt
    const result = await prisma.$transaction(async (tx) => {
      // Create the repository - specifically for the user (not organization)
      const repository = await tx.repository.create({
        data: {
          name,
          description,
          is_public: isPublic !== undefined ? isPublic : true,
          owner_user_id: userId,
          owner_org_id: null // Explicitly set to null to ensure it's user-owned
        }
      });
      
      // Create a default prompt if requested
      let prompt = null;
      let promptVersion = null;
      
      if (req.body.default_prompt_title) {
        prompt = await tx.prompt.create({
          data: {
            repository_id: repository.id,
            title: req.body.default_prompt_title,
            description: 'Default repository prompt'
          }
        });
        
        promptVersion = await tx.promptVersion.create({
          data: {
            prompt_id: prompt.id,
            content_snapshot: req.body.default_prompt_content || '',
            commit_message: 'Initial version',
            author_id: userId,
            version_number: 1
          }
        });
      }
      
      return { repository, prompt, promptVersion };
    });
    
    res.status(201).json({
      message: 'User repository created successfully',
      repository: {
        ...result.repository,
        owner_type: 'user' // Explicitly mark as user-owned
      },
      default_prompt: result.prompt ? {
        id: result.prompt.id,
        title: result.prompt.title,
        version: {
          id: result.promptVersion?.id,
          version_number: result.promptVersion?.version_number
        }
      } : null
    });
  } catch (error: any) {
    logger.error('Error creating user repository:', error);
    res.status(500).json({
      message: 'Error creating user repository',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  createRepository,
  getRepositoryById,
  updateRepository,
  deleteRepository,
  listRepositories,
  getUserRepositories,
  getTrendingRepositories,
  getRecentRepositories,
  getUserStarredRepositories,
  getMyStarredRepositories,
  starRepository,
  unstarRepository,
  getMyRepositories,
  createUserRepository
}; 