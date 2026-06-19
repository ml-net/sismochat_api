const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../models/index.js');

const secret = process.env.JWT_SECRET || 'trytoguess';

const validSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-id',
  keys: { p256dh: 'test-p256dh-key', auth: 'test-auth-key' }
};

describe('Push subscription endpoint', () => {
  let parentToken, _userId, deviceId;

  beforeAll(async () => {
    const parent = await db.parents.create({ email: 'push-test@test.com', pwd: '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012' });
    const user = await db.users.create({ nick: 'pushchild', parent: parent.id });
    const device = await db.devices.create({ userid: user.id });
    _userId = user.id;
    deviceId = device.id;
    parentToken = jwt.sign({ user: parent.id, profile: 'Parent' }, secret);
  });

  it('PUT with valid subscription should return 200', async () => {
    const res = await request(app)
      .put(`/api/v1/devices/${deviceId}/push-subscription`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ subscription: validSubscription });
    expect(res.status).toBe(200);
    const device = await db.devices.findByPk(deviceId);
    expect(device.pushSubscription).toEqual(validSubscription);
  });

  it('PUT without subscription should return 400', async () => {
    await request(app)
      .put(`/api/v1/devices/${deviceId}/push-subscription`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({})
      .expect(400);
  });

  it('PUT with invalid subscription (missing keys) should return 400', async () => {
    await request(app)
      .put(`/api/v1/devices/${deviceId}/push-subscription`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ subscription: { endpoint: 'https://example.com' } })
      .expect(400);
  });

  it('PUT on non-existent device should return 404', async () => {
    await request(app)
      .put('/api/v1/devices/non-existent-id/push-subscription')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ subscription: validSubscription })
      .expect(404);
  });

  it('PUT on another user device should return 403', async () => {
    const otherParent = await db.parents.create({ email: 'other-push@test.com', pwd: '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012' });
    const otherToken = jwt.sign({ user: otherParent.id, profile: 'Parent' }, secret);
    await request(app)
      .put(`/api/v1/devices/${deviceId}/push-subscription`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ subscription: validSubscription })
      .expect(403);
  });

  it('PUT without auth should return 401', async () => {
    await request(app)
      .put(`/api/v1/devices/${deviceId}/push-subscription`)
      .send({ subscription: validSubscription })
      .expect(401);
  });
});
