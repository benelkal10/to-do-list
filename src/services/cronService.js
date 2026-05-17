const cron = require('node-cron');
const Task = require('../models/Task');
const logger = require('../config/logger');

const initCron = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running recurring tasks job...');
    try {
      const recurringTasks = await Task.find({
        isRecurring: true,
        status: 'completed',
      });

      for (const task of recurringTasks) {
        const newTask = new Task({
          title: task.title,
          owner: task.owner,
          sharedWith: task.sharedWith,
          isRecurring: true,
          recurrenceFrequency: task.recurrenceFrequency,
          status: 'pending',
        });

        await newTask.save();
        
        // Mark old task as no longer recurring so it doesn't spawn again tomorrow
        task.isRecurring = false;
        await task.save();
        
        logger.info(`Spawned new recurring task for user ${task.owner} from task ${task._id}`);
      }
    } catch (error) {
      logger.error('Error in recurring tasks cron:', error);
    }
  });
};

module.exports = { initCron };
