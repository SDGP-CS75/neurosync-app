export function createValidationMiddleware(validator) {
  return (req, res, next) => {
    const result = validator(req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    req.validatedBody = result.value;
    return next();
  };
}
