const db = require('../models/index.js');
const util = require('../util.js');
const { notify } = require('./websocket');

async function sendSystemMessage(to, body) {
    const msg = await db.messages.create({
        from: null,
        to,
        body,
        status: util.MessageStatus.UNREAD,
        type: 'system'
    });
    notify(to, { type: 'new_message', from: null, messageType: 'system' });
    return msg;
}

module.exports = { sendSystemMessage };
