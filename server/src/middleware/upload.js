const multer = require('multer');
const path = require('path');

// Store in memory buffer for security and instant streaming
const storage = multer.memoryStorage();

const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10);
const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

// Denylist for executable and script file extensions
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.dll', '.so', '.dylib', '.bat', '.cmd', '.sh', '.bash', '.ps1',
  '.vbs', '.js', '.mjs', '.cjs', '.py', '.rb', '.php', '.pl', '.com', '.scr',
  '.msi', '.jar', '.war', '.bin', '.elf', '.app', '.pif'
]);

// Whitelist for valid CSV extensions and MIME types
const ALLOWED_EXTENSIONS = new Set(['.csv', '.txt']);
const ALLOWED_MIME_TYPES = new Set([
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/csv',
  'text/x-csv',
  'application/x-csv',
  'text/comma-separated-values'
]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  // 1. Immediately reject dangerous executable extensions even if MIME is spoofed
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    const err = new Error(`File upload rejected: executable or script extension '${ext}' is strictly forbidden.`);
    err.code = 'INVALID_FILE_TYPE';
    err.status = 400;
    return cb(err, false);
  }

  // 2. Reject if extension is invalid OR MIME type is invalid
  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(mime)) {
    const err = new Error(
      `Invalid file type. Only CSV files (.csv, .txt) with valid CSV MIME types up to ${maxFileSizeMB}MB are supported. Received extension: '${ext || 'none'}', MIME: '${mime || 'unknown'}'.`
    );
    err.code = 'INVALID_FILE_TYPE';
    err.status = 400;
    return cb(err, false);
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
