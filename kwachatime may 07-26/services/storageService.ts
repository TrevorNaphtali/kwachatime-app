
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const uploadDocument = async (blob: Blob, filename: string) => {
  const bucketName = process.env.AWS_S3_BUCKET;
  
  if (!bucketName || !process.env.AWS_ACCESS_KEY_ID) {
    // Fallback to local storage if AWS is not configured
    const reader = new FileReader();
    return new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const key = `doc_${Date.now()}_${filename}`;
        localStorage.setItem(key, base64data);
        console.warn(`[Storage Service] AWS S3 not configured. Saved ${filename} to local storage.`);
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `documents/${Date.now()}_${filename}`,
      Body: new Uint8Array(arrayBuffer),
      ContentType: blob.type,
      ACL: 'public-read', // Ensure it's publicly readable for the download links
    });

    await s3Client.send(command);
    const url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/documents/${Date.now()}_${filename}`;
    console.log(`[Storage Service] Uploaded ${filename} to AWS S3: ${url}`);
    return url;
  } catch (error) {
    console.error('[Storage Service] AWS S3 upload failed', error);
    throw error;
  }
};

export const getDocument = (key: string) => {
  return localStorage.getItem(key);
};
