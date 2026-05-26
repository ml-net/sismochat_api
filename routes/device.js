const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { generateKeyPair } = require('crypto');
const util = require('../util.js');
const db = require('../models/index.js');
const { notify } = require('../services/websocket');

router.post('/:userid', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Devices']
    // #swagger.summary = 'Register a device for a user'
    // #swagger.description = 'Create a device ID and pair it with a child user. Only one device per user.'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[201] = { description: 'Device created, returns device ID' } */
    /* #swagger.responses[400] = { description: 'User already has a device' } */
    /* #swagger.responses[404] = { description: 'User not found' } */
    if (!await util.userExists(req.params.userid)) {
        return res.status(404).send("User doesn't exists");
    }
    const d = await db.devices.findOne({ where: { userid: req.params.userid } });
    if (d) {
        return res.status(400).send("User has Device registered yet");
    }
    const device = await db.devices.create({ userid: req.params.userid });
    const { generateStateCert } = require('../services/stateCert');
    const stateCert = await generateStateCert(req.user.user);
    res.status(201).json({ deviceId: device.id, stateCert });
});

router.put('/:deviceId/push-subscription', authenticate, async (req, res) => {
    // #swagger.tags = ['Devices']
    // #swagger.summary = 'Save push subscription for a device'
    // #swagger.description = 'Store the Web Push subscription object for the specified device. The authenticated user must own the device.'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'Subscription saved' } */
    /* #swagger.responses[400] = { description: 'Invalid subscription' } */
    /* #swagger.responses[403] = { description: 'Not your device' } */
    /* #swagger.responses[404] = { description: 'Device not found' } */
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ errCode: 30, errDesc: 'Invalid push subscription' });
    }
    const device = await db.devices.findByPk(req.params.deviceId);
    if (!device) {
        return res.status(404).json({ errCode: 31, errDesc: 'Device not found' });
    }
    if (device.userid !== req.user.user) {
        const user = await db.users.findByPk(device.userid);
        if (!user || user.parent !== req.user.user) {
            return res.status(403).json({ errCode: 32, errDesc: 'Not your device' });
        }
    }
    await device.update({ pushSubscription: subscription });
    res.status(200).json({ message: 'Subscription saved' });
});

router.put('/:userid', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Devices']
    // #swagger.summary = 'Re-provision device for a user'
    // #swagger.description = 'Replace existing device with a new one. Preserves userId, connections, and permissions. Updates public key if provided.'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'Device re-provisioned, returns new device ID and keys' } */
    /* #swagger.responses[403] = { description: 'Not your child' } */
    /* #swagger.responses[404] = { description: 'User not found' } */
    const user = await db.users.findByPk(req.params.userid);
    if (!user) {
        return res.status(404).send("User not found");
    }
    if (user.parent !== req.user.user) {
        return res.status(403).send({ msg: 'Not your child' });
    }

    // Delete old device
    await db.devices.destroy({ where: { userid: req.params.userid } });

    // Create new device
    const device = await db.devices.create({ userid: req.params.userid });

    // Update public key
    if (req.body?.pk) {
        await user.update({ key: req.body.pk.replace(/\\n/g, '\n') });
        // Notify online contacts of key change
        const connections = await db.connections.findAll({ where: { from: req.params.userid, status: util.ConnectionStatus.ACCEPTED } });
        for (const conn of connections) {
            notify(conn.to, { type: 'key_changed', userId: req.params.userid, key: user.key });
        }
        const { generateStateCert } = require('../services/stateCert');
        const stateCert = await generateStateCert(req.user.user);
        return res.status(200).json({ deviceId: device.id, keys: { public: req.body.pk }, stateCert });
    }

    // Generate new key pair if no pk provided
    generateKeyPair('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase: '' }
    }, async (err, publicKey, privateKey) => {
        if (err) return res.status(500).send({ errCode: -1, errDesc: 'Key generation failed' });
        await user.update({ key: publicKey.replace(/\\n/g, '\n') });
        // Notify online contacts of key change
        const connections = await db.connections.findAll({ where: { from: req.params.userid, status: util.ConnectionStatus.ACCEPTED } });
        for (const conn of connections) {
            notify(conn.to, { type: 'key_changed', userId: req.params.userid, key: publicKey });
        }
        const { generateStateCert } = require('../services/stateCert');
        const stateCert = await generateStateCert(req.user.user);
        res.status(200).json({ deviceId: device.id, keys: { private: privateKey, public: publicKey }, stateCert });
    });
});

router.delete('/:userid', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Devices']
    // #swagger.summary = 'Remove device from a user'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[204] = { description: 'Device removed' } */
    await db.devices.destroy({ where: { userid: req.params.userid } });
    res.sendStatus(204);
});

module.exports = router;
