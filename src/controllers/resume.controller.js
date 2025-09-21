import { Resume } from '../models/resume.model.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

export const uploadResumeToCloudinary = asyncHandler(async (req, res) => {
  console.log("req.file", req.file);
  if (!req.file) {
    return new ApiResponse(400, 'No file uploaded').send(res);
  }
  const { path: fileUrl, filename: filePublicId, mimetype, size } = req.file;

  // Get userId from auth middleware (e.g., req.user set after JWT validation)
  const userId = req.user?._id;
  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  // Create Resume entry
  const resume = await Resume.create({
    user: userId,
    title: req.body.title || 'Untitled Resume',
    fileUrl,
    filePublicId,
    fileFormat: mimetype?.split('/')[1] || null, // e.g., pdf/docx
    fileSize: size,
    status: 'uploaded',
    aiData: {}, // can be filled later by AI parsing service
  });

  return new ApiResponse(201, '✅ Resume uploaded successfully', {
    resume,
  }).send(res);
});
