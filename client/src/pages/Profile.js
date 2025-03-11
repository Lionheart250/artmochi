import React, { useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode'; // Ensure jwt-decode is installed
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import debounce from 'lodash.debounce';
import { getImageUrl } from '../utils/imageUtils';
import ImageModal from '../components/ImageModal';
import { artisticLoras, realisticLoras } from '../components/LoraSelector';
import { customHistory } from '../utils/CustomHistory';
import './Profile.css';
import { ReactComponent as LikeIcon } from '../assets/icons/like.svg';
import { ReactComponent as CommentIcon } from '../assets/icons/comment.svg';
import { ReactComponent as ShareIcon } from '../assets/icons/share.svg';
import { ReactComponent as BookmarkIcon } from '../assets/icons/bookmark.svg';
import LazyImage from '../components/LazyImage';

const Profile = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { profilePicture, setProfilePicture } = useProfile();
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [images, setImages] = useState([]);
    const [modalImage, setModalImage] = useState(null);
    const [activeImageId, setActiveImageId] = useState(null);
    const [likes, setLikes] = useState({});
    const [comments, setComments] = useState({});
    const [commentInput, setCommentInput] = useState('');
    const [userLikedImages, setUserLikedImages] = useState(new Set());
    const [userLikedComments, setUserLikedComments] = useState(new Set());
    const [commentLikes, setCommentLikes] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [tempUsername, setTempUsername] = useState('');
    const [tempBio, setTempBio] = useState('');
    const [tempProfilePicture, setTempProfilePicture] = useState(null);
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [file, setFile] = useState(null);
    const [activeTab, setActiveTab] = useState('posts');
    const [likedImages, setLikedImages] = useState([]);
    const [isLoadingLikes, setIsLoadingLikes] = useState(false);
    const [imageUserDetails, setImageUserDetails] = useState({});
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [postsCount, setPostsCount] = useState(0);
    const [likesCount, setLikesCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);

    // Add new state variables
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);
    const [followersList, setFollowersList] = useState([]);
    const [followingList, setFollowingList] = useState([]);
    const [imageDetailsLoading, setImageDetailsLoading] = useState(false);

    // Add the expandedPrompts state and togglePrompt function
    const [expandedPrompts, setExpandedPrompts] = useState(new Set());

    const togglePrompt = (imageId) => {
        setExpandedPrompts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(imageId)) {
                newSet.delete(imageId);
            } else {
                newSet.add(imageId);
            }
            return newSet;
        });
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const fetchImageDetails = async (imageId) => {
        if (!imageId) return;
        const token = localStorage.getItem('token');
        
        try {
            // First get image details and user profile in parallel
            const imageResponse = await fetch(`${process.env.REACT_APP_API_URL}/images/${imageId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const imageData = await imageResponse.json();
            
            // Get image owner's profile data
            const userProfileResponse = await fetch(`${process.env.REACT_APP_API_URL}/user_profile/${imageData.user_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const userProfileData = await userProfileResponse.json();

            // Set image details with owner's profile
            setImageUserDetails(prev => ({
                ...prev,
                [imageId]: {
                    ...imageData,
                    username: userProfileData.username,
                    profile_picture: userProfileData.profile_picture,
                    user_id: imageData.user_id
                }
            }));

            // Fetch comments, follow status, and likes in parallel
            const [commentsResponse, followStatusResponse, likesResponse] = await Promise.all([
                fetch(`${process.env.REACT_APP_API_URL}/fetch_comments?id=${imageId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.REACT_APP_API_URL}/user/${imageData.user_id}/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.REACT_APP_API_URL}/likes/${imageId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const [commentsData, followStatus, likesData] = await Promise.all([
                commentsResponse.json(),
                followStatusResponse.json(),
                likesResponse.json()
            ]);

            // Update follow status
            if (followStatusResponse.ok) {
                setIsFollowing(followStatus.is_following);
            }

            // Update likes
            setLikes(prev => ({ ...prev, [imageId]: likesData.count }));

            if (commentsResponse.ok) {
                // First, initialize comments array
                setComments(prev => ({
                    ...prev,
                    [imageId]: commentsData.comments || []
                }));
                
                if (commentsData.comments?.length > 0) {
                    // Get each comment author's profile and likes
                    for (const comment of commentsData.comments) {
                        try {
                            const [profileResponse, commentLikesResponse] = await Promise.all([
                                fetch(`${process.env.REACT_APP_API_URL}/user_profile/${comment.user_id}`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                }),
                                fetch(`${process.env.REACT_APP_API_URL}/comment_likes/${comment.id}`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                })
                            ]);
                            
                            const [profileData, commentLikesData] = await Promise.all([
                                profileResponse.json(),
                                commentLikesResponse.json()
                            ]);
                            
                            // Update comments with profile data
                            setComments(prev => ({
                                ...prev,
                                [imageId]: prev[imageId].map(c => 
                                    c.id === comment.id 
                                        ? {
                                            ...c,
                                            username: profileData.username,
                                            profile_picture: profileData.profile_picture
                                        }
                                        : c
                                )
                            }));

                            // Update comment likes
                            setCommentLikes(prev => ({
                                ...prev,
                                [comment.id]: commentLikesData.count
                            }));

                            if (commentLikesData.user_liked) {
                                setUserLikedComments(prev => new Set([...prev, comment.id]));
                            }
                        } catch (error) {
                            console.error('Error fetching comment data:', error);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error fetching image details:', error);
        }
    };

    // Add debug logs
    useEffect(() => {
        console.log('Modal state:', { modalOpen, modalImage, activeImageId });
    }, [modalOpen, modalImage, activeImageId]);

    useEffect(() => {
        // Initialize temp values when entering edit mode
        if (isEditing) {
            setTempUsername(username);
            setTempBio(bio);
            setTempProfilePicture(profilePicture);
            setProfilePictureFile(null);
            setMessage(''); // Clear message when opening modal
        }
    }, [isEditing]);

    const fetchUserProfile = async () => {
        if (!id) return;
        
        try {
            setIsLoading(true);
            console.log('Starting profile fetch for ID:', id);
            const token = localStorage.getItem('token');
            
            // Fetch profile data first
            const response = await fetch(`${process.env.REACT_APP_API_URL}/user_profile/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            console.log('Profile data received:', data);
            
            setUsername(data.username);
            setBio(data.bio || '');
            
            // Only update profile picture if it exists
            if (data.profile_picture) {
                // Use the S3 URL directly if it's from S3
                setProfilePicture(constructProfilePicUrl(data.profile_picture));
            } else {
                setProfilePicture('/default-avatar.png');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfilePictureChange = async (e) => {
        if (!e.target.files?.[0]) return;
        
        const formData = new FormData();
        formData.append('image', e.target.files[0]);

        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/upload_profile_picture`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                credentials: 'include',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload profile picture');
            }

            const data = await response.json();
            if (data.success) {
                // Use the S3 URL directly
                setProfilePicture(data.filepath);
                setTempProfilePicture(data.filepath);
                setMessage('Profile picture updated successfully');
            } else {
                throw new Error(data.error || 'Failed to upload profile picture');
            }
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            setMessage('Error uploading profile picture');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const token = localStorage.getItem('token');
            // Assume "id" is the user's ID from props/useParams
            const response = await fetch(`${process.env.REACT_APP_API_URL}/update_profile/${id}`, {                
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username: tempUsername, bio: tempBio })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update profile');
            }

            // Update local state
            setUsername(data.data.username);
            setBio(data.data.bio || '');

            // (Optional) Upload new profile picture
            if (profilePictureFile) {
                const formData = new FormData();
                formData.append('image', profilePictureFile);

                const picResponse = await fetch(`${process.env.REACT_APP_API_URL}/upload_profile_picture`, {                    
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                const picData = await picResponse.json();
                if (!picResponse.ok) {
                    throw new Error(picData.error || 'Failed to upload profile picture');
                }
                setProfilePicture(`${process.env.REACT_APP_API_URL}/${picData.profilePicturePath}`);            
            }

            // Re-fetch to confirm DB changes
            await fetchUserProfile();
            setIsEditing(false);
            setMessage('Profile updated successfully');
        } catch (error) {
            console.error('Profile update error:', error);
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCommentLike = async (commentId) => {
        const token = localStorage.getItem('token');
        if (!token) return;
    
        const isLiked = userLikedComments.has(commentId);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/comment_likes/${commentId}`, {                
                method: isLiked ? 'DELETE' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) throw new Error('Failed to toggle like');
    
            setUserLikedComments(prev => {
                const newSet = new Set(prev);
                isLiked ? newSet.delete(commentId) : newSet.add(commentId);
                return newSet;
            });
    
            // Fetch updated like count
            await fetchCommentLikeCount(commentId);
        } catch (error) {
            console.error('Error toggling comment like:', error);
        }
    };
    
    const fetchCommentLikeCount = async (commentId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/comment_likes/${commentId}`, {                
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch like count');
            const data = await response.json();
            setCommentLikes(prev => ({
                ...prev,
                [commentId]: data.count
            }));
        } catch (error) {
            console.error('Error fetching comment like count:', error);
        }
    };
    
        // Update comment state when adding new comment
        const handleCommentSubmit = async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('token');
            if (!token || !commentInput.trim()) return;
        
            try {
                // Get user ID from token
                const decoded = jwtDecode(token);
                const userId = decoded.userId;
            
                // Post the new comment - include userId like Gallery.js does
                const response = await fetch(`${process.env.REACT_APP_API_URL}/add_comment`, {                    
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ 
                        userId, // Include userId as Gallery.js does
                        imageId: activeImageId, 
                        comment: commentInput 
                    }),
                });
        
                if (response.ok) {
                    // After adding comment, fetch updated comments
                    const commentsResponse = await fetch(`${process.env.REACT_APP_API_URL}/fetch_comments?id=${activeImageId}`, {                        
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
        
                    if (commentsResponse.ok) {
                        const commentsData = await commentsResponse.json();
                        
                        // Set the comments first
                        setComments((prev) => ({
                            ...prev,
                            [activeImageId]: commentsData.comments,
                        }));
                        
                        setCommentInput(''); // Clear input
                        
                        // Just like Gallery.js does, refetch all data for the image
                        fetchImageDetails(activeImageId);
                    } else {
                        console.error('Error fetching comments:', await commentsResponse.text());
                    }
                } else {
                    console.error('Error adding comment:', await response.text());
                }
            } catch (error) {
                console.error('Error in comment submission process:', error);
            }
        };

// Update your closeModal function to match Gallery.js pattern
const closeModal = () => {
    setModalImage(null);
    setActiveImageId(null);
    
    // Just like Gallery.js - let the ImageModal handle body class cleanup
    
    // Refetch stats to reflect any changes from the modal
    fetchUserStats();
};

    const fetchAllData = async (imageId) => {
        const token = localStorage.getItem('token');
        if (!token) return;
    
        try {
            // First get image details for user_id
            const imageDetailsResponse = await fetch(`${process.env.REACT_APP_API_URL}/images/${imageId}`, {                
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!imageDetailsResponse.ok) {
                throw new Error('Failed to fetch image details');
            }
            
            const imageData = await imageDetailsResponse.json();
            setImageUserDetails(prev => ({
                ...prev,
                [imageId]: imageData
            }));
    
            // Fetch likes, comments, and follow status in parallel
            const [likesResponse, commentsResponse, followStatusResponse] = await Promise.all([
                fetch(`${process.env.REACT_APP_API_URL}/likes/${imageId}`, {                    
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.REACT_APP_API_URL}/fetch_comments?id=${imageId}`, {                    
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.REACT_APP_API_URL}/user/${imageData.user_id}/stats`, {                    
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
    
            const [likesData, commentsData, followStatus] = await Promise.all([
                likesResponse.json(),
                commentsResponse.json(),
                followStatusResponse.json()
            ]);
    
            if (followStatusResponse.ok) {
                setIsFollowing(followStatus.is_following);
            }
    
            // Fetch comment likes for each comment
            if (commentsData.comments && commentsData.comments.length > 0) {
                const commentLikesPromises = commentsData.comments.map(comment => 
                    fetch(`${process.env.REACT_APP_API_URL}/comment_likes/${comment.id}`, {                        
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).then(res => res.json())
                );
    
                const commentLikesResults = await Promise.all(commentLikesPromises);
                
                const newCommentLikes = {};
                const userLikedCommentsSet = new Set();
    
                commentsData.comments.forEach((comment, index) => {
                    const likeData = commentLikesResults[index];
                    newCommentLikes[comment.id] = parseInt(likeData.count);
                    if (likeData.user_liked) {
                        userLikedCommentsSet.add(comment.id);
                    }
                });
    
                setCommentLikes(prev => ({ ...prev, ...newCommentLikes }));
                setUserLikedComments(userLikedCommentsSet);
            }
    
            setLikes(prev => ({ ...prev, [imageId]: likesData.count }));
            setComments(prev => ({ ...prev, [imageId]: commentsData.comments || [] }));
    
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const openModal = async (image) => {
        try {
            setModalImage(image.image_url);  // Change this to match Gallery.js
            setActiveImageId(image.id);
            await fetchImageDetails(image.id);
            navigate(`?id=${image.id}`, { replace: true });
            document.body.classList.add('modal-open');
        } catch (error) {
            console.error('Error fetching image details:', error);
        }
    };

    const navigateImage = (direction, specificId = null) => {
        if (!images.length) return;
        
        let newIndex;
        
        if (specificId) {
          // Navigate to a specific image
          newIndex = images.findIndex(img => img.id === specificId);
        } else {
          // Find current index
          const currentIndex = images.findIndex(img => img.id === activeImageId);
          
          // Calculate new index based on direction
          if (direction === 'next' || direction === 1) {
            newIndex = (currentIndex + 1) % images.length;
          } else {
            newIndex = (currentIndex - 1 + images.length) % images.length;
          }
        }
        
        // Update state with new image
        setActiveImageId(images[newIndex].id);
        setSelectedImage(images[newIndex].image_url);
        
        // Update URL
        const newUrl = `/image/${images[newIndex].id}`;
        customHistory.replace(newUrl);
        
        // Fetch details for the new image
        fetchImageDetails(images[newIndex].id);
    };

    const isAdmin = user && user.role === 'admin';

    const handleDeleteImage = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/delete_image/${activeImageId}`, {                
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setImages(images.filter(img => img.id !== activeImageId));
                closeModal();
            } else {
                console.error('Failed to delete image');
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    };

    const handleLike = async (imageId) => {
        const token = localStorage.getItem('token');
        if (!token) return;
    
        const isLiked = userLikedImages.has(imageId);
        
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/likes/${imageId}`, {                
                method: isLiked ? 'DELETE' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) throw new Error('Failed to toggle like');
    
            const data = await response.json();
            
            setLikes(prev => ({
                ...prev,
                [imageId]: data.count
            }));
            
            setUserLikedImages(prev => {
                const newSet = new Set(prev);
                if (isLiked) {
                    newSet.delete(imageId);
                } else {
                    newSet.add(imageId);
                }
                return newSet;
            });
    
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };
    

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    // Add handler function
    const handleUsernameClick = (user_id) => {
        setModalImage(null); // Close modal
        setModalOpen(false); // Reset modal state
        navigate(`/profile/${user_id}`);
    };

    const constructProfilePicUrl = (path) => {
        if (!path) return '/default-avatar.png';
        
        // If it's already a full S3 URL, return it as is
        if (path.startsWith('http')) {
            return path;
        }
        
        // Otherwise, append to API URL
        const baseUrl = process.env.REACT_APP_API_URL;
        const picturePath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${picturePath}`;
    };

    // Add loading state
    useEffect(() => {
        let isMounted = true;
        
        const fetchProfileData = async () => {
            if (!id) return;
            
            try {
                setIsLoading(true);
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_URL}/user_profile/${id}`, {                    
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const data = await response.json();
                console.log('Profile data received:', data);
                
                if (!isMounted) return;

                setUsername(data.username);
                setBio(data.bio || '');
                
                const profilePicUrl = constructProfilePicUrl(data.profile_picture);
                console.log('Setting final profile picture URL:', profilePicUrl);
                setProfilePicture(profilePicUrl);
                
            } catch (error) {
                console.error('Error fetching profile:', error);
                if (isMounted) setProfilePicture('/default-avatar.png');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchProfileData();
        
        return () => {
            isMounted = false;
        };
    }, [id]);

    const fetchProfilePicture = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/profile_picture`, {                
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setProfilePicture(data.profile_picture);
        } catch (error) {
            console.error('Error fetching profile picture:', error);
        }
    };

    useEffect(() => {
        fetchProfilePicture();
    }, []);

    useEffect(() => {
        // This useEffect will run whenever profilePicture changes
        if (profilePicture) {
            console.log('Profile picture updated:', profilePicture);
        }
    }, [profilePicture]);

    const fetchLikedImagesWithDetails = async (pageNum = 1) => {
        const token = localStorage.getItem('token');
        if (!token || !id) return;
        
        if (pageNum === 1) {
            setIsLoadingLikes(true);
        }
        
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/user/${id}/likes?page=${pageNum}&limit=${imagesPerPage}`, 
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            const data = await response.json();
            
            // Create user details object
            const details = {};
            data.images.forEach(img => {
                details[img.id] = {
                    username: img.username,
                    profile_picture: img.profile_picture,
                    user_id: img.user_id,
                    prompt: img.prompt
                };
            });
            
            setImageUserDetails(prev => ({...prev, ...details}));
            
            if (data.images.length === 0) {
                setHasMore(false);
            } else {
                setLikedImages(prev => pageNum === 1 ? data.images : [...prev, ...data.images]);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoadingLikes(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'likes') {
            fetchLikedImagesWithDetails();
        }
    }, [activeTab, id]);

    // Add debug logging to fetchUserStats
    const fetchUserStats = async () => {
        const token = localStorage.getItem('token');
        if (!token || !id) {
            console.log('Missing token or id for stats');
            return;
        }
    
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/user/${id}/stats`, {                
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user stats');
            }
            
            const stats = await response.json();
            console.log('Stats response:', stats); // Debug log
            
            setFollowersCount(parseInt(stats.followers_count) || 0);
            setFollowingCount(parseInt(stats.following_count) || 0);
            setPostsCount(parseInt(stats.posts_count) || 0);
            setLikesCount(parseInt(stats.likes_count) || 0);
            setIsFollowing(Boolean(stats.is_following)); // Explicitly convert to boolean
            console.log('Set isFollowing to:', Boolean(stats.is_following)); // Debug log
        } catch (error) {
            console.error('Error fetching user stats:', error);
        }
    };

    const handleFollowToggle = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
    
        try {
            // Add isFollowing to debug log
            console.log('Current follow state:', isFollowing);
            
            const response = await fetch(`${process.env.REACT_APP_API_URL}/follow/${id}`, {               
                 method: isFollowing ? 'DELETE' : 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (response.ok) {
                // Toggle state and refetch stats
                setIsFollowing(prev => !prev);
                setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
                await fetchUserStats(); // Refetch to ensure sync
            } else {
                const error = await response.json();
                console.error('Follow toggle failed:', error);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

        useEffect(() => {
        if (id) {
            fetchUserStats();
        }
    }, [id]);

    // Add fetch functions
    const fetchFollowersList = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/user/${id}/followers`, {                
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setFollowersList(data);
        } catch (error) {
            console.error('Error fetching followers:', error);
        }
    };

    const fetchFollowingList = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/user/${id}/following`, {                
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setFollowingList(data);
        } catch (error) {
            console.error('Error fetching following:', error);
        }
    };

    // Add handleModalFollowToggle function
    const handleModalFollowToggle = async (targetUserId) => {
        const token = localStorage.getItem('token');
        if (!token || targetUserId === user?.userId) return;
    
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/follow/${targetUserId}`, {
                method: isFollowing ? 'DELETE' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setIsFollowing(!isFollowing);
                // Update image details to reflect new follow state
                fetchImageDetails(activeImageId);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    // Add ID validation
    useEffect(() => {
        if (!id) {
            console.log('No ID provided, redirecting...');
            if (user?.userId) {
                navigate(`/profile/${user.userId}`);
            } else {
                navigate('/');
            }
            return;
        }

        const fetchData = async () => {
            try {
                setIsLoading(true);
                await Promise.all([
                    fetchProfileData(),
                    fetchUserStats(),
                    fetchUserProfile(id)
                ]);
            } catch (error) {
                console.error('Error initializing profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, user]);

    // Add this debug log
    useEffect(() => {
        console.log('Current ID from params:', id);
        console.log('Current user:', user);
    }, [id, user]);

    // Add this check near the top of the component
    const isOwnProfile = user && user.userId === parseInt(id);

    // Add this function to your Profile component

const handlePrivacyToggle = async () => {
  const token = localStorage.getItem('token');
  if (!token || !activeImageId) return;

  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/images/${activeImageId}/privacy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // Update the images state with the new privacy status
      setImages(prevImages => prevImages.map(img => 
        img.id === activeImageId ? { ...img, private: data.private } : img
      ));
      
      // Update image user details as well for consistency
      setImageUserDetails(prev => ({
        ...prev,
        [activeImageId]: {
          ...prev[activeImageId],
          private: data.private
        }
      }));
    }
  } catch (error) {
    console.error('Error toggling privacy:', error);
  }
};

    // Add the getLoraName function (import the lora lists if needed)
    const getLoraName = (url) => {
        // First check artistic loras
        const artisticLora = artisticLoras.find(lora => lora.url === url);
        if (artisticLora) return artisticLora.name;
        
        // Then check realistic loras
        const realisticLora = realisticLoras.find(lora => lora.url === url);
        if (realisticLora) return realisticLora.name;
        
        // Fallback to model ID if not found
        return url.split(':')[1];
    };

    // Make sure you have a proper handleImageEdit function defined
const handleImageEdit = (type, image) => {
  try {
    const imageData = {
      url: image.image_url,
      prompt: image.prompt,
      mode: type === 'upscale' ? 'upscale' : 'generate',
      isImageToImage: type === 'remix'
    };

    // Close the modal before navigating
    closeModal();
    
    // Store data and navigate
    localStorage.setItem('editImageData', JSON.stringify(imageData));
    navigate('/imagegenerator');
  } catch (error) {
    console.error('Error preparing image for edit:', error);
  }
};

// Add these state variables
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const loadingRef = useRef(null);
const loadingInProgress = useRef(false);
const imagesPerPage = 7; // Balance between UX and performance

// Function to fetch paginated posts
const fetchPaginatedImages = async (pageNum) => {
    if (loadingInProgress.current) return;
    loadingInProgress.current = true;
    
    try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/user_images/${id}?page=${pageNum}&limit=${imagesPerPage}`, 
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );
        
        const data = await response.json();
        
        if (data.images.length === 0) {
            setHasMore(false);
        } else {
            // Append new images rather than replacing
            setImages(prev => pageNum === 1 ? data.images : [...prev, ...data.images]);
        }
    } catch (error) {
        console.error('Error fetching paginated images:', error);
    } finally {
        setLoading(false);
        loadingInProgress.current = false;
    }
};

// Update fetchProfileData to use pagination
const fetchProfileData = async () => {
    if (!id) return;
    
    try {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        // Fetch profile and stats in parallel, but paginate images
        const [profileResponse, statsResponse] = await Promise.all([
            fetch(`${process.env.REACT_APP_API_URL}/user_profile/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${process.env.REACT_APP_API_URL}/user/${id}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
        ]);

        const [profileData, statsData] = await Promise.all([
            profileResponse.json(),
            statsResponse.json(),
        ]);

        setUsername(profileData.username);
        setBio(profileData.bio || '');
        setProfilePicture(profileData.profile_picture);
        
        setFollowersCount(parseInt(statsData.followers_count) || 0);
        setFollowingCount(parseInt(statsData.following_count) || 0);
        setPostsCount(parseInt(statsData.posts_count) || 0);
        setLikesCount(parseInt(statsData.likes_count) || 0);
        setIsFollowing(Boolean(statsData.is_following));

        // Reset pagination and fetch first page
        setPage(1);
        setHasMore(true);
        fetchPaginatedImages(1);

    } catch (error) {
        console.error('Error fetching profile data:', error);
    } finally {
        setIsLoading(false);
    }
};

// Add effect for infinite scroll
useEffect(() => {
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting && hasMore && !loading && !loadingInProgress.current) {
                setPage(prev => prev + 1);
            }
        },
        { threshold: 0.1 }
    );
    
    if (loadingRef.current) {
        observer.observe(loadingRef.current);
    }
    
    return () => {
        if (loadingRef.current) {
            observer.unobserve(loadingRef.current);
        }
    };
}, [hasMore, loading]);

// Effect to fetch when page changes
useEffect(() => {
    if (page > 1) {
        fetchPaginatedImages(page);
    }
}, [page]);

// Update the tab handling to reset pagination
const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setHasMore(true);
    
    if (tab === 'likes' && isOwnProfile) {
        fetchLikedImagesWithDetails(1);
    }
};

    return (
        <div className="profile-container">
            <div className="profile-header-wrapper">
                <div className="profile-header">
    {/* Left side: Profile picture */}
    {!isLoading && (
        <img 
            src={profilePicture} 
            alt={`${username}'s profile`}
            className="profile-profile-picture" 
            onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-avatar.png';
            }}
        />
    )}
    
    {/* Right side: Profile information */}
    <div className="profile-info">
        {/* Top row: Username and actions */}
        <div className="profile-top">
            <h1 className="profile-username">{username}</h1>
            
            <div className="profile-actions">
                {user && user.userId === parseInt(id) ? (
                    <button className="profile-edit-btn" onClick={() => setIsEditing(true)}>
                        Edit Profile
                    </button>
                ) : user && (
                    <button 
                        className={`profile-follow-btn ${isFollowing ? 'following' : ''}`}
                        onClick={handleFollowToggle}
                    >
                        {isFollowing ? 'Following' : 'Follow'}
                    </button>
                )}
            </div>
        </div>
        
        {/* Middle row: Stats */}
        <div className="profile-stats">
            <div className="stat-item" onClick={() => {
                setShowFollowingModal(true);
                fetchFollowingList();
            }}>
                <span className="stat-number">{followingCount}</span>
                <span className="stat-label">Following</span>
            </div>
            <div className="stat-item" onClick={() => {
                setShowFollowersModal(true);
                fetchFollowersList();
            }}>
                <span className="stat-number">{followersCount}</span>
                <span className="stat-label">Followers</span>
            </div>
            <div className="stat-item">
                <span className="stat-number">{postsCount}</span>
                <span className="stat-label">Posts</span>
            </div>
            <div className="stat-item">
                <span className="stat-number">{likesCount}</span>
                <span className="stat-label">Likes</span>
            </div>
        </div>
        
        {/* Bottom row: Bio */}
        <p className="profile-bio">{bio}</p>
    </div>
</div>
           
        </div>

            {/* Add Tabs */}
            <div className="profile-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => handleTabChange('posts')}
                >
                    Posts
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'private' ? 'active' : ''}`}
                    onClick={() => isOwnProfile ? handleTabChange('private') : null}
                    style={{ opacity: isOwnProfile ? 1 : 0.5, cursor: isOwnProfile ? 'pointer' : 'not-allowed' }}
                >
                    Private
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'likes' ? 'active' : ''}`}
                    onClick={() => isOwnProfile ? handleTabChange('likes') : null}
                    style={{ opacity: isOwnProfile ? 1 : 0.5, cursor: isOwnProfile ? 'pointer' : 'not-allowed' }}
                >
                    Likes
                </button>
            </div>

            {/* Keep existing grid */}
            {activeTab === 'posts' && (
                <div className="profile-grid">
                    {images && images.filter(image => !image.private).map((image) => (  // Added null check with &&
                        <div 
                            key={image.id} 
                            className="profile-item"
                            onClick={() => openModal(image)}
                        >
                            <LazyImage 
                                src={image.image_url} 
                                alt={image.prompt}
                                className="profile-image" 
                            />
                        </div>
                    ))}
                    {hasMore && (
                        <div ref={loadingRef} className="loading-indicator">
                            {loading && <div className="spinner"></div>}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'private' && isOwnProfile && (
                <div className="profile-grid">
                    {images && images.filter(image => image.private).map((image) => (
                        <div 
                            key={image.id} 
                            className="profile-item"
                            onClick={() => openModal(image)}
                        >
                            <LazyImage 
                                src={image.image_url} 
                                alt={image.prompt}
                                className="profile-image" 
                            />
                        </div>
                    ))}
                    {hasMore && (
                        <div ref={loadingRef} className="loading-indicator">
                            {loading && <div className="spinner"></div>}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'likes' && isOwnProfile && (
                <div className="profile-grid">
                    {isLoadingLikes && page === 1 ? (
                        <div className="loading-spinner">Loading...</div>
                    ) : (
                        <>
                            {likedImages && likedImages.map((image) => (
                                <div 
                                    key={image.id} 
                                    className="profile-item"
                                    onClick={() => openModal(image)}
                                >
                                    <LazyImage 
                                        src={image.image_url} 
                                        alt={image.prompt}
                                        className="profile-image" 
                                    />
                                </div>
                            ))}
                            {hasMore && (
                                <div ref={loadingRef} className="loading-indicator">
                                    {isLoadingLikes && page > 1 && <div className="spinner"></div>}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <ImageModal
                isOpen={!!modalImage} // Convert to boolean
                onClose={closeModal}
                modalImage={modalImage}
                activeImageId={activeImageId}
                images={activeTab === 'likes' ? likedImages : images}
                user={user}
                navigateImage={navigateImage}
                canDelete={(isAdmin || isOwnProfile)}
                isAdmin={isAdmin}
                isOwnProfile={isOwnProfile}
                activeTab={activeTab}
                onImageDelete={handleDeleteImage}
                imageUserDetails={imageUserDetails}
                comments={comments}
                likes={likes}
                userLikedImages={userLikedImages}
                commentLikes={commentLikes}
                isFollowing={isFollowing}
                handleLike={handleLike}
                handleCommentLike={handleCommentLike}
                handleCommentSubmit={handleCommentSubmit}
                handleModalFollowToggle={handleModalFollowToggle}
                handlePrivacyToggle={handlePrivacyToggle}
                handleImageEdit={handleImageEdit} // Add if you have this function
                togglePrompt={togglePrompt}
                expandedPrompts={expandedPrompts}
                commentInput={commentInput}
                setCommentInput={setCommentInput}
                formatTimestamp={formatTimestamp}
                formatDate={formatDate || formatTimestamp}
                getLoraName={getLoraName}
            />

            {isEditing && (
                <div className="profile-edit-modal">
                    <div className="profile-edit-modal-content">
                        <div className="profile-edit-header">
                            <h2 className="profile-edit-title">Edit Profile</h2>
                            <button className="profile-edit-close" onClick={() => setIsEditing(false)}>×</button>
                        </div>
                        <div className="profile-edit-form">
                            <div className="profile-picture-section">
                                <img 
                                    src={tempProfilePicture || profilePicture} 
                                    alt="Profile" 
                                    className="profile-edit-picture" 
                                />
                                <input
                                    type="file"
                                    id="profile-picture-input"
                                    accept="image/*"
                                    onChange={handleProfilePictureChange}
                                    style={{ display: 'none' }}
                                />
                                <label 
                                    htmlFor="profile-picture-input" 
                                    className="profile-picture-change-btn"
                                >
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zm0-2.5a2 2 0 100-4 2 2 0 000 4z"/>
                                        <path d="M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h4.05l1.83-2h4.24l1.83 2H20v12z"/>
                                    </svg>
                                    Change photo
                                </label>
                            </div>

                            <div className="profile-edit-field">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={tempUsername}
                                    onChange={(e) => setTempUsername(e.target.value)}
                                    className="profile-edit-input"
                                />
                            </div>

                            <div className="profile-edit-field">
                                <label>Bio</label>
                                <textarea
                                    value={tempBio}
                                    onChange={(e) => setTempBio(e.target.value)}
                                    className="profile-edit-input"
                                    rows={3}
                                />
                            </div>

                            <div className="profile-edit-actions">
                                <button 
                                    className="profile-save-btn"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                            </div>

                            {message && (
                                <div className="profile-message">
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add modals */}
            {showFollowersModal && (
                <div className="profile-modal followers-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Followers</h3>
                            <button onClick={() => setShowFollowersModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {followersList.map(follower => (
                                <div key={follower.id} className="user-list-item">
                                    <div className="user-info" onClick={() => navigate(`/profile/${follower.id}`)}>
                                    <img src={getImageUrl(follower.profile_picture, 'profile')}
                                    alt={follower.username}
                                    onError={(e) => e.target.src = '/default-avatar.png'}
                                    />                                        
                                    <span>{follower.username}</span>
                                    </div>
                                    <button 
                                        className={`follow-btn ${follower.is_following ? 'following' : ''}`}
                                        onClick={() => handleFollowToggle(follower.id)}
                                    >
                                        {follower.is_following ? 'Unfollow' : 'Follow Back'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showFollowingModal && (
                <div className="profile-modal following-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Following</h3>
                            <button onClick={() => setShowFollowingModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {followingList.map(user => (
                                <div key={user.id} className="user-list-item">
                                    <div className="user-info" onClick={() => navigate(`/profile/${user.id}`)}>
                                        <img 
                                            src={getImageUrl(user.profile_picture, 'profile')}
                                            alt={user.username}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/default-avatar.png';
                                            }}
                                        />
                                        <span>{user.username}</span>
                                    </div>
                                    {user.id !== user?.userId && (
                                        <button 
                                            className={`follow-btn ${user.is_following ? 'following' : ''}`}
                                            onClick={() => handleModalFollowToggle(user.id, user.is_following)}
                                        >
                                            {user.is_following ? 'Unfollow' : 'Follow'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>    
    );
};

export default Profile;