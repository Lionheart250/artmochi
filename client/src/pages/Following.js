import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Ensure jwt-decode is installed
import { useNavigate } from 'react-router-dom';
import { ReactComponent as LikeIcon } from '../assets/icons/like.svg';
import { ReactComponent as CommentIcon } from '../assets/icons/comment.svg';
import { ReactComponent as ShareIcon } from '../assets/icons/share.svg';
import { ReactComponent as BookmarkIcon } from '../assets/icons/bookmark.svg';
import './Following.css';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { getImageUrl } from '../utils/imageUtils';
import ImageModal from '../components/ImageModal';
import { artisticLoras, realisticLoras } from '../components/LoraSelector';
import { customHistory } from '../utils/CustomHistory';

const Following = () => {
    const { user } = useAuth();
    const { fetchUserProfile } = useProfile(); // Add this line
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imageUserDetails, setImageUserDetails] = useState({});
    const [likes, setLikes] = useState({});
    const [comments, setComments] = useState({});
    const [userLikedImages, setUserLikedImages] = useState(new Set());
    const [modalOpen, setModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState(null);
    const [activeImageId, setActiveImageId] = useState(null);
    const [commentInput, setCommentInput] = useState('');
    const [userLikedComments, setUserLikedComments] = useState(new Set());
    const [commentLikes, setCommentLikes] = useState({});
    const [isFollowing, setIsFollowing] = useState(false);
    const [expandedPrompts, setExpandedPrompts] = useState(new Set());
    const navigate = useNavigate();

    const handleImageClick = (image) => {
        openModal(image);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalImage(null);
        setActiveImageId(null);
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
              userId,  // Include userId as Gallery.js does
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
              
              // Instead of trying to update individual comment, just refetch all data
              // This is what Gallery.js does
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

    const fetchFollowingPosts = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
    
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/following/posts`, {                
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Following posts:', data);
    
            // Fetch user profiles for all posts
            const userProfiles = await Promise.all(
                data.map(post => 
                    fetch(`${process.env.REACT_APP_API_URL}/user_profile/${post.user_id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).then(res => res.json())
                )
            );
    
            const details = {};
            const likesMap = {};
            const commentsMap = {};
            const userLikedSet = new Set();
    
            // Combine post data with user profiles
            data.forEach((post, index) => {
                details[post.id] = {
                    username: userProfiles[index].username,
                    profile_picture: userProfiles[index].profile_picture,
                    user_id: post.user_id
                };
                likesMap[post.id] = post.like_count;
                commentsMap[post.id] = post.comments || [];
                if (post.user_has_liked) userLikedSet.add(post.id);
            });
    
            setImageUserDetails(details);
            setLikes(likesMap);
            setComments(commentsMap);
            setUserLikedImages(userLikedSet);
            setImages(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFollowingPosts();
    }, []);

    // Add this useEffect for profile fetching
    useEffect(() => {
        const loadProfile = async () => {
            const token = localStorage.getItem('token');
            if (user && token) {
                try {
                    await fetchUserProfile(token);
                } catch (error) {
                    console.error('Error fetching profile:', error);
                }
            }
        };

        loadProfile();
    }, [user, fetchUserProfile]);

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
    
const fetchImageDetails = async (imageId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        // First get image details
        const imageDetailsResponse = await fetch(`${process.env.REACT_APP_API_URL}/images/${imageId}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const imageData = await imageDetailsResponse.json();
        
        // Get user profile and follow status in parallel
        const [userProfileResponse, followStatusResponse] = await Promise.all([
            fetch(`${process.env.REACT_APP_API_URL}/user_profile/${imageData.user_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${process.env.REACT_APP_API_URL}/user/${imageData.user_id}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const [userProfileData, followStatus] = await Promise.all([
            userProfileResponse.json(),
            followStatusResponse.json()
        ]);

        if (followStatusResponse.ok) {
            setIsFollowing(followStatus.is_following);
        }

        setImageUserDetails(prev => ({
            ...prev,
            [imageId]: {
                ...imageData,
                username: userProfileData.username,
                profile_picture: userProfileData.profile_picture
            }
        }));

        // Fetch comments
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
            const response = await fetch(`${process.env.REACT_APP_API_URL}/comment_likes/${commentId}`, {                headers: {
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
                // Only fetch image details to update UI
                fetchImageDetails(activeImageId);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!modalOpen) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    navigateImage('prev');
                    break;
                case 'ArrowRight':
                    navigateImage('next');
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
    }, [modalOpen, modalImage]);

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

    const getLoraName = (url) => {
        // First check artistic loras
        const artisticLora = artisticLoras.find(lora => lora.url === url);
        if (artisticLora) return artisticLora.name;
        
        // Then check realistic loras
        const realisticLora = realisticLoras.find(lora => lora.url === url);
        if (realisticLora) return realisticLora.name;
        
        // Fallback to model ID if not found
        return url?.split(':')[1] || url;
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return `${diffInSeconds}s ago`;
        }
        
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        }
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        }
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            return `${diffInDays}d ago`;
        }
        
        // For older dates, show the actual date
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    };
    
    // Add this function to your Following component
    const openModal = (image) => {
        // Set state for this modal instance
        setModalImage(image);
        setActiveImageId(image.id);
        setModalOpen(true);
        
        // Fetch data for this image
        fetchImageDetails(image.id);
        
        // Add modal-open class to body
        document.body.classList.add('modal-open');
    };

    // Add these functions
    const handlePrivacyToggle = async () => {
        // This is not needed for Following page but included for compatibility
        console.log("Privacy toggle not applicable in Following view");
    };

    const handleImageEdit = () => {
        // This is not needed for Following page but included for compatibility
        console.log("Image edit not applicable in Following view");
    };

    return (
        <div className="following-container">
            <h1>Following</h1>
            
            <div className="following-grid">
                {loading ? (
                    <div>Loading...</div>
                ) : images.length === 0 ? (
                    <div>No posts from followed users</div>
                ) : (
                    images.map((image) => (
                        <div 
                            key={image.id} 
                            className="following-item"
                            onClick={() => handleImageClick(image)}
                        >
                            <div className="following-user-info">
                                <img 
                                    src={imageUserDetails[image.id]?.profile_picture || '/default-avatar.png'}
                                    alt="Profile"
                                    className="following-user-avatar"
                                    onError={(e) => {
                                        if (!imageUserDetails[image.id]?.profile_picture) {
                                            fetchImageDetails(image.id);
                                        }
                                        e.target.src = '/default-avatar.png';
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/profile/${image.user_id}`);
                                    }}
                                />
                                <span>{imageUserDetails[image.id]?.username}</span>
                            </div>
                            <img 
                                src={image.image_url} 
                                alt={image.prompt}
                                className="following-image" 
                            />
                        </div>
                    ))
                )}
            </div>
    
            {modalOpen && modalImage && (
                <ImageModal
                    isOpen={modalOpen && !!modalImage}
                    onClose={closeModal}
                    modalImage={modalImage?.image_url}
                    activeImageId={activeImageId}
                    images={images}
                    user={user}
                    navigateImage={(direction) => navigateImage(direction)}
                    canDelete={false}
                    isAdmin={user?.role === 'admin'}
                    isOwnProfile={false}
                    activeTab="following"
                    onImageDelete={() => {}} // Not applicable in Following view
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
                    togglePrompt={togglePrompt}
                    expandedPrompts={expandedPrompts}
                    commentInput={commentInput}
                    setCommentInput={setCommentInput}
                    formatTimestamp={formatTimestamp}
                    formatDate={formatDate}
                    getLoraName={getLoraName}
                />
            )}
        </div>
    );
};

export default Following;