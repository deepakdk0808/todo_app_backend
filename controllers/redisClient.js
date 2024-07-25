const redis = require("redis");
const dotenv = require("dotenv");
dotenv.config();

const redis_url = process.env.REDIS_URL;

// Create and configure Redis client
const redisClient = redis.createClient({
  url: redis_url,
});

redisClient.on("error", (err) => {
  console.error("Redis client error", err);
});

// Connect to Redis server
redisClient.connect().catch((err) => {
  console.error("Error connecting to Redis", err);
});

module.exports = redisClient;
