import express from 'express';
import multer from 'multer';
import { uploadProfilePicture, getLatestProfilePicture } from '../utils/profilePicture';

const router = express.Router();
const upload = multer();
const pool = require('../../server').pool;


router.put('/profile-picture', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = await uploadProfilePicture(req.file.buffer, req.user.id);
    
    // Update user profile in database
    await pool.query(
      'UPDATE users SET profile_picture_url = $1 WHERE id = $2',
      [imageUrl, req.user.id]
    );

    res.json({ imageUrl });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

router.post('/upload-profile-picture', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id; // Assuming you have auth middleware
    const result = await uploadProfilePicture(req.file.buffer, userId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      url: result.url,
      id: result.id
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

router.get('/profile-picture/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const url = await getLatestProfilePicture(userId);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile picture' });
  }
});

export default router;