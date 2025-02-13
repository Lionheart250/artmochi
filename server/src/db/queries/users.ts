import { db } from '../db';

export const getUserProfile = async (userId: string) => {
  const result = await db.query(`
    SELECT u.*, 
           pp.filepath as profile_picture_url
    FROM users u
    LEFT JOIN (
      SELECT DISTINCT ON (user_id) *
      FROM profile_pictures
      WHERE deleted_at IS NULL
      ORDER BY user_id, created_at DESC
    ) pp ON u.id = pp.user_id
    WHERE u.id = $1
  `, [userId]);
  
  return result.rows[0];
};