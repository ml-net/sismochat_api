const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const util = require('../util.js');
const db = require('../models/index.js');

router.get('/list/:msgStatus', authenticate, authorize('User'), [
    param('msgStatus').isInt({ min: 0, max: 1 })
], async (req, res) => {
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
    const msg = await db.messages.findOne({ where: { id: req.params.msgID } });
    if (!msg) {
        return res.status(404).send({ msg: "No msg found" });
    }
    if (msg.from == req.user.user || msg.to == req.user.user) {
        res.status(200).send(msg.dataValues);
    } else {
        res.status(400).send({ msg: "Not YOUR message!" });
    }
});

router.put('/:msgID/:status', authenticate, authorize('User'), async (req, res) => {
    const msg = await db.messages.findOne({ where: { id: req.params.msgID } });
    if (!msg) {
        return res.status(404).send({ msg: 'No msg found' });
    }
    if (msg.to != req.user.user) {
        return res.status(400).send({ msg: "Not YOUR message!" });
    }
    await msg.update({ status: req.params.status });
    res.sendStatus(204);
});

router.post('/', authenticate, authorize('User'), [
    body('to').notEmpty().trim(),
    body('message').notEmpty()
], async (req, res) => {
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

module.exports = router;
