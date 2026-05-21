const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

const secret = process.env.JWT_SECRET;
const clients = new Map(); // userId -> Set of ws connections
const HEARTBEAT_INTERVAL = 30000; // 30s

function setupWebSocket(server) {
    const wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws, req) => {
        const params = url.parse(req.url, true).query;
        const token = params.token;

        if (!token) {
            ws.close(4001, 'Token required');
            return;
        }

        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                ws.close(4001, 'Invalid token');
                return;
            }

            const userId = decoded.user;
            ws.userId = userId;
            ws.profile = decoded.profile;
            ws.isAlive = true;

            ws.on('pong', () => { ws.isAlive = true; });

            if (!clients.has(userId)) {
                clients.set(userId, new Set());
            }
            clients.get(userId).add(ws);

            ws.on('close', () => {
                const userConns = clients.get(userId);
                if (userConns) {
                    userConns.delete(ws);
                    if (userConns.size === 0) {
                        clients.delete(userId);
                    }
                }
            });
        });
    });

    const interval = setInterval(() => {
        wss.clients.forEach(ws => {
            if (!ws.isAlive) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
            // Send application-level heartbeat for clients to detect activity
            if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'ping' }));
        });
    }, HEARTBEAT_INTERVAL);

    wss.on('close', () => clearInterval(interval));
    wss.heartbeatInterval = interval;

    return wss;
}

function notify(userId, payload) {
    const conns = clients.get(userId);
    if (conns) {
        const msg = JSON.stringify(payload);
        conns.forEach(ws => {
            if (ws.readyState === 1) { // OPEN
                ws.send(msg);
            }
        });
    }
}

function isOnline(userId) {
    return clients.has(userId) && clients.get(userId).size > 0;
}

module.exports = { setupWebSocket, notify, isOnline };
