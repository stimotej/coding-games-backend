const Joi = require("joi");

// Validate register request
const registerValidation = (data) => {
  // Create validation schema
  const schema = Joi.object({
    // name: Joi.string(),
    username: Joi.string().min(4).required(),
    password: Joi.string().min(8).required(),
    // email: Joi.string().email(),
  });

  // Validate data based on schema
  return schema.validate(data);
};

// Validate login request
const loginValidation = (data) => {
  // Create validation schema
  const schema = Joi.object({
    username: Joi.string().min(4).required(),
    password: Joi.string().min(8).required(),
  });

  // Validate data based on schema
  return schema.validate(data);
};

// Validate change password request
const passwordValidation = (data) => {
  // Create validation schema
  const schema = Joi.object({
    currentPassword: Joi.string().min(8).required(),
    newPassword: Joi.string().min(8).required(),
  });

  // Validate data based on schema
  return schema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.passwordValidation = passwordValidation;
