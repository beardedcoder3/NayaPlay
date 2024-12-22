import { S3Client } from "@aws-sdk/client-s3";

console.log('Environment variables check:', {
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID ? 'Present' : 'Missing',
  secretKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY ? 'Present' : 'Missing',
  region: process.env.REACT_APP_AWS_REGION,
  bucket: process.env.REACT_APP_AWS_BUCKET_NAME
});

export const s3Client = new S3Client({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
  }
});

export const AWS_BUCKET_NAME = "nayaplay-support-files";