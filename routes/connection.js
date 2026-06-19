const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const util = require('../util.js');
const db = require('../models/index.js');
const { notify } = require('../services/websocket');
const { sendSystemMessage } = require('../services/systemMessage');
const { sendPush } = require('../services/push');

// Connection list for user, requested by same user
router.get('/', authenticate, authorize('User'), async (req, res) => {
    // #swagger.tags = ['Connections']
    // #swagger.summary = 'Get own connections list'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.parameters['limit'] = { in: 'query', description: 'Max results (default 20)', type: 'integer' } */
    /* #swagger.parameters['offset'] = { in: 'query', description: 'Skip N results (default 0)', type: 'integer' } */
    /* #swagger.responses[200] = { description: 'List of connected user IDs' } */
    if (!await util.userExists(req.user.user)) {
        return res.status(400).send("Users not found");
    }
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const cl = await db.connections.findAll({
        where: { status: util.ConnectionStatus.ACCEPTED, from: req.user.user },
        limit,
        offset
    });
    const contacts = await Promise.all(cl.map(async c => {
        const user = await db.users.findByPk(c.dataValues.to);
        return { id: c.dataValues.to, nick: user?.nick || null, key: user?.key || null };
    }));
    res.status(200).send(contacts);
});

// Sent connection requests (by parent)
router.get('/sent/:parent', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Connections']
    // #swagger.summary = 'Get sent connection requests with status'
    // #swagger.description = 'Returns all connection requests initiated by children of this parent, with current status.'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'List of sent requests with status' } */
    /* #swagger.responses[404] = { description: 'Parent not found' } */
    if (!await util.parentExists(req.user.user)) {
        return res.status(404).send("Parent not found");
    }
    const children = await util.getUserByParent(req.user.user);
    const fromList = children.map(u => u.id);
    const requests = await db.connections.findAll({ where: { from: fromList } });
    const results = await Promise.all(requests.map(async r => {
        const fromUser = await db.users.findByPk(r.from);
        const toUser = await db.users.findByPk(r.to);
        return { id: r.id, from: r.from, to: r.to, status: r.status, fromNick: fromUser?.nick || null, toNick: toUser?.nick || null };
    }));
    res.status(200).send(results);
});

// Pending approval list (by parent)
router.get('/approvalList/:parent', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Connections']
    // #swagger.summary = 'Get pending connection requests for approval'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'List of pending connection requests' } */
    /* #swagger.responses[404] = { description: 'Parent not found' } */
    if (!await util.parentExists(req.user.user)) {
        return res.status(404).send("Users not found");
    }
    const list = await util.getUserByParent(req.user.user);
    const toList = list.map(u => u.id);
    const cList = await db.connections.findAll({ where: { status: util.ConnectionStatus.REQUESTED, to: toList } });
    const results = await Promise.all(cList.map(async c => {
        const fromUser = await db.users.findByPk(c.from);
        const toUser = await db.users.findByPk(c.to);
        return { id: c.id, from: c.from, to: c.to, status: c.status, fromNick: fromUser?.nick || null, toNick: toUser?.nick || null };
    }));
    res.status(200).send(results);
});

// Connection list for user, requested by parent
router.get('/:user', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Connections']
    // #swagger.summary = 'Get connections list for a user (by parent)'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.parameters['limit'] = { in: 'query', description: 'Max results (default 20)', type: 'integer' } */
    /* #swagger.parameters['offset'] = { in: 'query', description: 'Skip N results (default 0)', type: 'integer' } */
    /* #swagger.responses[200] = { description: 'List of connected user IDs' } */
    /* #swagger.responses[404] = { description: 'User not found' } */
    if (!await util.userExists(req.params.user)) {
        return res.status(404).send("Users not found");
    }
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const cl = await db.connections.findAll({
        where: { status: util.ConnectionStatus.ACCEPTED, from: req.params.user },
        limit,
        offset
    });
    const contacts = await Promise.all(cl.map(async c => {
        const user = await db.users.findByPk(c.dataValues.to);
        return { id: c.dataValues.to, nick: user?.nick || null, key: user?.key || null };
    }));
    res.status(200).send(contacts);
});

router.post('/:from/:to', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Connections']
    // #swagger.summary = 'Request a connection between two users'
    // #swagger.description = 'Parent requests a friendship connection between two child users.'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[201] = { description: 'Connection requested' } */
    /* #swagger.responses[404] = { description: 'Users not found' } */
    if (!await util.userExists(req.params.from) || !await util.userExists(req.params.to)) {
        return res.status(404).send("Users not found");
    }
    // Block if connection already exists (ACCEPTED or REQUESTED)
    const existing = await db.connections.findOne({
        where: { from: req.params.from, to: req.params.to, status: [util.ConnectionStatus.ACCEPTED, util.ConnectionStatus.REQUESTED] }
    });
    if (existing) {
        return res.status(409).send({ errCode: 11, errDesc: 'Connection already exists or pending' });
    }
    await db.connections.create({ from: req.params.from, to: req.params.to, status: util.ConnectionStatus.REQUESTED });
    // Notify the parent of the recipient child
    const toUser = await db.users.findByPk(req.params.to);
    if (toUser) {
        notify(toUser.parent, { type: 'connection_request', from: req.params.from, to: req.params.to });
        // Push notification to parent's device
        const parentUser = await db.users.findOne({ where: { parent: toUser.parent, nick: util.PARENT_USER_NICK } });
        if (parentUser) {
            const device = await db.devices.findOne({ where: { userid: parentUser.id } });
            if (device?.pushSubscription) {
                const fromNick = await util.getNickByID(req.params.from);
                sendPush(device.pushSubscription, { type: 'connection_request', from: fromNick })
                    .catch(async (err) => {
                        if (err?.statusCode === 410 || err?.statusCode === 404) {
                            await device.update({ pushSubscription: null });
                        }
                    });
            }
        }
    }
    res.sendStatus(201);
});

router.patch('/:connid', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Connections']
    // #swagger.summary = 'Accept or reject a connection request'
    // #swagger.description = 'Update connection status: 0=accepted, 2=rejected.'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: { $ref: '#/definitions/ConnectionStatus' }
    } */
    /* #swagger.responses[204] = { description: 'Status updated' } */
    /* #swagger.responses[400] = { description: 'Invalid status' } */
    /* #swagger.responses[404] = { description: 'Connection not found' } */
    const c = await db.connections.findByPk(req.params.connid);
    if (!c) {
        return res.status(404).send("Connection request not found");
    }
    if (!req.body || typeof req.body.status == 'undefined') {
        return res.status(400).send({ errCode: 9, errDesc: 'Status missing' });
    }
    if (req.body.status == util.ConnectionStatus.ACCEPTED) {
        const c1 = await c.update({ status: req.body.status });
        await db.connections.create({ from: c1.to, to: c1.from, status: util.ConnectionStatus.ACCEPTED });
        // Notify the parent of the requester
        const fromUser = await db.users.findByPk(c1.from);
        if (fromUser) {
            notify(fromUser.parent, { type: 'connection_status', connectionId: c1.id, status: req.body.status });
            // Push notification to requester's parent
            const parentUser = await db.users.findOne({ where: { parent: fromUser.parent, nick: util.PARENT_USER_NICK } });
            if (parentUser) {
                const device = await db.devices.findOne({ where: { userid: parentUser.id } });
                if (device?.pushSubscription) {
                    const toNick = await util.getNickByID(c1.to);
                    sendPush(device.pushSubscription, { type: 'connection_accepted', from: toNick })
                        .catch(async (err) => {
                            if (err?.statusCode === 410 || err?.statusCode === 404) {
                                await device.update({ pushSubscription: null });
                            }
                        });
                }
            }
        }
        // System messages to both users
        const toNick = await util.getNickByID(c1.to);
        const fromNick = await util.getNickByID(c1.from);
        try {
            await sendSystemMessage(c1.from, `You are now connected with ${toNick}`);
            await sendSystemMessage(c1.to, `You are now connected with ${fromNick}`);
        } catch (e) {
            // Non-blocking: log but don't fail the request
        }
        const { generateStateCert } = require('../services/stateCert');
        const stateCert = await generateStateCert(req.user.user);
        // Also generate cert for the other parent (notify via WS)
        if (fromUser) {
            const otherCert = await generateStateCert(fromUser.parent);
            notify(fromUser.parent, { type: 'state_cert', stateCert: otherCert });
        }
        res.status(200).json({ stateCert });
    } else if (req.body.status == util.ConnectionStatus.REJECTED) {
        await c.update({ status: req.body.status });
        // Notify the parent of the requester
        const fromUser = await db.users.findByPk(c.from);
        if (fromUser) {
            notify(fromUser.parent, { type: 'connection_status', connectionId: c.id, status: req.body.status });
            // Push notification to requester's parent
            const parentUser = await db.users.findOne({ where: { parent: fromUser.parent, nick: util.PARENT_USER_NICK } });
            if (parentUser) {
                const device = await db.devices.findOne({ where: { userid: parentUser.id } });
                if (device?.pushSubscription) {
                    sendPush(device.pushSubscription, { type: 'connection_rejected' })
                        .catch(async (err) => {
                            if (err?.statusCode === 410 || err?.statusCode === 404) {
                                await device.update({ pushSubscription: null });
                            }
                        });
                }
            }
        }
        // System message to requester
        await sendSystemMessage(c.from, 'Connection request declined');
        res.sendStatus(204);
    } else {
        res.status(400).send({ errCode: 10, errDesc: 'Status not recognized' });
    }
});

router.delete('/:connid', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Connections']
    // #swagger.summary = 'Remove a connection (by parent)'
    // #swagger.description = 'Deletes both sides of a connection and notifies the other user.'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[204] = { description: 'Connection removed' } */
    /* #swagger.responses[403] = { description: 'Not authorized to remove this connection' } */
    /* #swagger.responses[404] = { description: 'Connection not found' } */
    const c = await db.connections.findByPk(req.params.connid);
    if (!c) {
        return res.status(404).send("Connection not found");
    }
    // Verify parent owns the 'from' user
    const children = await util.getUserByParent(req.user.user);
    const childIds = children.map(u => u.id);
    if (!childIds.includes(c.from)) {
        return res.status(403).send({ errCode: 12, errDesc: 'Not authorized to remove this connection' });
    }
    // Remove both sides
    await db.connections.destroy({ where: { from: c.from, to: c.to } });
    await db.connections.destroy({ where: { from: c.to, to: c.from } });
    // Notify other user's parent and send system message
    const otherUser = await db.users.findByPk(c.to);
    if (otherUser) {
        notify(otherUser.parent, { type: 'connection_removed', from: c.from, to: c.to });
        const fromNick = await util.getNickByID(c.from);
        try { await sendSystemMessage(c.to, `${fromNick} has been disconnected`); } catch (e) { /* non-blocking */ }
    }
    // Update state cert
    const { generateStateCert } = require('../services/stateCert');
    const stateCert = await generateStateCert(req.user.user);
    if (otherUser) {
        const otherCert = await generateStateCert(otherUser.parent);
        notify(otherUser.parent, { type: 'state_cert', stateCert: otherCert });
    }
    res.status(200).json({ stateCert });
});

module.exports = router;
