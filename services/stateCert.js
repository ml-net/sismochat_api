const jwt = require('jsonwebtoken');
const db = require('../models/index.js');

const secret = process.env.JWT_SECRET;

async function generateStateCert(parentId) {
    const parent = await db.parents.findByPk(parentId);
    if (!parent) return null;

    const children = await db.users.findAll({ where: { parent: parentId } });
    const childrenData = await Promise.all(children.map(async (child) => {
        const device = await db.devices.findOne({ where: { userid: child.id } });
        const connections = await db.connections.findAll({ where: { from: child.id } });
        return {
            id: child.id,
            nick: child.nick,
            key: child.key,
            permissions: child.permissions,
            deviceId: device ? device.id : null,
            connections: connections.map(c => ({ from: c.from, to: c.to, status: c.status }))
        };
    }));

    const payload = {
        type: 'parent',
        id: parentId,
        email: parent.email,
        pwdHash: parent.pwd,
        children: childrenData,
        issuedAt: new Date().toISOString()
    };

    return jwt.sign(payload, secret);
}

module.exports = { generateStateCert };
