import dotenv from 'dotenv';
dotenv.config();

export const PORT = Number(process.env.PORT) || 5000;
export const MONGO_URI = process.env.MONGO_URI;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
export const GROQ_API_KEY = process.env.GROQ_API_KEY;

export const CLOUDINARY = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
};

// Optional: check required variables
if (!MONGO_URI || !JWT_SECRET || !CLOUDINARY.apiKey) {
  throw new Error('❌ Required environment variables are missing!');
}
