const router = require('express').Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { authenticate, authorize } = require('../middleware/auth');
const { generateStateCert } = require('../services/stateCert');
const db = require('../models/index.js');


const secret = process.env.JWT_SECRET;

// GET /api/v1/sync/cert — get current state certificate on demand
router.get('/cert', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Sync']
    // #swagger.summary = 'Get current state certificate'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'State certificate JWT' } */
    const stateCert = await generateStateCert(req.user.user);
    if (!stateCert) return res.status(404).json({ errCode: 3, errDesc: 'Parent not found' });
    res.json({ stateCert });
});

// POST /api/v1/sync/restore — restore state from signed certificate
router.post('/restore', async (req, res) => {
    // #swagger.tags = ['Sync']
    // #swagger.summary = 'Restore server state from client certificate'
    /* #swagger.responses[201] = { description: 'State restored' } */
    /* #swagger.responses[400] = { description: 'Malformed certificate' } */
    /* #swagger.responses[401] = { description: 'Invalid signature' } */
    /* #swagger.responses[409] = { description: 'Email conflict' } */
    const { stateCert } = req.body;
    if (!stateCert) return res.status(400).json({ errCode: 4, errDesc: 'Certificate required' });

    let payload;
    try {
        payload = jwt.verify(stateCert, secret);
    } catch (e) {
        return res.status(401).json({ errCode: 5, errDesc: 'Invalid certificate signature' });
    }

    if (payload.type !== 'parent') {
        return res.status(400).json({ errCode: 4, errDesc: 'Invalid certificate type' });
    }

    try {
        // Check email conflict
        const existing = await db.parents.findOne({ where: { email: payload.email } });
        if (existing && existing.id !== payload.id) {
            return res.status(409).json({ errCode: 2, errDesc: 'Email already registered by another account' });
        }

        // Restore parent
        const [parent] = await db.parents.findOrCreate({ where: { id: payload.id }, defaults: { id: payload.id, email: payload.email, pwd: payload.pwdHash } });
        if (parent.email !== payload.email || parent.pwd !== payload.pwdHash) {
            await parent.update({ email: payload.email, pwd: payload.pwdHash });
        }

        // Restore children, devices, connections
        for (const child of payload.children || []) {
            const [user] = await db.users.findOrCreate({ where: { id: child.id }, defaults: { id: child.id, nick: child.nick, key: child.key, parent: payload.id, permissions: child.permissions } });
            if (user.nick !== child.nick || user.key !== child.key) {
                await user.update({ nick: child.nick, key: child.key, permissions: child.permissions });
            }
            if (child.deviceId) {
                const existingDevice = await db.devices.findByPk(child.deviceId);
                if (!existingDevice) {
                    await db.devices.create({ id: child.deviceId, userid: child.id });
                }
            }
            for (const conn of child.connections || []) {
                const [connRecord] = await db.connections.findOrCreate({
                    where: { from: conn.from, to: conn.to },
                    defaults: { id: crypto.randomUUID(), from: conn.from, to: conn.to, status: conn.status }
                });
                if (connRecord.status !== conn.status) await connRecord.update({ status: conn.status });
                // Create inverse connection if the other user exists
                if (conn.status === 0) {
                    const otherUser = await db.users.findByPk(conn.to);
                    if (otherUser) {
                        await db.connections.findOrCreate({
                            where: { from: conn.to, to: conn.from },
                            defaults: { id: crypto.randomUUID(), from: conn.to, to: conn.from, status: 0 }
                        });
                    }
                }
            }
        }

        // Create inverse connections: if someone has a connection TO our child, ensure our child has one back
        for (const child of payload.children || []) {
            const inbound = await db.connections.findAll({ where: { to: child.id, status: 0 } });
            for (const conn of inbound) {
                await db.connections.findOrCreate({
                    where: { from: child.id, to: conn.from },
                    defaults: { id: crypto.randomUUID(), from: child.id, to: conn.from, status: 0 }
                });
            }
        }

        // Return fresh certificate with complete state
        const stateCert = await generateStateCert(payload.id);
        res.status(201).json({ msg: 'State restored', stateCert });
    } catch (e) {
        res.status(500).json({ errCode: -1, errDesc: 'Restore failed' });
    }
});

module.exports = router;
