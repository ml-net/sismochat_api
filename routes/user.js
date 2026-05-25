const router = require('express').Router();
const { generateKeyPair } = require('crypto');
const { authenticate, authorize } = require('../middleware/auth');
const util = require('../util.js');
const db = require('../models/index.js');
const { sendSystemMessage } = require('../services/systemMessage');

async function connectVirtualUser(parentId, childId) {
    const virtualUser = await db.users.findOne({ where: { parent: parentId, nick: util.PARENT_USER_NICK } });
    if (virtualUser) {
        await db.connections.bulkCreate([
            { id: crypto.randomUUID(), from: virtualUser.id, to: childId, status: util.ConnectionStatus.ACCEPTED },
            { id: crypto.randomUUID(), from: childId, to: virtualUser.id, status: util.ConnectionStatus.ACCEPTED }
        ]);
    }
}

router.post('/', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Create a child user'
    // #swagger.description = 'Create a new child user. If no public key is provided, a key pair is generated.'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: { $ref: '#/definitions/User' }
    } */
    /* #swagger.responses[201] = { description: 'User created, returns ID and keys' } */
    /* #swagger.responses[400] = { description: 'Parent not found' } */
    /* #swagger.responses[401] = { description: 'Authentication required or wrong profile' } */
    if (!await util.parentExists(req.user.user)) {
        return res.status(400).send("Parent not found");
    }
    if (req.body.pk && req.body.pk != '') {
        const user = await db.users.create({ nick: req.body.nick, key: req.body.pk.replace(/\\n/g, '\n'), parent: req.user.user });
        await connectVirtualUser(req.user.user, user.id);
        const { generateStateCert } = require('../services/stateCert');
        const stateCert = await generateStateCert(req.user.user);
        return res.status(201).json({ ID: user.id, keys: { public: req.body.pk }, stateCert });
    }
    // Generate key pair if no public key provided
    generateKeyPair('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase: '' }
    }, async (err, publicKey, privateKey) => {
        if (err) return res.status(400).send(err);
        const user = await db.users.create({ nick: req.body.nick, key: publicKey.replace(/\\n/g, '\n'), parent: req.user.user });
        await connectVirtualUser(req.user.user, user.id);
        const { generateStateCert } = require('../services/stateCert');
        const stateCert = await generateStateCert(req.user.user);
        res.status(201).json({ ID: user.id, keys: { private: privateKey, public: publicKey }, stateCert });
    });
});

router.get('/:userid', authenticate, authorize('User'), async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get user by ID'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'User found' } */
    /* #swagger.responses[404] = { description: 'User not found' } */
    const u = await db.users.findByPk(req.params.userid);
    if (u) {
        res.status(200).send({ id: req.params.userid, nick: u.nick, parent: u.parent, pubkey: u.key });
    } else {
        res.status(404).send('No user found');
    }
});

router.get('/pubkey/:userid', authenticate, authorize('User'), async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get public key of a user'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'Public key returned' } */
    /* #swagger.responses[400] = { description: 'User not found' } */
    const u = await db.users.findByPk(req.params.userid);
    if (u) {
        res.status(200).send({ pubkey: u.key });
    } else {
        res.status(400).send('No user found');
    }
});

router.patch('/:userid', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Edit child nickname'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'Nickname updated' } */
    /* #swagger.responses[403] = { description: 'Not your child' } */
    /* #swagger.responses[404] = { description: 'User not found' } */
    const u = await db.users.findByPk(req.params.userid);
    if (!u) {
        return res.status(404).send('No user found');
    }
    if (u.parent != req.user.user) {
        return res.status(403).send({ msg: 'Not your child' });
    }
    if (!req.body.nick || !req.body.nick.trim()) {
        return res.status(400).send({ msg: 'Nickname required' });
    }
    await u.update({ nick: req.body.nick.trim() });
    res.status(200).send({ id: u.id, nick: u.nick });
});

router.delete('/:userid', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Delete a child user'
    // #swagger.description = 'Removes child user and all related data (device, connections, pending messages).'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[204] = { description: 'User deleted' } */
    /* #swagger.responses[403] = { description: 'Not your child' } */
    /* #swagger.responses[404] = { description: 'User not found' } */
    const u = await db.users.findByPk(req.params.userid);
    if (!u) {
        return res.status(404).send('No user found');
    }
    if (u.parent != req.user.user) {
        return res.status(403).send({ msg: 'Not your child' });
    }
    // Notify contacts before cleanup
    const contacts = await db.connections.findAll({
        where: { from: req.params.userid, status: util.ConnectionStatus.ACCEPTED }
    });
    for (const conn of contacts) {
        await sendSystemMessage(conn.to, 'This contact is no longer available');
    }
    // Clean up related data
    await db.devices.destroy({ where: { userid: req.params.userid } });
    await db.connections.destroy({ where: { [require('sequelize').Op.or]: [{ from: req.params.userid }, { to: req.params.userid }] } });
    await db.messages.destroy({ where: { [require('sequelize').Op.or]: [{ from: req.params.userid }, { to: req.params.userid }] } });
    await u.destroy();
    res.sendStatus(204);
});

module.exports = router;
