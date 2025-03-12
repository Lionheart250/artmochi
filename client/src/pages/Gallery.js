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
import { customHistory } from '../utils/CustomHistory';
import LazyImage from '../components/LazyImage'; // Ensure LazyImage component is imported


const Gallery = () => {
    const { user, profile } = useAuth();
    const { fetchUserProfile } = useProfile();
    const [images, setImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null); 
    const [activeImageId, setActiveImageId] = useState(null);
    const [likes, setLikes] = useState({});
    const [comments, setComments] = useState({});
    const [commentInput, setCommentInput] = useState('');
    const [userLikedImages, setUserLikedImages] = useState(new Set());
    const [isAdmin, setIsAdmin] = useState(false);
    const [username, setUsername] = useState('');
    const [commentLikes, setCommentLikes] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [imageUserDetails, setImageUserDetails] = useState({});
    const navigate = useNavigate();
    const location = useLocation();
    const gridRef = useRef(null);
    const [columns, setColumns] = useState(4);
    const [sortType, setSortType] = useState('newest');
    const [timeRange, setTimeRange] = useState('week');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedAspectRatio, setSelectedAspectRatio] = useState('all'); 
    const [userLikedComments, setUserLikedComments] = useState(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedImages, setSelectedImages] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loadingRef = useRef(null);
    const fetchingRef = useRef(false);
    const [globalLikeCounts, setGlobalLikeCounts] = useState({});
    const [globalCommentCounts, setGlobalCommentCounts] = useState({});
    const [isFollowing, setIsFollowing] = useState(false);
    const currentRequestRef = useRef(null);
    const profileLoaded = useRef(false);
    const imageDetailsCache = useRef(new Map());
    const [columnImages, setColumnImages] = useState([]);
    const [error, setError] = useState(null);
    const [expandedPrompts, setExpandedPrompts] = useState(new Set());
    const [availableCategories, setAvailableCategories] = useState([]);
    const [imagesLoading, setImagesLoading] = useState(0);
    const [scrollLock, setScrollLock] = useState(false);
    const [hidingColumns, setHidingColumns] = useState(false);
    const [forceRerender, setForceRerender] = useState(0);
    const lastScrollPosition = useRef(0);
    const [pageHistory, setPageHistory] = useState([1]);
    const [galleryState, setGalleryState] = useState(null);

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

    const navigateImage = (direction, specificId = null) => {
        if (!images.length) return;
        
        // Set the internal navigation flag to tell the system this is an intentional image navigation
        window.__internalImageNavigation = true;
        
        let newIndex;
        
        if (specificId) {
          // Navigate to a specific image
          newIndex = images.findIndex(img => img.id === specificId);
          if (newIndex === -1) return; // Image not found
        } else {
          // Find current index
          const currentIndex = images.findIndex(img => img.id === activeImageId);
          if (currentIndex === -1) return; // Current image not found
          
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
        
        // Update URL using PUSH (not replace) to create proper browser history
        const newUrl = `/image/${images[newIndex].id}`;
        customHistory.push(newUrl, { 
          background: location,
          fromGallery: true
        });
        
        // Fetch details for the new image if needed
        if (typeof fetchImageDetails === 'function') {
          fetchImageDetails(images[newIndex].id);
        }
    };

    // Updated openModal that captures complete view state
    const openModal = (image) => {
        // Save full gallery state before opening modal
        const stateToSave = {
            page: page,
            scrollPosition: window.scrollY,
            sortType: sortType,
            timeRange: timeRange,
            selectedCategory: selectedCategory,
            selectedAspectRatio: selectedAspectRatio
        };
        sessionStorage.setItem('galleryState', JSON.stringify(stateToSave));
        
        setSelectedImage(image.image_url);
        setActiveImageId(image.id);
        setModalOpen(true);
        
        // Fetch data for this image
        fetchImageDetails(image.id);
        
        // Update URL using customHistory for proper back button support
        const newUrl = `/image/${image.id}`;
        customHistory.push(newUrl, { 
            background: location,
            fromGallery: true
        });
        
        // Add modal-open class to body
        document.body.classList.add('modal-open');
    };

    // Update your closeModal function:

const closeModal = () => {
    // Get saved state from sessionStorage
    const savedState = JSON.parse(sessionStorage.getItem('galleryState'));
    
    if (!savedState || typeof savedState.scrollPosition !== 'number') {
        console.error('Missing valid gallery state - cannot restore position');
        setModalOpen(false);
        document.body.classList.remove('modal-open');
        setSelectedImage(null);
        setActiveImageId(null);
        return;
    }
    
    const scrollPos = savedState.scrollPosition;
    console.log('Restoring to position:', scrollPos);
    
    // CRITICAL: Completely disable history functions temporarily
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    // Override history methods to prevent any navigation
    window.history.pushState = function() { return; };
    window.history.replaceState = function() { return; };
    
    // Create opacity transition overlay FIRST
    const blackOverlay = document.createElement('div');
    blackOverlay.className = 'modal-transition-overlay';
    blackOverlay.style.position = 'fixed';
    blackOverlay.style.top = '0';
    blackOverlay.style.left = '0';
    blackOverlay.style.width = '100%';
    blackOverlay.style.height = '100%';
    blackOverlay.style.backgroundColor = 'black';
    blackOverlay.style.zIndex = '9999';
    blackOverlay.style.opacity = '1';
    document.body.insertBefore(blackOverlay, document.body.firstChild);
    
    // WAIT FOR THE OVERLAY TO BE VISIBLE before closing modal
    setTimeout(() => {
        // NOW close the modal (after overlay is visible)
        setModalOpen(false);
        document.body.classList.remove('modal-open');
        setSelectedImage(null);
        setActiveImageId(null);
        
        // After another tiny delay to allow state updates to complete:
        setTimeout(() => {
            // Force scroll position first
            window.scrollTo(0, scrollPos);
            
            // Restore history functions but still prevent navigation
            window.history.pushState = originalPushState;
            window.history.replaceState = originalReplaceState;
            
            // Only NOW update the URL, after scroll position is set
            window.history.replaceState(null, '', '/gallery');
            
            // Wait a moment, then fade out overlay
            setTimeout(() => {
                blackOverlay.style.transition = 'opacity 300ms ease';
                blackOverlay.style.opacity = '0';
                
                // Remove overlay after fade completes
                setTimeout(() => {
                    blackOverlay.remove();
                }, 300);
            }, 50);
        }, 10);
    }, 20); // Small delay to ensure overlay is visible first
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
                    // Set internal navigation flag before navigating
                    window.__internalImageNavigation = true;
                    navigateImage(-1);
                    break;
                case 'ArrowRight':
                    // Set internal navigation flag before navigating
                    window.__internalImageNavigation = true;
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
        if (!images || images.length === 0) {
            return Array(columnCount).fill().map(() => []);
        }
        
        // Initialize empty columns array
        const cols = Array(columnCount).fill().map(() => []);
        
        // SIMPLE SEQUENTIAL DISTRIBUTION - WITHOUT TRIMMING REMAINDERS
        images.forEach((image, index) => {
            // Calculate column index by simple modulo (remainder)
            const columnIndex = index % columnCount;
            // Add image to corresponding column
            cols[columnIndex].push(image);
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

    useEffect(() => {
        fetchAllCounts();
    }, []);

    useEffect(() => {
        fetchImagesForPage(page);
    }, [page, sortType, timeRange, selectedCategory, selectedAspectRatio]);

    // 1. Image loading handlers with proper logging
    const handleImageLoadStart = () => {
        setImagesLoading(prev => {
            const newCount = prev + 1;
            console.log("Image load started, total loading:", newCount);
            return newCount;
        });
    };

    const handleImageLoadComplete = () => {
        setImagesLoading(prev => {
            const newCount = Math.max(0, prev - 1);
            console.log("Image load completed, remaining:", newCount);
            return newCount;
        });
    };

    // Replace your fetchImagesForPage function with this one:

    const fetchImagesForPage = async (pageNum) => {
        if (loading || fetchingRef.current) return;
        setLoading(true);
        fetchingRef.current = true;
        
        // Track that we've loaded this page
        if (!pageHistory.includes(pageNum)) {
            setPageHistory(prev => [...prev, pageNum]);
        }
        
        // Instead of hiding the entire gallery, just add a loading state
        if (pageNum > 1) {
            // Add a loading indicator at the bottom of the gallery
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'gallery-bottom-loader';
            loadingIndicator.innerHTML = '<div class="spinner"></div><div>Loading more images...</div>';
            gridRef.current?.appendChild(loadingIndicator);
        }
        
        try {
            const token = localStorage.getItem('token');
            
            // Capture the current column count
            const currentColumnCount = columns;
            
            // Calculate request size based on columns
            const IMAGES_PER_COLUMN = 4; // Each column gets this many new images
            const batchSize = currentColumnCount * IMAGES_PER_COLUMN;
            
            const params = new URLSearchParams({
                page: pageNum,
                limit: batchSize,
                sortType: sortType,
                category: selectedCategory,
                aspectRatio: selectedAspectRatio,
                hidePrivate: true
            });

            console.log(`Fetching ${batchSize} images for ${currentColumnCount} columns`);

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
            const newImages = (data?.images || []).filter(img => !img.private);
            
            // Reset imagesLoading counter for new images
            setImagesLoading(0);
            
            setImages(prev => {
                const allImages = pageNum === 1 ? [...newImages] : [...prev, ...newImages];
                
                // Don't trim the remainder at all - keep ALL images
                // This ensures we show everything, even if it's not divisible by column count
                return allImages;
            });
            
            // Update hasMore logic to be more accurate:
            // If we got fewer images than requested, we've reached the end
            setHasMore(newImages.length > 0 && newImages.length >= batchSize);
            
            // Force a rerender after a delay
            setTimeout(() => {
                setForceRerender(prev => prev + 1);
            }, 100);
            
            // If this was the last page to restore, handle scroll restoration
            const storedState = galleryState;
            if (storedState && pageNum === storedState.page) {
                setTimeout(() => {
                    window.scrollTo(0, storedState.scrollPosition);
                    // Clear stored state now that we've used it
                    setGalleryState(null);
                }, 100);
            }
            
        } catch (error) {
            console.error('Error fetching images:', error);
            setError('Failed to load images');
        } finally {
            setLoading(false);
            fetchingRef.current = false;
            
            // Clean up loading indicators
            setTimeout(() => {
                document.querySelectorAll('.gallery-bottom-loader').forEach(el => el.remove());
                document.querySelectorAll('.loading-indicator').forEach(el => el.remove());
                setHidingColumns(false);
                setScrollLock(false);
                document.body.classList.remove('loading-images');
            }, 300);
        }
    };

    // Replace your Intersection Observer with this scroll-based approach
    useEffect(() => {
        // More reliable scroll-based loading that doesn't depend on observers
        const handleScroll = () => {
            // Don't check if already loading or no more content
            if (!hasMore || loading || fetchingRef.current) return;
    
            // Get scroll position
            const scrollY = window.scrollY;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = window.innerHeight;
            
            // Check if we're near the bottom (within 1000px)
            const isNearBottom = scrollY + clientHeight > scrollHeight - 1000;
            
            // Check if we're scrolling down (not up)
            const isScrollingDown = scrollY > lastScrollPosition.current;
            
            // Update last scroll position
            lastScrollPosition.current = scrollY;
            
            // If we're near the bottom and scrolling down, load more
            if (isNearBottom && isScrollingDown) {
                console.log("🔄 Scroll triggered load, position:", 
                    Math.round(scrollY), "/", Math.round(scrollHeight - clientHeight));
                setPage(prev => prev + 1);
            }
        };
        
        // Add scroll throttling to prevent excessive checks
        let scrollTimeout = null;
        const throttledScroll = () => {
            if (scrollTimeout === null) {
                scrollTimeout = setTimeout(() => {
                    handleScroll();
                    scrollTimeout = null;
                }, 200);
            }
        };
        
        window.addEventListener('scroll', throttledScroll);
    
        // Also check on load and resize
        handleScroll();
        window.addEventListener('resize', handleScroll);
        
        return () => {
            window.removeEventListener('scroll', throttledScroll);
            window.removeEventListener('resize', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, [hasMore, loading, page]);

    // Add a cleanup effect that will make sure to finish any pending loads
    // on component unmount or when changing sort/filter
    useEffect(() => {
        return () => {
            // If there are any loading indicators left, clean them up
            document.querySelectorAll('.loading-indicator').forEach(el => el.remove());
        };
    }, []);

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

// Add this useEffect to throttle loads and ensure sequential batch completion
useEffect(() => {
    // Set a flag when all images in current batch are loaded
    if (imagesLoading === 0 && !loading && !fetchingRef.current && images.length > 0) {
        // Reset hiding flag when loading completes
        document.querySelectorAll('.gallery-column').forEach(col => {
            col.style.visibility = 'visible';
        });
    }
}, [imagesLoading, loading, images.length]);


    // Add this function to estimate height when not available in your data
    const getEstimatedHeight = (image) => {
        // If you have width and aspect ratio info
        if (image.width && image.aspect_ratio) {
            return image.width * image.aspect_ratio;
        }
        
        // Based on common aspect ratios
        if (image.orientation === 'portrait') return 500;
        if (image.orientation === 'landscape') return 300;
        return 400; // Default for square or unknown
    };

    const loadMoreImages = () => {
        if (hasMore && !loading && !fetchingRef.current && imagesLoading === 0) {
            console.log("Loading more images from modal navigation");
            setPage(prev => prev + 1);
        }
    };

    // KKKEEEEEEEP TTTTHHHHHIIIIIIISSSSSSSSSS
    useEffect(() => {
    // Try to restore previous gallery state
        const savedState = sessionStorage.getItem('galleryState');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                // Restore page number
                setPage(parsed.page);
                // Set flag to indicate we're restoring state
                setGalleryState(parsed);
            } catch (e) {
                console.error('Failed to parse saved gallery state:', e);
                sessionStorage.removeItem('galleryState');
            }
        }
        
        // Set up cleanup function to save state on unmount
        return () => {
            const stateToSave = {
                page: page,
                scrollPosition: window.scrollY,
                sortType: sortType,
                timeRange: timeRange,
                selectedCategory: selectedCategory,
                selectedAspectRatio: selectedAspectRatio
            };
            sessionStorage.setItem('galleryState', JSON.stringify(stateToSave));
        };
    }, []); // Empty dependencies to run only on mount/unmount

    // Add a useEffect that watches page changes to load multiple pages if needed
    useEffect(() => {
        // Get saved state
        const storedState = galleryState;
        
        // If we have saved state and we're on page 1 but need to load more pages
        if (storedState && page === 1 && storedState.page > 1) {
            // Load pages 2 through storedState.page sequentially
            const loadNextPage = (pageToLoad) => {
                if (pageToLoad <= storedState.page) {
                    setPage(pageToLoad);
                }
            };
            
            // Start loading from page 2
            loadNextPage(2);
        }
    }, [galleryState, page]);

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
                                {col.map((image, imageIndex) => (
                                    // Use a combination of column index, image index and image id to ensure uniqueness
                                    <div key={`col${colIndex}-${image.id}-${imageIndex}`} className="gallery-item">
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
                                        
                                        <LazyImage
                                            src={image.image_url}
                                            alt={image.prompt || 'Gallery image'}
                                            className="gallery-thumbnail"
                                            onClick={() => !selectionMode && openModal(image)}
                                            onLoadComplete={() => handleImageLoadComplete(colIndex)}
                                            onLoadStart={() => handleImageLoadStart(colIndex)}
                                            columnIndex={colIndex}
                                        />
                                        
                                        {/* Rest of your item rendering code */}
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
                        loadMoreImages={loadMoreImages}
                        loadThreshold={5}
                    />

                    {hasMore && <div ref={loadingRef} style={{ height: '200px' }} />}
                    {loading && <div>Loading more images...</div>}
                </>
            </div>
        </div>
    );
};

export default Gallery;