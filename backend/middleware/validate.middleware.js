const validate = (validator) => {
  return (req, res, next) => {
    const result = validator(req);

    if (!result.valid) {
      return res.status(400).json({
        message: result.message || 'Validation failed',
        errors: result.errors || []
      });
    }

    if (result.sanitizedBody) {
      req.body = result.sanitizedBody;
    }

    next();
  };
};

module.exports = validate;