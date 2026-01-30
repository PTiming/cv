const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/moodle_integration',
  jwtSecret: process.env.JWT_SECRET || 'default_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  moodle: {
    url: process.env.MOODLE_URL,
    token: process.env.MOODLE_TOKEN
  }
};
