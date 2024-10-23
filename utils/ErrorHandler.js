// errorHandler.js
const ErrorHandler = (err, req, res, next) => {
    let statusCode = err.status || 500;
    let message = err.message;

    // Handle Mongoose CastError
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 400; // Bad Request
        message = `Invalid ${err.path}: ${err.value}.`;
    }

    // Log the error (you can use a logging library like Winston here)
    console.error(err.message, err.stack);

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
        // Optionally, include stack trace in non-production environments
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });

    next();
};

export default ErrorHandler;