require('dotenv').config({ path: '.env.production' });
const { Pool } = require('pg');
const { uploadToS3 } = require('../src/config/s3');
const axios = require('axios');

// Create a new pool with production credentials
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function isBase64(str) {
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch {
    return false;
  }
}

async function migrateImages() {
  try {
    console.log('Connecting to Railway database...');
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');

    const { rows } = await pool.query(
      "SELECT id, image_url FROM images WHERE image_url NOT LIKE '%amazonaws.com%'"
    );
    
    console.log(`Found ${rows.length} images to migrate...`);

    for (const image of rows) {
      try {
        // Check if the image_url is base64
        if (isBase64(image.image_url)) {
          console.log(`Image ${image.id} contains base64 data, converting directly...`);
          
          const imageBuffer = Buffer.from(image.image_url, 'base64');
          const key = `migrated/${image.id}-${Date.now()}.webp`;
          
          const s3Result = await uploadToS3(
            imageBuffer,
            key,
            'image/webp'
          );

          if (!s3Result.success) {
            throw new Error(`Failed to upload image ${image.id} to S3: ${s3Result.error}`);
          }

          await pool.query(
            'UPDATE images SET image_url = $1 WHERE id = $2',
            [s3Result.url, image.id]
          );

          console.log(`✅ Successfully migrated base64 image ${image.id}`);
          continue;
        }

        // Construct and validate URL
        let imageUrl = image.image_url;
        if (!image.image_url.startsWith('http')) {
          imageUrl = `${process.env.REACT_APP_API_URL}${image.image_url}`;
        }

        // Log the URL we're trying to access
        console.log(`Processing image ${image.id} with URL: ${imageUrl}`);

        if (!isValidUrl(imageUrl)) {
          console.error(`Invalid URL for image ${image.id}: ${imageUrl}`);
          continue;
        }

        const response = await axios({
          url: imageUrl,
          responseType: 'arraybuffer',
          validateStatus: false,
          timeout: 10000 // 10 second timeout
        });

        if (response.status !== 200) {
          console.error(`Failed to download image ${image.id}: Status ${response.status}`);
          continue;
        }

        const key = `migrated/${image.id}-${Date.now()}.webp`;
        const s3Result = await uploadToS3(
          response.data,
          key,
          response.headers['content-type'] || 'image/webp'
        );

        if (!s3Result.success) {
          throw new Error(`Failed to upload image ${image.id} to S3: ${s3Result.error}`);
        }

        await pool.query(
          'UPDATE images SET image_url = $1 WHERE id = $2',
          [s3Result.url, image.id]
        );

        console.log(`✅ Successfully migrated image ${image.id}`);
      } catch (error) {
        console.error(`❌ Failed to migrate image ${image.id}:`, error.message);
        // Log the problematic image data
        console.error('Image data:', {
          id: image.id,
          originalUrl: image.image_url,
          constructedUrl: image.image_url.startsWith('http') 
            ? image.image_url 
            : `${process.env.REACT_APP_API_URL}${image.image_url}`
        });
      }
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

// Add some debugging info
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

migrateImages().catch(console.error);