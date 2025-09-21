import mongoose from 'mongoose';
import { MONGO_URI } from './config.js';


const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      // Recommended options
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1); // Exit process if DB fails
  }
};

export default connectDB;
