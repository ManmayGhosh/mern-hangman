require('dotenv').config();

const connectDB = require('./src/config/db');
const createApp = require('./src/app');
const { loadPool } = require('./src/utils/wordBank');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    loadPool(); // load the ~275k word dictionary into memory once at boot
    await connectDB();

    const app = createApp();
    app.listen(PORT, () => {
      console.log(`[server] Hangman backend listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

start();
