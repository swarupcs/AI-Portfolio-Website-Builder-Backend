import { cloudinary } from './cloudinary.js';

/**
 * Generate a secure URL for a Cloudinary resource
 * @param {string} publicId - The public ID of the resource
 * @param {Object} options - Transformation options
 * @returns {string} Secure URL
 */
export const generateSecureUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: 'raw',
    ...options,
  });
};

/**
 * Generate a signed URL with expiration
 * @param {string} publicId - The public ID of the resource
 * @param {number} expirationMinutes - Expiration time in minutes (default: 60)
 * @returns {string} Signed URL
 */
export const generateSignedUrl = (publicId, expirationMinutes = 60) => {
  const timestamp = Math.round(Date.now() / 1000) + expirationMinutes * 60;

  return cloudinary.utils.private_download_zip_url({
    resource_type: 'raw',
    public_ids: [publicId],
    expires_at: timestamp,
  });
};

/**
 * Extract file information from Cloudinary response
 * @param {Object} cloudinaryResource - Cloudinary resource object
 * @returns {Object} Formatted file information
 */
export const formatFileInfo = (cloudinaryResource) => {
  return {
    id: cloudinaryResource.public_id,
    originalName:
      cloudinaryResource.original_filename || cloudinaryResource.display_name,
    filename: cloudinaryResource.public_id.split('/').pop(),
    url: cloudinaryResource.secure_url || cloudinaryResource.url,
    size: cloudinaryResource.bytes,
    format: cloudinaryResource.format,
    resourceType: cloudinaryResource.resource_type,
    uploadedAt: cloudinaryResource.created_at,
    tags: cloudinaryResource.tags || [],
    context: cloudinaryResource.context || {},
    folder: cloudinaryResource.folder,
  };
};

/**
 * Validate Cloudinary public ID format
 * @param {string} publicId - Public ID to validate
 * @returns {boolean} Is valid
 */
export const isValidPublicId = (publicId) => {
  if (!publicId || typeof publicId !== 'string') return false;

  // Basic validation: should contain only alphanumeric, hyphens, underscores, and forward slashes
  const validPattern = /^[a-zA-Z0-9/_-]+$/;
  return validPattern.test(publicId) && publicId.length <= 255;
};

/**
 * Sanitize filename for Cloudinary
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename) return 'untitled';

  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 100); // Limit length
};

/**
 * Generate unique public ID for resume
 * @param {string} userId - User ID
 * @param {string} filename - Original filename
 * @returns {string} Unique public ID
 */
export const generateResumePublicId = (userId, filename) => {
  const timestamp = Date.now();
  const sanitizedFilename = sanitizeFilename(filename.replace(/\.[^/.]+$/, ''));
  return `resume_${userId}_${sanitizedFilename}_${timestamp}`;
};

/**
 * Parse Cloudinary error and return user-friendly message
 * @param {Error} error - Cloudinary error
 * @returns {Object} Parsed error information
 */
export const parseCloudinaryError = (error) => {
  if (!error) {
    return {
      message: 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    };
  }

  // Common Cloudinary errors
  const errorMappings = {
    'Invalid image file': {
      message:
        'Invalid file format. Please upload a valid PDF, DOC, or DOCX file.',
      code: 'INVALID_FILE_FORMAT',
      statusCode: 400,
    },
    'File size too large': {
      message: 'File size exceeds the maximum limit of 10MB.',
      code: 'FILE_TOO_LARGE',
      statusCode: 400,
    },
    'Invalid public_id': {
      message: 'Invalid file identifier.',
      code: 'INVALID_PUBLIC_ID',
      statusCode: 400,
    },
    'Not Found': {
      message: 'File not found.',
      code: 'FILE_NOT_FOUND',
      statusCode: 404,
    },
    'Invalid API Key': {
      message: 'Service temporarily unavailable.',
      code: 'SERVICE_UNAVAILABLE',
      statusCode: 503,
    },
  };

  const errorMessage = error.message || error.error?.message || 'Unknown error';
  const httpCode = error.error?.http_code || error.http_code;

  // Check for specific error patterns
  for (const [pattern, errorInfo] of Object.entries(errorMappings)) {
    if (errorMessage.includes(pattern)) {
      return errorInfo;
    }
  }

  // Handle HTTP status codes
  if (httpCode) {
    switch (httpCode) {
      case 400:
        return {
          message: 'Invalid request. Please check your file and try again.',
          code: 'BAD_REQUEST',
          statusCode: 400,
        };
      case 401:
        return {
          message: 'Authentication failed.',
          code: 'UNAUTHORIZED',
          statusCode: 401,
        };
      case 403:
        return {
          message: 'Access forbidden.',
          code: 'FORBIDDEN',
          statusCode: 403,
        };
      case 404:
        return {
          message: 'File not found.',
          code: 'NOT_FOUND',
          statusCode: 404,
        };
      case 429:
        return {
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMITED',
          statusCode: 429,
        };
      default:
        return {
          message: 'Service temporarily unavailable.',
          code: 'SERVICE_ERROR',
          statusCode: httpCode,
        };
    }
  }

  return {
    message: errorMessage,
    code: 'CLOUDINARY_ERROR',
    statusCode: 500,
  };
};

/**
 * Build search query for user's resumes
 * @param {string} userId - User ID
 * @param {Object} filters - Additional filters
 * @returns {string} Cloudinary search expression
 */
export const buildResumeSearchQuery = (userId, filters = {}) => {
  let query = `folder:portfolio-builder*/resumes AND tags:resume AND tags:user_${userId}`;

  if (filters.format) {
    query += ` AND format:${filters.format}`;
  }

  if (filters.dateFrom) {
    query += ` AND uploaded_at>=${filters.dateFrom}`;
  }

  if (filters.dateTo) {
    query += ` AND uploaded_at<=${filters.dateTo}`;
  }

  return query;
};

/**
 * Calculate storage usage for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Storage usage information
 */
export const calculateUserStorageUsage = async (userId) => {
  try {
    const searchQuery = buildResumeSearchQuery(userId);

    const result = await cloudinary.search
      .expression(searchQuery)
      .with_field('bytes')
      .max_results(500) // Adjust based on expected max files per user
      .execute();

    const totalFiles = result.total_count;
    const totalBytes = result.resources.reduce(
      (sum, resource) => sum + (resource.bytes || 0),
      0
    );
    const totalMB = Math.round((totalBytes / (1024 * 1024)) * 100) / 100;

    return {
      totalFiles,
      totalBytes,
      totalMB,
      maxFilesAllowed: parseInt(process.env.MAX_FILES_PER_USER) || 5,
      maxStorageAllowedMB: parseInt(process.env.MAX_STORAGE_PER_USER_MB) || 50,
    };
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return {
      totalFiles: 0,
      totalBytes: 0,
      totalMB: 0,
      maxFilesAllowed: 5,
      maxStorageAllowedMB: 50,
    };
  }
};
