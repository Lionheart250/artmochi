import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../config/s3';
import { db } from '../db';

interface ProfilePictureResult {
  success: boolean;
  url?: string;
  error?: string;
  id?: number;
}

export const uploadProfilePicture = async (
  file: Buffer,
  userId: string
): Promise<ProfilePictureResult> => {
  try {
    const key = `profile-pictures/${userId}-${Date.now()}.jpg`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: 'image/jpeg',
      ServerSideEncryption: 'AES256',
      ACL: 'public-read'
    });

    await s3Client.send(command);
    const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Insert into profile_pictures table
    const result = await db.query(
      `INSERT INTO profile_pictures (user_id, filename, filepath) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      [userId, key.split('/').pop(), url]
    );

    return {
      success: true,
      url,
      id: result.rows[0].id
    };
  } catch (error) {
    console.error('Profile picture upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const getLatestProfilePicture = async (userId: string): Promise<string | null> => {
  try {
    const result = await db.query(
      `SELECT filepath 
       FROM profile_pictures 
       WHERE user_id = $1 
       AND deleted_at IS NULL 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );
    
    return result.rows[0]?.filepath || null;
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    return null;
  }
};

export const softDeleteProfilePicture = async (pictureId: number): Promise<boolean> => {
  try {
    await db.query(
      `UPDATE profile_pictures 
       SET deleted_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [pictureId]
    );
    return true;
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    return false;
  }
};