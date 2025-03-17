const { RekognitionClient, DetectLabelsCommand } = require('@aws-sdk/client-rekognition');
const fetch = require('node-fetch');  // Add this import
const sharp = require('sharp');
const axios = require('axios');
const { uploadToS3 } = require('../src/config/s3');
const path = require('path');
const crypto = require('crypto');

const rekognition = new RekognitionClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const categoryMapping = {
    // People Categories
    'Person': ['portrait', 0.8],
    'Woman': ['woman', 0.9],
    'Man': ['man', 0.9],
    'Face': ['portrait', 0.8],
    'Human': ['portrait', 0.7],
    
    // Anime/Art Categories
    'Anime': ['anime', 0.9],
    'Cartoon': ['anime', 0.8],
    'Manga': ['anime', 0.9],
    'Animation': ['anime', 0.7],
    'Digital Art': ['digital_art', 0.8],
    'Painting': ['painting', 0.8],
    'Illustration': ['illustration', 0.8],
    
    // Subject Categories
    'Animal': ['animal', 0.9],
    'Pet': ['animal', 0.8],
    'Food': ['food', 0.9],
    'Meal': ['food', 0.8],
    'Armor': ['armor', 0.9],
    'Weapon': ['weapon', 0.9],
    
    // Environment Categories
    'Landscape': ['outdoors', 0.9],
    'Nature': ['outdoors', 0.8],
    'Architecture': ['architecture', 0.9],
    'Building': ['architecture', 0.8],
    'City': ['cityscape', 0.9],
    'Space': ['space', 0.9],
    'Indoor': ['indoor', 0.8],
    'Outdoor': ['outdoors', 0.9],
    
    // Style Categories
    'Sci-fi': ['scifi', 0.9],
    'Fantasy': ['fantasy', 0.9],
    'Abstract': ['abstract', 0.8],
    'Dark': ['dark', 0.8],
    'Colorful': ['colorful', 0.8],
    'Minimalist': ['minimalist', 0.8]
};

// Add aspect ratio detection function
const getImageAspectRatio = async (imageUrl) => {
    try {
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Use sharp to get image dimensions
        const metadata = await sharp(buffer).metadata();
        
        const { width, height } = metadata;
        
        // Determine aspect ratio category
        if (width === height) {
            return 'square';
        } else if (width > height) {
            return 'landscape';
        } else {
            return 'portrait';
        }
    } catch (error) {
        console.error('Error detecting aspect ratio:', error);
        return 'unknown';
    }
};

// Modify the categorizeImage function to handle both content category and aspect ratio
const categorizeImage = async (imageUrl) => {
    try {
        const [contentCategories, aspectRatio] = await Promise.all([
            detectContentCategories(imageUrl),
            getImageAspectRatio(imageUrl)
        ]);

        return {
            categories: contentCategories,
            aspectRatio: aspectRatio
        };
    } catch (error) {
        console.error('Error categorizing image:', error);
        return {
            categories: [{ category: 'other', confidence: 100 }],
            aspectRatio: 'unknown'
        };
    }
};

// Separate content detection into its own function
const detectContentCategories = async (imageUrl) => {
    try {
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const command = new DetectLabelsCommand({
            Image: { Bytes: buffer },
            MaxLabels: 15,
            MinConfidence: 60
        });

        console.log('Attempting to categorize image:', imageUrl);
        const result = await rekognition.send(command);
        
        // Get all matching categories with confidence scores
        const categories = result.Labels
            .filter(label => categoryMapping[label.Name])
            .map(label => ({
                category: categoryMapping[label.Name][0],
                confidence: label.Confidence * (categoryMapping[label.Name][1] || 1)
            }))
            .sort((a, b) => b.confidence - a.confidence);

        // Remove duplicates, keeping highest confidence
        const uniqueCategories = Array.from(
            new Map(categories.map(item => [item.category, item])).values()
        );

        console.log('Detected categories:', uniqueCategories);
        return uniqueCategories;
    } catch (error) {
        console.error('Rekognition error:', error);
        return [{ category: 'other', confidence: 100 }];
    }
};

// Add this new function to your imageService.js
const getOptimizedImage = async (imageUrl, options = {}) => {
  try {
    const {
      width = null,
      format = 'webp',
      quality = 80,
      generateThumbnail = false
    } = options;
    
    // Check if we already have a cached optimized version
    const urlHash = crypto.createHash('md5').update(`${imageUrl}-w${width}-f${format}-q${quality}`).digest('hex');
    const cacheKey = `optimized/${urlHash}.${format}`;
    
    // First check if this optimized version already exists in S3
    try {
      const headParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: cacheKey
      };
      
      // Try to get the object
      await s3Client.send(new HeadObjectCommand(headParams));
      
      // If this succeeds, the optimized version exists, return the URL
      return {
        url: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${cacheKey}`,
        fromCache: true
      };
    } catch (err) {
      // Object doesn't exist - we'll create it
    }
    
    // Download the original image
    const response = await axios({
      url: imageUrl,
      responseType: 'arraybuffer'
    });
    
    // Process with Sharp
    let sharpInstance = sharp(response.data);
    
    // Get original metadata
    const metadata = await sharpInstance.metadata();
    
    // Resize if width is specified
    if (width && width < metadata.width) {
      sharpInstance = sharpInstance.resize({ 
        width,
        withoutEnlargement: true
      });
    }
    
    // Convert format
    if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality });
    } else if (format === 'jpeg' || format === 'jpg') {
      sharpInstance = sharpInstance.jpeg({ quality });
    } else if (format === 'avif') {
      sharpInstance = sharpInstance.avif({ quality });
    }
    
    // Process the image
    const buffer = await sharpInstance.toBuffer();
    
    // Upload to S3
    const contentType = `image/${format}`;
    const s3Result = await uploadToS3(buffer, cacheKey, contentType, {
      CacheControl: 'public, max-age=31536000' // 1 year cache
    });
    
    // If requested, also generate a small thumbnail for faster initial loading
    if (generateThumbnail) {
      const thumbWidth = Math.min(metadata.width, 100);
      const thumbnail = await sharp(response.data)
        .resize({ width: thumbWidth })
        .webp({ quality: 60 })
        .toBuffer();
      
      const thumbKey = `thumbnails/${urlHash}-thumb.webp`;
      await uploadToS3(thumbnail, thumbKey, 'image/webp', {
        CacheControl: 'public, max-age=31536000'
      });
    }
    
    return {
      url: s3Result.url,
      width: metadata.width,
      height: metadata.height,
      format,
      originalFormat: metadata.format,
      fromCache: false
    };
  } catch (error) {
    console.error('Image optimization error:', error);
    return { error: 'Failed to optimize image', originalUrl: imageUrl };
  }
};

module.exports = {
    categorizeImage,
    getImageAspectRatio,
    categoryMapping,
    getOptimizedImage // New function export
};