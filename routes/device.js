const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const util = require('../util.js');
const db = require('../models/index.js');

router.post('/:userid', authenticate, authorize('Parent'), async (req, res) => {
    if (!await util.userExists(req.params.userid)) {
        return res.status(404).send("User doesn't exists");
    }
    const d = await db.devices.findOne({ where: { userid: req.params.userid } });
    if (d) {
        return res.status(400).send("User has Device registered yet");
    }
    const device = await db.devices.create({ userid: req.params.userid });
    res.status(201).send(device.id);
});

router.delete('/:userid', authenticate, authorize('Parent'), async (req, res) => {
    await db.devices.destroy({ where: { userid: req.params.userid } });
    res.sendStatus(204);
});

module.exports = router;
