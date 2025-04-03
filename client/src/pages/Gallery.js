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

    const cleanupDOM = useCallback(() => {
        console.log('Running DOM cleanup before navigation');
        
        document.querySelectorAll('.custom-dropdown-wrapper').forEach(wrapper => {
            if (wrapper && wrapper.parentNode) {
                try {
                    const selected = wrapper.querySelector('.custom-dropdown-selected');
                    if (selected && selected._clickHandler) {
                        selected.removeEventListener('click', selected._clickHandler);
                    }
                    wrapper.parentNode.removeChild(wrapper);
                } catch (e) {
                    console.error('Error removing dropdown:', e);
                }
            }
        });
        
        if (window._closeAllDropdowns) {
            document.removeEventListener('click', window._closeAllDropdowns);
            window._closeAllDropdowns = null;
        }
        
        document.querySelectorAll('.modal-transition-overlay').forEach(el => {
            if (el && el.parentNode) {
                try {
                    el.parentNode.removeChild(el);
                } catch (e) {
                    console.error('Error removing overlay:', e);
                }
            }
        });
        
        document.body.classList.remove('modal-open');
        window.__internalImageNavigation = false;
    }, []);
    
    useEffect(() => {
        window.__galleryCleanup = cleanupDOM;
        return () => {
            cleanupDOM();
            delete window.__galleryCleanup;
        };
    }, [cleanupDOM]);

    useEffect(() => {
        const loadProfile = async () => {
            if (profileLoaded.current) return;
            
            const token = localStorage.getItem('token');
            if (user && token && !profile) {
                try {
                    profileLoaded.current = true;
                    await fetchUserProfile(token);
                } catch (error) {
                    console.error('Error fetching profile:', error);
                    profileLoaded.current = false;
                }
            }
        };

        loadProfile();
    }, []);

    useEffect(() => {
        const fetchImagesAndCheckAuth = async () => {
            const token = localStorage.getItem('token');
            
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

    const fetchImageDetails = async (imageId) => {
        if (!imageId) return;
        const token = localStorage.getItem('token');
        
        try {
            const imageResponse = await fetch(`${process.env.REACT_APP_API_URL}/images/${imageId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const imageData = await imageResponse.json();
            
            const userProfileResponse = await fetch(`${process.env.REACT_APP_API_URL}/user_profile/${imageData.user_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const userProfileData = await userProfileResponse.json();

            setImageUserDetails(prev => ({
                ...prev,
                [imageId]: {
                    ...imageData,
                    username: userProfileData.username,
                    profile_picture: userProfileData.profile_picture,
                    user_id: imageData.user_id,
                    loras_used: imageData.loras_used
                }
            }));

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

            if (followStatusResponse.ok) {
                setIsFollowing(followStatus.is_following);
            }

            setLikes(prev => ({ ...prev, [imageId]: likesData.count }));

            if (commentsResponse.ok) {
                setComments(prev => ({
                    ...prev,
                    [imageId]: commentsData.comments || []
                }));
                
                if (commentsData.comments?.length > 0) {
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

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;
    
        try {
            const decoded = jwtDecode(token);
            const userId = decoded.userId;
    
            const response = await fetch(`${process.env.REACT_APP_API_URL}/add_comment`, {                
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId, imageId: activeImageId, comment: commentInput }),
            });
    
            if (response.ok) {
                const commentsResponse = await fetch(`${process.env.REACT_APP_API_URL}/fetch_comments?id=${activeImageId}`, {                    
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
    
                if (commentsResponse.ok) {
                    const commentsData = await commentsResponse.json();
                    setComments((prev) => ({
                        ...prev,
                        [activeImageId]: commentsData.comments,
                    }));
                    setCommentInput('');
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
    
            await fetchCommentLikeCount(commentId);
        } catch (error) {
            console.error('Error toggling comment like:', error);
        }
    };

    const navigateImage = (direction, specificId = null) => {
        if (!images.length) return;
        
        window.__internalImageNavigation = true;
        
        let newIndex;
        
        if (specificId) {
            newIndex = images.findIndex(img => img.id === specificId);
            if (newIndex === -1) return;
        } else {
            const currentIndex = images.findIndex(img => img.id === activeImageId);
            if (currentIndex === -1) return;
            
            if (direction === 'next' || direction === 1) {
                newIndex = (currentIndex + 1) % images.length;
            } else {
                newIndex = (currentIndex - 1 + images.length) % images.length;
            }
        }
        
        setActiveImageId(images[newIndex].id);
        setSelectedImage(images[newIndex].image_url);
        
        const newUrl = `/gallery/image/${images[newIndex].id}`;
        customHistory.replace(newUrl, { fromGallery: true }); 
        
        if (typeof fetchImageDetails === 'function') {
            fetchImageDetails(images[newIndex].id);
        }
    };

    const openModal = (image) => {
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
        
        fetchImageDetails(image.id);
        
        const newUrl = `/gallery/image/${image.id}`;
        customHistory.push(newUrl, { 
            background: location,
            fromGallery: true
        });
        
        document.body.classList.add('modal-open');
    };

    const closeModal = () => {
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
        
        const originalPushState = window.history.pushState;
        const originalReplaceState = window.history.replaceState;
        
        window.history.pushState = function() { return; };
        window.history.replaceState = function() { return; };
        
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
        
        setTimeout(() => {
            setModalOpen(false);
            document.body.classList.remove('modal-open');
            setSelectedImage(null);
            setActiveImageId(null);
            
            setTimeout(() => {
                window.scrollTo(0, scrollPos);
                
                window.history.pushState = originalPushState;
                window.history.replaceState = originalReplaceState;
                
                window.history.replaceState(null, '', '/gallery');
                
                setTimeout(() => {
                    blackOverlay.style.transition = 'opacity 300ms ease';
                    blackOverlay.style.opacity = '0';
                    
                    setTimeout(() => {
                        blackOverlay.remove();
                    }, 300);
                }, 50);
            }, 10);
        }, 20);
    };

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
                    window.__internalImageNavigation = true;
                    navigateImage(-1);
                    break;
                case 'ArrowRight':
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
    
    useEffect(() => {
        return () => {
        };
    }, []);

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
    
        if (selectedCategory !== 'all') {
            filteredImages = filteredImages.filter(img => 
                img.categories?.includes(selectedCategory)
            );
        }
    
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
                    const aLikes = (likes[a.id] || 0);
                    const bLikes = (likes[b.id] || 0);
                    const aComments = (comments[a.id]?.length || 0);
                    const bComments = (comments[b.id]?.length || 0);
                    
                    const aHours = Math.max(1, (Date.now() - new Date(a.created_at)) / 3600000);
                    const bHours = Math.max(1, (Date.now() - new Date(b.created_at)) / 3600000);
                    
                    const gravity = 1.8;
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
        
        const cols = Array(columnCount).fill().map(() => []);
        
        images.forEach((image, index) => {
            const columnIndex = index % columnCount;
            cols[columnIndex].push(image);
        });
        
        return cols;
    };

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const columnWidth = 250;
            const containerWidth = width - 200;
            const calculatedColumns = Math.floor(containerWidth / columnWidth);
            setColumns(Math.min(4, Math.max(1, calculatedColumns)));
        };
    
        window.addEventListener('resize', handleResize);
        handleResize();
    
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const handleBulkDelete = async () => {
        if (!isAdmin || selectedImages.size === 0) return;
        
        if (!window.confirm(`Delete ${selectedImages.size} images?`)) return;
    
        const token = localStorage.getItem('token');
        let failedDeletes = 0;
    
        try {
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

    const fetchImagesForPage = async (pageNum) => {
        if (loading || fetchingRef.current) return;
        
        setLoading(true);
        fetchingRef.current = true;
        
        console.log(`📥 Fetching page ${pageNum}`);
        
        try {
            const token = localStorage.getItem('token');
            
            const IMAGES_PER_COLUMN = 4; 
            const batchSize = columns * IMAGES_PER_COLUMN;
            
            const params = new URLSearchParams({
                page: pageNum,
                limit: batchSize,
                sortType: sortType,
                category: selectedCategory,
                aspectRatio: selectedAspectRatio,
                hidePrivate: true
            });

            console.log(`📊 Request params: Batch size=${batchSize}, Sort=${sortType}, Category=${selectedCategory}`);

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
            
            console.log(`📥 Received ${newImages.length} images for page ${pageNum}`);
            
            setImages(prev => {
                return pageNum === 1 ? [...newImages] : [...prev, ...newImages];
            });
            
            setHasMore(newImages.length > 0);
            
            setTimeout(() => {
                setForceRerender(prev => prev + 1);
            }, 100);
            
        } catch (error) {
            console.error('Error fetching images:', error);
            setError('Failed to load images');
        } finally {
            setLoading(false);
            fetchingRef.current = false;
            
            document.querySelectorAll('.gallery-bottom-loader').forEach(el => el.remove());
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const currentlyLoading = loading || fetchingRef.current;
            const needsMoreContent = hasMore && !currentlyLoading;
            
            if (!needsMoreContent) return;

            const scrollY = window.scrollY || window.pageYOffset;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            const distanceFromBottom = documentHeight - (scrollY + windowHeight);
            
            const isNearBottom = distanceFromBottom < 500;
            
            const isScrollingDown = scrollY > lastScrollPosition.current;
            
            lastScrollPosition.current = scrollY;
            
            if (isNearBottom) {
                console.log(`📊 Scroll position: ${Math.round(scrollY)}/${documentHeight}, 
                            Distance from bottom: ${Math.round(distanceFromBottom)}px, 
                            Loading: ${currentlyLoading}, Has more: ${hasMore}`);
            }
            
            if (isNearBottom && isScrollingDown && needsMoreContent) {
                console.log("🔄 Loading next page:", page + 1);
                setPage(prev => prev + 1);
            }
        };
        
        let scrollTimeout = null;
        const throttledScroll = () => {
            if (scrollTimeout === null) {
                scrollTimeout = setTimeout(() => {
                    handleScroll();
                    scrollTimeout = null;
                }, 150);
            }
        };
        
        window.addEventListener('scroll', throttledScroll);
        
        handleScroll();
        window.addEventListener('resize', handleScroll);
        
        const observer = new MutationObserver(() => {
            setTimeout(handleScroll, 100);
        });
        
        if (gridRef.current) {
            observer.observe(gridRef.current, { 
                childList: true, 
                subtree: true 
            });
        }
        
        return () => {
            window.removeEventListener('scroll', throttledScroll);
            window.removeEventListener('resize', handleScroll);
            observer.disconnect();
            clearTimeout(scrollTimeout);
        };
    }, [hasMore, loading, page, gridRef]);

    useEffect(() => {
        return () => {
            document.querySelectorAll('.loading-indicator').forEach(el => el.remove());
        };
    }, []);

    useEffect(() => {
        // Create an intersection observer to detect when we're near the bottom
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry && entry.isIntersecting && hasMore && !loading && !fetchingRef.current) {
                    console.log('Gallery: Loading next page', page + 1);
                    setPage(prevPage => prevPage + 1);
                }
            },
            { threshold: 0.1, rootMargin: '300px' }
        );
        
        // Observe the loading reference element
        const currentRef = loadingRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }
        
        // Clean up
        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [hasMore, loading, page]);

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
                setImages(prevImages => prevImages.map(img => 
                    img.id === imageId ? { ...img, private: data.private } : img
                ));
            }
        } catch (error) {
            console.error('Error toggling privacy:', error);
        }
    };

    useEffect(() => {
        if (activeImageId && imageUserDetails[activeImageId]) {
            console.log('Image details updated:', {
                imageId: activeImageId,
                userDetails: imageUserDetails[activeImageId],
                profilePicture: imageUserDetails[activeImageId]?.profile_picture
            });
        }
    }, [activeImageId, imageUserDetails]);

    const fetchCategories = async () => {
        try {
            console.log('Fetching categories...');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/categories`);
            if (response.ok) {
                const data = await response.json();
                console.log('Raw categories data:', data);
                setAvailableCategories(data);
                
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

    useEffect(() => {
        console.log('Gallery component mounted');
        fetchCategories();
        
        const interval = setInterval(fetchCategories, 30000);
        
        return () => clearInterval(interval);
    }, []);

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

    const organizeIntoColumns = useCallback((imageList) => {
        const columns = [[], [], [], []];
        imageList.forEach((image, index) => {
            columns[index % 4].push(image);
        });
        return columns;
    }, []);

    useEffect(() => {
        setColumnImages(organizeIntoColumns(images));
    }, [images, organizeIntoColumns]);

    const handleImageEdit = (type, image) => {
        try {
            const imageData = {
                url: image.image_url,
                prompt: image.prompt,
                mode: type === 'upscale' ? 'upscale' : 'generate',
                isImageToImage: type === 'remix'
            };

            closeModal();
            
            localStorage.setItem('editImageData', JSON.stringify(imageData));
            navigate('/imagegenerator');
        } catch (error) {
            console.error('Error preparing image for edit:', error);
            setError('Failed to prepare image for editing');
        }
    };

    const handleAspectRatioChange = (value) => {
        setSelectedAspectRatio(value);
        setPage(1);
        setImages([]);
        setHasMore(true);
        setLoading(false);
        fetchingRef.current = false;
    };

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        setPage(1);
        setImages([]);
        setHasMore(true);
        setLoading(false);
        fetchingRef.current = false;
    };

    const handleSort = async (newSortType) => {
        setSortType(newSortType);
        setPage(1);
        setImages([]);
        setHasMore(true);
        setLoading(false);
        fetchingRef.current = false;
        await fetchAllCounts();
    };

    const getLoraName = (url) => {
        const artisticLora = artisticLoras.find(lora => lora.url === url);
        if (artisticLora) return artisticLora.name;
        
        const realisticLora = realisticLoras.find(lora => lora.url === url);
        if (realisticLora) return realisticLora.name;
        
        return url.split(':')[1];
    };

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

    const initCustomDropdowns = () => {
        const allOptionContainers = [];
        
        document.querySelectorAll('.gallery-sort, .gallery-time-range, .gallery-aspect-ratio, .gallery-category').forEach(dropdown => {
            if (dropdown.style.display === 'none') return;
            
            const wrapper = document.createElement('div');
            wrapper.className = 'custom-dropdown-wrapper';
            
            const selected = document.createElement('div');
            selected.className = 'custom-dropdown-selected';
            selected.textContent = dropdown.options[dropdown.selectedIndex].text;
            
            const options = document.createElement('div');
            options.className = 'custom-dropdown-options';
            allOptionContainers.push(options);
            
            dropdown.style.display = 'none';
            
            Array.from(dropdown.options).forEach(option => {
                const optionElement = document.createElement('div');
                optionElement.className = 'custom-dropdown-option';
                optionElement.textContent = option.text;
                optionElement.dataset.value = option.value;
                
                optionElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.value = option.value;
                    dropdown.dispatchEvent(new Event('change', { bubbles: true }));
                    selected.textContent = option.text;
                    options.classList.remove('show');
                });
                
                options.appendChild(optionElement);
            });
            
            selected._clickHandler = (e) => {
                e.stopPropagation();
                
                allOptionContainers.forEach(container => {
                    if (container !== options && container.classList.contains('show')) {
                        container.classList.remove('show');
                    }
                });
                
                options.classList.toggle('show');
            };
            
            selected.addEventListener('click', selected._clickHandler);
            
            wrapper.appendChild(selected);
            wrapper.appendChild(options);
            dropdown.parentNode.insertBefore(wrapper, dropdown);
        });

        if (typeof window._closeAllDropdowns === 'function') {
            document.removeEventListener('click', window._closeAllDropdowns);
        }
        
        window._closeAllDropdowns = function(event) {
            const target = event.target;
            if (!target.closest('.custom-dropdown-wrapper')) {
                allOptionContainers.forEach(container => {
                    container.classList.remove('show');
                });
            }
        };
        
        document.addEventListener('click', window._closeAllDropdowns);
    };

    useEffect(() => {
        const closeDropdownsOnOutsideClick = (e) => {
            if (!e.target.closest('.custom-dropdown-wrapper')) {
                document.querySelectorAll('.custom-dropdown-options.show').forEach(dropdown => {
                    dropdown.classList.remove('show');
                });
            }
        };
      
        document.addEventListener('click', closeDropdownsOnOutsideClick);
        
        return () => {
            document.removeEventListener('click', closeDropdownsOnOutsideClick);
        };
    }, []);

    useEffect(() => {
        document.querySelectorAll('.custom-dropdown-wrapper').forEach(wrapper => {
            wrapper.remove();
        });
        
        setTimeout(() => {
            initCustomDropdowns();
        }, 20);
        
        return () => {
            document.removeEventListener('click', window._closeAllDropdowns);
            document.querySelectorAll('.custom-dropdown-wrapper').forEach(wrapper => {
                wrapper.remove();
            });
        };
    }, []);

    useEffect(() => {
        if (imagesLoading === 0 && !loading && !fetchingRef.current && images.length > 0) {
            document.querySelectorAll('.gallery-column').forEach(col => {
                col.style.visibility = 'visible';
            });
        }
    }, [imagesLoading, loading, images.length]);

    const getEstimatedHeight = (image) => {
        if (image.width && image.aspect_ratio) {
            return image.width * image.aspect_ratio;
        }
        
        if (image.orientation === 'portrait') return 500;
        if (image.orientation === 'landscape') return 300;
        return 400;
    };

    const loadMoreImages = () => {
        if (hasMore && !loading && !fetchingRef.current && imagesLoading === 0) {
            console.log("Loading more images from modal navigation");
            setPage(prev => prev + 1);
        }
    };

    useEffect(() => {
        const savedState = sessionStorage.getItem('galleryState');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                setPage(parsed.page);
                setGalleryState(parsed);
            } catch (e) {
                console.error('Failed to parse saved gallery state:', e);
                sessionStorage.removeItem('galleryState');
            }
        }
        
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
    }, []);

    useEffect(() => {
        const storedState = galleryState;
        
        if (storedState && page === 1 && storedState.page > 1) {
            const loadNextPage = (pageToLoad) => {
                if (pageToLoad <= storedState.page) {
                    setPage(pageToLoad);
                }
            };
            
            loadNextPage(2);
        }
    }, [galleryState, page]);

    const ImageLoader = {
        queue: [],
        activeLoads: 0,
        maxConcurrent: 4,
        priorityThreshold: 500,
        
        init() {
            this.queue = [];
            this.activeLoads = 0;
        },
        
        add(imageObj, priority = 0) {
            this.queue.push({ imageObj, priority });
            this.queue.sort((a, b) => a.priority - b.priority);
            this.processQueue();
        },
        
        processQueue() {
            if (this.activeLoads >= this.maxConcurrent || this.queue.length === 0) return;
            
            const { imageObj } = this.queue.shift();
            this.activeLoads++;
            
            const img = new Image();
            img.onload = img.onerror = () => {
                this.activeLoads--;
                this.processQueue();
            };
            img.src = imageObj.url;
        },
        
        prioritize(imageId) {
            const index = this.queue.findIndex(item => item.imageObj.id === imageId);
            if (index !== -1) {
                const item = this.queue[index];
                item.priority = -1;
                this.queue.splice(index, 1);
                this.queue.unshift(item);
            }
        }
    };
    
    useEffect(() => {
        ImageLoader.init();
    }, []);
    
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    const imageId = entry.target.dataset.imageId;
                    if (entry.isIntersecting) {
                        ImageLoader.prioritize(imageId);
                    }
                });
            },
            { rootMargin: '200px' }
        );
        
        document.querySelectorAll('.gallery-item').forEach(el => {
            observer.observe(el);
        });
        
        return () => observer.disconnect();
    }, [images]);

    return (
        <div className="gallery-page">
            <div className="background-effects">
                <div className="terminal-grid"></div>
                <div className="scan-lines"></div>
                <div className="horizontal-scan"></div>
                <div className="hexagon-overlay"></div>
                <div className="ambient-pulse"></div>
                <div className="data-blocks">
                    <div className="data-block"></div>
                    <div className="data-block"></div>
                    <div className="data-block"></div>
                    <div className="data-block"></div>
                    <div className="data-block"></div>
                </div>
                <div className="circuit-connections">
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-connection" style={{top: '15%', left: '20%', width: '30%'}}></div>
                    <div className="circuit-connection" style={{top: '35%', left: '10%', width: '40%'}}></div>
                    <div className="circuit-connection" style={{top: '65%', left: '25%', width: '20%'}}></div>
                    <div className="circuit-connection" style={{top: '10%', right: '30%', width: '15%'}}></div>
                    <div className="circuit-connection" style={{top: '60%', right: '10%', width: '20%'}}></div>
                </div>
            </div>
            
            <div className="custom-dropdown-overlay"></div>
            
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