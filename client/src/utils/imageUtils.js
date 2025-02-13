export const getImageUrl = (path, type = 'image') => {
  if (!path) return '/default-avatar.png';
  
  // Handle full URLs (including S3)
  if (path.startsWith('http')) {
    return path;
  }

  // Handle S3 paths without full URL
  if (path.startsWith('profile_pictures/')) {
    return `https://${process.env.REACT_APP_S3_BUCKET_NAME}.s3.${process.env.REACT_APP_AWS_REGION}.amazonaws.com/${path}`;
  }

  // Handle legacy local paths during transition
  if (path.startsWith('/')) {
    return `${process.env.REACT_APP_API_URL}${path}`;
  }

  // Handle all other S3 paths
  return `https://${process.env.REACT_APP_S3_BUCKET_NAME}.s3.${process.env.REACT_APP_AWS_REGION}.amazonaws.com/${path}`;
};