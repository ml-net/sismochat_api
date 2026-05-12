const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const util = require('../util.js');
const db = require('../models/index.js');

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
    res.status(201).send(device.id);
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
