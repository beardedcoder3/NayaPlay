import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, AWS_BUCKET_NAME } from './AwsConfig'

export const uploadFileToS3 = async (file, ticketId) => {
  if (!file || !ticketId) {
    throw new Error('File and ticketId are required');
  }

  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const key = `support/${ticketId}/${fileName}`;

    console.log('Uploading file:', {
      bucket: AWS_BUCKET_NAME,
      key: key,
      contentType: file.type
    });

    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: file.type
    });

    const response = await s3Client.send(command);
    console.log('Upload response:', response);

    return {
      url: `https://${AWS_BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${key}`,
      key: key,
      name: file.name,
      type: file.type,
      size: file.size
    };
  } catch (error) {
    console.error('Upload error details:', error);
    throw error;
  }
};