const dotenv = require('dotenv');
const mongoose = require('mongoose');

// This must come BEFORE requiring app.js
dotenv.config({ path: `${__dirname}/config.env` });

// Database connection
const DB = process.env.DATABASE_LOCAL;

mongoose
  .connect(DB, {
    serverSelectionTimeoutMS: 3000,
    socketTimeoutMS: 3000
  })
  .then(() => console.log('DB connection successful'))
  .catch(err => {
    console.error('DB connection error:', err.message);
  });

const app = require('./app');

const port = process.env.PORT || 3000;

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

app.listen(port, () => {
    console.log(`App running on port ${port} in ${process.env.NODE_ENV} mode...`);
});
