const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const message = err.message || 'Server error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  } else {
    console.error(message);
  }

  res.status(statusCode).json({ message });
};

module.exports = errorHandler;