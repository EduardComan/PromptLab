import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserService from '../services/UserService';

interface UseImageUploadReturn {
  imagePreview: string | null;
  uploadingImage: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageClick: () => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function useImageUpload(): UseImageUploadReturn {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      // Set initial image preview
      if (user.profile_image_id) {
        setImagePreview(`/api/accounts/profile-image/${user.profile_image_id}`);
      } else if (user.picture_url) {
        setImagePreview(user.picture_url);
      } else {
        setImagePreview(null); // Default to null if no image is set
      }
    }
  }, [user]);

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      try {
        setUploadingImage(true);

        // Upload the image
        const result = await UserService.uploadProfileImage(file);

        // Update the user context with new profile image id
        if (updateUser && user) {
          updateUser({
            ...user,
            profile_image_id: result.profile_image_id
          });
          // Update the image preview to reflect the new image
          setImagePreview(`/api/accounts/profile-image/${result.profile_image_id}`);
        }
      } catch (error) {
        console.error('Error uploading profile image:', error);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  return {
    imagePreview,
    uploadingImage,
    fileInputRef,
    handleImageClick,
    handleImageChange
  };
} 