const Task = require('../models/Task');
const { getCachedTasks, setCachedTasks, clearCachedTasks } = require('../services/cacheService');
const logger = require('../config/logger');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all tasks for logged in user
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cachedTasks = await getCachedTasks(userId);
  if (cachedTasks) {
    logger.info(`Serving tasks from cache for user ${userId}`);
    return res.json(cachedTasks);
  }

  const tasks = await Task.find({
    $or: [
      { owner: userId },
      { sharedWith: userId }
    ]
  }).populate('owner', 'username');

  await setCachedTasks(userId, tasks);
  res.json(tasks);
});

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { title, isRecurring, recurrenceFrequency } = req.body;

  const task = new Task({
    title,
    owner: req.user._id,
    isRecurring,
    recurrenceFrequency,
  });

  const createdTask = await task.save();
  await clearCachedTasks(req.user._id);
  res.status(201).json(createdTask);
});

// @desc    Update task status or details
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  const { title, status, sharedWith, isRecurring, recurrenceFrequency } = req.body;
  const task = await Task.findById(req.params.id);

  if (task) {
    if (task.owner.toString() !== req.user._id.toString() && !task.sharedWith.includes(req.user._id)) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    task.title = title || task.title;
    task.status = status || task.status;
    task.isRecurring = isRecurring !== undefined ? isRecurring : task.isRecurring;
    task.recurrenceFrequency = recurrenceFrequency || task.recurrenceFrequency;
    
    if (sharedWith) {
      task.sharedWith = sharedWith;
    }

    const updatedTask = await task.save();
    await clearCachedTasks(req.user._id);
    
    // Also clear cache for shared users
    for (const sharedUserId of task.sharedWith) {
      await clearCachedTasks(sharedUserId);
    }

    res.json(updatedTask);
  } else {
    res.status(404).json({ message: 'Task not found' });
  }
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (task) {
    if (task.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await task.deleteOne();
    await clearCachedTasks(req.user._id);
    
    for (const sharedUserId of task.sharedWith) {
      await clearCachedTasks(sharedUserId);
    }

    res.json({ message: 'Task removed' });
  } else {
    res.status(404).json({ message: 'Task not found' });
  }
});

module.exports = { getTasks, createTask, updateTask, deleteTask };
