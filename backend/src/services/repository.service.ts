import prisma from '../lib/prisma';
import { CreateRepositoryDto, UpdateRepositoryDto } from '../types';
import { NotFoundError } from '../utils/errors';
import { PrismaClient } from '@prisma/client';

class RepositoryService {
  /**
   * Create a new repository
   */
  async createRepository(userId: string, data: CreateRepositoryDto) {
    return prisma.$transaction(async (tx: PrismaClient) => {
      const { name, description, isPublic, ownerType, orgId } = data;
      
      // Determine ownership (user or organization)
      const ownerUserId = ownerType === 'organization' ? null : userId;
      const ownerOrgId = ownerType === 'organization' ? orgId : null;
      
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
      
      return {
        repository: {
          id: repository.id,
          name: repository.name,
          description: repository.description,
          is_public: repository.is_public,
          owner_user_id: repository.owner_user_id,
          owner_org_id: repository.owner_org_id,
          created_at: repository.created_at
        },
        prompt: {
          id: prompt.id,
          title: prompt.title
        }
      };
    });
  }
  
  /**
   * Get repository by ID
   */
  async getRepositoryById(id: string) {
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
      throw new NotFoundError('Repository');
    }
    
    return repository;
  }
  
  /**
   * Update repository
   */
  async updateRepository(id: string, data: UpdateRepositoryDto) {
    const repository = await prisma.repository.findUnique({
      where: { id }
    });
    
    if (!repository) {
      throw new NotFoundError('Repository');
    }
    
    // Update repository
    const updatedRepository = await prisma.repository.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : repository.name,
        description: data.description !== undefined ? data.description : repository.description,
        is_public: data.isPublic !== undefined ? data.isPublic : repository.is_public
      }
    });
    
    return {
      id: updatedRepository.id,
      name: updatedRepository.name,
      description: updatedRepository.description,
      is_public: updatedRepository.is_public,
      updated_at: updatedRepository.updated_at
    };
  }
  
  /**
   * Delete repository
   */
  async deleteRepository(id: string) {
    return prisma.$transaction(async (tx: PrismaClient) => {
      const repository = await tx.repository.findUnique({
        where: { id }
      });
      
      if (!repository) {
        throw new NotFoundError('Repository');
      }
      
      // Delete repository (cascade will handle related entities)
      await tx.repository.delete({
        where: { id }
      });
      
      return { id };
    });
  }
  
  /**
   * List repositories with filtering
   */
  async listRepositories(filters: any) {
    const {
      username,
      orgName,
      isPublic,
      sort = 'created_at',
      order = 'DESC',
      page = 1,
      limit = 10,
      userId,
      search
    } = filters;
    
    const offset = (Number(page) - 1) * Number(limit);
    const where: any = {};
    
    // Apply filters
    if (isPublic !== undefined) {
      where.is_public = isPublic === 'true';
    }
    
    // Include only public repos if not authenticated
    if (!userId) {
      where.is_public = true;
    }
    
    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Filter by user
    if (username) {
      const user = await prisma.account.findFirst({
        where: { username: username as string }
      });
      
      if (!user) {
        throw new NotFoundError('User');
      }
      
      where.owner_user_id = user.id;
    }
    
    // Filter by organization
    if (orgName) {
      const organization = await prisma.organization.findFirst({
        where: { name: orgName as string }
      });
      
      if (!organization) {
        throw new NotFoundError('Organization');
      }
      
      where.owner_org_id = organization.id;
    }
    
    // Get repositories count
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
        [sort as string]: order === 'DESC' ? 'desc' : 'asc'
      },
      take: Number(limit),
      skip: offset
    });
    
    return {
      repositories,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(count / Number(limit))
      }
    };
  }
  
  /**
   * Get repositories for a specific user
   */
  async getUserRepositories(username: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    
    // Find the user by username
    const user = await prisma.account.findFirst({
      where: { username },
      select: { id: true, username: true }
    });
    
    if (!user) {
      throw new NotFoundError('User');
    }
    
    // Get repositories count
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
      take: Number(limit),
      skip: offset,
      orderBy: {
        updated_at: 'desc'
      }
    });
    
    return {
      repositories,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    };
  }
}

export default new RepositoryService(); 