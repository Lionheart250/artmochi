import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ImageModal.css';
import { ReactComponent as LikeIcon } from '../assets/icons/like.svg';
import { ReactComponent as CommentIcon } from '../assets/icons/comment.svg';
import { ReactComponent as ShareIcon } from '../assets/icons/share.svg';
import { ReactComponent as BookmarkIcon } from '../assets/icons/bookmark.svg';
import { LockIcon, UnlockIcon } from '../utils/Icons';

const ImageModal = ({
  isOpen,
  onClose,
  modalImage,
  activeImageId,
  images,
  user,
  navigateImage,
  canDelete = false,
  isAdmin = false,
  isOwnProfile = false,
  activeTab = 'gallery',
  onImageDelete,
  // Pass in all the necessary state and handlers
  imageUserDetails,
  comments = {},
  likes = {},
  userLikedImages = new Set(),
  commentLikes = {},
  isFollowing = false,
  handleLike,
  handleCommentLike,
  handleCommentSubmit,
  handleModalFollowToggle,
  handlePrivacyToggle,
  handleImageEdit,
  togglePrompt,
  expandedPrompts = new Set(),
  commentInput = '',
  setCommentInput,
  formatTimestamp = (timestamp) => timestamp,
  formatDate = (date) => date,
  getLoraName = (url) => url
}) => {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);
  const [isBodyLocked, setIsBodyLocked] = useState(false);

  // Add a proper effect to handle body scrolling
  useEffect(() => {
    if (isOpen && !isBodyLocked) {
      // Save the current scroll position
      const scrollY = window.scrollY;
      
      // Apply styles to lock the body scroll in place
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      
      setIsBodyLocked(true);
    }
    
    return () => {
      if (isBodyLocked) {
        // Restore scrolling when component unmounts
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
        
        // Restore scroll position
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
        
        setIsBodyLocked(false);
      }
    };
  }, [isOpen, isBodyLocked]);

  // Add keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          navigateImage('prev');
          break;
        case 'ArrowRight':
          navigateImage('next');
          break;
        case 'Escape':
          handleClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, navigateImage, onClose]);

  // Handle username click
  const handleUsernameClick = (userId) => {
    navigate(`/profile/${userId}`);
    onClose();
  };

  const handleClose = () => {
    setIsClosing(true);
    
    // Remove modal-open class immediately
    // But DON'T reset other body styles, we'll do that in the cleanup function
    
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      setIsClosing(false); // Reset the closing state before calling onClose
      onClose();
    }, 300);
  };

  
  // If modal is not open, don't render anything
  if (!isOpen || !modalImage || !activeImageId) return null;

  // Get the current image data
  const currentImage = images.find(img => img.id === activeImageId);
  if (!currentImage) return null;

  // Check if current user owns the image
  const isUserImage = user && imageUserDetails[activeImageId]?.user_id === user.userId;

  const renderLoraPills = () => {
    const imageDetails = imageUserDetails[activeImageId];
    if (!imageDetails || !imageDetails.loras) return null;

    return (
      <div className="lora-pills">
        {Array.isArray(imageDetails.loras) && imageDetails.loras.map((lora, index) => (
          <span key={index} className="lora-pill">
            {getLoraName(lora)}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={`image-modal ${isClosing ? 'closing' : ''}`}>
      <div className="image-modal-content">
        <div className="image-modal-main">
          <div className="image-modal-image-container">
            <button className="image-close-button" onClick={handleClose}>×</button>
            
            <button className="image-modal-nav-left" onClick={() => navigateImage('prev')}>
              <span>‹</span>
            </button>
            
            <img className="image-modal-image" src={modalImage} alt="Full size" />
            
            {isAdmin && (
              <div className="image-delete-section">
                <button 
                  className="image-delete-button" 
                  onClick={() => onImageDelete(activeImageId)}
                >
                  Delete Image
                </button>
              </div>
            )}
            
            <button className="image-modal-nav-right" onClick={() => navigateImage('next')}>
              <span>›</span>
            </button>
          </div>
          
          <div className="image-modal-info">
            <div className="image-user-info">
              <img 
                src={imageUserDetails[activeImageId]?.profile_picture || '/default-avatar.png'} 
                alt={imageUserDetails[activeImageId]?.username || 'Profile'}
                className="user-avatar"
                onClick={() => handleUsernameClick(imageUserDetails[activeImageId]?.user_id)}
                onError={(e) => e.target.src = '/default-avatar.png'}
              />
              <div className="image-user-details">
                <h4 onClick={() => navigate(`/profile/${imageUserDetails[activeImageId]?.user_id}`)}>
                  {imageUserDetails[activeImageId]?.username}
                </h4>
                
                {user && imageUserDetails[activeImageId] && user.userId !== parseInt(imageUserDetails[activeImageId].user_id) && (
                  <button 
                    className={`image-follow-btn ${isFollowing ? 'following' : ''}`}
                    onClick={() => handleModalFollowToggle(imageUserDetails[activeImageId].user_id)}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
                
                <span className="image-creation-date">
                  {formatDate(currentImage.created_at)}
                </span>
              </div>
              
              {isUserImage && (
                <button 
                  className={`privacy-toggle ${currentImage?.private ? 'private' : 'public'}`}
                  onClick={() => handlePrivacyToggle(activeImageId)}
                >
                  {currentImage?.private ? '🔒 Private' : '🌐 Public'}
                </button>
              )}
            </div>
            
            <div className="image-modal-info-content">
              {/* Title first */}
              <div className="image-modal-title">
                {currentImage.title || 'Untitled'}
              </div>
              
              {/* Then prompt */}
              <div className="image-modal-prompt">
                <div className={`prompt-text ${expandedPrompts.has(activeImageId) ? 'expanded' : ''}`}>
                  {currentImage.prompt}
                </div>
                <button 
                  className="show-more-btn"
                  onClick={() => togglePrompt(activeImageId)}
                >
                  {expandedPrompts.has(activeImageId) ? 'Show Less' : 'Show More'}
                </button>
              </div>
              
              {/* Then LoRAs */}
              {(currentImage.loras_used || imageUserDetails[activeImageId]?.loras) && (
                <div className="image-modal-loras">
                  <h4 className="metadata-heading">Styles Used:</h4>
                  {currentImage.loras_used ? (
                    <div className="lora-pills">
                      {(typeof currentImage.loras_used === 'string' 
                        ? JSON.parse(currentImage.loras_used)
                        : currentImage.loras_used
                      ).map((lora, index) => (
                        <span key={index} className="lora-pill">
                          {getLoraName(lora.model)} ({lora.weight})
                        </span>
                      ))}
                    </div>
                  ) : renderLoraPills()}
                </div>
              )}
              
              {/* Interaction buttons */}
              <div className="image-interaction-buttons">
                <button onClick={() => handleLike(activeImageId)} className="image-action-btn">
                  <LikeIcon className={userLikedImages.has(activeImageId) ? 'liked' : ''} />
                  <span>{likes[activeImageId] || 0}</span>
                </button>
                <button className="image-action-btn">
                  <CommentIcon />
                  <span>{comments[activeImageId]?.length || 0}</span>
                </button>
                <button className="image-action-btn">
                  <ShareIcon />
                </button>
                <button className="image-action-btn">
                  <BookmarkIcon />
                </button>
                <button 
                  onClick={() => handleImageEdit('upscale', currentImage)}
                  className="image-action-btn"
                >
                  🔍 Upscale
                </button>
                <button 
                  onClick={() => handleImageEdit('remix', currentImage)}
                  className="image-action-btn"
                >
                  🎨 Remix
                </button>
              </div>
              
              {/* Categories */}
              <div className="image-image-metadata">
                <h4 className="metadata-heading">Categories:</h4>
                <div className="category-pills">
                  {currentImage.categories?.length > 0 
                    ? currentImage.categories.map((category, index) => (
                      <span key={index} className="category-pill">
                        {category && typeof category === 'string' 
                          ? category.charAt(0).toUpperCase() + category.slice(1)
                          : 'Unknown'}
                      </span>
                    ))
                    : <span className="category-pill">Uncategorized</span>
                  }
                </div>
              </div>
              
              {/* Comments section */}
              <div className="image-comments-section">
                <h4 className="image-comments-heading">Comments</h4>
                <ul className="image-comments-list">
                  {(comments[activeImageId] || []).map((comment) => (
                    <li key={`comment-${comment.id}-${comment.created_at}`} className="image-comment-item">
                      <div className="image-comment-avatar">
                        <img 
                          src={comment.profile_picture || '/default-avatar.png'} 
                          alt={comment.username || 'User'}
                          className="comment-avatar"
                          onClick={() => handleUsernameClick(comment.user_id)}
                          onError={(e) => e.target.src = '/default-avatar.png'}
                        />
                      </div>
                      <div className="image-comment-content">
                        <div className="image-comment-header">
                          <span 
                            className="image-comment-username"
                            onClick={() => handleUsernameClick(comment.user_id)}
                            role="button"
                            tabIndex={0}
                          >
                            {comment.username}
                          </span>
                          <span className="image-comment-time">
                            {formatTimestamp(comment.created_at)}
                          </span>
                        </div>
                        <p className="image-comment-text">{comment.comment}</p>
                        <div className="image-comment-actions">
                          <button 
                            className="image-comment-like-btn"
                            onClick={() => handleCommentLike(comment.id)}
                          >
                            ♥ {commentLikes[comment.id] || 0}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Comment form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleCommentSubmit(e);
              }} 
              className="image-comment-form"
            >
              <input
                className="image-comment-input"
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment..."
                required
              />
              <button type="submit" className="image-comment-submit">Post</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;