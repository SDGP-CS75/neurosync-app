import express from 'express';
const { Request, Response, NextFunction } = express;

/**
 * Enhanced error handler with better classification and logging
 */
export const errorHandler = (err, req, res, next) => {
  // Log error with context
  const errorContext = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.uid || 'anonymous',
  };
  
  console.error('[Error Handler]', {
    ...errorContext,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
  
  // Rate limit error (AI quota)
  if (err.isQuota) {
    return res.status(429).json({ 
      error: err.message || 'AI quota exceeded. Try again later.',
      retryAfter: err.retryAfter || 60,
    });
  }
  
  // Timeout error
  if (err.name === 'AbortError' || err.code === 'ETIMEDOUT') {
    return res.status(504).json({ 
      error: 'Request timed out. Please try again.' 
    });
  }
  
  // Validation error
  if (err.name === 'ValidationError' || err.status === 400) {
    return res.status(400).json({ 
      error: err.message || 'Invalid request data.' 
    });
  }
  
  // Authentication error
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({ 
      error: 'Authentication required.' 
    });
  }
  
  // Forbidden error
  if (err.name === 'ForbiddenError' || err.status === 403) {
    return res.status(403).json({ 
      error: 'Access denied.' 
    });
  }
  
  // Not found error
  if (err.name === 'NotFoundError' || err.status === 404) {
    return res.status(404).json({ 
      error: err.message || 'Resource not found.' 
    });
  }
  
  // Known error with status
  if (err.status && err.message) {
    return res.status(err.status).json({ 
      error: err.message 
    });
  }
  
  // Default internal server error
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error. Please try again.' 
      : err.message || 'Internal server error.' 
  });
};

/**
 * Async handler wrapper to catch promise rejections
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};