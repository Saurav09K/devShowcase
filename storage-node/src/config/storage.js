require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5001,
  NODE_ID: process.env.NODE_ID || 'node-unknown',
  STORAGE_PATH: process.env.STORAGE_PATH || './src/data'
};