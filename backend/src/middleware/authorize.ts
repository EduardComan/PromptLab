import { Request, Response, NextFunction } from 'express';
import { Repository, RepoCollaborator, Organization, OrgMembership } from '../models';
import logger from '../utils/logger';

// Check if user is the repository owner or has access rights
export const authorizeRepository = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;
    const repoId = req.params.repoId || req.body.repoId;

    if (!repoId) {
      res.status(400).json({ message: 'Repository ID is required' });
      return;
    }

    const repo = await Repository.findByPk(repoId);
    if (!repo) {
      res.status(404).json({ message: 'Repository not found' });
      return;
    }

    // If public repository and just reading
    if (repo.is_public && req.method === 'GET') {
      next();
      return;
    }

    // Check if user is the repository owner
    if (repo.owner_user_id === userId) {
      next();
      return;
    }

    // Check if repo is owned by an organization and user is a member
    if (repo.owner_org_id) {
      const orgMembership = await OrgMembership.findOne({
        where: {
          org_id: repo.owner_org_id,
          user_id: userId
        }
      });

      if (orgMembership) {
        next();
        return;
      }
    }

    // Check if user is a collaborator
    const collaborator = await RepoCollaborator.findOne({
      where: {
        repo_id: repoId,
        user_id: userId
      }
    });

    if (collaborator) {
      next();
      return;
    }

    // If none of the above, unauthorized
    res.status(403).json({ message: 'You do not have permission to access this repository' });
  } catch (error) {
    logger.error('Authorization error:', error);
    res.status(500).json({ message: 'Server error during authorization' });
  }
};

// Check if user is an organization owner or admin
export const authorizeOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;
    const orgId = req.params.orgId || req.body.orgId;

    if (!orgId) {
      res.status(400).json({ message: 'Organization ID is required' });
      return;
    }

    const org = await Organization.findByPk(orgId);
    if (!org) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    // Check if user is the organization owner
    if (org.owner_id === userId) {
      next();
      return;
    }

    // Check if user is an admin
    const membership = await OrgMembership.findOne({
      where: {
        org_id: orgId,
        user_id: userId,
        role: 'admin'
      }
    });

    if (membership) {
      next();
      return;
    }

    // If none of the above, unauthorized
    res.status(403).json({ message: 'You do not have permission to manage this organization' });
  } catch (error) {
    logger.error('Organization authorization error:', error);
    res.status(500).json({ message: 'Server error during authorization' });
  }
}; 