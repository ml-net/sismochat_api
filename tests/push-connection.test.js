const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../models/index.js');
const util = require('../util.js');

const secret = process.env.JWT_SECRET || 'trytoguess';

jest.mock('../services/push', () => ({
  sendPush: jest.fn().mockResolvedValue({ statusCode: 201 }),
  pushEnabled: true
}));

const { sendPush } = require('../services/push');

describe('Push notification on connection events', () => {
  let parentAToken, parentBToken, parentAId, parentBId, childAId, childBId;

  beforeAll(async () => {
    // Parent A with child
    const parentA = await db.parents.create({ email: 'push-conn-a@test.com', pwd: '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012' });
    parentAId = parentA.id;
    const parentAUser = await db.users.create({ nick: util.PARENT_USER_NICK, parent: parentAId });
    await db.devices.create({ userid: parentAUser.id, pushSubscription: { endpoint: 'https://push.a.com', keys: { p256dh: 'a', auth: 'a' } } });
    const childA = await db.users.create({ nick: 'ChildA', parent: parentAId });
    childAId = childA.id;
    await db.devices.create({ userid: childAId });

    // Parent B with child
    const parentB = await db.parents.create({ email: 'push-conn-b@test.com', pwd: '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012' });
    parentBId = parentB.id;
    const parentBUser = await db.users.create({ nick: util.PARENT_USER_NICK, parent: parentBId });
    await db.devices.create({ userid: parentBUser.id, pushSubscription: { endpoint: 'https://push.b.com', keys: { p256dh: 'b', auth: 'b' } } });
    const childB = await db.users.create({ nick: 'ChildB', parent: parentBId });
    childBId = childB.id;
    await db.devices.create({ userid: childBId });

    parentAToken = jwt.sign({ user: parentAId, profile: 'Parent' }, secret);
    parentBToken = jwt.sign({ user: parentBId, profile: 'Parent' }, secret);
  });

  beforeEach(() => sendPush.mockClear());

  it('should send push to recipient parent on connection request', async () => {
    await request(app)
      .post(`/api/v1/connections/${childAId}/${childBId}`)
      .set('Authorization', `Bearer ${parentAToken}`)
      .expect(201);
    expect(sendPush).toHaveBeenCalledWith(
      { endpoint: 'https://push.b.com', keys: { p256dh: 'b', auth: 'b' } },
      { type: 'connection_request', from: 'ChildA' }
    );
  });

  it('should send push to requester parent on connection accepted', async () => {
    const conn = await db.connections.findOne({ where: { from: childAId, to: childBId } });
    await request(app)
      .patch(`/api/v1/connections/${conn.id}`)
      .set('Authorization', `Bearer ${parentBToken}`)
      .send({ status: util.ConnectionStatus.ACCEPTED })
      .expect(200);
    expect(sendPush).toHaveBeenCalledWith(
      { endpoint: 'https://push.a.com', keys: { p256dh: 'a', auth: 'a' } },
      { type: 'connection_accepted', from: 'ChildB' }
    );
  });

  it('should send push to requester parent on connection rejected', async () => {
    // Create a new request to reject
    await db.connections.create({ from: childBId, to: childAId, status: util.ConnectionStatus.REQUESTED });
    const conn = await db.connections.findOne({ where: { from: childBId, to: childAId, status: util.ConnectionStatus.REQUESTED } });
    await request(app)
      .patch(`/api/v1/connections/${conn.id}`)
      .set('Authorization', `Bearer ${parentAToken}`)
      .send({ status: util.ConnectionStatus.REJECTED })
      .expect(204);
    expect(sendPush).toHaveBeenCalledWith(
      { endpoint: 'https://push.b.com', keys: { p256dh: 'b', auth: 'b' } },
      { type: 'connection_rejected' }
    );
  });
});
