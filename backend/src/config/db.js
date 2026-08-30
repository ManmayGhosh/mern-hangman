const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hangman';

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri);
  console.log(`[db] Connected to MongoDB (${uri.replace(/\/\/.*@/, '//***@')})`);

  mongoose.connection.on('error', (err) => {
    console.error('[db] MongoDB connection error:', err.message);
  });
}

module.exports = connectDB;
