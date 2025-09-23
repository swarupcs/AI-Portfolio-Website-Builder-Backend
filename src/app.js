import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/apiRoutes.js';
import { globalErrorHandler } from './middlewares/error.middleware.js';
import { config, connectDB } from './config/index.js';
import cors from 'cors';  

dotenv.config(); // Load env variables

const app = express();

// ✅ CORS middleware
app.use(cors({
  origin: config.CLIENT_URL || "http://localhost:5173", // frontend URL (Vite/React by default)
  credentials: true, // allow cookies and auth headers
}));

// Middleware to parse JSON requests
app.use(express.json());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root route
app.get('/', (req, res) => {
  res.send('✅ Test from Hello World');
});

app.use("/api", apiRouter);

app.use(globalErrorHandler);

const PORT = config.PORT;

// Start server

const startServer = async () => {
  try {
    await connectDB(); // Connect DB before starting server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}...`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();