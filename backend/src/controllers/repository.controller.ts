import { Request, Response } from 'express';
import { Repository, Account, Organization, RepoCollaborator, Prompt, Star, sequelize } from '../models';
import logger from '../utils/logger';
import { Op } from 'sequelize';

// Create a new repository
export const createRepository = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const { name, description, isPublic, ownerType, orgId } = req.body;
    const userId = req.user.id;
    
    // Determine ownership (user or organization)
    const ownerUserId = ownerType === 'organization' ? null : userId;
    const ownerOrgId = ownerType === 'organization' ? orgId : null;
    
    // If creating under an organization, check membership
    if (ownerType === 'organization' && orgId) {
      const orgMembership = await OrgMembership.findOne({
        where: {
          org_id: orgId,
          user_id: userId
        },
        transaction
      });
      
      if (!orgMembership) {
        await transaction.rollback();
        res.status(403).json({ message: 'You do not have permission to create repositories in this organization' });
        return;
      }
    }
    
    // Create repository
    const repository = await Repository.create({
      name,
      description,
      is_public: isPublic || false,
      owner_user_id: ownerUserId,
      owner_org_id: ownerOrgId
    }, { transaction });
    
    // Create initial prompt in the repository
    const prompt = await Prompt.create({
      repo_id: repository.id,
      title: name,
      description: description || '',
      content: '',
    }, { transaction });
    
    await transaction.commit();
    
    res.status(201).json({
      message: 'Repository created successfully',
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
    });
  } catch (error) {
    await transaction.rollback();
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
    
    const repository = await Repository.findByPk(id, {
      include: [
        {
          model: Account,
          as: 'owner_user',
          attributes: ['id', 'username']
        },
        {
          model: Organization,
          as: 'owner_org',
          attributes: ['id', 'name']
        },
        {
          model: Prompt,
          as: 'prompt',
          attributes: ['id', 'title', 'description']
        }
      ]
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
        const collaborator = await RepoCollaborator.findOne({
          where: {
            repo_id: id,
            user_id: userId
          }
        });
        
        isCollaborator = !!collaborator;
        
        // Check if user is org member (if org owned)
        if (repository.owner_org_id) {
          const membership = await OrgMembership.findOne({
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
    const starCount = await Star.count({
      where: { repo_id: id }
    });
    
    // Check if current user has starred
    let isStarred = false;
    if (req.user?.id) {
      const star = await Star.findOne({
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
  } catch (error) {
    logger.error('Error fetching repository:', error);
    res.status(500).json({
      message: 'Error fetching repository',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update repository
export const updateRepository = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, isPublic } = req.body;
    
    const repository = await Repository.findByPk(id);
    
    if (!repository) {
      res.status(404).json({ message: 'Repository not found' });
      return;
    }
    
    // Update fields
    if (name !== undefined) repository.name = name;
    if (description !== undefined) repository.description = description;
    if (isPublic !== undefined) repository.is_public = isPublic;
    
    await repository.save();
    
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
  } catch (error) {
    logger.error('Error updating repository:', error);
    res.status(500).json({
      message: 'Error updating repository',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete repository
export const deleteRepository = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const repository = await Repository.findByPk(id, { transaction });
    
    if (!repository) {
      await transaction.rollback();
      res.status(404).json({ message: 'Repository not found' });
      return;
    }
    
    // Delete repository (cascade will handle related entities)
    await repository.destroy({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      message: 'Repository deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting repository:', error);
    res.status(500).json({
      message: 'Error deleting repository',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// List repositories (with filtering)
export const listRepositories = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      username,
      orgName,
      isPublic,
      sort = 'created_at',
      order = 'DESC',
      page = 1,
      limit = 10
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    const where: any = {};
    
    // Apply filters
    if (isPublic !== undefined) {
      where.is_public = isPublic === 'true';
    }
    
    // Include only public repos if not authenticated
    if (!req.user) {
      where.is_public = true;
    }
    
    // Filter by user
    if (username) {
      const user = await Account.findOne({
        where: { username }
      });
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      where.owner_user_id = user.id;
    }
    
    // Filter by organization
    if (orgName) {
      const organization = await Organization.findOne({
        where: { name: orgName }
      });
      
      if (!organization) {
        res.status(404).json({ message: 'Organization not found' });
        return;
      }
      
      where.owner_org_id = organization.id;
    }
    
    // Get repositories
    const { count, rows } = await Repository.findAndCountAll({
      where,
      include: [
        {
          model: Account,
          as: 'owner_user',
          attributes: ['id', 'username']
        },
        {
          model: Organization,
          as: 'owner_org',
          attributes: ['id', 'name']
        },
        {
          model: Prompt,
          as: 'prompt',
          attributes: ['id', 'title']
        }
      ],
      order: [[sort as string, order]],
      limit: Number(limit),
      offset
    });
    
    res.status(200).json({
      repositories: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error listing repositories:', error);
    res.status(500).json({
      message: 'Error listing repositories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Manage repository collaborators
export const addCollaborator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { repoId, userId, role } = req.body;
    
    // Check if repository exists
    const repository = await Repository.findByPk(repoId);
    if (!repository) {
      res.status(404).json({ message: 'Repository not found' });
      return;
    }
    
    // Check if user exists
    const user = await Account.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Check if collaboration already exists
    const existingCollaboration = await RepoCollaborator.findOne({
      where: {
        repo_id: repoId,
        user_id: userId
      }
    });
    
    if (existingCollaboration) {
      // Update role if already exists
      existingCollaboration.role = role;
      await existingCollaboration.save();
      
      res.status(200).json({
        message: 'Collaborator role updated successfully',
        collaboration: existingCollaboration
      });
      return;
    }
    
    // Create new collaboration
    const collaboration = await RepoCollaborator.create({
      repo_id: repoId,
      user_id: userId,
      role
    });
    
    res.status(201).json({
      message: 'Collaborator added successfully',
      collaboration
    });
  } catch (error) {
    logger.error('Error adding collaborator:', error);
    res.status(500).json({
      message: 'Error adding collaborator',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Remove collaborator
export const removeCollaborator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { repoId, userId } = req.params;
    
    // Find collaboration
    const collaboration = await RepoCollaborator.findOne({
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
    await collaboration.destroy();
    
    res.status(200).json({
      message: 'Collaborator removed successfully'
    });
  } catch (error) {
    logger.error('Error removing collaborator:', error);
    res.status(500).json({
      message: 'Error removing collaborator',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// List collaborators for a repository
export const listCollaborators = async (req: Request, res: Response): Promise<void> => {
  try {
    const { repoId } = req.params;
    
    // Check if repository exists
    const repository = await Repository.findByPk(repoId);
    if (!repository) {
      res.status(404).json({ message: 'Repository not found' });
      return;
    }
    
    // Get collaborators
    const collaborators = await RepoCollaborator.findAll({
      where: {
        repo_id: repoId
      },
      include: [
        {
          model: Account,
          as: 'user',
          attributes: ['id', 'username', 'email', 'profile_image_id']
        }
      ]
    });
    
    res.status(200).json({ collaborators });
  } catch (error) {
    logger.error('Error listing collaborators:', error);
    res.status(500).json({
      message: 'Error listing collaborators',
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
  addCollaborator,
  removeCollaborator,
  listCollaborators
}; 