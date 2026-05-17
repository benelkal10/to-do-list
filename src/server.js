require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { initCron } = require('./services/cronService');
const logger = require('./config/logger');

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    // Initialize Cron Jobs
    initCron();

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
