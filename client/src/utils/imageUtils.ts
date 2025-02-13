export const getImageUrl = (path: string | null, type: 'profile' | 'image' = 'image'): string => {
  if (!path) return '/default-avatar.png';
  
  if (path.startsWith('http')) {
    return path;
  }

  return `${process.env.REACT_APP_API_URL}/${type === 'profile' ? 'profile_pictures' : 'images'}/${path}`;
};