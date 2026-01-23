// middleware/validation.js
const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  country_code: Joi.string().pattern(/^\+[0-9]{1,4}$/).default('+237'), // ✅ Cameroon default
  phone: Joi.string().pattern(/^[0-9]{8,15}$/).optional(), // Adjusted for Cameroon (8-15 digits)
  password: Joi.string()
  .min(8)
  .max(128)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
  .required()
  .messages({
    'string.pattern.base': 'Password must contain at least one uppercase, lowercase, number and special character'
  }),
  first_name: Joi.string().min(2).required(),
  last_name: Joi.string().min(2).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  
  next();
};

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validateForgotPassword: validate(forgotPasswordSchema),
  validateResetPassword: validate(resetPasswordSchema)
};