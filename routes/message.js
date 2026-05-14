const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const util = require('../util.js');
const db = require('../models/index.js');

router.get('/list/:msgStatus', authenticate, authorize('User'), [
    param('msgStatus').isInt({ min: 0, max: 1 })
], async (req, res) => {
    // #swagger.tags = ['Messages']
    // #swagger.summary = 'List messages by status'
    // #swagger.description = 'Get list of messages for the authenticated user. Status: 0=unread, 1=read.'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.parameters['msgStatus'] = { description: '0 = unread, 1 = read' } */
    /* #swagger.responses[200] = { description: 'List of messages' } */
    /* #swagger.responses[404] = { description: 'No messages found' } */
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errCode: 4, errDesc: "Invalid input" });
    }
    if (!await util.userExists(req.user.user)) {
        return res.status(400).send('No user found');
    }
    const messages = await db.messages.findAll({ where: { to: req.user.user, status: req.params.msgStatus } });
    const mList = messages.map(m => ({ msgID: m.id, from: m.from }));
    if (mList.length > 0) {
        res.status(200).send(mList);
    } else {
        res.sendStatus(404);
    }
});

router.get("/:msgID", authenticate, authorize('User'), async (req, res) => {
    // #swagger.tags = ['Messages']
    // #swagger.summary = 'Get message by ID'
    // #swagger.description = 'Download a message. Automatically marks as DOWNLOADED (sender can no longer withdraw).'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'Message content' } */
    /* #swagger.responses[400] = { description: 'Not your message' } */
    /* #swagger.responses[404] = { description: 'Message not found' } */
    const msg = await db.messages.findOne({ where: { id: req.params.msgID } });
    if (!msg) {
        return res.status(404).send({ msg: "No msg found" });
    }
    if (msg.from == req.user.user || msg.to == req.user.user) {
        // Mark as downloaded before sending response
        if (msg.to == req.user.user && msg.status == util.MessageStatus.UNREAD) {
            await msg.update({ status: util.MessageStatus.DOWNLOADED });
        }
        res.status(200).send(msg.dataValues);
    } else {
        res.status(400).send({ msg: "Not YOUR message!" });
    }
});

router.post('/', authenticate, authorize('User'), [
    body('to').notEmpty().trim(),
    body('message').notEmpty()
], async (req, res) => {
    // #swagger.tags = ['Messages']
    // #swagger.summary = 'Send a message'
    // #swagger.description = 'Send an encrypted message to another user.'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: { $ref: '#/definitions/Message' }
    } */
    /* #swagger.responses[201] = { description: 'Message sent, returns messageID' } */
    /* #swagger.responses[400] = { description: 'Invalid input' } */
    /* #swagger.responses[404] = { description: 'User not found' } */
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errCode: 4, errDesc: "Invalid input", details: errors.array() });
    }
    const fromID = req.user.user;
    const toID = req.body.to;
    if (!await util.userExists(fromID)) {
        return res.status(404).send({ msg: 'From: No user found' });
    }
    if (!await util.userExists(toID)) {
        return res.status(404).send({ msg: 'To: No user found' });
    }
    if (!req.body.message.trim()) {
        return res.status(400).send({ msg: 'No empty body allowed' });
    }
    const msgData = { from: fromID, to: toID, body: req.body.message, status: util.MessageStatus.UNREAD };
    const msg1 = await db.messages.create(msgData);
    // Create second copy if sender != recipient (each user can manage their own copy)
    if (fromID != toID) {
        await db.messages.create(msgData);
    }
    res.status(201).send({ messageID: msg1.id });
});

router.delete('/:msgID', authenticate, authorize('User'), async (req, res) => {
    // #swagger.tags = ['Messages']
    // #swagger.summary = 'Delete a message (ACK or withdraw)'
    // #swagger.description = 'Recipient: ACK after download (always allowed). Sender: withdraw only if message is still unread.'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[204] = { description: 'Message deleted' } */
    /* #swagger.responses[400] = { description: 'Not your message or already read' } */
    /* #swagger.responses[404] = { description: 'Message not found' } */
    const msg = await db.messages.findOne({ where: { id: req.params.msgID } });
    if (!msg) {
        return res.status(404).send({ msg: 'No msg found' });
    }
    if (msg.to == req.user.user) {
        // Recipient can always delete (ACK)
        await msg.destroy();
        return res.sendStatus(204);
    }
    if (msg.from == req.user.user) {
        // Sender can only withdraw if not yet downloaded
        if (msg.status == util.MessageStatus.UNREAD) {
            await msg.destroy();
            return res.sendStatus(204);
        }
        return res.status(400).send({ msg: 'Message already downloaded, cannot withdraw' });
    }
    res.status(400).send({ msg: "Not YOUR message!" });
});

module.exports = router;
