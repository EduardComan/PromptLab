const getApiBaseUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
};

// Both /images/:imageId and /accounts/profile-image/:imageId hit the same backend logic
// Using the simpler /images route for all image serving
export const getImageUrl = (imageId: string) => {
  return `${getApiBaseUrl()}/images/${imageId}`;
};

// Legacy function - keeping for backward compatibility, but uses same endpoint
export const getProfileImageUrl = (imageId: string) => {
  return getImageUrl(imageId);
}; 