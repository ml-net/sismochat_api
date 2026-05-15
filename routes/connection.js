const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const util = require('../util.js');
const db = require('../models/index.js');

// Connection list for user, requested by same user
router.get('/', authenticate, authorize('User'), async (req, res) => {
    // #swagger.tags = ['Connections']
    // #swagger.summary = 'Get own connections list'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'List of connected user IDs' } */
    if (!await util.userExists(req.user.user)) {
        return res.status(400).send("Users not found");
    }
    const cl = await db.connections.findAll({ where: { status: util.ConnectionStatus.ACCEPTED, from: req.user.user } });
    res.status(200).send(cl.map(c => c.dataValues.to));
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
    res.status(200).send(requests.map(r => ({ id: r.id, from: r.from, to: r.to, status: r.status })));
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
    res.status(200).send(cList.map(c => c.dataValues));
});

// Connection list for user, requested by parent
router.get('/:user', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Connections']
    // #swagger.summary = 'Get connections list for a user (by parent)'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'List of connected user IDs' } */
    /* #swagger.responses[404] = { description: 'User not found' } */
    if (!await util.userExists(req.params.user)) {
        return res.status(404).send("Users not found");
    }
    const cl = await db.connections.findAll({ where: { status: util.ConnectionStatus.ACCEPTED, from: req.params.user } });
    res.status(200).send(cl.map(c => c.dataValues.to));
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
    await db.connections.create({ from: req.params.from, to: req.params.to, status: util.ConnectionStatus.REQUESTED });
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
    if (typeof req.body.status == 'undefined') {
        return res.status(400).send({ errCode: 9, errDesc: 'Status missing' });
    }
    if (req.body.status == util.ConnectionStatus.ACCEPTED) {
        const c1 = await c.update({ status: req.body.status });
        await db.connections.create({ from: c1.to, to: c1.from, status: util.ConnectionStatus.ACCEPTED });
        res.sendStatus(204);
    } else if (req.body.status == util.ConnectionStatus.REJECTED) {
        await c.update({ status: req.body.status });
        res.sendStatus(204);
    } else {
        res.status(400).send({ errCode: 10, errDesc: 'Status not recognized' });
    }
});

module.exports = router;
