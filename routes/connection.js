const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const util = require('../util.js');
const db = require('../models/index.js');

router.post('/:from/:to', authenticate, authorize('Parent'), async (req, res) => {
    if (!await util.userExists(req.params.from) || !await util.userExists(req.params.to)) {
        return res.status(404).send("Users not found");
    }
    await db.connections.create({ from: req.params.from, to: req.params.to, status: util.ConnectionStatus.REQUESTED });
    res.sendStatus(201);
});

// Connection list for user, requested by parent
router.get('/:user', authenticate, authorize('Parent'), async (req, res) => {
    if (!await util.userExists(req.params.user)) {
        return res.status(404).send("Users not found");
    }
    const cl = await db.connections.findAll({ where: { status: util.ConnectionStatus.ACCEPTED, from: req.params.user } });
    res.status(200).send(cl.map(c => c.dataValues.to));
});

// Connection list for user, requested by same user
router.get('/', authenticate, authorize('User'), async (req, res) => {
    if (!await util.userExists(req.user.user)) {
        return res.status(400).send("Users not found");
    }
    const cl = await db.connections.findAll({ where: { status: util.ConnectionStatus.ACCEPTED, from: req.user.user } });
    res.status(200).send(cl.map(c => c.dataValues.to));
});

router.get('/approvalList/:parent', authenticate, authorize('Parent'), async (req, res) => {
    if (!await util.parentExists(req.user.user)) {
        return res.status(404).send("Users not found");
    }
    const list = await util.getUserByParent(req.user.user);
    const toList = list.map(u => u.id);
    const cList = await db.connections.findAll({ where: { status: util.ConnectionStatus.REQUESTED, to: toList } });
    res.status(200).send(cList.map(c => c.dataValues));
});

router.patch('/:connid', authenticate, authorize('Parent'), async (req, res) => {
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
