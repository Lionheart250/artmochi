import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ImageModal.css';
import { ReactComponent as LikeIcon } from '../assets/icons/like.svg';
import { ReactComponent as CommentIcon } from '../assets/icons/comment.svg';
import { ReactComponent as ShareIcon } from '../assets/icons/share.svg';
import { ReactComponent as BookmarkIcon } from '../assets/icons/bookmark.svg';
import { LockIcon, UnlockIcon } from '../utils/Icons';
import { customHistory } from '../utils/CustomHistory';

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
  getLoraName = (url) => url,
  loadMoreImages = () => {}, // Function to load more images  
  loadThreshold = 5, // How many images from end before loading more
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isClosing, setIsClosing] = useState(false);
  const [isBodyLocked, setIsBodyLocked] = useState(false);
  const [closingAnimation, setClosingAnimation] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const originalScrollPosition = useRef(0);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);
  
  // Move the current image declaration up here, before the hooks
  const currentImage = isOpen && activeImageId ? 
    images.find(img => img.id === activeImageId) : null;

  // Add a proper effect to handle body scrolling
  useEffect(() => {
    if (isOpen && !isBodyLocked) {
      // Save the scroll position in our ref
      originalScrollPosition.current = window.scrollY;
      
      // Apply styles to lock the body scroll in place
      const scrollY = window.scrollY;
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

  const handleClose = () => {
    // IMMEDIATE actions before any animation or state changes
    // 1. Add modal-closing class to body
    document.body.classList.add('modal-closing');
    
    // 2. Force synchronous DOM reflow to ensure class is applied
    void document.body.offsetHeight;
    
    // 3. Dispatch event to instantly trigger header transition
    document.dispatchEvent(new CustomEvent('modalclosing', {
      detail: { closing: true }
    }));
    
    // 4. IMPORTANT: Start the header animation NOW, don't wait for timeout
    // This will make the header start moving immediately
    
    // Now start modal closing animation
    setClosingAnimation(true);
    
    // Remove other body classes
    document.body.classList.remove('modal-open');
    document.body.classList.remove('holographic-cursor');
  
    // Wait for modal animation to complete before actually closing
    setTimeout(() => {
      setClosingAnimation(false);
      document.body.classList.remove('modal-closing');
      
      // If we have an explicit onClose handler from parent, use it
      if (onClose) {
        onClose();
      }
      
      // Make sure we restore to the original position
      window.scrollTo(0, originalScrollPosition.current);
    }, 0);
  };

  // Now the rest of your effects can use handleClose
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;
      
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        // Use the navigateImage prop safely
        if (typeof navigateImage === 'function') {
          isNavigatingWithArrowKeys.current = true;
          navigateImage(event.key === 'ArrowRight' ? 'next' : 'prev');
        }
      }
      
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, navigateImage]);

  // Add this useEffect to the ImageModal.js component
  useEffect(() => {
    if (isOpen) {
      // Force header to TOP position when modal opens
      document.dispatchEvent(new CustomEvent('forceheaderposition', {
        detail: { position: 'top' }
      }));
      
      // Mark body with both classes for redundancy
      document.body.classList.add('modal-open');
      document.body.classList.add('modal-in-profile');
    }
    
    return () => {
      // Cleanup when modal closes or unmounts
      document.body.classList.remove('modal-in-profile');
    };
  }, [isOpen]);

  // Add this effect to reset expanded prompts when the active image changes
  useEffect(() => {
    // Reset expanded prompt state when activeImageId changes
    if (activeImageId && expandedPrompts.has(activeImageId) && togglePrompt) {
      togglePrompt(activeImageId); // Collapse the expanded prompt
    }
  }, [activeImageId]);

  // Add a function to handle sharing images with corrected dependency
  const handleShareImage = useCallback(() => {
    if (!activeImageId) return;
    
    // Generate a secure share URL with a UUID or hash instead of a sequential ID
    const shareUrl = `${window.location.origin}/share/${activeImageId}`;
    
    // Check if we can use the Web Share API (mobile devices)
    if (navigator.share) {
      navigator.share({
        title: currentImage?.title || 'Check out this AI art',
        text: 'Check out this amazing AI-generated artwork on ArtMochi!',
        url: shareUrl
      }).catch(err => {
        console.log('Error sharing:', err);
        copyToClipboard(shareUrl);
      });
    } else {
      // Fallback to copy-to-clipboard
      copyToClipboard(shareUrl);
    }
  }, [activeImageId, currentImage]); // Now currentImage is defined before being referenced

  // Helper function to copy text to clipboard
  const copyToClipboard = (text) => {
    // Create a temporary input
    const input = document.createElement('input');
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    
    // Set and select the text
    input.value = text;
    input.select();
    input.setSelectionRange(0, 99999);
    
    // Copy and clean up
    document.execCommand('copy');
    document.body.removeChild(input);
    
    // Show success toast
    showShareToast();
  };

  // Show a toast message when URL is copied
  const showShareToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Add a reference to track the comment list container
  const commentsContainerRef = useRef(null);
  
  // Add effect to scroll to the bottom of comments when new comments are added
  useEffect(() => {
    if (commentsContainerRef.current && activeImageId && comments[activeImageId]) {
      const container = commentsContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [comments, activeImageId]);

  // Use custom history listener
  useEffect(() => {
    if (!isOpen) return;
    
    // Listen for navigation events BEFORE they happen
    const unlisten = customHistory.listen((location) => {
      // Add this to the start of the customHistory.listen callback:
      if (!isOpen || !images || !Array.isArray(images)) {
        return true; // Skip the logic if images is not available
      }
      // Only handle POP events (back/forward buttons)
      if (location.action === 'POP') {
        console.log("⚡ History POP detected:", location.path);
        
        // Case 1: We're navigating between images
        if (location.path.includes('/image/') || location.path.includes('/share/')) {
          const pathSegments = location.path.split('/');
          const newImageId = parseInt(pathSegments[pathSegments.length - 1]);
          
          if (newImageId && newImageId !== activeImageId && images.some(img => img.id === newImageId)) {
            console.log("🔄 Navigating to another image:", newImageId);
            
            // Set flag to indicate we're navigating with browser controls
            isNavigatingWithArrowKeys.current = true;
            
            // Use navigateImage if provided
            if (navigateImage) {
              const direction = images.findIndex(img => img.id === newImageId) > 
                               images.findIndex(img => img.id === activeImageId) ? 'next' : 'prev';
              navigateImage(direction, newImageId);
            }
            return true; // Allow navigation to proceed
          }
        }
        
        // Case 2: We're navigating away from the modal entirely
        console.log("🚪 Closing modal via custom history");
        
        // Start animation for visual feedback
        setClosingAnimation(true);
        
        // Remove modal-related classes immediately
        document.body.classList.remove('modal-open');
        document.body.classList.remove('holographic-cursor');
        
        // After animation completes, close the modal
        setTimeout(() => {
          if (onClose) {
            console.log("📞 Calling onClose()");
            onClose(); 
          }
          setClosingAnimation(false);
        }, 300);
        
        return true; // Allow navigation to proceed
      }
      return true;
    });
    
    // Clean up listener
    return () => {
      if (unlisten) unlisten();
    };
  }, [isOpen, activeImageId, images, navigateImage, onClose]);
  
  // Use custom history for navigation
  const navigateToImage = (imageId) => {
    customHistory.push(`/image/${imageId}`);
  };

  // Add missing refs at the top of your component
  const isNavigatingWithArrowKeys = useRef(false);
  const previousUrls = useRef([]);

  useEffect(() => {
    // When activeImageId changes, update URL and history
    if (isOpen && activeImageId) {
      // Determine the correct URL path based on context
      let newUrl;
      const currentPathname = window.location.pathname;
      
      // Check which view we're in and create appropriate URL
      if (currentPathname.includes('/profile/')) {
        const profileId = currentPathname.split('/profile/')[1]?.split('/')[0];
        newUrl = `/profile/${profileId}/image/${activeImageId}`;
      } 
      else if (currentPathname.includes('/following')) {
        newUrl = `/following/image/${activeImageId}`;
      } 
      else {
        // Default to gallery
        newUrl = `/gallery/image/${activeImageId}`; 
      }
      
      // Don't add duplicate entries
      if (window.location.pathname !== newUrl) {
        // Always PUSH new history entries for each image
        customHistory.push(newUrl);
        
        // Store current URL before navigation
        if (!isNavigatingWithArrowKeys.current) {
          previousUrls.current.push(window.location.pathname);
        }
      }
      
      // Reset flag
      isNavigatingWithArrowKeys.current = false;
    }
  }, [isOpen, activeImageId]);

  useEffect(() => {
    const handleForceClose = () => {
      console.log("📣 Force close event received");
      
      // IMMEDIATE actions before any animation or state changes
      // 1. Add modal-closing class to body
      document.body.classList.add('modal-closing');
      
      // 2. Force synchronous DOM reflow to ensure class is applied
      void document.body.offsetHeight;
      
      // 3. Dispatch event to instantly trigger header transition
      document.dispatchEvent(new CustomEvent('modalclosing', {
        detail: { closing: true }
      }));
      
      // Now start modal closing animation
      setClosingAnimation(true);
      
      // Remove other body classes
      document.body.classList.remove('modal-open');
      document.body.classList.remove('holographic-cursor');
    
      // Wait for modal animation to complete before actually closing
      setTimeout(() => {
        setClosingAnimation(false);
        document.body.classList.remove('modal-closing');
        
        // If we have an explicit onClose handler from parent, use it
        if (onClose) {
          onClose();
        }
      }, 0);
    };
    
    document.addEventListener('forcemodalclose', handleForceClose);
    
    return () => {
      document.removeEventListener('forcemodalclose', handleForceClose);
    };
  }, [onClose]);  // Only depend on onClose, not handleClose

  // Add auto-load feature when nearing end of list
  useEffect(() => {
    const currentIndex = images.findIndex(img => img.id === activeImageId);
    
    // Check if we're approaching the end of the images array
    if (currentIndex >= images.length - loadThreshold && 
        images.length > 0 &&
        loadMoreImages) {
      // Load more images when we're nearing the end
      console.log("Loading more images from modal navigation");
      loadMoreImages();
    }
  }, [activeImageId, images, loadThreshold, loadMoreImages]);

  // If modal is not open, don't render anything
  if (!isOpen || !modalImage || !activeImageId) return null;

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
    <div className={`image-modal ${closingAnimation ? 'closing' : ''}`}>
      <div className="image-modal-content">
        <div className="image-modal-main">
          {/* Image container section */}
          <div className={`image-modal-image-container ${showLeftIndicator ? 'at-boundary-start' : ''} ${showRightIndicator ? 'at-boundary-end' : ''}`}>
            {/* Add boundary indicators */}
            <div className={`boundary-indicator left ${showLeftIndicator ? 'show' : ''}`}></div>
            <div className={`boundary-indicator right ${showRightIndicator ? 'show' : ''}`}></div>
            
            {/* Close button */}
            <button className="image-close-button" onClick={handleClose}>
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
              </svg>
            </button>
            
            {/* Navigation buttons */}
            <button 
              className={`image-modal-nav-left ${images.findIndex(img => img.id === activeImageId) <= 0 ? 'disabled' : ''}`}
              onClick={() => {
                const currentIndex = images.findIndex(img => img.id === activeImageId);
                if (currentIndex <= 0) {
                  // Use visual indicator instead of wrapper
                  setShowLeftIndicator(true);
                  setTimeout(() => setShowLeftIndicator(false), 800);
                } else {
                  navigateImage('prev');
                }
              }}
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
              </svg>
            </button>

            <img 
              className="image-modal-image" 
              src={modalImage} 
              alt="AI generated image" 
            />

            <button 
              className={`image-modal-nav-right ${images.findIndex(img => img.id === activeImageId) >= images.length - 1 ? 'disabled' : ''}`}
              onClick={() => {
                const currentIndex = images.findIndex(img => img.id === activeImageId);
                if (currentIndex >= images.length - 1) {
                  // Use visual indicator instead of wrapper
                  setShowRightIndicator(true);
                  setTimeout(() => setShowRightIndicator(false), 800);
                } else {
                  navigateImage('next');
                }
              }}
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
              </svg>
            </button>
            
            {/* Delete button */}
            {canDelete && (
              <div className="image-delete-section">
                <button className="image-delete-button" onClick={() => onImageDelete(activeImageId)}>
                  Delete
                </button>
              </div>
            )}
            
            {/* TikTok-style side actions */}
            <div className="image-side-actions">
              <div className="image-side-action">
                <button 
                  className={`image-side-action-btn ${userLikedImages.has(activeImageId) ? 'liked' : ''}`}
                  onClick={() => handleLike(activeImageId)}
                >
                  {/* Like icon */}
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
                <span className="image-side-action-label">{likes[activeImageId] || 0}</span>
              </div>
              
              <div className="image-side-action">
                <button className="image-side-action-btn">
                  {/* Comment icon */}
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" />
                  </svg>
                </button>
                <span className="image-side-action-label">{(comments[activeImageId] || []).length}</span>
              </div>
              
              <div className="image-side-action">
                <button className="image-side-action-btn" onClick={handleShareImage}>
                  {/* Share icon */}
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                  </svg>
                </button>
                <span className="image-side-action-label">Share</span>
              </div>
            </div>
          </div>
          
          {/* Info panel */}
          <div className="image-modal-info">
            <div className="image-modal-info-content">
              {/* Header with user info */}
              <div className="image-info-header">
                <div className="image-user-info">
                  <div className="user-avatar-wrapper">
                    <img 
                      src={imageUserDetails[activeImageId]?.profile_picture || '/default-avatar.png'} 
                      alt={imageUserDetails[activeImageId]?.username || 'User'} 
                      className="user-avatar"
                      onClick={() => handleUsernameClick(imageUserDetails[activeImageId]?.user_id)}
                    />
                    {imageUserDetails[activeImageId]?.is_premium && (
                      <div className="premium-badge">
                        <svg viewBox="0 0 24 24">
                          <path d="M12 2L9.2 8.6L2 9.2L7.5 14.6L5.8 22L12 18.6L18.2 22L16.5 14.6L22 9.2L14.8 8.6L12 2Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="image-user-details">
                    <h4 onClick={() => handleUsernameClick(imageUserDetails[activeImageId]?.user_id)}>
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
                    
                    <div className="image-creation-date">
                      {formatDate(images.find(img => img.id === activeImageId)?.created_at)}
                    </div>
                  </div>
                  
                  {/* Privacy toggle if it's the user's own image */}
                  {(isOwnProfile || isAdmin) && (
                    <button 
                      className={`privacy-toggle ${images.find(img => img.id === activeImageId)?.private ? 'private' : 'public'}`} 
                      onClick={() => handlePrivacyToggle(activeImageId)}
                    >
                      {images.find(img => img.id === activeImageId)?.private ? 'Private' : 'Public'}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Scrollable body content */}
              <div className="image-info-body">
                {/* Title and prompt */}
                <div className="image-modal-title">
                  {images.find(img => img.id === activeImageId)?.title || 'Untitled'}
                </div>
                
                <div className="image-modal-prompt">
                  <div className={`prompt-text ${expandedPrompts.has(activeImageId) ? 'expanded' : ''}`}>
                    {images.find(img => img.id === activeImageId)?.prompt}
                  </div>
                  <button 
                    className="show-more-btn" 
                    onClick={() => togglePrompt(activeImageId)}
                  >
                    {expandedPrompts.has(activeImageId) ? 'Show less' : 'Show more'}
                  </button>
                </div>
                
                {/* LoRAs section */}
                {images.find(img => img.id === activeImageId)?.loras_used && (
                  <div className="image-modal-loras">
                    <h4 className="metadata-heading">Styles Used:</h4>
                    <div className="lora-pills">
                      {(images.find(img => img.id === activeImageId)?.loras_used)?.map((lora, index) => (
                        <span key={index} className="lora-pill">
                          {getLoraName(lora.model)} ({lora.weight})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Comments section */}
                <div className="image-comments-section">
                  <h3 className="image-comments-heading">Comments</h3>
                  <ul className="image-comments-list" ref={commentsContainerRef}>
                    {(comments[activeImageId] || []).map(comment => (
                      <li key={comment.id} className="image-comment-item">
                        <div className="image-comment-avatar">
                          <img 
                            src={comment.profile_picture || '/default-avatar.png'} 
                            alt={comment.username} 
                            className="comment-avatar"
                            onClick={() => handleUsernameClick(comment.user_id)}
                          />
                        </div>
                        <div className="image-comment-content">
                          <div className="image-comment-header">
                            <span 
                              className="image-comment-username"
                              onClick={() => handleUsernameClick(comment.user_id)}
                            >
                              {comment.username}
                            </span>
                            <span className="image-comment-time">{formatTimestamp(comment.created_at)}</span>
                          </div>
                          <div className="image-comment-text">
                            {comment.comment_text || comment.text || comment.comment || ""}
                          </div>
                          <div className="image-comment-actions">
                            <button 
                              className={`image-comment-like-btn ${commentLikes[comment.id] ? 'liked' : ''}`}
                              onClick={() => handleCommentLike(comment.id, activeImageId)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                              </svg>
                              <span>{comment.likes || 0}</span>
                            </button>
                            
                            <button className="image-comment-reply-btn">Reply</button>
                          </div>
                        </div>
                      </li>
                    ))}
                    
                    {/* Show loading indicator if there are no comments */}
                    {(!comments[activeImageId] || comments[activeImageId].length === 0) && (
                      <div className="no-comments-message">No comments yet. Be the first to comment!</div>
                    )}
                  </ul>
                  
                  {/* Add a scroll progress indicator */}
                  <div className="scroll-progress">
                    <div className="scroll-progress-bar" style={{ top: '0%', height: '30%' }}></div>
                  </div>
                </div>
              </div>
              
              {/* Footer with comment form */}
              <div className="image-info-footer">
                <div className="image-comment-form">
                  <input 
                    type="text" 
                    className="image-comment-input" 
                    placeholder="Add a comment..." 
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && commentInput.trim()) {
                        e.preventDefault();
                        handleCommentSubmit(e);
                      }
                    }}
                  />
                  <button 
                    className="image-comment-submit"
                    onClick={(e) => {
                      if (commentInput.trim()) {
                        handleCommentSubmit(e);
                      }
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;