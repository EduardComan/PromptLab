import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import logger from '../utils/logger';

// Get organization by ID
export const getOrganizationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        logo_image: {
          select: {
            id: true,
            mime_type: true,
            data: true
          }
        },
        owner: {
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
        }
      }
    });

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    res.status(200).json({ organization });
  } catch (error: unknown) {
    logger.error('Error fetching organization by ID:', error);
    res.status(500).json({
      message: 'Error fetching organization',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// Get organization by name
export const getOrganizationByName = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;

    const organization = await prisma.organization.findFirst({
      where: { name },
      include: {
        logo_image: {
          select: {
            id: true,
            mime_type: true,
            data: true
          }
        },
        owner: {
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
        }
      }
    });

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    res.status(200).json({ organization });
  } catch (error: unknown) {
    logger.error('Error fetching organization by name:', error);
    res.status(500).json({
      message: 'Error fetching organization',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// Create organization
export const createOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, display_name, description } = req.body;
    const userId = req.user.id;

    // Check if organization name already exists
    const existingOrg = await prisma.organization.findFirst({
      where: { name }
    });

    if (existingOrg) {
      res.status(400).json({
        message: 'Organization name is already taken'
      });
      return;
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name,
        display_name,
        description,
        owner: {
          connect: { id: userId }
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    // Add owner as member with OWNER role
    await prisma.orgMembership.create({
      data: {
        organization: {
          connect: { id: organization.id }
        },
        user: {
          connect: { id: userId }
        },
        role: 'OWNER'
      }
    });

    res.status(201).json({
      message: 'Organization created successfully',
      organization
    });
  } catch (error: unknown) {
    logger.error('Error creating organization:', error);
    res.status(500).json({
      message: 'Error creating organization',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// Update organization
export const updateOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { display_name, description } = req.body;
    const userId = req.user.id;

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        memberships: {
          where: {
            user_id: userId,
            role: { in: ['OWNER', 'ADMIN'] }
          }
        }
      }
    });

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    // Check if user is owner or admin of the organization
    if (organization.memberships.length === 0) {
      res.status(403).json({ message: 'You do not have permission to update this organization' });
      return;
    }

    // Update organization
    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: {
        display_name,
        description
      },
      include: {
        logo_image: {
          select: {
            id: true,
            mime_type: true,
            data: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    res.status(200).json({
      message: 'Organization updated successfully',
      organization: updatedOrganization
    });
  } catch (error: unknown) {
    logger.error('Error updating organization:', error);
    res.status(500).json({
      message: 'Error updating organization',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// Delete organization
export const deleteOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        memberships: {
          where: {
            user_id: userId
          }
        },
        repositories: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    // Check if user is owner of the organization
    const isOwner = organization.memberships.some(membership => membership.role === 'OWNER');
    if (!isOwner) {
      res.status(403).json({ message: 'Only the organization owner can delete the organization' });
      return;
    }

    // Delete all repositories under this organization first
    if (organization.repositories.length > 0) {
      // Delete all prompts in these repositories
      await prisma.prompt.deleteMany({
        where: {
          repository: {
            owner_org_id: id
          }
        }
      });

      // Delete all stars for these repositories
      await prisma.star.deleteMany({
        where: {
          repository: {
            owner_org_id: id
          }
        }
      });

      // Delete all repositories
      await prisma.repository.deleteMany({
        where: { owner_org_id: id }
      });
    }

    // Delete organization memberships
    await prisma.orgMembership.deleteMany({
      where: { org_id: id }
    });

    // Delete organization
    await prisma.organization.delete({
      where: { id }
    });

    res.status(200).json({
      message: 'Organization and all associated repositories deleted successfully',
      deleted_repositories: organization.repositories.length
    });
  } catch (error: unknown) {
    logger.error('Error deleting organization:', error);
    res.status(500).json({
      message: 'Error deleting organization',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// Get user's organizations
export const getUserOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const memberships = await prisma.orgMembership.findMany({
      where: { user_id: userId },
      include: {
        organization: {
          include: {
            logo_image: {
              select: {
                id: true,
                mime_type: true
              }
            },
            owner: {
              select: {
                id: true,
                username: true
              }
            },
            _count: {
              select: {
                repositories: true,
                memberships: true
              }
            }
          }
        }
      }
    });

    const organizations = memberships.map((membership: any) => ({
      ...membership.organization,
      role: membership.role
    }));

    res.status(200).json({ organizations });
  } catch (error: unknown) {
    logger.error('Error fetching user organizations:', error);
    res.status(500).json({
      message: 'Error fetching organizations',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// Upload organization logo
export const uploadOrganizationLogo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if user is authorized to update organization
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        memberships: {
          where: {
            user_id: userId,
            role: { in: ['OWNER', 'ADMIN'] }
          }
        }
      }
    });

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    if (organization.memberships.length === 0) {
      res.status(403).json({ message: 'You do not have permission to update this organization' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No image file uploaded' });
      return;
    }

    // Create image record with image data in the database
    const image = await prisma.image.create({
      data: {
        mime_type: req.file.mimetype,
        description: `Logo for organization ${organization.name}`,
        uploaded_by: userId,
        data: req.file.buffer
      }
    });

    // Update organization with logo
    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: {
        logo_image: {
          connect: { id: image.id }
        }
      },
      include: {
        logo_image: {
          select: {
            id: true,
            mime_type: true,
            data: true
          }
        }
      }
    });

    res.status(200).json({
      message: 'Logo uploaded successfully',
      organization: updatedOrganization
    });
  } catch (error: unknown) {
    logger.error('Error uploading organization logo:', error);
    res.status(500).json({
      message: 'Error uploading logo',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// Get organization members
export const getOrganizationMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { id }
    });

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    const members = await prisma.orgMembership.findMany({
      where: { org_id: organization.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            full_name: true,
            bio: true,
            profile_image: {
              select: {
                id: true,
                mime_type: true,
                data: true
              }
            }
          }
        }
      }
    });

    res.status(200).json({
      members: members.map(m => ({
        ...m.user,
        role: m.role
      }))
    });
  } catch (error: unknown) {
    logger.error('Error fetching organization members:', error);
    res.status(500).json({
      message: 'Error fetching members',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};


// Leave an organization
export const leaveOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        memberships: {
          where: {
            user_id: userId
          }
        }
      }
    });

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    // Check if user is a member
    if (organization.memberships.length === 0) {
      res.status(404).json({ message: 'You are not a member of this organization' });
      return;
    }

    // Owner cannot leave the organization
    if (organization.memberships[0].role === 'OWNER') {
      res.status(403).json({ message: 'Organization owner cannot leave the organization. Transfer ownership first or delete the organization.' });
      return;
    }

    // Remove user from organization
    await prisma.orgMembership.delete({
      where: { id: organization.memberships[0].id }
    });

    res.status(200).json({
      message: 'Successfully left the organization'
    });
  } catch (error: unknown) {
    logger.error('Error leaving organization:', error);
    res.status(500).json({
      message: 'Error leaving organization',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// Update member role
export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, userId: targetUserId } = req.params;
    const { role } = req.body;
    const requesterId = req.user.id;

    // Validate role
    const validRoles = ['ADMIN', 'MEMBER'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ message: 'Invalid role. Valid roles are: ADMIN, MEMBER' });
      return;
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        memberships: true
      }
    });

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    // Find requester's membership
    const requesterMembership = organization.memberships.find(m => m.user_id === requesterId);
    if (!requesterMembership || !['OWNER', 'ADMIN'].includes(requesterMembership.role)) {
      res.status(403).json({ message: 'You do not have permission to update member roles' });
      return;
    }

    // Find target user's membership
    const targetMembership = organization.memberships.find(m => m.user_id === targetUserId);
    if (!targetMembership) {
      res.status(404).json({ message: 'User is not a member of this organization' });
      return;
    }

    // Check permissions
    if (targetMembership.role === 'OWNER') {
      res.status(403).json({ message: 'Cannot change role of organization owner' });
      return;
    }

    // Only owner can change Admin roles, admins can only change member roles
    if (targetMembership.role === 'ADMIN' && requesterMembership.role !== 'OWNER') {
      res.status(403).json({ message: 'Only the organization owner can change admin roles' });
      return;
    }

    // Update member role
    const updatedMembership = await prisma.orgMembership.update({
      where: { id: targetMembership.id },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    res.status(200).json({
      message: 'Member role updated successfully',
      membership: updatedMembership
    });
  } catch (error: unknown) {
    logger.error('Error updating member role:', error);
    res.status(500).json({
      message: 'Error updating member role',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// Remove member from organization
export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, userId: targetUserId } = req.params;
    const requesterId = req.user.id;

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        memberships: true
      }
    });

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    // Find requester's membership
    const requesterMembership = organization.memberships.find(m => m.user_id === requesterId);
    if (!requesterMembership || !['OWNER', 'ADMIN'].includes(requesterMembership.role)) {
      res.status(403).json({ message: 'You do not have permission to remove members' });
      return;
    }

    // Find target user's membership
    const targetMembership = organization.memberships.find(m => m.user_id === targetUserId);
    if (!targetMembership) {
      res.status(404).json({ message: 'User is not a member of this organization' });
      return;
    }

    // Owner cannot be removed
    if (targetMembership.role === 'OWNER') {
      res.status(403).json({ message: 'Cannot remove organization owner' });
      return;
    }

    // Admin can only be removed by owner
    if (targetMembership.role === 'ADMIN' && requesterMembership.role !== 'OWNER') {
      res.status(403).json({ message: 'Only the organization owner can remove admins' });
      return;
    }

    // Remove user from organization
    await prisma.orgMembership.delete({
      where: { id: targetMembership.id }
    });

    res.status(200).json({
      message: 'Member removed successfully'
    });
  } catch (error: unknown) {
    logger.error('Error removing member:', error);
    res.status(500).json({
      message: 'Error removing member',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// Get organization repositories
export const getOrganizationRepositories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const organization = await prisma.organization.findUnique({
      where: { id }
    });

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    const isMember = userId ? await prisma.orgMembership.findFirst({
      where: {
        org_id: organization.id,
        user_id: userId
      }
    }) : false;

    const repositories = await prisma.repository.findMany({
      where: {
        owner_org_id: organization.id,
        ...(isMember ? {} : { is_public: true })
      },
      include: {
        _count: {
          select: {
            stars: true,
            prompts: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.status(200).json({ repositories });
  } catch (error: unknown) {
    logger.error('Error fetching organization repositories:', error);
    res.status(500).json({
      message: 'Error fetching repositories',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};


// Invite user to organization
export const inviteUserToOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, role = 'MEMBER' } = req.body;
    const requesterId = req.user.id;

    // Validate role
    const validRoles = ['ADMIN', 'MEMBER'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ message: 'Invalid role. Valid roles are: ADMIN, MEMBER' });
      return;
    }

    if (!username || !username.trim()) {
      res.status(400).json({ message: 'Username is required' });
      return;
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        memberships: {
          where: {
            user_id: requesterId
          }
        }
      }
    });

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    // Check if requester is owner or admin
    const requesterMembership = organization.memberships[0];
    if (!requesterMembership || !['OWNER', 'ADMIN'].includes(requesterMembership.role)) {
      res.status(403).json({ message: 'You do not have permission to invite users' });
      return;
    }

    // Only owners can add admins
    if (role === 'ADMIN' && requesterMembership.role !== 'OWNER') {
      res.status(403).json({ message: 'Only the organization owner can add admins' });
      return;
    }

    // Find user to invite
    const userToInvite = await prisma.account.findFirst({
      where: { username: username.trim() }
    });

    if (!userToInvite) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if user is already a member
    const existingMembership = await prisma.orgMembership.findFirst({
      where: {
        org_id: id,
        user_id: userToInvite.id
      }
    });

    if (existingMembership) {
      res.status(400).json({ message: 'User is already a member of this organization' });
      return;
    }

    // Add user to organization with specified role
    const membership = await prisma.orgMembership.create({
      data: {
        organization: {
          connect: { id }
        },
        user: {
          connect: { id: userToInvite.id }
        },
        role
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            full_name: true
          }
        }
      }
    });

    res.status(200).json({
      message: 'User added successfully',
      member: {
        organization: {
          id: organization.id,
          name: organization.name
        },
        user: membership.user,
        role: membership.role
      }
    });
  } catch (error: unknown) {
    logger.error('Error inviting user to organization:', error);
    res.status(500).json({
      message: 'Error inviting user',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// Search organizations
export const searchOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, limit = 10 } = req.query;
    const searchQuery = query as string;
    const limitNum = parseInt(limit as string) || 10;

    if (!searchQuery) {
      res.status(400).json({ message: 'Search query is required' });
      return;
    }

    const organizations = await prisma.organization.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { display_name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } }
        ]
      },
      take: limitNum,
      include: {
        logo_image: {
          select: {
            id: true,
            mime_type: true,
            data: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true
          }
        },
        _count: {
          select: {
            repositories: true,
            memberships: true
          }
        }
      }
    });

    res.status(200).json({ organizations });
  } catch (error: unknown) {
    logger.error('Error searching organizations:', error);
    res.status(500).json({
      message: 'Error searching organizations',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// List all organizations
export const listOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, limit = 50 } = req.query;
    const searchQuery = query as string;
    const limitNum = parseInt(limit as string) || 50;

    let whereClause = {};
    
    // If search query is provided, filter by name, display_name, or description
    if (searchQuery) {
      whereClause = {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { display_name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } }
        ]
      };
    }

    const organizations = await prisma.organization.findMany({
      where: whereClause,
      take: limitNum,
      include: {
        logo_image: {
          select: {
            id: true,
            mime_type: true,
            data: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true
          }
        },
        _count: {
          select: {
            repositories: true,
            memberships: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.status(200).json({ organizations });
  } catch (error: unknown) {
    logger.error('Error listing organizations:', error);
    res.status(500).json({
      message: 'Error listing organizations',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

export default {
  getOrganizationById,
  getOrganizationByName,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getUserOrganizations,
  uploadOrganizationLogo,
  getOrganizationMembers,
  leaveOrganization,
  updateMemberRole,
  removeMember,
  getOrganizationRepositories,
  inviteUserToOrganization,
  searchOrganizations,
  listOrganizations
}; 