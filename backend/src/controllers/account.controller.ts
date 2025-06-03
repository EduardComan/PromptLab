import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, full_name, bio } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      res.status(400).json({
        message: 'Username, email, and password are required'
      });
      return;
    }

    // Check if username already exists
    const existingUsername = await prisma.account.findFirst({
      where: { username }
    });

    if (existingUsername) {
      res.status(400).json({
        message: 'Username is already taken'
      });
      return;
    }

    // Check if email already exists
    const existingEmail = await prisma.account.findFirst({
      where: { email }
    });

    if (existingEmail) {
      res.status(400).json({
        message: 'Email is already in use'
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.account.create({
      data: {
        username,
        email,
        password: hashedPassword,
        full_name: full_name || null,
        bio: bio || null,
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      JWT_SECRET as jwt.Secret,
      { expiresIn: JWT_EXPIRATION as jwt.SignOptions['expiresIn'] }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username
      },
    });
  } catch (error: unknown) {
    logger.error('Error registering user:', error);
    res.status(500).json({
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

    // Find user by username
    const user = await prisma.account.findFirst({
      where: { username }
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET as jwt.Secret,
      { expiresIn: JWT_EXPIRATION as jwt.SignOptions['expiresIn'] }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username
      },
    });
  } catch (error: unknown) {
    logger.error('Error logging in user:', error);
    res.status(500).json({
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const user = await prisma.account.findUnique({
      where: { id: userId },
      include: {
        profile_image: {
          select: {
            id: true, 
            mime_type: true,
            data: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json({ user: userWithoutPassword });
  } catch (error: unknown) {
    logger.error('Error fetching current user:', error);
    res.status(500).json({
      message: 'Error fetching user profile',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

export const getUserByUsername = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    const user = await prisma.account.findFirst({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        full_name: true,
        profile_image_id: true,
        created_at: true,
        profile_image: {
          select: {
            id: true,
            mime_type: true,
            data: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Get repositories where the user is the owner (exclude organization repositories)
    const repositories = await prisma.repository.findMany({
      where: { 
        owner_user_id: user.id,
        owner_org_id: null, // Only personal repositories, not organization repositories
        // Only show public repositories unless the requesting user is the owner
        ...(req.user?.id !== user.id && { is_public: true })
      },
      select: {
        id: true,
        name: true,
        description: true,
        is_public: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            stars: true
          }
        }
      },
      take: 10,
      orderBy: {
        updated_at: 'desc'
      }
    });

    // Count total stars received (only for personal repositories)
    const starsCount = await prisma.star.count({
      where: { 
        repository: {
          owner_user_id: user.id,
          owner_org_id: null // Only count stars for personal repositories
        }
      }
    });

    const formattedUser = {
      id: user.id,
      username: user.username,
      bio: user.bio,
      full_name: user.full_name,
      profile_image_id: user.profile_image_id,
      created_at: user.created_at,
      profile_image: user.profile_image,
      stars_count: starsCount,
      repositories: repositories.map(repo => ({
        ...repo,
        stars_count: repo._count.stars
      }))
    };

    res.status(200).json({ user: formattedUser });
  } catch (error: unknown) {
    logger.error('Error fetching user by username:', error);
    res.status(500).json({
      message: 'Error fetching user profile',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { bio, email, full_name } = req.body;

    const user = await prisma.account.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Validate email uniqueness if being updated
    if (email && email !== user.email) {
      const existingEmail = await prisma.account.findFirst({
        where: { email }
      });
      
      if (existingEmail) {
        res.status(400).json({ message: 'Email is already in use' });
        return;
      }
    }

    // Update user
    const updatedUser = await prisma.account.update({
      where: { id: userId },
      data: {
        bio: bio !== undefined ? bio : user.bio,
        email: email || user.email,
        full_name: full_name !== undefined ? full_name : user.full_name
      }
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        full_name: updatedUser.full_name
      }
    });
  } catch (error: unknown) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.account.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.account.update({
      where: { id: userId },
      data: {
        password: hashedPassword
      }
    });

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error: unknown) {
    logger.error('Error changing password:', error);
    res.status(500).json({
      message: 'Error changing password',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

export const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const imageData = req.file?.buffer;
    const mimeType = req.file?.mimetype || 'application/octet-stream';

    if (!imageData) {
      res.status(400).json({ message: 'No image provided' });
      return;
    }

    const user = await prisma.account.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Create new image
    const image = await prisma.image.create({
      data: {
        mime_type: mimeType,
        description: `Profile image for ${user.username}`,
        uploaded_by: userId,
        data: imageData
      }
    });

    // Update user profile image
    await prisma.account.update({
      where: { id: userId },
      data: {
        profile_image_id: image.id
      }
    });

    res.status(200).json({
      message: 'Profile image uploaded successfully',
      profile_image_id: image.id,
    });
  } catch (error: unknown) {
    logger.error('Error uploading profile image:', error);
    res.status(500).json({
      message: 'Error uploading profile image',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Count total users
    const count = await prisma.account.count();
    
    // Get users with pagination
    const users = await prisma.account.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        bio: true,
        profile_image_id: true,
        created_at: true,
        profile_image: {
          select: {
            id: true,
            mime_type: true,
            data: true
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: {
        created_at: 'desc'
      }
    });
    
    res.status(200).json({
      users,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error: unknown) {
    logger.error('Error listing users:', error);
    
    res.status(500).json({
      message: 'Error listing users',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, limit = 10 } = req.query;
    const searchQuery = query as string;
    const limitNum = parseInt(limit as string) || 10;

    if (!searchQuery || searchQuery.trim().length < 2) {
      res.status(400).json({ message: 'Search query must be at least 2 characters' });
      return;
    }

    const users = await prisma.account.findMany({
      where: {
        username: {
          contains: searchQuery.trim(),
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        username: true,
        full_name: true,
        profile_image_id: true,
        profile_image: {
          select: {
            id: true,
            mime_type: true,
            data: true
          }
        }
      },
      take: limitNum,
      orderBy: {
        username: 'asc'
      }
    });

    res.status(200).json({ users });
  } catch (error: unknown) {
    logger.error('Error searching users:', error);
    res.status(500).json({
      message: 'Error searching users',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

// General image serving endpoint (can be used for organization logos, etc.)
export const getImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageId } = req.params;

    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: {
        data: true,
        mime_type: true
      }
    });

    if (!image || !image.data) {
      res.status(404).json({ message: 'Image not found' });
      return;
    }

    // Set appropriate headers for image response
    res.set({
      'Content-Type': image.mime_type,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'Content-Length': image.data.length.toString(),
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*', // Allow CORS for images
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });

    // Send the raw image data
    res.end(image.data);
  } catch (error: unknown) {
    logger.error('Error serving image:', error);
    res.status(500).json({
      message: 'Error serving image',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
};

export default {
  register,
  login,
  getCurrentUser,
  getUserByUsername,
  updateProfile,
  changePassword,
  uploadProfileImage,
  listUsers,
  searchUsers,
  getImage
}; 