import React, { useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode'; // Ensure jwt-decode is installed
import './Gallery.css'; // Make sure this file exists with proper styles
import { useNavigate, useLocation } from 'react-router-dom';
import { ReactComponent as LikeIcon } from '../assets/icons/like.svg';
import { ReactComponent as CommentIcon } from '../assets/icons/comment.svg';
import { ReactComponent as ShareIcon } from '../assets/icons/share.svg';
import { ReactComponent as BookmarkIcon } from '../assets/icons/bookmark.svg';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { getImageUrl } from '../utils/imageUtils';
import { artisticLoras, realisticLoras } from '../components/LoraSelector';
import ImageModal from '../components/ImageModal';

const Gallery = () => {
    const { user, profile } = useAuth();
    const { fetchUserProfile } = useProfile();
    const [images, setImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null); // Rename this from modalImage
    const [activeImageId, setActiveImageId] = useState(null);
    const [likes, setLikes] = useState({});
    const [comments, setComments] = useState({});
    const [commentInput, setCommentInput] = useState('');
    const [userLikedImages, setUserLikedImages] = useState(new Set());
    const [isAdmin, setIsAdmin] = useState(false);
    const [username, setUsername] = useState(''); // For storing the username from the token
    const [commentLikes, setCommentLikes] = useState({});
    const [modalOpen, setModalOpen] = useState(false); // Add modalOpen state
    const [imageUserDetails, setImageUserDetails] = useState({});
    const navigate = useNavigate();
    const location = useLocation();
    const gridRef = useRef(null);
    const [columns, setColumns] = useState(4);
    const [sortType, setSortType] = useState('newest');
    const [timeRange, setTimeRange] = useState('week');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedAspectRatio, setSelectedAspectRatio] = useState('all'); // Add this
    const [userLikedComments, setUserLikedComments] = useState(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedImages, setSelectedImages] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loadingRef = useRef(null);
    const fetchingRef = useRef(false);

    // Add new state for global counts
    const [globalLikeCounts, setGlobalLikeCounts] = useState({});
    const [globalCommentCounts, setGlobalCommentCounts] = useState({});

    // Add new state
    const [isFollowing, setIsFollowing] = useState(false);

    // Add at the top of component
    const currentRequestRef = useRef(null);

    // First, add a profileLoaded ref to track if we've already loaded the profile
    const profileLoaded = useRef(false);

    // Replace the problematic useEffect with:
    useEffect(() => {
        const loadProfile = async () => {
            if (profileLoaded.current) return; // Skip if already loaded
            
            const token = localStorage.getItem('token');
            if (user && token && !profile) {
                try {
                    profileLoaded.current = true; // Mark as loaded before fetch
                    await fetchUserProfile(token);
                } catch (error) {
                    console.error('Error fetching profile:', error);
                    profileLoaded.current = false; // Reset on error
                }
            }
        };

        loadProfile();
    }, []); // Empty dependency array since we're using refs

    useEffect(() => {
        const fetchImagesAndCheckAuth = async () => {
            const token = localStorage.getItem('token');
            
            // Check auth status first
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    console.log('Decoded token:', decoded);
                    setIsAdmin(decoded.role === 'admin');
                    setUsername(decoded.username);
                } catch (error) {
                    console.error('Token decode error:', error);
                    setIsAdmin(false);
                }
            }
    
            // Fetch images with auth header if token exists
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/images`, {                    
                    headers: token ? {
                        'Authorization': `Bearer ${token}`
                    } : {}
                });
                const data = await response.json();
                console.log('Fetched images:', data.images?.length);
                setImages(data.images || []);
            } catch (error) {
                console.error('Error fetching images:', error);
                setImages([]);
            }
        };
    
        fetchImagesAndCheckAuth();
    }, []);

    // First, optimize the fetchImageDetails function
    // 1. Add image details cache
    const imageDetailsCache = useRef(new Map());

    // 2. Optimize fetchImageDetails with caching and parallel requests
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
                    user_id: imageData.user_id,
                    loras_used: imageData.loras_used  // Make sure loras_used is explicitly included
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
    
            if (!response.ok) {
                throw new Error(`Failed to ${isLiked ? 'unlike' : 'like'} image`);
            }
    
            const data = await response.json();
            
            // Update likes count
            setLikes(prev => ({
                ...prev,
                [imageId]: data.count
            }));
    
            // Toggle like status
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

                    // Fetch image details to update profiles
                fetchImageDetails(activeImageId);
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

    const handleDeleteImage = async (imageId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/images/${imageId}`, {                
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });
    
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete image');
            }
    
            setImages(prev => prev.filter(img => img.id !== imageId));
            closeModal();
        } catch (error) {
            console.error('Error deleting image:', error);
            alert(error.message);
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

    const navigateImage = async (direction) => {
        const currentIndex = images.findIndex(img => img.id === activeImageId);
        const nextIndex = direction === 1 ? currentIndex + 1 : currentIndex - 1;
    
        if (nextIndex >= 0 && nextIndex < images.length) {
            const nextImage = images[nextIndex];
            
            // Start the fetch first
            const loadingPromise = fetchImageDetails(nextImage.id);
            
            // Update the image state atomically
            await Promise.all([
                new Promise(resolve => {
                    setSelectedImage(nextImage.image_url);  // Use selectedImage instead of modalImage
                    setActiveImageId(nextImage.id);
                    navigate(`?id=${nextImage.id}`, { replace: true });
                    resolve();
                }),
                loadingPromise // Wait for fetch to complete
            ]);
        }
    };

    // Update the openModal function to use URL-based navigation
    const openModal = (image) => {
        // Set state for this modal instance
        setSelectedImage(image.image_url);
        setActiveImageId(image.id);
        setModalOpen(true);
        
        // Fetch data for this image
        fetchImageDetails(image.id);
        
        // Update URL without full page navigation
        navigate(`/image/${image.id}`, {
            state: { background: location },
            replace: true // Use replace to avoid cluttering history
        });
        
        // Add modal-open class to body
        document.body.classList.add('modal-open');
    };

    // Also update the closeModal function to handle URL navigation
    const closeModal = () => {
        // Set modalOpen to false - the ImageModal component 
        // will handle the animation and body class cleanup
        setModalOpen(false);
        
        // Go back to previous URL
        navigate(-1);
        
        // After animation completes, reset other states
        setTimeout(() => {
            setSelectedImage(null);
            setActiveImageId(null);
        }, 350);
    };

    // Add effect to watch image loading
    useEffect(() => {
        if (fetchingRef.current && images.length > 0) {
            fetchingRef.current = false;
        }
    }, [images.length]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedImage) return;
            switch(e.key) {
                case 'ArrowLeft':
                    navigateImage(-1);
                    break;
                case 'ArrowRight':
                    navigateImage(1);
                    break;
                case 'Escape':
                    closeModal();
                    break;
                default:
                    break;
            }
        };
    
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImage]);
    
    // Add this useEffect near your other effects
    useEffect(() => {
        // We'll let the ImageModal component handle the body styles
        // This is just a safety measure
        return () => {
            // Ensure scrolling is restored when component unmounts
        };
    }, []);

    // Add this utility function
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                return `${diffMinutes}m ago`;
            }
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    };
    
    const handleUsernameClick = (user_id) => {
        navigate(`/profile/${user_id}`);
    };

    // Add formatDate function
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const sortImages = (images, sortType, timeRange) => {
        // First filter by time range if needed
        let filteredImages = [...images];
        
        if (sortType === 'trending') {
            const timeRanges = {
                'day': 24 * 60 * 60 * 1000,
                'week': 7 * 24 * 60 * 60 * 1000,
                'month': 30 * 24 * 60 * 60 * 1000,
                'year': 365 * 24 * 60 * 60 * 1000
            };
            const cutoff = new Date(Date.now() - timeRanges[timeRange]);
            filteredImages = filteredImages.filter(img => new Date(img.created_at) > cutoff);
        }
    
        // Filter by category if selected
        if (selectedCategory !== 'all') {
            filteredImages = filteredImages.filter(img => 
                img.categories?.includes(selectedCategory)
            );
        }
    
        // Sort based on type
        switch(sortType) {
            case 'newest':
                return filteredImages.sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                );
            case 'mostLiked':
                return filteredImages.sort((a, b) => {
                    const aLikes = (likes[a.id] || 0);
                    const bLikes = (likes[b.id] || 0);
                    return bLikes - aLikes;
                });
            case 'mostCommented':
                return filteredImages.sort((a, b) => 
                    (comments[b.id]?.length || 0) - (comments[a.id]?.length || 0)
                );
                case 'trending':
                    return filteredImages.sort((a, b) => {
                        // Get likes and comments
                        const aLikes = (likes[a.id] || 0);
                        const bLikes = (likes[b.id] || 0);
                        const aComments = (comments[a.id]?.length || 0);
                        const bComments = (comments[b.id]?.length || 0);
                        
                        // Hours since post (minimum 1 hour)
                        const aHours = Math.max(1, (Date.now() - new Date(a.created_at)) / 3600000);
                        const bHours = Math.max(1, (Date.now() - new Date(b.created_at)) / 3600000);
                        
                        // Reddit-inspired algorithm with comments weighted 2x
                        const gravity = 1.8; // Higher = faster decay
                        const aScore = (aLikes + (aComments * 2)) / Math.pow(aHours, gravity);
                        const bScore = (bLikes + (bComments * 2)) / Math.pow(bHours, gravity);
                        
                        return bScore - aScore;
                    });
            default:
                return filteredImages;
        }
    };

    const createColumns = (images, columnCount) => {
        if (!Array.isArray(images) || images.length === 0) {
            return Array(columnCount).fill().map(() => []);
        }
    
        // Create Set of existing IDs to prevent duplicates
        const uniqueImages = [];
        const seenIds = new Set();
        
        images.forEach(img => {
            if (!seenIds.has(img.id)) {
                uniqueImages.push(img);
                seenIds.add(img.id);
            }
        });
    
        // Distribute unique images across columns
        const cols = Array(columnCount).fill().map(() => []);
        uniqueImages.forEach((image, index) => {
            cols[index % columnCount].push(image);
        });
    
        return cols;
    };

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const columnWidth = 250; // Base column width
            const containerWidth = width - 200; // Account for sidebar and margins
            const calculatedColumns = Math.floor(containerWidth / columnWidth);
            setColumns(Math.min(4, Math.max(1, calculatedColumns)));
        };
    
        window.addEventListener('resize', handleResize);
        handleResize();
    
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Add admin controls
    const handleBulkDelete = async () => {
        if (!isAdmin || selectedImages.size === 0) return;
        
        if (!window.confirm(`Delete ${selectedImages.size} images?`)) return;
    
        const token = localStorage.getItem('token');
        let failedDeletes = 0;
    
        try {
            // Delete images sequentially
            for (const imageId of selectedImages) {
                try {
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/images/${imageId}`, {                        
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
    
                    if (!response.ok) {
                        failedDeletes++;
                    }
                } catch (error) {
                    failedDeletes++;
                    console.error(`Failed to delete image ${imageId}:`, error);
                }
            }
    
            // Update UI
            setImages(prev => prev.filter(img => !selectedImages.has(img.id)));
            setSelectedImages(new Set());
            setSelectionMode(false);
    
            if (failedDeletes > 0) {
                alert(`Failed to delete ${failedDeletes} images`);
            }
        } catch (error) {
            console.error('Bulk delete error:', error);
            alert('Failed to delete images');
        }
    };

    const handleSelectAll = () => {
        const allImageIds = new Set(images.map(img => img.id));
        setSelectedImages(allImageIds);
    };

    // Add function to fetch all counts
    const fetchAllCounts = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/image_counts`, {                
                headers: token ? {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                } : {}
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setGlobalLikeCounts(data.likes || {});
            setGlobalCommentCounts(data.comments || {});
        } catch (error) {
            console.error('Failed to fetch counts:', error);
            setGlobalLikeCounts({});
            setGlobalCommentCounts({});
        }
    };

    // Define fetchImagesForPage function
    const fetchImagesForPage = async (pageNum) => {
        if (loading || fetchingRef.current) return;
        setLoading(true);
        fetchingRef.current = true;
        
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: pageNum,
                limit: 20,
                sortType: sortType,
                category: selectedCategory,
                aspectRatio: selectedAspectRatio, // Add this parameter
                hidePrivate: true // Add this parameter
            });

            console.log('Fetching images with params:', Object.fromEntries(params));

            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/images?${params}`,
                {
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Additional client-side filter to ensure no private images slip through
            const newImages = (data?.images || []).filter(img => !img.private);
            
            setImages(prev => 
                pageNum === 1 ? newImages : [...prev, ...newImages]
            );
            
            setHasMore(newImages.length > 0);
        } catch (error) {
            console.error('Error fetching images:', error);
            setError('Failed to load images');
            setImages(prev => pageNum === 1 ? [] : prev); // Keep existing images if not first page
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    };

// Add effect to fetch counts on mount
useEffect(() => {
    fetchAllCounts();
}, []);

    useEffect(() => {
        fetchImagesForPage(page);
    }, [page, sortType, timeRange, selectedCategory, selectedAspectRatio]);
    

    // Use single useEffect for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading && !fetchingRef.current) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 0.1 } // Ensures the element is fully visible
        );
    
        if (loadingRef.current) {
            observer.observe(loadingRef.current);
        }
    
        return () => {
            if (loadingRef.current) {
                observer.unobserve(loadingRef.current);
            }
        };
    }, [hasMore, loading, fetchingRef.current]);

    // Add effect to watch for page changes
    useEffect(() => {
        if (page > 1) {
            console.log('Page changed to:', page);
        }
    }, [page]);

    // Add follow toggle function
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
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    const handlePrivacyToggle = async (imageId) => {
        const token = localStorage.getItem('token');
        const currentImage = images.find(img => img.id === imageId);
        
        if (!currentImage || !token) return;
    
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/images/${imageId}/privacy`, {
                method: 'Post',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (response.ok) {
                const data = await response.json();
                // Update local state
                setImages(prevImages => prevImages.map(img => 
                    img.id === imageId ? { ...img, private: data.private } : img
                ));
            }
        } catch (error) {
            console.error('Error toggling privacy:', error);
        }
    };

    // Add a useEffect to monitor these values instead
    useEffect(() => {
        if (activeImageId && imageUserDetails[activeImageId]) {
            // Log only when values actually change
            console.log('Image details updated:', {
                imageId: activeImageId,
                userDetails: imageUserDetails[activeImageId],
                profilePicture: imageUserDetails[activeImageId]?.profile_picture
            });
        }
    }, [activeImageId, imageUserDetails]);

    // In Gallery.js, add new state
    const [availableCategories, setAvailableCategories] = useState([]);

    // Add function to fetch categories
const fetchCategories = async () => {
    try {
        console.log('Fetching categories...');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/categories`);
        if (response.ok) {
            const data = await response.json();
            console.log('Raw categories data:', data);
            setAvailableCategories(data);
            
            // Log the state after update
            setTimeout(() => {
                console.log('Available categories state:', availableCategories);
            }, 0);
        } else {
            console.error('Failed to fetch categories:', response.status);
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
};

// Update the useEffect to fetch categories on mount and when navigating back to Gallery
useEffect(() => {
    console.log('Gallery component mounted');
    fetchCategories();
    
    // Refresh categories periodically or after navigation
    const interval = setInterval(fetchCategories, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
}, []); // Empty dependency array since we only need it on mount/revisit

    // 3. Update modal render to use cached data
    const renderUserAvatar = (userId) => {
        const imageDetails = imageUserDetails[activeImageId];
        const profilePicUrl = imageDetails?.profile_picture;
    
        return (
            <img 
                src={profilePicUrl || '/default-avatar.png'}
                alt={imageDetails?.username || 'Profile'}
                className="user-avatar"
                onError={(e) => {
                    e.target.src = '/default-avatar.png';
                }}
                onClick={() => navigate(`/profile/${userId}`)}
            />
        );
    };

    // 4. Update comment rendering to use cached profiles
    const renderCommentAvatar = (comment) => {
        return (
            <img 
                src={comment.profile_picture || '/default-avatar.png'}
                alt={comment.username || 'User'}
                className="comment-avatar"
                onError={(e) => e.target.src = '/default-avatar.png'}
                onClick={() => navigate(`/profile/${comment.user_id}`)}
            />
        );
    };

    // Add function to organize images into columns
    const organizeIntoColumns = useCallback((imageList) => {
        const columns = [[], [], [], []]; // 4 columns
        imageList.forEach((image, index) => {
            columns[index % 4].push(image);
        });
        return columns;
    }, []);

    // Update useEffect to set columnImages when images change
    useEffect(() => {
        setColumnImages(organizeIntoColumns(images));
    }, [images, organizeIntoColumns]);

    const [columnImages, setColumnImages] = useState([]); // Add this state
    const [error, setError] = useState(null);

    // Add these functions after your existing state declarations
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
            setError('Failed to prepare image for editing');
        }
    };

    // These handlers need to reset the state and trigger a new fetch:

    // 1. Aspect Ratio change
    const handleAspectRatioChange = (value) => {
        setSelectedAspectRatio(value);
        setPage(1);
        setImages([]);
        setHasMore(true);
        setLoading(false);
        fetchingRef.current = false;
    };

    // 2. Category change 
    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        setPage(1);
        setImages([]);
        setHasMore(true);
        setLoading(false);
        fetchingRef.current = false;
    };

    // 3. Sort type change - your current handleSort function
    const handleSort = async (newSortType) => {
        setSortType(newSortType);
        setPage(1);
        setImages([]);
        setHasMore(true);
        setLoading(false);
        fetchingRef.current = false;
        await fetchAllCounts();
    };

    // Add this function at the component level
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

    // Add this state at the top of your component
    const [expandedPrompts, setExpandedPrompts] = useState(new Set());

    // Add this function to your component
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

    // Replace your current initCustomDropdowns function with this one
function initCustomDropdowns() {
    // Store references to all dropdown option containers
    const allOptionContainers = [];
    
    // First, create custom dropdowns
    document.querySelectorAll('.gallery-sort, .gallery-time-range, .gallery-aspect-ratio, .gallery-category').forEach(dropdown => {
        // Skip if already processed
        if (dropdown.style.display === 'none') return;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-dropdown-wrapper';
        
        // Create the selected display
        const selected = document.createElement('div');
        selected.className = 'custom-dropdown-selected';
        selected.textContent = dropdown.options[dropdown.selectedIndex].text;
        
        // Create the options container
        const options = document.createElement('div');
        options.className = 'custom-dropdown-options';
        allOptionContainers.push(options);
        
        // Hide the original select element but keep it in the DOM for form submission
        dropdown.style.display = 'none';
        
        // Add the new elements to the DOM
        Array.from(dropdown.options).forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'custom-dropdown-option';
            optionElement.textContent = option.text;
            optionElement.dataset.value = option.value;
            
            optionElement.addEventListener('click', () => {
                dropdown.value = option.value;
                dropdown.dispatchEvent(new Event('change', { bubbles: true }));
                selected.textContent = option.text;
                options.classList.remove('show');
            });
            
            options.appendChild(optionElement);
        });
        
        selected._clickHandler = (e) => {
            e.stopPropagation();
            
            // Close all other dropdowns first
            allOptionContainers.forEach(container => {
                if (container !== options && container.classList.contains('show')) {
                    container.classList.remove('show');
                }
            });
            
            // Toggle this dropdown
            options.classList.toggle('show');
        };
        
        selected.addEventListener('click', selected._clickHandler);
        
        wrapper.appendChild(selected);
        wrapper.appendChild(options);
        dropdown.parentNode.insertBefore(wrapper, dropdown);
    });
    
    // Close dropdown when clicking elsewhere
    document.removeEventListener('click', window._closeAllDropdowns);
    window._closeAllDropdowns = () => {
        allOptionContainers.forEach(container => {
            container.classList.remove('show');
        });
    };
    document.addEventListener('click', window._closeAllDropdowns);
}

// Also update your useEffect to guarantee removal of old dropdowns before creating new ones
useEffect(() => {
    document.querySelectorAll('.custom-dropdown-wrapper').forEach(wrapper => {
        wrapper.remove();
    });
    
    // Wait a bit for React to update the DOM
    setTimeout(() => {
        initCustomDropdowns();
    }, 100);
    
    return () => {
        // Clean up on unmount
        document.removeEventListener('click', window._closeAllDropdowns);
        document.querySelectorAll('.custom-dropdown-wrapper').forEach(wrapper => {
            wrapper.remove();
        });
    };
}, []); // Empty dependency array - only run once

    return (
        <div className="gallery-page">
            <div className="gallery-container">
                {error && <div className="error-message">{error}</div>}
                <>
                    <div className="gallery-controls">
                        <div className="gallery-filter-controls">
                            <select 
                                className="gallery-sort" 
                                value={sortType} 
                                onChange={(e) => handleSort(e.target.value)}
                            >
                                <option value="newest">Newest</option>
                                <option value="mostLiked">Most Liked</option>
                                <option value="mostCommented">Most Commented</option>
                                <option value="trending">Trending</option>
                            </select>
                            
                            <select 
                                className="gallery-time-range" 
                                value={timeRange} 
                                onChange={(e) => setTimeRange(e.target.value)}
                            >
                                <option value="day">24 Hours</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="year">This Year</option>
                            </select>
                            
                            <select 
                                className="gallery-aspect-ratio" 
                                value={selectedAspectRatio} 
                                onChange={(e) => handleAspectRatioChange(e.target.value)}
                            >
                                <option value="all">All Orientations</option>
                                <option value="landscape">Landscape</option>
                                <option value="portrait">Portrait</option>
                                <option value="square">Square</option>
                            </select>

                            <select 
                                className="gallery-category" 
                                value={selectedCategory} 
                                onChange={(e) => handleCategoryChange(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                {availableCategories.map(cat => (
                                    <option key={cat.category} value={cat.category}>
                                        {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)} ({cat.count})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {isAdmin && (
                            <div className="admin-controls">
                                <div className="admin-controls-primary">
                                    <button 
                                        className="admin-button"
                                        onClick={() => setSelectionMode(!selectionMode)}
                                        disabled={loading}
                                    >
                                        {selectionMode ? 'Cancel Selection' : 'Select Images'}
                                    </button>
                                </div>
                                {selectionMode && (
                                    <div className="admin-controls-secondary">
                                        <button 
                                            onClick={handleSelectAll}
                                            className="admin-button"
                                        >
                                            Select All
                                        </button>
                                        <button 
                                            onClick={handleBulkDelete}
                                            className="admin-button delete"
                                            disabled={selectedImages.size === 0}
                                        >
                                            Delete Selected ({selectedImages.size})
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <h2 className="gallery-heading"></h2>
                    <div className="gallery-grid" ref={gridRef}>
                        {createColumns(images, columns).map((col, colIndex) => (
                            <div key={colIndex} className="gallery-column">
                                {col.map((image) => (
                                    <div key={image.id} className="gallery-item">
                                        {selectionMode && isAdmin && (
                                            <input
                                                type="checkbox"
                                                className="image-checkbox"
                                                checked={selectedImages.has(image.id)}
                                                onChange={(e) => {
                                                    const newSelected = new Set(selectedImages);
                                                    if (e.target.checked) {
                                                        newSelected.add(image.id);
                                                    } else {
                                                        newSelected.delete(image.id);
                                                    }
                                                    setSelectedImages(newSelected);
                                                }}
                                            />
                                        )}
                                        <img 
                                            className="gallery-thumbnail" 
                                            src={image.image_url} 
                                            alt={image.prompt}
                                            onClick={() => !selectionMode && openModal(image)}
                                            onError={(e) => {
                                                if (!e.target.dataset.retried) {
                                                    e.target.dataset.retried = true;
                                                    // Give a small delay before retry
                                                    setTimeout(() => {
                                                        e.target.src = image.image_url;
                                                    }, 500);
                                                }
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    <ImageModal
                        isOpen={modalOpen}
                        onClose={closeModal}
                        modalImage={selectedImage}
                        activeImageId={activeImageId}
                        images={images}
                        user={user}
                        navigateImage={(direction) => navigateImage(direction === 'prev' ? -1 : 1)}
                        canDelete={isAdmin}
                        isAdmin={isAdmin}
                        isOwnProfile={false}
                        activeTab="gallery"
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
                        handleImageEdit={handleImageEdit}
                        togglePrompt={(id) => togglePrompt(id)}
                        expandedPrompts={expandedPrompts}
                        commentInput={commentInput}
                        setCommentInput={setCommentInput}
                        formatTimestamp={formatTimestamp}
                        formatDate={formatDate}
                        getLoraName={getLoraName}
                    />

                    {hasMore && <div ref={loadingRef} style={{ height: '20px' }} />}
                    {loading && <div>Loading more images...</div>}
                </>
            </div>
        </div>
    );
};

export default Gallery;