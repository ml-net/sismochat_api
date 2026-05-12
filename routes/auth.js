var router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const util = require('../util.js');
const cred = require('../APIcred.js');

router.post('/parent', [
    body('email').isEmail().normalizeEmail(),
    body('pwd').notEmpty()
], (req, res) => {
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
    util.parentEmailExists(req.body.email).then(found => {
        if (!found) {
            res.status(404).send({ errCode: 3, errDesc: "User unknown" });
        } else {
            cred.parentAuth(req.body.email, req.body.pwd, (data) => {
                switch (data.esito) {
                    case 0:
                        jwt.sign({ user: data.userid, email: req.body.email, profile: 'Parent' }, cred.secret, { expiresIn: "3600s" }, (err, token) => {
                            res.json({ token });
                        });
                        break;
                    case 1:
                        res.status(401).send({ errCode: 4, errDesc: "Password mismatch" });
                        break;
                    default:
                        res.status(400).send({ errCode: -1, errDesc: "Generic error" });
                        break;
                }
            });
        }
    });
});

router.post('/user', (req, res) => {
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
    let ut = req.body.token.split('.');
    if (!ut || ut.length != 3) {
        res.status(401).send({ errCode: 5, errDesc: "Authentication required" });
    } else {
        cred.userAuth(ut, (data) => {
            switch (data.errCode) {
                case 0:
                    jwt.sign(data.jwt, cred.secret, { expiresIn: "14400s" }, (err, token) => {
                        if (err) {
                            res.status(401).send(err);
                        } else {
                            res.json({ token });
                        }
                    });
                    break;
                default: 
                    res.status(401).send(data);
                    break;
            }
        });
    }
});

module.exports = router;