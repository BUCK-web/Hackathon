const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = connectDB;