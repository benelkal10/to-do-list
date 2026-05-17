const Task = require('../models/Task');
const { getCachedTasks, setCachedTasks, clearCachedTasks } = require('../services/cacheService');
const logger = require('../config/logger');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { TASK_STATUS } = require('../utils/constants');

const getTasks = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const cached = await getCachedTasks(userId);
  if (cached) {
    return res.status(200).json({ success: true, count: cached.length, data: cached });
  }

  const tasks = await Task.find({
    $or: [{ owner: userId }, { sharedWith: userId }]
  }).populate('owner', 'username');

  await setCachedTasks(userId, tasks);
  
  res.status(200).json({ success: true, count: tasks.length, data: tasks });
});

const createTask = asyncHandler(async (req, res, next) => {
  const { title, isRecurring, recurrenceFrequency } = req.body;

  if (!title) {
    return next(new ErrorResponse('Please provide a task title', 400));
  }

  const task = await Task.create({
    title,
    owner: req.user._id,
    isRecurring,
    recurrenceFrequency,
  });

  await clearCachedTasks(req.user._id);
  res.status(201).json({ success: true, data: task });
});

const updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
  }

  const isOwner = task.owner.equals(req.user._id);
  const isShared = task.sharedWith.some(id => id.equals(req.user._id));

  if (!isOwner && !isShared) {
    return next(new ErrorResponse('Not authorized to update this task', 401));
  }

  const { title, status, sharedWith, isRecurring, recurrenceFrequency } = req.body;
  
  task = await Task.findByIdAndUpdate(
    req.params.id, 
    { title, status, sharedWith, isRecurring, recurrenceFrequency }, 
    { new: true, runValidators: true }
  );

  await clearCachedTasks(req.user._id);
  for (const sharedId of task.sharedWith) {
    await clearCachedTasks(sharedId);
  }

  res.status(200).json({ success: true, data: task });
});

const deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
  }

  if (!task.owner.equals(req.user._id)) {
    return next(new ErrorResponse('Only the owner can delete this task', 401));
  }

  const sharedUsers = [...task.sharedWith];
  await task.deleteOne();
  
  await clearCachedTasks(req.user._id);
  for (const sharedId of sharedUsers) {
    await clearCachedTasks(sharedId);
  }

  res.status(200).json({ success: true, data: {} });
});

module.exports = { getTasks, createTask, updateTask, deleteTask };
