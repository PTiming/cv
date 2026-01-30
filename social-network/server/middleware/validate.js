const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    // Return both single message (for frontend compatibility) and full errors array
    return res.status(400).json({
      success: false,
      message: errorArray[0].msg,  // First error message for frontend
      errors: errorArray.map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

module.exports = validate;
