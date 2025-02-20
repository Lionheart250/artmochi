const { Pool } = require('pg');
const { RekognitionClient, DetectLabelsCommand } = require('@aws-sdk/client-rekognition');
const fetch = require('node-fetch');

// Remove the dotenv config since Railway CLI will provide the env vars
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Railway/Heroku PostgreSQL
    }
});

// Add more detailed logging
console.log('Connecting to database with config:', {
    database_url_provided: !!process.env.DATABASE_URL,
    aws_region_provided: !!process.env.AWS_REGION,
    aws_key_provided: !!process.env.AWS_ACCESS_KEY_ID,
    aws_secret_provided: !!process.env.AWS_SECRET_ACCESS_KEY
});

// Log connection attempt
console.log('Attempting to connect to database:', process.env.DATABASE_URL);

const rekognition = new RekognitionClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const categoryMapping = {
    'Person': 'portrait',
    'Face': 'portrait',
    'People': 'portrait',
    'Landscape': 'landscape',
    'Nature': 'landscape',
    'Scenery': 'landscape',
    'Cartoon': 'anime',
    'Anime': 'anime',
    'Animation': 'anime',
    'Abstract': 'abstract',
    'Pattern': 'abstract',
    'Architecture': 'architecture',
    'Building': 'architecture'
};

async function categorizeImage(imageUrl) {
    try {
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();

        const command = new DetectLabelsCommand({
            Image: {
                Bytes: buffer
            },
            MaxLabels: 10,
            MinConfidence: 70
        });

        const result = await rekognition.send(command);
        
        for (const label of result.Labels) {
            if (categoryMapping[label.Name]) {
                return categoryMapping[label.Name];
            }
        }

        return 'other';
    } catch (error) {
        console.error('Error categorizing image:', error);
        return 'other';
    }
}

async function updateAllImages() {
    const client = await pool.connect();
    try {
        // Get all images that are uncategorized or marked as 'other'
        const result = await client.query(`
            SELECT id, image_url 
            FROM images 
            WHERE category IS NULL OR category = 'other'
        `);

        console.log(`Found ${result.rows.length} images to categorize`);

        for (let i = 0; i < result.rows.length; i++) {
            const image = result.rows[i];
            console.log(`Processing image ${i + 1}/${result.rows.length}`);

            try {
                const category = await categorizeImage(image.image_url);
                await client.query(
                    'UPDATE images SET category = $1 WHERE id = $2',
                    [category, image.id]
                );
                console.log(`Categorized image ${image.id} as ${category}`);
            } catch (error) {
                console.error(`Failed to categorize image ${image.id}:`, error);
            }

            // Add a small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('Finished categorizing all images');
    } catch (error) {
        console.error('Error in updateAllImages:', error);
    } finally {
        client.release();
        pool.end();
    }
}

// Add a test connection
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('Successfully connected to database:', result.rows[0]);
        client.release();
        return true;
    } catch (err) {
        console.error('Database connection error:', err);
        return false;
    }
}

// Modify the main function to test connection first
async function main() {
    const connected = await testConnection();
    if (!connected) {
        console.error('Failed to connect to database. Exiting...');
        process.exit(1);
    }
    await updateAllImages();
}

main().catch(console.error);