const AppError = require('./AppError');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // 1) Operational, trusted errors: send message to client
  if (err.isOperational) {
    return sendErrorProd(err, res);
  }
  
  // 2) Cast Error - Invalid DB IDs (like /api/v1/products/abc123)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    return sendErrorProd(new AppError(message, 400), res);
  }
  
  // 3) Duplicate field value errors (MongoDB)
  if (err.code === 11000) {
    const value = Object.values(err.keyValue)[0];
    const fieldName = Object.keys(err.keyValue)[0];
    const message = `Duplicate field ${fieldName}: ${value} already exists`;
    return sendErrorProd(new AppError(message, 400), res);
  }
  
  // 4) Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return sendErrorProd(new AppError(message, 400), res);
  }
  
  // 5) Send dev/prod errors
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    console.error('ERROR 💥', err);
    return sendErrorProd(new AppError('Something went very wrong!', 500), res);
  }
};
