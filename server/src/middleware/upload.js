const multer = require('multer');
const path = require('path');

// Store in memory buffer for security and instant streaming
const storage = multer.memoryStorage();

const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10);
const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.csv', '.txt'];
  const allowedMimeTypes = [
    'text/csv',
    'text/plain',
    'application/vnd.ms-excel',
    'application/csv',
    'text/x-csv',
    'application/x-csv',
    'text/comma-separated-values'
  ];

  if (!allowedExtensions.includes(ext) && !allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error(`Invalid file type. Only CSV files (.csv) up to ${maxFileSizeMB}MB are supported. Received MIME: ${file.mimetype}`),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeBytes
  },
  fileFilter
});

module.exports = upload;
