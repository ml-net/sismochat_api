const http = require('http');
const WebSocket = require('ws');
const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
const { setupWebSocket } = require('../services/websocket');

let server;
let port;

beforeAll((done) => {
    server = http.createServer(app);
    setupWebSocket(server);
    server.listen(0, () => {
        port = server.address().port;
        done();
    });
});

afterAll((done) => {
    server.close(done);
});

function createToken(user, profile) {
    return jwt.sign({ user, profile }, secret, { expiresIn: '60s' });
}

describe('WebSocket', () => {
    it('should connect with valid token', (done) => {
        const token = createToken('test-user-1', 'User');
        const ws = new WebSocket(`ws://localhost:${port}/ws?token=${token}`);
        ws.on('open', () => {
            expect(ws.readyState).toBe(WebSocket.OPEN);
            ws.close();
            done();
        });
    });

    it('should reject connection without token', (done) => {
        const ws = new WebSocket(`ws://localhost:${port}/ws`);
        ws.on('close', (code) => {
            expect(code).toBe(4001);
            done();
        });
    });

    it('should reject connection with invalid token', (done) => {
        const ws = new WebSocket(`ws://localhost:${port}/ws?token=invalid`);
        ws.on('close', (code) => {
            expect(code).toBe(4001);
            done();
        });
    });

    it('should clean up on disconnect', (done) => {
        const { isOnline } = require('../services/websocket');
        const token = createToken('test-user-cleanup', 'User');
        const ws = new WebSocket(`ws://localhost:${port}/ws?token=${token}`);
        ws.on('open', () => {
            expect(isOnline('test-user-cleanup')).toBe(true);
            ws.close();
        });
        ws.on('close', () => {
            setTimeout(() => {
                expect(isOnline('test-user-cleanup')).toBe(false);
                done();
            }, 50);
        });
    });

    it('should receive new_message notification when message is sent', (done) => {
        const { notify } = require('../services/websocket');
        const token = createToken('recipient-user', 'User');
        const ws = new WebSocket(`ws://localhost:${port}/ws?token=${token}`);
        ws.on('open', () => {
            notify('recipient-user', { type: 'new_message', from: 'sender-user' });
        });
        ws.on('message', (data) => {
            const msg = JSON.parse(data);
            expect(msg.type).toBe('new_message');
            expect(msg.from).toBe('sender-user');
            ws.close();
            done();
        });
    });
});
