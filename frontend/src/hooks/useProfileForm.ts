import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserService from '../services/UserService';

interface ProfileFormData {
  full_name: string;
  bio: string;
}

interface UseProfileFormReturn {
  profileData: ProfileFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
  notification: { open: boolean; message: string; severity: 'success' | 'error' };
  handleCloseNotification: () => void;
}

export function useProfileForm(): UseProfileFormReturn {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileFormData>({
    full_name: '',
    bio: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedUser = await UserService.updateProfile({
        full_name: profileData.full_name,
        bio: profileData.bio
      });
      if (updateUser) {
        updateUser(updatedUser);
      }
      setNotification({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
      // Navigate back to profile after successful update
      setTimeout(() => {
        navigate('/profile');
      }, 500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification({
        open: true,
        message: 'Failed to update profile',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return {
    profileData,
    handleChange,
    handleSubmit,
    loading,
    notification,
    handleCloseNotification
  };
} 