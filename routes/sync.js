const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { authenticate, authorize } = require('../middleware/auth');
const { generateStateCert } = require('../services/stateCert');
const db = require('../models/index.js');
const uuid = require('uuid');

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

        // Upsert parent
        await db.parents.upsert({ id: payload.id, email: payload.email, pwd: payload.pwdHash });

        // Upsert children, devices, connections
        for (const child of payload.children || []) {
            await db.users.upsert({ id: child.id, nick: child.nick, key: child.key, parent: payload.id, permissions: child.permissions });
            if (child.deviceId) {
                await db.devices.upsert({ id: child.deviceId, userid: child.id });
            }
            for (const conn of child.connections || []) {
                const [connRecord] = await db.connections.findOrCreate({
                    where: { from: conn.from, to: conn.to },
                    defaults: { id: uuid.v4(), from: conn.from, to: conn.to, status: conn.status }
                });
                if (connRecord.status !== conn.status) await connRecord.update({ status: conn.status });
            }
        }

        res.status(201).json({ msg: 'State restored' });
    } catch (e) {
        res.status(500).json({ errCode: -1, errDesc: 'Restore failed' });
    }
});

module.exports = router;
