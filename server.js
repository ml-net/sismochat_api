require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Exiting.');
  process.exit(1);
}

const http = require('http');
const app = require('./app');
const { setupWebSocket } = require('./services/websocket');
const { startCleanupJob } = require('./jobs/ttl-cleanup');

const port = process.env.PORT || 3000;
const server = http.createServer(app);
setupWebSocket(server);

server.listen(port, function() {
  console.log('Your app is listening on port ' + port);
  startCleanupJob();
});