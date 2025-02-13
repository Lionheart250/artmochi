const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Validate environment variables
const requiredEnvVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const uploadToS3 = async (file, key) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: 'image/jpeg'
    });
    
    await s3Client.send(command);
    
    return {
      success: true,
      url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

module.exports = { uploadToS3 };