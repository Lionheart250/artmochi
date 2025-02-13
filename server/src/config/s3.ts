import { S3Client, PutObjectCommand, S3ServiceException } from '@aws-sdk/client-s3';

// Validate environment variables
const requiredEnvVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToS3 = async (file: Buffer, key: string): Promise<UploadResult> => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file,
      ServerSideEncryption: 'AES256'
    });
    
    await s3Client.send(command);
    return {
      success: true,
      url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    };
  } catch (error) {
    const errorMessage = error instanceof S3ServiceException 
      ? error.message 
      : 'Unknown error occurred during upload';
    return { success: false, error: errorMessage };
  }
};