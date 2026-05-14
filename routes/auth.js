const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const util = require('../util.js');
const { parentAuth, userAuth } = require('../services/auth.js');

const secret = process.env.JWT_SECRET;

router.post('/parent', [
    body('email').isEmail().normalizeEmail(),
    body('pwd').notEmpty()
], async (req, res) => {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Authenticate parent'
    // #swagger.description = 'Login with email and password, returns a JWT token.'
    /* #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: { $ref: '#/definitions/Parent' }
    } */
    /* #swagger.responses[200] = { description: 'JWT token returned' } */
    /* #swagger.responses[401] = { description: 'Invalid credentials' } */
    /* #swagger.responses[404] = { description: 'User not found' } */
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(401).json({ errCode: 4, errDesc: "Missing credentials" });
    }
    const found = await util.parentEmailExists(req.body.email);
    if (!found) {
        return res.status(404).send({ errCode: 3, errDesc: "User unknown" });
    }
    const data = await parentAuth(req.body.email, req.body.pwd);
    if (data.esito === 0) {
        jwt.sign({ user: data.userid, email: req.body.email, profile: 'Parent' }, secret, { expiresIn: "3600s" }, (err, token) => {
            res.json({ token });
        });
    } else {
        res.status(401).send({ errCode: 4, errDesc: "Password mismatch" });
    }
});

router.post('/user', async (req, res) => {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Authenticate child user'
    // #swagger.description = 'Login with device token (base64-encoded userid.deviceId.encryptedDeviceId), returns a JWT token.'
    /* #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: { token: 'base64userid.base64deviceid.encryptedDeviceId' }
    } */
    /* #swagger.responses[200] = { description: 'JWT token returned' } */
    /* #swagger.responses[401] = { description: 'Authentication failed' } */
    const ut = req.body.token.split('.');
    if (!ut || ut.length != 3) {
        return res.status(401).send({ errCode: 5, errDesc: "Authentication required" });
    }
    const data = await userAuth(ut);
    if (data.errCode === 0) {
        jwt.sign(data.jwt, secret, { expiresIn: "14400s" }, (err, token) => {
            if (err) {
                res.status(401).send(err);
            } else {
                res.json({ token });
            }
        });
    } else {
        res.status(401).send(data);
    }
});

module.exports = router;
