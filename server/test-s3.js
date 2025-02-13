require('dotenv').config({ path: '.env.development' });
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const uploadToS3 = async (buffer, key, contentType) => {
    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read'
    });

    try {
        const response = await s3Client.send(command);
        return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
        console.error('S3 upload error:', error);
        throw error;
    }
};

const testConnection = async () => {
    try {
        // Test specific bucket access instead of listing all buckets
        const testData = Buffer.from('test file');
        const key = 'test.txt';
        const contentType = 'text/plain';

        const uploadResult = await uploadToS3(testData, key, contentType);
        console.log('Successfully uploaded test file:', uploadResult);

        // Try to read the file back
        const getResult = await s3Client.send(new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key
        }));
        
        console.log('Successfully read test file');
        
        // Clean up test file
        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key
        }));
        
        console.log('Successfully deleted test file');
        console.log('All S3 operations completed successfully!');
    } catch (error) {
        console.error('Connection failed:', error);
    }
};

testConnection();