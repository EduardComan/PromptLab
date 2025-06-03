import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';
// Create a new repository
export const createRepository = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, is_public, org_id, default_prompt_content } = req.body;
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
          owner_org_id: org_id || null
        }
      });

      // Always create a default prompt when a repository is created
      const prompt = await tx.prompt.create({
        data: {
          repository_id: repository.id,
          title: `${name}-prompt`,
          description: 'Default repository prompt'
        }
      });

      const promptVersion = await tx.promptVersion.create({
        data: {
          prompt_id: prompt.id,
          content: default_prompt_content || 'Click the Edit button to add content.',
          commit_message: 'Initial version',
          author_id: userId,
          version_number: 1
        }
      });

      return { repository, prompt, promptVersion };
    });

    res.status(201).json({
      message: 'Repository created successfully',
      repository: result.repository,
      default_prompt: {
        id: result.prompt.id,
        title: result.prompt.title,
        version: {
          id: result.promptVersion.id,
          version_number: result.promptVersion.version_number
        }
      }
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
    const userId = req.user?.id;
    
    const repository = await prisma.repository.findUnique({
      where: { id },
      include: {
        owner_user: {
          select: {
            id: true,
            username: true,
            profile_image: {
              select: {
                id: true,
                mime_type: true,
                data: true
              }
            }
          }
        },
        owner_org: {
          select: {
            id: true,
            name: true,
            logo_image: {
              select: {
                id: true,
                mime_type: true,
                data: true
              }
            }
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
                content: true,
                metadata_json: true,
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

    // Check if repository is private
    if (!repository.is_public) {
      // If not authenticated, deny access
      if (!userId) {
        res.status(401).json({ message: 'Authentication required to view this private repository' });
        return;
      }

      // Check if user is owner, org member, or collaborator
      const requestUserId = userId.toString();
      const ownerUserId = repository.owner_user?.id?.toString();
      const isOwner = ownerUserId && requestUserId === ownerUserId;

      // Check org membership
      const isOrgMember = repository.owner_org
        ? !!(await prisma.orgMembership.findFirst({
            where: {
              org_id: repository.owner_org.id,
              user_id: userId
            }
          }))
        : false;

      // Check collaboration
      const isCollaborator = !!(await prisma.repoCollaborator.findFirst({
        where: {
          repo_id: repository.id,
          user_id: userId
        }
      }));

      // If not authorized, deny access
      if (!isOwner && !isOrgMember && !isCollaborator) {
        res.status(403).json({ message: 'You do not have permission to access this repository' });
        return;
      }
    }

    // Calculate star count and star status
    const starCount = await prisma.star.count({
      where: { repo_id: id }
    });
    
    // Check if the user has starred this repository
    const is_starred = userId
      ? !!(await prisma.star.findFirst({
          where: {
            repo_id: id,
            user_id: userId
          }
        }))
      : false;
    
    // Get the primary prompt (assuming it's the first one)
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
        is_starred
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
            username: true,
            profile_image: {
              select: {
                id: true,
                mime_type: true,
                data: true
              }
            }
          }
        },
        owner_org: {
          select: {
            id: true,
            name: true,
            logo_image: {
              select: {
                id: true,
                mime_type: true,
                data: true
              }
            }
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
                content: true,
                metadata_json: true
              }
            }
          }
        },
        _count: {
          select: {
            prompts: true,
            stars: true
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
      primaryPrompt: repo.prompts && repo.prompts.length > 0 ? repo.prompts[0] : null,
      stats: {
        stars: repo._count.stars
      }
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

// Get user repositories
export const getUserRepositories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const { page = '1', limit = '10' } = req.query;
    
    const user = await prisma.account.findFirst({
      where: { username: username as string }
    });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    // Define where clause based on authentication
    let where: any = { 
      owner_user_id: user.id,
      owner_org_id: null // Only personal repositories, exclude organization repositories
    };
    
    // If the viewing user is not the repository owner, only show public repos
    const isOwner = req.user?.id === user.id;
    if (!isOwner) {
      where.is_public = true;
    }
    
    const count = await prisma.repository.count({ where });
    
    const repositories = await prisma.repository.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        owner_user: {
          select: {
            id: true,
            username: true,
            profile_image: {
              select: {
                id: true,
                mime_type: true,
                data: true
              }
            }
          }
        },
        _count: {
          select: {
            prompts: true,
            stars: true
          }
        }
      },
      orderBy: { updated_at: 'desc' }
    });
    
    // Format repositories
    const formattedRepos = await Promise.all(repositories.map(async (repo) => {
      // Get latest prompt if any
      const latestPrompt = await prisma.prompt.findFirst({
        where: { repository_id: repo.id },
        orderBy: { updated_at: 'desc' },
        include: {
          versions: {
            orderBy: { version_number: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              version_number: true,
              metadata_json: true
            }
          }
        }
      });
      
      // Check if current user has starred
      let is_starred = false;
      if (req.user) {
        const star = await prisma.star.findFirst({
          where: {
            repo_id: repo.id,
            user_id: req.user.id
          }
        });
        is_starred = !!star;
      }
      
      return {
        id: repo.id,
        name: repo.name,
        description: repo.description,
        is_public: repo.is_public,
        owner_user_id: repo.owner_user_id,
        owner_org_id: repo.owner_org_id,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        owner_user: repo.owner_user,
        stats: {
          stars: repo._count.stars,
          prompts: repo._count.prompts,
          is_starred
        },
        latest_prompt: latestPrompt
      };
    }));
    
    res.status(200).json({
      repositories: formattedRepos,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(count / limitNum)
      }
    });
  } catch (error: unknown) {
    logger.error('Error fetching user repositories:', error);
    res.status(500).json({
      message: 'Error fetching repositories',
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
                username: true,
                profile_image: {
                  select: {
                    id: true,
                    mime_type: true,
                    data: true
                  }
                }
              }
            },
            owner_org: {
              select: {
                id: true,
                name: true,
                display_name: true,
                logo_image: {
                  select: {
                    id: true,
                    mime_type: true,
                    data: true
                  }
                }
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
        owner_user_id: repo.owner_user_id,
        owner_org_id: repo.owner_org_id,
        owner_user: repo.owner_user,
        owner_org: repo.owner_org,
        primaryPrompt: repo.prompts && repo.prompts.length > 0 ? repo.prompts[0] : null,
        stats: {
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
                username: true,
                profile_image: {
                  select: {
                    id: true,
                    mime_type: true,
                    data: true
                  }
                }
              }
            },
            owner_org: {
              select: {
                id: true,
                name: true,
                display_name: true,
                logo_image: {
                  select: {
                    id: true,
                    mime_type: true,
                    data: true
                  }
                }
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
        owner_user_id: repo.owner_user_id,
        owner_org_id: repo.owner_org_id,
        owner_user: repo.owner_user,
        owner_org: repo.owner_org,
        primaryPrompt: repo.prompts && repo.prompts.length > 0 ? repo.prompts[0] : null,
        stats: {
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

// Get my repositories
export const getMyRepositories = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { page = '1', limit = '10' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    
    // Count total repositories for this user
    const count = await prisma.repository.count({
      where: { 
        owner_user_id: userId,
        owner_org_id: null // Only personal repositories
      }
    });
    
    // Get repositories where the user is the owner
    const repositories = await prisma.repository.findMany({
      where: { 
        owner_user_id: userId,
        owner_org_id: null // Only personal repositories
      },
      include: {
        owner_user: {
          select: {
            id: true,
            username: true,
            profile_image: {
              select: {
                id: true,
                mime_type: true,
                data: true
              }
            }
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
                content: true,
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
      take: limitNum,
      skip: offset,
      orderBy: {
        updated_at: 'desc'
      }
    });
    
    // Format the repositories for response
    const formattedRepos = repositories.map(repo => {
      const primaryPrompt = repo.prompts.length > 0 ? repo.prompts[0] : null;
      
      return {
        id: repo.id,
        name: repo.name,
        description: repo.description,
        is_public: repo.is_public,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        owner_user: repo.owner_user,
        owner_type: 'user', // Explicitly mark as user-owned
        primaryPrompt,
        stars_count: repo._count.stars
      };
    });
    
    // Get user details
    const user = await prisma.account.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        username: true,
        profile_image: {
          select: {
            id: true,
            mime_type: true,
            data: true
          }
        }
      }
    });
    
    res.status(200).json({
      repositories: formattedRepos,
      user,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(count / limitNum)
      }
    });
  } catch (error: unknown) {
    logger.error('Error fetching user repositories:', error);
    
    res.status(500).json({
      message: 'Error fetching user repositories',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
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
            content: req.body.default_prompt_content || '',
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

export const isRepositoryStarred = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Check if repository exists
    const repository = await prisma.repository.findUnique({
      where: { id }
    });

    if (!repository) {
      res.status(404).json({ message: 'Repository not found' });
      return;
    }

    // Check if user has starred the repository
    const star = await prisma.star.findFirst({
      where: {
        repo_id: id,
        user_id: userId
      }
    });

    res.status(200).json({ is_starred: !!star });
  } catch (error: any) {
    logger.error('Error checking star status:', error);
    res.status(500).json({
      message: 'Error checking star status',
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
  getUserStarredRepositories,
  getMyStarredRepositories,
  starRepository,
  unstarRepository,
  getMyRepositories,
  createUserRepository,
  isRepositoryStarred
}; 