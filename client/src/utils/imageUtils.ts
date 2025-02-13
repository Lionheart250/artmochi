export const getImageUrl = (path: string | null, type: 'profile' | 'image' = 'image'): string => {
  if (!path) return '/default-avatar.png';
  
  // Handle full S3 URLs
  if (path.startsWith('http')) {
    return path;
  }

  // Handle legacy local paths during transition
  if (path.startsWith('/')) {
    return `${process.env.REACT_APP_API_URL}${path}`;
  }

  // Handle S3 paths
  const bucket = process.env.REACT_APP_S3_BUCKET_NAME;
  const region = process.env.REACT_APP_AWS_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${type}s/${path}`;
};