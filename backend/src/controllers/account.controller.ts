import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Account, Image } from '../models';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, bio } = req.body;

    // Check if user already exists
    const existingUser = await Account.findOne({
      where: {
        [Op.or]: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      res.status(400).json({
        message: 'User with this username or email already exists',
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await Account.create({
      username,
      email,
      password_hash: hashedPassword,
      bio: bio || null,
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        bio: newUser.bio,
      },
    });
  } catch (error) {
    logger.error('Error registering user:', error);
    res.status(500).json({
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await Account.findOne({
      where: { email },
      include: [
        {
          model: Image,
          as: 'profile_image',
          attributes: ['id'],
        },
      ],
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profile_image_id: user.profile_image_id,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    logger.error('Error logging in user:', error);
    res.status(500).json({
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Get current user profile
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const user = await Account.findByPk(userId, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: Image,
          as: 'profile_image',
          attributes: ['id', 'mime_type'],
        },
      ],
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    logger.error('Error fetching current user:', error);
    res.status(500).json({
      message: 'Error fetching user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Get user by username
export const getUserByUsername = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    const user = await Account.findOne({
      where: { username },
      attributes: ['id', 'username', 'bio', 'profile_image_id', 'created_at'],
      include: [
        {
          model: Image,
          as: 'profile_image',
          attributes: ['id', 'mime_type'],
        },
      ],
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    logger.error('Error fetching user by username:', error);
    res.status(500).json({
      message: 'Error fetching user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { bio, email } = req.body;

    const user = await Account.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Update fields
    if (bio !== undefined) user.bio = bio;
    if (email !== undefined) user.email = email;

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profile_image_id: user.profile_image_id,
      },
    });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await Account.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password_hash = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Error changing password:', error);
    res.status(500).json({
      message: 'Error changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Upload profile image
export const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const imageData = req.file?.buffer;
    const mimeType = req.file?.mimetype;

    if (!imageData) {
      res.status(400).json({ message: 'No image provided' });
      return;
    }

    const user = await Account.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Create new image
    const image = await Image.create({
      data: imageData,
      mime_type: mimeType,
      alt_text: `Profile image for ${user.username}`,
    });

    // Update user profile image
    user.profile_image_id = image.id;
    await user.save();

    res.status(200).json({
      message: 'Profile image uploaded successfully',
      profile_image_id: image.id,
    });
  } catch (error) {
    logger.error('Error uploading profile image:', error);
    res.status(500).json({
      message: 'Error uploading profile image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
}; 