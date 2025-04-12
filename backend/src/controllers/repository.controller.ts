import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';
// Create a new repository
export const createRepository = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, isPublic, ownerType, orgId } = req.body;
    const userId = req.user.id;
    
    // Use transaction with correct typing
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Determine ownership (user or organization)
      const ownerUserId = ownerType === 'organization' ? null : userId;
      const ownerOrgId = ownerType === 'organization' ? orgId : null;
      
      // If creating under an organization, check membership
      if (ownerType === 'organization' && orgId) {
        const orgMembership = await tx.orgMembership.findFirst({
          where: {
            org_id: orgId,
            user_id: userId
          }
        });
        
        if (!orgMembership) {
          throw new Error('You do not have permission to create repositories in this organization');
        }
      }
      
      // Create repository
      const repository = await tx.repository.create({
        data: {
          name,
          description,
          is_public: isPublic || false,
          owner_user_id: ownerUserId,
          owner_org_id: ownerOrgId
        }
      });
      
      // Create initial prompt in the repository
      const prompt = await tx.prompt.create({
        data: {
          repository_id: repository.id,
          title: name,
          description: description || ''
        }
      });
      
      return { repository, prompt };
    });

    res.status(201).json({
      message: 'Repository created successfully',
      repository: {
        id: result.repository.id,
        name: result.repository.name,
        description: result.repository.description,
        is_public: result.repository.is_public,
        owner_user_id: result.repository.owner_user_id,
        owner_org_id: result.repository.owner_org_id,
        created_at: result.repository.created_at
      },
      prompt: {
        id: result.prompt.id,
        title: result.prompt.title
      }
    });
  } catch (error: unknown) {
    logger.error('Error creating repository:', error);
    if (error instanceof Error && error.message.includes('permission')) {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({
        message: 'Error creating repository',
        error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      });
    }
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
            description: true
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
    
    res.status(200).json({
      repository,
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
            title: true
          }
        }
      },
      orderBy: {
        [sort as string]: order as string
      },
      take: limitNum,
      skip: offset
    });
    
    res.status(200).json({
      repositories,
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
    
    // Count total repositories for this user
    const count = await prisma.repository.count({
      where: { owner_user_id: user.id }
    });
    
    // Get repositories where the user is the owner
    const repositories = await prisma.repository.findMany({
      where: { owner_user_id: user.id },
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
        }
      },
      take: limit,
      skip: offset,
      orderBy: {
        updated_at: 'desc'
      }
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
            id: true
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
    
    // Format response
    const formattedRepos = repositories.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      is_public: repo.is_public,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      owner_user: repo.owner_user,
      owner_org: repo.owner_org,
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
            id: true
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
    
    // Format response
    const formattedRepos = repositories.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      is_public: repo.is_public,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      owner_user: repo.owner_user,
      owner_org: repo.owner_org,
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

export default {
  createRepository,
  getRepositoryById,
  updateRepository,
  deleteRepository,
  listRepositories,
  getUserRepositories,
  getTrendingRepositories,
  getRecentRepositories
}; 