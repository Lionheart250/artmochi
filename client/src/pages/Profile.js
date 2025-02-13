import React, { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode'; // Ensure jwt-decode is installed
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import debounce from 'lodash.debounce';
import { getImageUrl } from '../utils/imageUtils';

import './Profile.css';
import { ReactComponent as LikeIcon } from '../assets/icons/like.svg';
import { ReactComponent as CommentIcon } from '../assets/icons/comment.svg';
import { ReactComponent as ShareIcon } from '../assets/icons/share.svg';
import { ReactComponent as BookmarkIcon } from '../assets/icons/bookmark.svg';

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
        const token = localStorage.getItem('token');
        if (!token) return;

        setImageDetailsLoading(true);
        try {
            // First get image details
            const imageDetailsResponse = await fetch(`${process.env.REACT_APP_API_URL}/images/${imageId}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            const imageData = await imageDetailsResponse.json();
            
            // Get the user's profile data
            const userProfileResponse = await fetch(`${process.env.REACT_APP_API_URL}/user_profile/${imageData.user_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const userProfileData = await userProfileResponse.json();

            setImageUserDetails(prev => ({
                ...prev,
                [imageId]: {
                    ...imageData,
                    username: userProfileData.username,
                    profile_picture: userProfileData.profile_picture
                }
            }));

            // Fetch comments with profile pictures
            const commentsResponse = await fetch(`${process.env.REACT_APP_API_URL}/fetch_comments?id=${imageId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (commentsResponse.ok) {
                const commentsData = await commentsResponse.json();
                
                // Fetch profile data for each comment author
                const commentUserProfiles = await Promise.all(
                    commentsData.comments.map(comment => 
                        fetch(`${process.env.REACT_APP_API_URL}/user_profile/${comment.user_id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }).then(res => res.json())
                    )
                );

                // Combine comment data with profile data
                const commentsWithProfiles = commentsData.comments.map((comment, index) => ({
                    ...comment,
                    profile_picture: commentUserProfiles[index].profile_picture
                }));

                setComments(prev => ({
                    ...prev,
                    [imageId]: commentsWithProfiles
                }));
            }

        } catch (error) {
            console.error('Error fetching image details:', error);
        } finally {
            setImageDetailsLoading(false);
        }
    };

    // Add debug logs
    useEffect(() => {
        console.log('Modal state:', { modalOpen, modalImage, activeImageId });
    }, [modalOpen, modalImage, activeImageId]);

    useEffect(() => {
        // Fetch user bio and posts
        fetchUserProfile();
    }, [id]);

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

    useEffect(() => {
        const fetchUserImages = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_URL}/user_images/${id}`, {                    
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const data = await response.json();
                console.log("Fetched user images data:", data);
                
                // Create imageUserDetails and initialize comment likes
                const details = {};
                const newCommentLikes = {};
                const userLikedCommentsSet = new Set();

                data.images.forEach(img => {
                    details[img.id] = {
                        username: img.username,
                        profile_picture: img.profile_picture,
                        user_id: img.user_id
                    };
                    
                    // Add comment likes data
                    if (img.comment_likes) {
                        newCommentLikes[img.id] = img.comment_likes;
                    }
                    if (img.user_liked_comments) {
                        img.user_liked_comments.forEach(commentId => 
                            userLikedCommentsSet.add(commentId)
                        );
                    }
                });

                setImageUserDetails(details);
                setImages(data.images);
                setCommentLikes(newCommentLikes);
                setUserLikedComments(userLikedCommentsSet);
            } catch (error) {
                console.error('Error fetching images:', error);
            }
        };

        fetchUserImages();
    }, [id]); // Add id as dependency to re-fetch when URL changes

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
            if (!token) return;
        
            try {
                const decoded = jwtDecode(token);
                const userId = decoded.userId;
        
                // Post the new comment
                const response = await fetch(`${process.env.REACT_APP_API_URL}/add_comment`, {                    
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ userId, imageId: activeImageId, comment: commentInput }),
                });
        
                if (response.ok) {
                    // After adding the comment, fetch all comments again
                    const commentsResponse = await fetch(`${process.env.REACT_APP_API_URL}/fetch_comments?id=${activeImageId}`, {                        
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
        
                    if (commentsResponse.ok) {
                        const commentsData = await commentsResponse.json();
                        // Update comments state with the latest comments
                        setComments((prev) => ({
                            ...prev,
                            [activeImageId]: commentsData.comments, // Use the fetched comments
                        }));
                        setCommentInput(''); // Clear the comment input
                    } else {
                        console.error('Error fetching comments:', await commentsResponse.json());
                    }
                } else {
                    console.error('Error adding comment:', await response.json());
                }
            } catch (error) {
                console.error('Error adding comment:', error);
            }
        };

    const closeModal = () => {
        setModalOpen(false);
        setModalImage(null);
        setActiveImageId(null);
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
            setModalImage(image);
            setActiveImageId(image.id);
            setModalOpen(true);
            await fetchImageDetails(image.id);
        } catch (error) {
            console.error('Error fetching image details:', error);
        }
    };

    const navigateImage = async (direction) => {
        const currentImages = activeTab === 'likes' ? likedImages : images;
        const currentIndex = currentImages.findIndex(img => img.id === activeImageId);
        
        let newIndex;
        if (direction === 'prev') {
            newIndex = currentIndex - 1 < 0 ? currentImages.length - 1 : currentIndex - 1;
        } else {
            newIndex = currentIndex + 1 >= currentImages.length ? 0 : currentIndex + 1;
        }
        
        const nextImage = currentImages[newIndex];
        if (nextImage) {
            try {
                setModalImage(nextImage);
                setActiveImageId(nextImage.id);
                await fetchImageDetails(nextImage.id);
            } catch (error) {
                console.error('Error fetching next image details:', error);
            }
        }
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
        
        const fetchUserProfile = async () => {
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

        fetchUserProfile();
        
        return () => {
            isMounted = false;
        };
    }, [id]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Please select a file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('profile_picture', file);

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/upload_profile_picture`, {                
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Profile picture updated:', data);
            setMessage('Profile picture updated successfully.');

            // Re-fetch the profile picture
            await fetchProfilePicture();
        } catch (error) {
            console.error('Error updating profile picture:', error);
            setMessage('Failed to update profile picture.');
        }
    };

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

    const fetchLikedImagesWithDetails = async () => {
        const token = localStorage.getItem('token');
        if (!token || !id) return;
        
        setIsLoadingLikes(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/user/${id}/likes`, {                
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            // Create user details object
            const details = {};
            data.images.forEach(img => {
                details[img.id] = {
                    username: img.username,
                    profile_picture: img.profile_picture,
                    user_id: img.user_id,
                    prompt: img.prompt // Add prompt to user details
                };
            });
            
            setImageUserDetails(prev => ({...prev, ...details}));
            setLikedImages(data.images);
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

    // Add useEffect to trigger fetch when activeImageId changes
    useEffect(() => {
        if (activeImageId) {
            fetchAllData(activeImageId);
        }
    }, [activeImageId]);

    // Add debug logging to fetchUserStats
    const fetchUserStats = async () => {
        const token = localStorage.getItem('token');
        if (!token || !id) return;
    
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/user/${id}/stats`, {                
                headers: { 'Authorization': `Bearer ${token}` }
            });
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
        fetchUserStats();
    }, [id]);
    

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
            const statsResponse = await fetch(`${process.env.REACT_APP_API_URL}/user/${targetUserId}/stats`, {                
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!statsResponse.ok) {
                throw new Error('Failed to fetch follow status');
            }
    
            const statsData = await statsResponse.json();
            
            const response = await fetch(`${process.env.REACT_APP_API_URL}/follow/${targetUserId}`, {                method: statsData.is_following ? 'DELETE' : 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (response.ok) {
                // After toggle, refetch all data as if navigating
                fetchImageDetails(activeImageId);
                fetchAllData(activeImageId);
            } else {
                throw new Error('Failed to toggle follow status');
            }
        } catch (error) {
            console.error('Follow toggle error:', error);
            await fetchUserStats();
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-header-wrapper">
                <div className="profile-header">
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
                    <div className="profile-info">
                        <div className="profile-top">
                            <h1 className="profile-username">{username}</h1>
                            {user && user.id === parseInt(id) && (
                                <button className="profile-edit-btn" onClick={() => setIsEditing(true)}>
                                    Edit Profile
                                </button>
                            )}
                        <div className="profile-actions">
                                {user && user.id !== parseInt(id) && (
                                    <button 
                                        className={`profile-follow-btn ${isFollowing ? 'following' : ''}`}
                                        onClick={handleFollowToggle}
                                    >
                                        {isFollowing ? 'Unfollow' : 'Follow'}
                                    </button>
                                )}
                        </div>
                        
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
                                <span className="stat-number">{likesCount}</span>
                                <span className="stat-label">Likes</span>
                            </div>
                        </div>
                        
                        <p className="profile-bio">{bio}</p>
                    </div>
                </div>
            </div>
        </div>

            {/* Add Tabs */}
            <div className="profile-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    Posts
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'likes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('likes')}
                >
                    Likes
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'tagged' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tagged')}
                >
                    Tagged
                </button>
            </div>

            {/* Keep existing grid */}
            {activeTab === 'posts' && (
                <div className="profile-grid">
                    {images.map((image) => (
                        <div 
                            key={image.id} 
                            className="profile-item"
                            onClick={() => openModal(image)}
                        >
                            <img src={image.image_url} alt={image.prompt} />
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'likes' && (
                <div className="profile-grid">
                    {isLoadingLikes ? (
                        <div className="loading-spinner">Loading...</div>
                    ) : (
                        likedImages.map((image) => (
                            <div 
                                key={image.id} 
                                className="profile-item"
                                onClick={() => openModal(image)}
                            >
                                <img src={image.image_url} alt={image.prompt} />
                            </div>
                        ))
                    )}
                </div>
            )}

            {modalImage && (
                <div className="profile-modal">
                    <div className="profile-modal-content">
                        <div className="profile-modal-main">
                            <div className="profile-modal-image-container">
                                <button className="profile-close-button" onClick={closeModal}>×</button>
                                <button 
                                    className="profile-modal-nav-left" 
                                    onClick={() => navigateImage('prev')}
                                >
                                    &lt;
                                </button>
                                <img className="profile-modal-image" src={modalImage.image_url} alt="Enlarged" />
                                {isAdmin && (
                                    <div className="profile-delete-section">
                                        <button className="profile-delete-button" onClick={handleDeleteImage}>
                                            Delete Image
                                        </button>
                                    </div>
                                )}
                                <button 
                                    className="profile-modal-nav-right" 
                                    onClick={() => navigateImage('next')}
                                >
                                    &gt;
                                </button>
                            </div>
                            <div className="profile-modal-info">
                                <div className="profile-user-info">
                                    <img 
                                        src={imageUserDetails[activeImageId]?.profile_picture || '/default-avatar.png'} 
                                        alt={imageUserDetails[activeImageId]?.username || 'Profile'}
                                        className="profile-user-avatar"
                                        onError={(e) => {
                                            if (!imageUserDetails[activeImageId]?.profile_picture) {
                                                fetchImageDetails(activeImageId);
                                            }
                                            e.target.src = '/default-avatar.png';
                                        }}
                                    />
                                    <div className="profile-user-details">
                                        <h4 onClick={() => navigate(`/profile/${imageUserDetails[activeImageId]?.user_id}`)}>
                                            {imageUserDetails[activeImageId]?.username}
                                        </h4>
                                        {user && user.id !== parseInt(imageUserDetails[activeImageId]?.user_id) && (
                                            <button 
                                                className={`profile-follow-btn ${isFollowing ? 'following' : ''}`}
                                                onClick={() => handleModalFollowToggle(imageUserDetails[activeImageId]?.user_id, isFollowing)}
                                            >
                                                {isFollowing ? 'Following' : 'Follow'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="profile-modal-title">
                                    {(activeTab === 'likes' ? likedImages : images).find(img => img.id === activeImageId)?.prompt}
                                </div>
                                <div className="profile-interaction-buttons">
                                    <button onClick={() => handleLike(activeImageId)} className="profile-action-btn">
                                        <LikeIcon className={userLikedImages.has(activeImageId) ? 'liked' : ''} />
                                        <span>{likes[activeImageId] || 0}</span>
                                    </button>
                                    <button className="profile-action-btn">
                                        <CommentIcon />
                                        <span>{comments[activeImageId]?.length || 0}</span>
                                    </button>
                                    <button className="profile-action-btn">
                                        <ShareIcon />
                                    </button>
                                    <button className="profile-action-btn">
                                        <BookmarkIcon />
                                    </button>
                                </div>
                                <div className="profile-comments-section">
                                    <h4 className="profile-comments-heading">Comments</h4>
                                    <ul className="profile-comments-list">
                                        {(comments[activeImageId] || []).map((comment) => (
                                            <li key={`comment-${comment.id}-${comment.created_at}`} className="profile-comment-item">
                                                <div className="profile-comment-avatar">
                                                    <img 
                                                        src={getImageUrl(comment.profile_picture, 'profile')} 
                                                        alt={comment.username}
                                                        onError={(e) => e.target.src = '/default-avatar.png'}
                                                    />
                                                </div>
                                                <div className="profile-comment-content">
                                                    <div className="profile-comment-header">
                                                        <span 
                                                            className="profile-comment-username"
                                                            onClick={() => handleUsernameClick(comment.user_id)}
                                                        >
                                                            {comment.username}
                                                        </span>
                                                        <span className="profile-comment-time">
                                                            {formatTimestamp(comment.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="profile-comment-text">{comment.comment}</p>
                                                    <div className="profile-comment-actions">
                                                        <button 
                                                            className="profile-comment-like-btn"
                                                            onClick={() => handleCommentLike(comment.id)}
                                                        >
                                                            ♥ {commentLikes[comment.id] || 0}
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    <form onSubmit={handleCommentSubmit} className="profile-comment-form">
                                        <input
                                            className="profile-comment-input"
                                            type="text"
                                            value={commentInput}
                                            onChange={(e) => setCommentInput(e.target.value)}
                                            placeholder="Add a comment..."
                                            required
                                        />
                                        <button type="submit" className="profile-comment-submit">Post</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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