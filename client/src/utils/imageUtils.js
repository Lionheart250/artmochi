export const getImageUrl = (path, type = 'image') => {
  if (!path) return '/default-avatar.png';
  
  // Handle full URLs (including S3)
  if (path.startsWith('http')) {
    return path;
  }

  // Handle legacy local paths during transition
  if (path.startsWith('/')) {
    return `${process.env.REACT_APP_API_URL}${path}`;
  }

  // Handle S3 paths
  return path;
};