// Import required modules
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({
    path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
  });
}
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg'); // Add PostgreSQL import
const axios = require('axios');
const multer = require('multer'); // Add multer for file uploads
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const { uploadToS3 } = require('./src/config/s3');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Update CORS configuration
const allowedOrigins = [
    'https://www.artmochi.com',
    'https://artmochi.com',
    'https://artmochi-frontend-production.up.railway.app',
    'http://localhost:3001',
    'https://artmochi-production.up.railway.app'
];

// 4. Update your corsOptions to include more headers
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 hours
};

// 1. First, move the CORS setup to the very top of your middleware stack
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Add after express initialization
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '50mb',
    parameterLimit: 50000 
}));

// Middleware in correct order
// 1. Basic middleware
app.use(express.json());
app.use(bodyParser.json());

// 2. Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// 2. Update CORS options
app.use(cors(corsOptions));

// Add this helper function
const sendVerificationEmail = async (email, token) => {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email - ArtMochi',
        html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #fe2c55;">Welcome to ArtMochi!</h1>
                <p>Please verify your email address by clicking the link below:</p>
                <a href="${verificationLink}" 
                   style="display: inline-block; padding: 12px 24px; 
                          background-color: #fe2c55; color: white; 
                          text-decoration: none; border-radius: 4px;">
                    Verify Email
                </a>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

// Add before your routes
app.options('*', cors(corsOptions));

// Add header size settings
app.use((req, res, next) => {
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Connection', 'keep-alive');
    next();
});

// 4. Static files and logging
app.use(express.static(path.join(__dirname, 'public')));


// 3. Serve profile pictures on '/profile_picture'

// 4. Static files and logging
app.use(express.static(path.join(__dirname, 'public')));


// 3. Serve profile pictures on '/profile_picture'
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    if (req.url.includes('/profile_pictures')) {
        console.log('Image request path:', req.url);
        console.log('Full image path:', path.join(__dirname, 'profile_pictures', req.url.split('/profile_pictures/')[1]));
    }
    next();
});

// Database setup
console.log('Running in:', process.env.NODE_ENV, 'mode');
console.log('Using database:', process.env.NODE_ENV === 'production' ? 'Railway PostgreSQL' : 'Local PostgreSQL');

// Update database configuration
const pool = new Pool({
    connectionString: process.env.NODE_ENV === 'production'
        ? process.env.DATABASE_PUBLIC_URL  // Railway PostgreSQL public URL
        : 'postgresql://jack:1321@localhost:5432/anime_ai_db', // Local development
    ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false }
        : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

// Add detailed connection logging
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err);
        console.log('Connection string:', process.env.NODE_ENV === 'production' 
            ? process.env.DATABASE_PUBLIC_URL 
            : 'postgresql://jack:1321@localhost:5432/anime_ai_db');
        return;
    }
    console.log(`Connected to ${process.env.NODE_ENV} database`);
    release();
});

// Add connection logging
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err);
        return;
    }
    console.log(`Connected to ${process.env.NODE_ENV} database at ${process.env.PGHOST}`);
    release();
});


// Single database connection check
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    } else {
        console.log('Database connected successfully at:', res.rows[0].now);
        pool.query('SELECT COUNT(*) FROM images', (err, res) => {
            if (err) {
                console.error('Error checking images table:', err);
            } else {
                console.log('Total images in database:', res.rows[0].count);
            }
        });
    }
});

// Single error handler
pool.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'ECONNREFUSED') {
        console.error('Ensure PostgreSQL is running');
    }
    process.exit(1);
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
        process.exit(1); // Exit if can't connect to database
    } else {
        console.log('Database connected successfully at:', res.rows[0].now);
        // Test image table
        pool.query('SELECT COUNT(*) FROM images', (err, res) => {
            if (err) {
                console.error('Error checking images table:', err);
            } else {
                console.log('Total images in database:', res.rows[0].count);
            }
        });
    }
});

// Add error handler for pool
pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    process.exit(1);
});

// Add better error handling
pool.on('error', (err) => {
    console.error('Database connection error:', err);
    if (err.code === 'ECONNREFUSED') {
        console.error('Ensure PostgreSQL is running:');
        console.error('brew services start postgresql@14');
    }
});

// Single connection check with detailed logging
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection failed:', err);
        console.error('Connection details:', {
            host: process.env.NODE_ENV === 'production' ? 'Railway PostgreSQL' : 'localhost',
            database: process.env.NODE_ENV === 'production' ? 'railway' : process.env.DB_NAME,
            port: process.env.NODE_ENV === 'production' ? process.env.DB_PORT : 5432
        });
    } else {
        console.log(`Connected to ${process.env.NODE_ENV === 'production' ? 'Railway' : 'Local'} PostgreSQL at:`, res.rows[0].now);
    }
});

// Reset the sequence for refresh_tokens
pool.query("SELECT setval('refresh_tokens_id_seq', (SELECT MAX(id) FROM refresh_tokens));");


// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET;

// Middleware to verify and refresh tokens
const authenticateTokenWithAutoRefresh = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Auth middleware decoded token:', decoded);
        
        req.user = {
            userId: decoded.userId,  // Match the token field name
            username: decoded.username,
            role: decoded.role
        };
        
        console.log('Set req.user:', req.user);
        next();
    } catch (err) {
        console.error('Token verification error:', err);
        res.status(403).json({ error: 'Invalid token' });
    }
};

// Middleware to optionally verify JWT
const optionalAuthenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return next(); // Skip authentication if no token is provided

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return next(); // Skip authentication if token is invalid
        req.user = user;
        next();
    });
};

// Add after middleware setup
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image file'));
        }
    }
});

const deleteFromS3 = async (imageUrl) => {
    try {
      // Extract the key from the full S3 URL
      const key = imageUrl.split('.amazonaws.com/')[1];
      
      const command = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key
      });
  
      await s3Client.send(command);
      return { success: true };
    } catch (error) {
      console.error('S3 deletion error:', error);
      return { success: false, error: error.message };
    }
  };

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Add after transporter setup
transporter.verify(function (error, success) {
    if (error) {
        console.log('SMTP config error:', error);
    } else {
        console.log('SMTP server is ready');
    }
});

// --- User Routes ---

// Modify your signup endpoint
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Check if username or email already exists
        const existingUser = await client.query(
            'SELECT username, email FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            const field = existingUser.rows[0].username === username ? 'username' : 'email';
            throw new Error(`${field} already exists`);
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpiry = new Date();
        verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hour expiry

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new user
        const result = await client.query(
            `INSERT INTO users (
                username, email, password, 
                verification_token, verification_expiry, 
                is_verified, role
            ) VALUES ($1, $2, $3, $4, $5, false, $6) 
            RETURNING id`,
            [username, email, hashedPassword, verificationToken, verificationExpiry, 'user']
        );

        // Send verification email
        await sendVerificationEmail(email, verificationToken);
        
        await client.query('COMMIT');

        res.status(201).json({
            message: 'Registration successful! Please check your email to verify your account.',
            requiresVerification: true
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Signup error:', error);
        
        if (error.message.includes('already exists')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Registration failed' });
        }
    } finally {
        client.release();
    }
});

// Add email verification endpoint
app.get('/verify-email/:token', async (req, res) => {
    const { token } = req.params;

    try {
        // First check if user exists and get their current status
        const userCheck = await pool.query(
            `SELECT id, username, role, is_verified, email 
             FROM users 
             WHERE verification_token = $1 OR email = (
                SELECT email FROM users WHERE verification_token = $1
             )`,
            [token]
        );

        if (userCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid verification link' });
        }

        const user = userCheck.rows[0];

        // Generate auth tokens regardless of verification status
        const authToken = jwt.sign(
            { userId: user.id, username: user.username, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );
        
        const refreshToken = jwt.sign(
            { userId: user.id, username: user.username, role: user.role }, 
            process.env.REFRESH_SECRET, 
            { expiresIn: '30d' }
        );

        // If not verified, verify them
        if (!user.is_verified) {
            await pool.query(
                `UPDATE users 
                 SET is_verified = true, 
                     verification_token = null 
                 WHERE id = $1`,
                [user.id]
            );
        }

        // Always return success with tokens
        res.json({ 
            message: 'Email verified successfully',
            token: authToken,
            refreshToken,
            userId: user.id
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

app.post('/check-credentials', async (req, res) => {
    const { username, email } = req.body;

    try {
        // Check if username exists
        const usernameCheck = await pool.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (usernameCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Username is already taken' });
        }

        // Check if email exists
        const emailCheck = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        res.json({ message: 'Credentials available' });
    } catch (error) {
        console.error('Error checking credentials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// User login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.is_verified) {
            return res.status(403).json({ 
                error: 'Please verify your email before logging in',
                requiresVerification: true
            });
        }

        const role = user.role;
        const token = jwt.sign({ userId: user.id, username: user.username, role }, JWT_SECRET, { expiresIn: '7d' });
        const refreshToken = jwt.sign({ userId: user.id, username: user.username, role }, REFRESH_SECRET, { expiresIn: '30d' });

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Delete existing refresh tokens for user
        await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);

        // Insert new refresh token
        await pool.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, refreshToken, expiresAt]
        );

        res.json({ token, refreshToken, userId: user.id, message: 'Login successful' });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Refresh token
app.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
    }

    try {
        const result = await pool.query(
            'SELECT rt.*, u.username, u.role FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.token = $1',
            [refreshToken]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        const { user_id, expires_at, username, role } = result.rows[0];

        // Check if token has expired
        if (new Date(expires_at) < new Date()) {
            await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
            return res.status(403).json({ error: 'Refresh token expired' });
        }

        // Generate new tokens
        const newToken = jwt.sign(
            { userId: user_id, username, role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const newRefreshToken = jwt.sign(
            { userId: user_id, username, role },
            process.env.REFRESH_SECRET,
            { expiresIn: '30d' }
        );

        // Update refresh token in database
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 7);

        await pool.query(
            'UPDATE refresh_tokens SET token = $1, expires_at = $2 WHERE user_id = $3 AND token = $4',
            [newRefreshToken, newExpiresAt, user_id, refreshToken]
        );

        res.json({ token: newToken, refreshToken: newRefreshToken });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

// Refresh token route
app.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
            [refreshToken]
        );
        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }
        // ...existing token generation code...
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

// Logout route (optional for clearing refresh tokens)
app.post('/logout', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
    }

    pool.query(
        `DELETE FROM refresh_tokens WHERE token = $1`,
        [refreshToken],
        (err) => {
            if (err) {
                console.error('Error deleting refresh token:', err);
                return res.status(500).json({ error: 'Failed to log out' });
            }
            res.json({ message: 'Logged out successfully' });
        }
    );
});

// --- Image Routes ---

// 2. Add corsOptions to all your routes that handle images
app.get('/images', cors(corsOptions), optionalAuthenticateToken, async (req, res) => {
    try {
        const { sortType = 'newest', page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const orderQuery = `
            SELECT i.id
            FROM images i
            LEFT JOIN (
                SELECT image_id,
                    COUNT(*) as total_likes,
                    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_likes
                FROM likes
                GROUP BY image_id
            ) l ON l.image_id = i.id
            LEFT JOIN (
                SELECT image_id,
                    COUNT(*) as total_comments,
                    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_comments
                FROM comments
                GROUP BY image_id
            ) c ON c.image_id = i.id
            ORDER BY 
                CASE 
                    WHEN $1 = 'mostLiked' THEN (SELECT COUNT(*) FROM likes WHERE image_id = i.id)
                    WHEN $1 = 'mostCommented' THEN (SELECT COUNT(*) FROM comments WHERE image_id = i.id)
                    WHEN $1 = 'trending' THEN 
                        (COALESCE(recent_likes, 0) * 2 + COALESCE(recent_comments, 0) * 3) * 
                        (1 + (1000000 / (EXTRACT(epoch FROM NOW() - i.created_at) + 1)))
                    ELSE extract(epoch from i.created_at)::bigint
                END DESC`;

        const sortedIds = (await pool.query(orderQuery, [sortType])).rows.map(row => row.id);
        const totalImages = sortedIds.length;

        if (offset >= totalImages) {
            return res.json({
                images: [],
                hasMore: false,
                total: totalImages
            });
        }

        const pageIds = sortedIds.slice(offset, Math.min(offset + limit, totalImages));

        const result = await pool.query(`
            SELECT i.*, 
                   u.username,
                   u.profile_picture,
                   (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as like_count,
                   (SELECT COUNT(*) FROM comments WHERE image_id = i.id) as comment_count,
                   EXISTS(SELECT 1 FROM likes WHERE image_id = i.id AND user_id = $1) as user_has_liked
            FROM images i
            LEFT JOIN users u ON i.user_id = u.id
            WHERE i.id = ANY($2)
            ORDER BY array_position($2::int[], i.id)
            LIMIT $3`,
            [req.user?.userId || null, pageIds, limit]
        );

        res.json({
            images: result.rows,
            hasMore: offset + result.rows.length < totalImages,
            total: totalImages
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/images', cors(corsOptions), optionalAuthenticateToken, async (req, res) => {
    try {
        const { sortType = 'newest', page = 1, limit = 20 } = req.query;
        const { globalLikeCounts, globalCommentCounts } = req.body;
        const offset = (page - 1) * limit;

        const allImagesQuery = `
            SELECT i.id, i.created_at,
                   (SELECT COUNT(*) FROM likes 
                    WHERE image_id = i.id 
                    AND created_at > NOW() - INTERVAL '24 hours') as recent_likes,
                   (SELECT COUNT(*) FROM comments 
                    WHERE image_id = i.id 
                    AND created_at > NOW() - INTERVAL '24 hours') as recent_comments
            FROM images i
            ORDER BY created_at DESC`;
            
        const allImages = await pool.query(allImagesQuery);
        
        const sortedIds = allImages.rows
            .sort((a, b) => {
                if (sortType === 'mostLiked') {
                    return (globalLikeCounts[b.id] || 0) - (globalLikeCounts[a.id] || 0);
                }
                if (sortType === 'mostCommented') {
                    return (globalCommentCounts[b.id] || 0) - (globalCommentCounts[a.id] || 0);
                }
                if (sortType === 'trending') {
                    const scoreA = (a.recent_likes * 2 + a.recent_comments * 3) * 
                                 (1 + (1000000 / (Date.now() - new Date(a.created_at).getTime() + 1)));
                    const scoreB = (b.recent_likes * 2 + b.recent_comments * 3) * 
                                 (1 + (1000000 / (Date.now() - new Date(b.created_at).getTime() + 1)));
                    return scoreB - scoreA;
                }
                return new Date(b.created_at) - new Date(a.created_at);
            })
            .map(img => img.id);

        const pageIds = sortedIds.slice(offset, offset + limit);

        const result = await pool.query(`
            SELECT i.*, u.username, u.profile_picture
            FROM images i
            LEFT JOIN users u ON i.user_id = u.id
            WHERE i.id = ANY($1)
            ORDER BY array_position($1::int[], i.id)`,
            [pageIds]
        );

        res.json({
            images: result.rows,
            hasMore: offset + limit < sortedIds.length
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});
// Fetch single image
app.get('/images/:id', authenticateTokenWithAutoRefresh, async (req, res) => {
    const imageId = parseInt(req.params.id);
    
    if (isNaN(imageId)) {
        return res.status(400).json({ error: "Invalid image ID" });
    }

    try {
        const result = await pool.query(`
            SELECT 
                i.*,
                u.username, 
                u.profile_picture, 
                u.id AS user_id
            FROM images i
            JOIN users u ON i.user_id = u.id 
            WHERE i.id = $1
        `, [imageId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Image not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "An unexpected error occurred" });
    }
});

app.get('/image_counts', authenticateTokenWithAutoRefresh, async (req, res) => {
    try {
        const likes = await pool.query(`
            SELECT image_id, COUNT(*) as count 
            FROM likes 
            GROUP BY image_id
        `);
        
        const comments = await pool.query(`
            SELECT image_id, COUNT(*) as count 
            FROM comments 
            GROUP BY image_id
        `);

        res.json({
            likes: Object.fromEntries(likes.rows.map(r => [r.image_id, r.count])),
            comments: Object.fromEntries(comments.rows.map(r => [r.image_id, r.count]))
        });
    } catch (error) {
        console.error('Error fetching counts:', error);
        res.status(500).json({ error: 'Failed to fetch counts' });
    }
});

const FORGE_URL = 'http://127.0.0.1:7860';

// Generate image
app.post('/generate_image', authenticateTokenWithAutoRefresh, async (req, res) => {
    try {
        // ... existing ForgeUI call ...

        if (response.data?.images?.[0]) {
            // Upload to S3 instead of storing base64
            const key = `generated/${Date.now()}-${userId}.jpg`;
            const imageBuffer = Buffer.from(response.data.images[0], 'base64');
            
            const s3Result = await uploadToS3(imageBuffer, key);
            if (!s3Result.success) {
                throw new Error(s3Result.error);
            }

            const result = await pool.query(
                `INSERT INTO images (user_id, image_url, prompt, negative_prompt, steps, width, height) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [userId, s3Result.url, prompt, negativePrompt, steps, width, height]
            );

            res.json({ 
                image: s3Result.url, 
                imageId: result.rows[0].id 
            });
        }
    } catch (error) {
        console.error('Image generation error:', error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

// Like an Image
app.post('/add_like', authenticateTokenWithAutoRefresh, async (req, res) => {
    const { userId, imageId } = req.body;

    try {
        await pool.query(
            'INSERT INTO likes (user_id, image_id) VALUES ($1, $2)',
            [userId, imageId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add like' });
    }
});

// Like image
app.post('/like_image', authenticateTokenWithAutoRefresh, async (req, res) => {
    const { imageId } = req.body;
    const userId = req.user.userId;
    try {
        await pool.query(
            'INSERT INTO likes (user_id, image_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, imageId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({ error: 'Failed to like image' });
    }
});

// Get Likes for an Image
app.get('/image_likes/:imageId', authenticateTokenWithAutoRefresh, (req, res) => {
    const { imageId } = req.params;

    pool.query(
        `SELECT COUNT(*) as likeCount FROM likes WHERE image_id = $1`,
        [imageId],
        (err, result) => {
            if (err) {
                console.error('Error fetching likes:', err);
                return res.status(500).json({ error: 'Failed to fetch likes' });
            }
            res.json({ imageId, likeCount: result.rows[0].likecount });
        }
    );
});

// Delete image
app.delete('/images/:id', authenticateTokenWithAutoRefresh, async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get the user's role from the auth token
      const isAdmin = req.user.role === 'admin';
      
      // First get the image URL
      const imageQuery = isAdmin 
        ? 'SELECT image_url FROM images WHERE id = $1'
        : 'SELECT image_url FROM images WHERE id = $1 AND user_id = $2';
      
      const imageParams = isAdmin ? [req.params.id] : [req.params.id, req.user.userId];
      const imageResult = await client.query(imageQuery, imageParams);
  
      if (imageResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Image not found or unauthorized' });
      }
  
      const imageUrl = imageResult.rows[0].image_url;
  
      // Delete from S3
      const s3Result = await deleteFromS3(imageUrl);
      if (!s3Result.success) {
        throw new Error(`Failed to delete from S3: ${s3Result.error}`);
      }
  
      // Delete from database
      const deleteQuery = isAdmin 
        ? 'DELETE FROM images WHERE id = $1'
        : 'DELETE FROM images WHERE id = $1 AND user_id = $2';
      
      await client.query(deleteQuery, imageParams);
      await client.query('COMMIT');
  
      res.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    } finally {
      client.release();
    }
  });

// Fetch likes for a specific image
app.get('/fetch_likes', authenticateTokenWithAutoRefresh, async (req, res) => {
    const imageId = req.query.id;
    const userId = req.user.id;

    try {
        const likesCount = await pool.query(
            'SELECT COUNT(*) FROM likes WHERE image_id = $1',
            [imageId]
        );
        const userLiked = await pool.query(
            'SELECT EXISTS(SELECT 1 FROM likes WHERE image_id = $1 AND user_id = $2)',
            [imageId, userId]
        );
        res.json({
            likes: parseInt(likesCount.rows[0].count),
            userHasLiked: userLiked.rows[0].exists
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch likes' });
    }
});

app.delete('/remove_like', (req, res) => {
    const { userId, imageId } = req.body;

    const deleteQuery = `
        DELETE FROM likes
        WHERE user_id = $1 AND image_id = $2;
    `;

    // Execute the delete query
    pool.query(deleteQuery, [userId, imageId], function (err) {
        if (err) {
            console.error('Error removing like:', err);
            return res.status(500).json({ error: 'Failed to remove like' });
        }

        // Check if any rows were affected
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Like not found' }); // No like to remove
        }

        res.status(200).json({ message: 'Like removed successfully' }); // Successful deletion
    });
});

// Single endpoint for handling likes
app.route('/likes/:imageId')
    .get(authenticateTokenWithAutoRefresh, async (req, res) => {
        const imageId = req.params.imageId;
        const userId = req.user.userId;

        try {
            const result = await pool.query(`
                SELECT 
                    COUNT(*) as total_likes,
                    EXISTS(
                        SELECT 1 FROM likes 
                        WHERE image_id = $1 AND user_id = $2
                    ) as user_liked
                FROM likes 
                WHERE image_id = $1
            `, [imageId, userId]);

            res.json({
                count: parseInt(result.rows[0].total_likes),
                userHasLiked: result.rows[0].user_liked
            });
        } catch (error) {
            console.error('Error handling likes:', error);
            res.status(500).json({ error: 'Failed to process likes request' });
        }
    })
    .post(authenticateTokenWithAutoRefresh, async (req, res) => {
        const imageId = req.params.imageId;
        const userId = req.user.userId;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            await client.query(`
                INSERT INTO likes (user_id, image_id)
                VALUES ($1, $2)
                ON CONFLICT (user_id, image_id) DO NOTHING
            `, [userId, imageId]);

            const likeCount = await client.query(`
                SELECT COUNT(*) as count
                FROM likes
                WHERE image_id = $1
            `, [imageId]);

            await client.query('COMMIT');
            
            res.json({
                success: true,
                count: parseInt(likeCount.rows[0].count)
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Like error:', error);
            res.status(500).json({ error: 'Failed to like image' });
        } finally {
            client.release();
        }
    })
    .delete(authenticateTokenWithAutoRefresh, async (req, res) => {
        const imageId = req.params.imageId;
        const userId = req.user.userId;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            await client.query(`
                DELETE FROM likes
                WHERE user_id = $1 AND image_id = $2
            `, [userId, imageId]);

            const likeCount = await client.query(`
                SELECT COUNT(*) as count
                FROM likes
                WHERE image_id = $1
            `, [imageId]);

            await client.query('COMMIT');
            
            res.json({
                success: true,
                count: parseInt(likeCount.rows[0].count)
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Unlike error:', error);
            res.status(500).json({ error: 'Failed to unlike image' });
        } finally {
            client.release();
        }
    });

// --- Comment Routes ---

// Add Comment to an Image
app.post('/add_comment', authenticateTokenWithAutoRefresh, async (req, res) => {
    const { userId, imageId, comment } = req.body;

    try {
        await pool.query(
            'INSERT INTO comments (user_id, image_id, comment) VALUES ($1, $2, $3)',
            [userId, imageId, comment]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Add comment
app.post('/add_comment', authenticateTokenWithAutoRefresh, async (req, res) => {
    const { imageId, comment } = req.body;
    const userId = req.user.userId;
    try {
        await pool.query(
            'INSERT INTO comments (user_id, image_id, comment) VALUES ($1, $2, $3)',
            [userId, imageId, comment]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Comment add error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Fetch comments for a specific image
app.get('/fetch_comments', authenticateTokenWithAutoRefresh, async (req, res) => {
    const imageId = req.query.id;
    const userId = req.user.userId;
    console.log('Fetching comments for image:', imageId);

    try {
        const result = await pool.query(`
            SELECT 
                c.*,
                u.username,
                u.profile_picture,
                COUNT(DISTINCT cl.id) as like_count,
                EXISTS (
                    SELECT 1 
                    FROM comment_likes cl2 
                    WHERE cl2.comment_id = c.id 
                    AND cl2.user_id = $2
                ) as user_has_liked
            FROM comments c 
            JOIN users u ON c.user_id = u.id 
            LEFT JOIN comment_likes cl ON cl.comment_id = c.id
            WHERE c.image_id = $1 
            GROUP BY c.id, u.username, u.profile_picture
            ORDER BY c.created_at DESC`,
            [imageId, userId]
        );
        res.json({ comments: result.rows });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

app.route('/comment_likes/:commentId')
    .get(authenticateTokenWithAutoRefresh, async (req, res) => {
        const { commentId } = req.params;
        const userId = req.user.userId;
        
        try {
            const result = await pool.query(`
                SELECT COUNT(*) as count,
                EXISTS(
                    SELECT 1 
                    FROM comment_likes 
                    WHERE comment_id = $1 
                    AND user_id = $2
                ) as user_liked
                FROM comment_likes 
                WHERE comment_id = $1`, 
                [commentId, userId]
            );
            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error fetching comment likes:', error);
            res.status(500).json({ error: 'Failed to fetch comment likes' });
        }
    })
    .post(authenticateTokenWithAutoRefresh, async (req, res) => {
        const { commentId } = req.params;
    const userId = req.user.userId;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if like exists in comment_likes table
        const existingLike = await client.query(
            'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
            [commentId, userId]
        );

        if (existingLike.rows.length > 0) {
            // Remove like from comment_likes table
            await client.query(
                'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
                [commentId, userId]
            );
        } else {
            // Add like to comment_likes table
            await client.query(
                'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)',
                [commentId, userId]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error liking comment:', error);
        res.status(500).json({ error: 'Failed to toggle like' });
    } finally {
        client.release();
    }
})
.delete(authenticateTokenWithAutoRefresh, async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.userId;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        await client.query(
            'DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2',
            [userId, commentId]
        );
        
        const result = await client.query(
            'SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = $1',
            [commentId]
        );
        
        await client.query('COMMIT');
        res.json({ 
            success: true, 
            count: parseInt(result.rows[0].count) 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error unliking comment:', error);
        res.status(500).json({ error: 'Failed to unlike comment' });
    } finally {
        client.release();
    }
});

// --- Favorites Routes (Optional) ---

// Add an Image to Favorites
app.post('/add_favorite', authenticateTokenWithAutoRefresh, (req, res) => {
    const { imageId } = req.body;
    const userId = req.user.userId;

    pool.query(
        `INSERT INTO favorites (user_id, image_id) VALUES ($1, $2)`,
        [userId, imageId],
        function (err) {
            if (err) {
                console.error('Error adding to favorites:', err);
                return res.status(400).json({ error: 'Failed to add to favorites' });
            }
            res.status(201).json({ message: 'Image added to favorites' });
        }
    );
});

// Upload Profile Picture
app.post('/upload_profile_picture', cors(corsOptions),  authenticateTokenWithAutoRefresh, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user.userId;
        const key = `profile-pictures/${userId}-${Date.now()}.jpg`;

        // Upload to S3
        const s3Result = await uploadToS3(req.file.buffer, key);
        if (!s3Result.success) {
            throw new Error(s3Result.error || 'Failed to upload to S3');
        }

        // Save to database
        await pool.query('BEGIN');

        const result = await pool.query(
            'INSERT INTO profile_pictures (user_id, filename, filepath) VALUES ($1, $2, $3) RETURNING id',
            [userId, key, s3Result.url]
        );

        await pool.query('COMMIT');

        res.json({
            success: true,
            filepath: s3Result.url,
            id: result.rows[0].id
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Profile picture upload error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to upload profile picture' 
        });
    }
});

// Update profile picture retrieval endpoint
app.get('/profile_picture', cors(corsOptions),  authenticateTokenWithAutoRefresh, async (req, res) => {
    const userId = req.user.userId; // Changed from req.user.id to req.user.userId
    console.log('Fetching profile picture for user:', userId);
    
    try {
        const query = `
            SELECT 
                pp.filepath as profile_picture_url,
                u.username
            FROM users u
            LEFT JOIN profile_pictures pp 
                ON pp.user_id = u.id 
                AND pp.id = (
                    SELECT id 
                    FROM profile_pictures 
                    WHERE user_id = u.id 
                    AND deleted_at IS NULL
                    ORDER BY created_at DESC 
                    LIMIT 1
                )
            WHERE u.id = $1
        `;
        
        const result = await pool.query(query, [userId]);
        console.log('Query result:', result.rows[0]);
        
        if (!result.rows.length) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const profilePicture = result.rows[0].filepath || 
                             result.rows[0].profile_picture_url || 
                             'default-avatar.png';
                             
        console.log('Selected profile picture:', profilePicture);
        
        res.json({ 
            profile_picture: profilePicture,
            username: result.rows[0].username 
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/update_profile/:id', authenticateTokenWithAutoRefresh, async (req, res) => {
    const userId = req.params.id;
    const { username, bio } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        const query = `
            UPDATE users
            SET username = COALESCE($1, username),
                bio = COALESCE($2, bio)
            WHERE id = $3
            RETURNING username, bio,
                (SELECT filepath FROM profile_pictures 
                 WHERE user_id = $3 
                 AND deleted_at IS NULL
                 ORDER BY created_at DESC 
                 LIMIT 1) as profile_picture_url
        `;
        
        const { rows } = await client.query(query, [username, bio, userId]);
        await client.query('COMMIT');

        if (!rows.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ 
            message: 'Profile updated successfully', 
            data: {
                ...rows[0],
                profile_picture: rows[0].profile_picture_url || '/default-avatar.png'
            }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating profile:', err);
        return res.status(500).json({ error: 'Failed to update profile' });
    } finally {
        client.release();
    }
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: err.message 
    });
});

// Ensure HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            return res.redirect(`https://${req.header('host')}${req.url}`);
        }
        next();
    });
}

// Endpoint to get user profile
app.get('/user_profile/:id', authenticateTokenWithAutoRefresh, async (req, res) => {
    const userId = req.params.id;
    console.log('Token user:', req.user);
    console.log(`Fetching profile for user ID: ${userId}`);

    try {
        const result = await pool.query(`
            SELECT 
                u.username, 
                u.bio,
                u.email, 
                COALESCE(pp.filepath, u.profile_picture) as profile_picture
            FROM users u
            LEFT JOIN profile_pictures pp 
                ON pp.user_id = u.id 
                AND pp.id = (
                    SELECT id 
                    FROM profile_pictures 
                    WHERE user_id = u.id 
                    ORDER BY created_at DESC 
                    LIMIT 1
                )
            WHERE u.id = $1
        `, [userId]);

        if (!result.rows[0]) {
            console.log('No user found for ID:', userId);
            return res.status(404).json({ error: 'User not found' });
        }

        const row = result.rows[0];
        const profilePicture = row.profile_picture || 'default-avatar.png';
        
        console.log('Found user data:', {
            userId,
            username: row.username,
            email: row.email,
            profile_picture: profilePicture
        });

        // Use dynamic origin from request headers
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
        }
        res.header('Access-Control-Allow-Credentials', 'true');

        res.json({ 
            userId,
            username: row.username,
            bio: row.bio,
            email: row.email,
            profile_picture: profilePicture
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

app.post('/user_profiles/batch', authenticateTokenWithAutoRefresh, async (req, res) => {
    const { imageId } = req.body;
    try {
        // Fetch image details to get user IDs
        const image = await db.query('SELECT user_id FROM images WHERE id = $1', [imageId]);
        const comments = await db.query('SELECT DISTINCT user_id FROM comments WHERE image_id = $1', [imageId]);
        
        // Get unique user IDs
        const userIds = new Set([image.rows[0].user_id, ...comments.rows.map(c => c.user_id)]);
        
        // Fetch all profiles in one query
        const profiles = await db.query(
            'SELECT * FROM user_profiles WHERE user_id = ANY($1)',
            [Array.from(userIds)]
        );

        // Return as map of userId to profile
        const profileMap = profiles.rows.reduce((map, profile) => {
            map[profile.user_id] = profile;
            return map;
        }, {});

        res.json(profileMap);
    } catch (error) {
        console.error('Error fetching batch profiles:', error);
        res.status(500).json({ error: 'Failed to fetch profiles' });
    }
});

// Endpoint to update user profile
app.post('/update_profile', authenticateTokenWithAutoRefresh, async (req, res) => {
    console.log('update_profile called, req.user:', req.user); // Debug log
    const userId = req.user.id; // Must exist in DB
    const { username, bio } = req.body;

    const query = `
        UPDATE users
        SET username = COALESCE($1, username), 
            bio = COALESCE($2, bio)
        WHERE id = $3
        RETURNING username, bio
    `;
    
    try {
        const result = await pool.query(query, [username, bio, userId]);
        if (!result.rows.length) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'Profile updated successfully', data: result.rows[0] });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.post('/change_password', authenticateTokenWithAutoRefresh, async (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    
    try {
        // First verify the current password
        const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update the password
        await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedPassword, userId]
        );

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});


app.get('/user_images/:userId', authenticateTokenWithAutoRefresh, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT i.*, 
                   u.username, 
                   COALESCE(pp.filepath, u.profile_picture) as profile_picture
            FROM images i
            JOIN users u ON i.user_id = u.id
            LEFT JOIN profile_pictures pp ON pp.user_id = u.id 
                AND pp.id = (
                    SELECT id FROM profile_pictures 
                    WHERE user_id = u.id 
                    AND deleted_at IS NULL
                    ORDER BY created_at DESC 
                    LIMIT 1
                )
            WHERE i.user_id = $1 
            ORDER BY i.created_at DESC
        `, [req.params.userId]);
        
        res.json({ images: result.rows });
    } catch (error) {
        console.error('Error fetching user images:', error);
        res.status(500).json({ error: 'Failed to fetch user images' });
    }
});

// Follow user
app.post('/follow/:userId', authenticateTokenWithAutoRefresh, async (req, res) => {
    try {
        // Debug logs
        console.log('Follow request:', {
            follower: req.user.userId,
            following: req.params.userId
        });
        
        const followerId = req.user.userId;
        const followingId = req.params.userId;
        
        // Prevent self-following
        if (followerId === parseInt(followingId)) {
            console.log('Self-follow attempt prevented');
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }
        
        await pool.query(
            'INSERT INTO followers (follower_id, following_id) VALUES ($1, $2)',
            [followerId, followingId]
        );
        
        res.json({ message: 'Successfully followed user' });
    } catch (error) {
        // Detailed error logging
        console.error('Follow error:', error);
        res.status(500).json({ error: 'Failed to follow user' });
    }
});

// Unfollow user
app.delete('/follow/:userId', authenticateTokenWithAutoRefresh, async (req, res) => {
    try {
        // Debug logs
        console.log('Unfollow request:', {
            follower: req.user.userId,
            following: req.params.userId
        });
        
        const followerId = req.user.userId; // Changed from req.user.id
        const followingId = req.params.userId;
        
        await pool.query(
            'DELETE FROM followers WHERE follower_id = $1 AND following_id = $2',
            [followerId, followingId]
        );
        
        res.json({ message: 'Successfully unfollowed user' });
    } catch (error) {
        // Detailed error logging
        console.error('Unfollow error:', error);
        res.status(500).json({ error: 'Failed to unfollow user' });
    }
});

// Get user stats

app.get('/user/:userId/stats', authenticateTokenWithAutoRefresh, async (req, res) => {
    const userId = req.params.userId;
    console.log(`Fetching stats for user ID: ${userId}`);

    try {
        const result = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM followers WHERE following_id = $1) as followers_count,
                (SELECT COUNT(*) FROM followers WHERE follower_id = $1) as following_count,
                (SELECT COUNT(*) FROM images WHERE user_id = $1) as posts_count,
                (SELECT COUNT(*) FROM likes l 
                 JOIN images i ON l.image_id = i.id 
                 WHERE i.user_id = $1) as likes_count,
                EXISTS(
                    SELECT 1 FROM followers 
                    WHERE follower_id = $2 AND following_id = $1
                ) as is_following
        `, [userId, req.user.userId]);

        // Use dynamic origin from request headers
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
        }
        res.header('Access-Control-Allow-Credentials', 'true');

        console.log('User stats:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Failed to fetch user stats' });
    }
});

app.get('/user/:id/likes', authenticateTokenWithAutoRefresh, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT i.*, 
                   u.username, 
                   u.profile_picture,
                   u.id as user_id,
                   (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as like_count
            FROM images i
            JOIN likes l ON i.id = l.image_id
            JOIN users u ON i.user_id = u.id
            WHERE l.user_id = $1
            ORDER BY l.created_at DESC
        `, [req.params.id]);
        
        res.json({ images: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch liked images' });
    }
});

app.get('/following/posts', authenticateTokenWithAutoRefresh, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                i.*,
                u.username,
                u.profile_picture,
                u.id as user_id,
                (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as like_count,
                EXISTS(
                    SELECT 1 FROM likes 
                    WHERE image_id = i.id AND user_id = $1
                ) as user_has_liked,
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', c.id,
                            'comment', c.comment,
                            'username', cu.username,
                            'profile_picture', cu.profile_picture,
                            'created_at', c.created_at
                        )
                    )
                    FROM comments c
                    JOIN users cu ON c.user_id = cu.id
                    WHERE c.image_id = i.id
                ) as comments
            FROM images i
            JOIN followers f ON i.user_id = f.following_id
            JOIN users u ON i.user_id = u.id
            WHERE f.follower_id = $1
            ORDER BY i.created_at DESC
        `, [req.user.userId]);

        console.log(`Found ${result.rows.length} posts from followed users`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching following posts:', error);
        res.status(500).json({ error: 'Failed to fetch following posts' });
    }
});

app.get('/user/:userId/following', authenticateTokenWithAutoRefresh, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id,
                u.username,
                u.profile_picture,
                EXISTS(
                    SELECT 1 FROM followers 
                    WHERE follower_id = $2 AND following_id = u.id
                ) as is_following
            FROM followers f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = $1
            ORDER BY f.created_at DESC
        `, [req.params.userId, req.user.userId]);
        
        console.log('Following list:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching following:', error);
        res.status(500).json({ error: 'Failed to fetch following list' });
    }
});

app.get('/user/:userId/followers', authenticateTokenWithAutoRefresh, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id,
                u.username,
                u.profile_picture,
                EXISTS(
                    SELECT 1 FROM followers 
                    WHERE follower_id = $2 AND following_id = u.id
                ) as is_following
            FROM followers f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = $1
            ORDER BY f.created_at DESC
        `, [req.params.userId, req.user.userId]);
        
        console.log('Followers list:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ error: 'Failed to fetch followers list' });
    }
});

app.post('/save_generated_image', authenticateTokenWithAutoRefresh, async (req, res) => {
    const { imageData, prompt, userId } = req.body;
    
    try {
        const key = `saved/${Date.now()}-${userId}.jpg`;
        const imageBuffer = Buffer.from(imageData, 'base64');
        
        const s3Result = await uploadToS3(imageBuffer, key);
        if (!s3Result.success) {
            throw new Error(s3Result.error);
        }

        const result = await pool.query(
            `INSERT INTO images (user_id, image_url, prompt, created_at) 
             VALUES ($1, $2, $3, NOW()) 
             RETURNING id`,
            [userId, s3Result.url, prompt]
        );
        
        res.json({ 
            success: true, 
            imageId: result.rows[0].id,
            imageUrl: s3Result.url
        });
    } catch (error) {
        console.error('Error saving image:', error);
        res.status(500).json({ error: 'Failed to save image' });
    }
});

app.post('/api/replicate', authenticateTokenWithAutoRefresh, async (req, res) => {
    try {
        // Log token for debugging
        console.log('Using Replicate token:', process.env.REPLICATE_API_TOKEN);
        
        const response = await axios({
            method: 'post',
            url: 'https://api.replicate.com/v1/predictions',
            headers: {
                'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: {
                version: req.body.version,
                input: req.body.input
            }
        });

        // 2. Poll for completion
        let prediction = response.data;
        while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const pollResponse = await axios({
                method: 'get',
                url: `https://api.replicate.com/v1/predictions/${prediction.id}`,
                headers: {
                    'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
                }
            });
            prediction = pollResponse.data;
        }

        if (prediction.status === 'failed') {
            throw new Error('Image generation failed');
        }

        // 3. Download and upload to S3
        if (prediction.output?.[0]) {
            const imageResponse = await axios({
                url: prediction.output[0],
                responseType: 'arraybuffer'
            });

            // Upload to S3 instead of converting to base64
            const key = `generated/${Date.now()}-${req.user.userId}.webp`;
            const s3Result = await uploadToS3(
                imageResponse.data,
                key,
                'image/webp'
            );

            if (!s3Result.success) {
                throw new Error('Failed to upload to S3');
            }

            const result = await pool.query(
                `INSERT INTO images (user_id, image_url, prompt, negative_prompt, steps, width, height) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [
                    req.user.userId,
                    s3Result.url,  // Use the URL from the response object
                    req.body.input.prompt,
                    req.body.input.negative_prompt || '',
                    req.body.input.num_inference_steps,
                    req.body.input.width || 1024,
                    req.body.input.height || 1024
                ]
            );

            res.json({
                image: s3Result.url,  // Use the URL from the response object
                imageId: result.rows[0].id
            });
        }
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

app.post('/resend-verification', async (req, res) => {
    const { email } = req.body;
    
    try {
        // Check if email exists and is unverified
        const result = await pool.query(
            'SELECT id, username FROM users WHERE email = $1 AND NOT is_verified',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ 
                error: 'Invalid email or account already verified' 
            });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpiry = new Date();
        verificationExpiry.setHours(verificationExpiry.getHours() + 24);

        // Update user with new token
        await pool.query(
            `UPDATE users 
             SET verification_token = $1, 
                 verification_expiry = $2 
             WHERE email = $3`,
            [verificationToken, verificationExpiry, email]
        );

        // Send new verification email
        await sendVerificationEmail(email, verificationToken);

        res.json({ message: 'Verification email sent successfully' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Failed to resend verification email' });
    }
});

app.post('/check-verification', async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query(
      'SELECT id, username, role, is_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (user.is_verified) {
      // Generate tokens for auto-login
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        process.env.REFRESH_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        isVerified: true,
        token,
        refreshToken
      });
    }

    res.json({ isVerified: false });
  } catch (error) {
    console.error('Check verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
if (process.env.NODE_ENV === 'production') {
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ error: 'Something broke!' });
    });
}

// Development error handling with more details
if (process.env.NODE_ENV !== 'production') {
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({
            error: err.message,
            stack: err.stack
        });
    });
}

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

