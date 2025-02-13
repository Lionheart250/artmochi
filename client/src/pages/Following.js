import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Ensure jwt-decode is installed
import { useNavigate } from 'react-router-dom';
import { ReactComponent as LikeIcon } from '../assets/icons/like.svg';
import { ReactComponent as CommentIcon } from '../assets/icons/comment.svg';
import { ReactComponent as ShareIcon } from '../assets/icons/share.svg';
import { ReactComponent as BookmarkIcon } from '../assets/icons/bookmark.svg';
import './Following.css';
import { useAuth } from '../context/AuthContext';

const Following = () => {
    const { user } = useAuth();
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
    const navigate = useNavigate();

    const handleImageClick = (image) => {
        setModalImage(image);
        setActiveImageId(image.id);
        setModalOpen(true);
        fetchAllData(image.id);
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
    
            const details = {};
            const likesMap = {};
            const commentsMap = {};
            const userLikedSet = new Set();
    
            data.forEach(post => {
                details[post.id] = {
                    username: post.username,
                    profile_picture: post.profile_picture,
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

    const navigateImage = (direction) => {
        if (!modalImage) return;
        const currentIndex = images.findIndex(img => img.id === activeImageId);
        let newIndex;
        
        if (direction === 'prev') {
            newIndex = currentIndex - 1 < 0 ? images.length - 1 : currentIndex - 1;
        } else {
            newIndex = currentIndex + 1 >= images.length ? 0 : currentIndex + 1;
        }
        
        const newImage = images[newIndex];
        setModalImage(newImage);
        setActiveImageId(newImage.id);
        fetchAllData(newImage.id);
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
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const imageData = await imageDetailsResponse.json();
        
        // Then fetch comments and follow status
        const [commentsResponse, followStatusResponse] = await Promise.all([
            fetch(`${process.env.REACT_APP_API_URL}/fetch_comments?id=${imageId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${process.env.REACT_APP_API_URL}/user/${imageData.user_id}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const [comments, stats] = await Promise.all([
            commentsResponse.json(),
            followStatusResponse.json()
        ]);

        // Update states with correct URL construction
        setImageUserDetails(prev => ({
            ...prev,
            [imageId]: {
                ...stats,
                profile_picture: stats.profile_picture ? 
                    `${process.env.REACT_APP_API_URL}/profile_pictures/${stats.profile_picture.split('/').pop()}` :
                    '/default-avatar.png'
            }
        }));

        setComments(prev => ({
            ...prev,
            [imageId]: comments.comments
        }));

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
                // Refetch data to update UI
                fetchImageDetails(activeImageId);
                fetchAllData(activeImageId);
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
                                    src={`${process.env.REACT_APP_API_URL}/${imageUserDetails[image.id]?.profile_picture}`}                                    alt="Profile"
                                    className="following-user-avatar"
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
    <div className="profile-modal">
        <div className="profile-modal-content">
            <div className="profile-modal-main">
                <div className="profile-modal-image-container">
                    <button className="profile-close-button" onClick={closeModal}>×</button>
                    <button className="profile-modal-nav-left" onClick={() => navigateImage('prev')}>
                        &lt;
                    </button>
                    <img className="profile-modal-image" src={modalImage.image_url} alt="Enlarged" />
                    <button className="profile-modal-nav-right" onClick={() => navigateImage('next')}>
                        &gt;
                    </button>
                </div>
                <div className="profile-modal-info">
                    <div className="profile-user-info">
                        <img 
                            src={`${process.env.REACT_APP_API_URL}/${imageUserDetails[activeImageId]?.profile_picture}` || '/default-avatar.png'}                            
                            alt="Profile"
                            className="profile-user-avatar"
                            onClick={() => navigate(`/profile/${imageUserDetails[activeImageId]?.user_id}`)}
                        />
                        <div className="profile-user-details">
                            <h4 onClick={() => navigate(`/profile/${imageUserDetails[activeImageId]?.user_id}`)}>
                                {imageUserDetails[activeImageId]?.username}
                            </h4>
                            {user && user.userId !== parseInt(imageUserDetails[activeImageId]?.user_id) && (
                                <button 
                                    className={`profile-follow-btn ${isFollowing ? 'following' : ''}`}
                                    onClick={() => handleModalFollowToggle(imageUserDetails[activeImageId]?.user_id)}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="profile-image-prompt">{modalImage.prompt}</div>
                    <div className="profile-interaction-buttons">
                        <button onClick={() => handleLike(activeImageId)} className="profile-action-btn">
                            <LikeIcon className={userLikedImages.has(activeImageId) ? 'liked' : ''} />
                            <span>{likes[activeImageId] || 0}</span>
                            </button>
                        <button className="profile-action-btn">
                            <CommentIcon />
                            <span>{(comments[activeImageId] || []).length}</span>
                        </button>
                        <button className="profile-action-btn">
                            <ShareIcon />
                        </button>
                        <button className="profile-action-btn">
                            <BookmarkIcon />
                        </button>
                    </div>
                    <div className="profile-comments-section">
                        {comments[activeImageId]?.map((comment) => (
                            <div key={comment.id} className="profile-comment">
                                <img 
                                    src={`${process.env.REACT_APP_API_URL}/${comment.profile_picture}` || '/default-avatar.png'}                                    
                                    alt=""
                                    className="profile-comment-avatar"
                                    onClick={() => navigate(`/profile/${comment.user_id}`)}
                                />
                                <div className="profile-comment-content">
                                    <span 
                                        className="profile-comment-username"
                                        onClick={() => navigate(`/profile/${comment.user_id}`)}
                                    >
                                        {comment.username}
                                    </span>
                                    <p>{comment.comment}</p>
                                    <div className="profile-comment-actions">
                                        <button 
                                            onClick={() => handleCommentLike(comment.id)}
                                            className={`profile-comment-like-btn ${userLikedComments.has(comment.id) ? 'liked' : ''}`}
                                        >
                                            <LikeIcon />
                                            <span>{commentLikes[comment.id] || 0}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <form onSubmit={handleCommentSubmit} className="profile-comment-form">
                            <input
                                type="text"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder="Add a comment..."
                                className="profile-comment-input"
                            />
                            <button type="submit" className="profile-comment-submit">Post</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
)}
 </div>
    );
};

export default Following;