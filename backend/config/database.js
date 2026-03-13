const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://staffsync_user:YOgSYH3pEKxNoa99@cluster0.ahvb6sk.mongodb.net/staff_monitor');
    console.log('MongoDB connected');
    const { seedAdmins } = require('./seed');
    await seedAdmins();
  } catch (err) {
    console.error('DB error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
