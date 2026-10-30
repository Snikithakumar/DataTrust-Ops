const multer = require('multer');

/**
 * Standardized JSON Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Handle Multer upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = process.env.MAX_FILE_SIZE_MB || '5';
      return res.status(413).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `The uploaded file exceeds the ${maxMb}MB size limit.`
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message
      },
      timestamp: new Date().toISOString()
    });
  }

  // Handle custom validation or bad request errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: err.errors
      },
      timestamp: new Date().toISOString()
    });
  }

  // General server error
  const statusCode = err.status || err.statusCode || 500;
  console.error(`[Unhandled Error] ${req.method} ${req.url}:`, err);

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred while processing the request.'
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;
