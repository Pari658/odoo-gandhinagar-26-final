import app from './app.js';
import { EventEmitter } from 'events';

// Increase default Event Emitter Max Listeners
EventEmitter.defaultMaxListeners = 50;

const PORT = process.env.PORT || 5000;
const NINETY_MINUTES_MS = 90 * 60 * 1000; // 90 minutes in milliseconds

const server = app.listen(PORT, () => {
  console.log(`🚀 Urban Furniture ERP Backend running on port ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
  console.log(`⏱️ Express Emitter / Connection Timeout set to 90 minutes (${NINETY_MINUTES_MS / 60000} mins)`);
});

// Configure Express Server Connection & Socket Timeouts to 90 minutes
server.timeout = NINETY_MINUTES_MS;
server.keepAliveTimeout = NINETY_MINUTES_MS;
server.headersTimeout = NINETY_MINUTES_MS + 1000;
