import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'resumes',
    resource_type: 'raw', // PDFs, DOCX, etc.
    type: 'upload', // 👈 ensures it's public
    access_mode: 'public', // 👈 force public accessibility
    public_id: (req, file) => file.originalname.split('.')[0],
  },
});

const upload = multer({ storage });

export default upload;
