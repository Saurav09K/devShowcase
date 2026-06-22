require('dotenv').config();

const { Queue } = require('bullmq');
const Redis = require('ioredis');

const redisConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

console.log('Connected to Redis successfully.');

const videoQueue = new Queue('generate-thumbnail', {
  connection: redisConnection,
});

module.exports = { videoQueue, redisConnection };