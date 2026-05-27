const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../models/index.js');

const secret = process.env.JWT_SECRET || 'trytoguess';

jest.mock('../services/push', () => ({
  sendPush: jest.fn().mockResolvedValue({ statusCode: 201 }),
  pushEnabled: true
}));

const { sendPush } = require('../services/push');

describe('Push notification on new message', () => {
  let senderToken, senderId, receiverId, deviceId;

  beforeAll(async () => {
    const parent = await db.parents.create({ email: 'push-msg@test.com', pwd: '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012' });
    const sender = await db.users.create({ nick: 'sender', parent: parent.id });
    const receiver = await db.users.create({ nick: 'receiver', parent: parent.id });
    senderId = sender.id;
    receiverId = receiver.id;
    // Create connection
    await db.connections.create({ from: senderId, to: receiverId, status: 0 });
    await db.connections.create({ from: receiverId, to: senderId, status: 0 });
    // Create device with push subscription
    const device = await db.devices.create({
      userid: receiverId,
      pushSubscription: { endpoint: 'https://fcm.googleapis.com/test', keys: { p256dh: 'k', auth: 'a' } }
    });
    deviceId = device.id;
    senderToken = jwt.sign({ user: senderId, profile: 'User' }, secret);
  });

  beforeEach(() => sendPush.mockClear());

  it('should send push notification when recipient has subscription', async () => {
    await request(app)
      .post('/api/v1/message')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ to: receiverId, message: 'hello' })
      .expect(201);
    expect(sendPush).toHaveBeenCalledWith(
      { endpoint: 'https://fcm.googleapis.com/test', keys: { p256dh: 'k', auth: 'a' } },
      { type: 'new_message', from: 'sender' }
    );
  });

  it('should not send push when recipient has no subscription', async () => {
    await db.devices.update({ pushSubscription: null }, { where: { id: deviceId } });
    await request(app)
      .post('/api/v1/message')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ to: receiverId, message: 'hello again' })
      .expect(201);
    expect(sendPush).not.toHaveBeenCalled();
  });

  it('should remove subscription on 410 Gone', async () => {
    const sub = { endpoint: 'https://expired.example.com', keys: { p256dh: 'k', auth: 'a' } };
    await db.devices.update({ pushSubscription: sub }, { where: { id: deviceId } });
    sendPush.mockRejectedValueOnce({ statusCode: 410 });
    await request(app)
      .post('/api/v1/message')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ to: receiverId, message: 'expired test' })
      .expect(201);
    // Wait for async catch to execute
    await new Promise(r => setTimeout(r, 50));
    const device = await db.devices.findByPk(deviceId);
    expect(device.pushSubscription).toBeNull();
  });
});
