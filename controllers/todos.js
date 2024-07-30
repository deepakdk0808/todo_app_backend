const Todo = require("../models/todos");
const router = require("express").Router();
const mqtt = require("mqtt");
const redisClient = require("./redisClient");
const { broadcastMessage } = require("./webSocket");

// Redis key for storing tasks
const REDIS_TASK_KEY = `FULLSTACK_TASK_DEEPAK`;

// MQTT client setup
const client = mqtt.connect("mqtt://broker.hivemq.com");
client.on("connect", () => {
  client.subscribe("/add", (err) => {
    if (!err) {
      // console.log("Subscribed to /add topic");
    }
  });
});

client.on("message", async (topic, message) => {
  if (topic === "/add") {
    try {
      const messageData = JSON.parse(message.toString());
    } catch (err) {
      console.error("Error adding todo from MQTT message", err);
    }
  }
});

// Function to add task to Redis cache and handle overflow
const addTaskToCache = async (task) => {
  try {
    // Add the new task to the cache
    let cachedTasksString = await redisClient.get(REDIS_TASK_KEY);
    let cachedTasks = cachedTasksString ? JSON.parse(cachedTasksString) : [];

    cachedTasks.push(task);

    if (cachedTasks.length > 50) {
      // Move tasks to MongoDB if there are more than 50
      await Todo.insertMany(cachedTasks);
      // Clear the cache
      await redisClient.del(REDIS_TASK_KEY);
      // console.log("Limit reached, clearing cache and saving to MongoDB");
    } else {
      // Store updated tasks in cache
      await redisClient.set(REDIS_TASK_KEY, JSON.stringify(cachedTasks));
    }

    // Broadcast the new task
    broadcastMessage(JSON.stringify(task));
  } catch (err) {
    console.error("Error handling task in Redis cache", err);
  }
};

// CREATE
router.post("/add", async (req, res) => {
  const newTodo = {
    title: req.body.title,
  };
  try {
    await addTaskToCache(newTodo);
    client.publish("/add", JSON.stringify({ title: req.body.title })); 
    res.status(200).json({ message: "Todo added successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET ALL
router.get("/fetchAllTasks", async (req, res) => {
  try {
    // Fetch tasks from Redis
    let cachedTasksString = await redisClient.get(REDIS_TASK_KEY);
    let cachedTasks = cachedTasksString ? JSON.parse(cachedTasksString) : [];

    if (cachedTasks.length > 0) {
      // Return tasks from Redis
      res.status(200).json({ source: "Redis", tasks: cachedTasks });
    } else {
      // If no tasks in Redis, fetch from MongoDB
      const todos = await Todo.find();
      res.status(200).json({ source: "MongoDB", tasks: todos });
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching tasks", error: err });
  }
});

module.exports = router;
