const router = require('express').Router();
const { generateKeyPair } = require('crypto');
const { authenticate, authorize } = require('../middleware/auth');
const util = require('../util.js');
const db = require('../models/index.js');

router.post('/', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Create a child user'
    // #swagger.description = 'Create a new child user. If no public key is provided, a key pair is generated.'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: { $ref: '#/definitions/User' }
    } */
    /* #swagger.responses[201] = { description: 'User created, returns ID and keys' } */
    /* #swagger.responses[400] = { description: 'Parent not found' } */
    /* #swagger.responses[401] = { description: 'Authentication required or wrong profile' } */
    if (!await util.parentExists(req.user.user)) {
        return res.status(400).send("Parent not found");
    }
    if (req.body.pk && req.body.pk != '') {
        const user = await db.users.create({ nick: req.body.nick, key: req.body.pk.replace(/\\n/g, '\n'), parent: req.user.user });
        return res.status(201).json({ ID: user.id, keys: { public: req.body.pk } });
    }
    // Generate key pair if no public key provided
    generateKeyPair('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase: '' }
    }, async (err, publicKey, privateKey) => {
        if (err) return res.status(400).send(err);
        const user = await db.users.create({ nick: req.body.nick, key: publicKey.replace(/\\n/g, '\n'), parent: req.user.user });
        res.status(201).json({ ID: user.id, keys: { private: privateKey, public: publicKey } });
    });
});

router.get('/:userid', authenticate, authorize('User'), async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get user by ID'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'User found' } */
    /* #swagger.responses[404] = { description: 'User not found' } */
    const u = await db.users.findByPk(req.params.userid);
    if (u) {
        res.status(200).send({ id: req.params.userid, nick: u.nick, parent: u.parent, pubkey: u.key });
    } else {
        res.status(404).send('No user found');
    }
});

router.get('/pubkey/:userid', authenticate, authorize('User'), async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get public key of a user'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'Public key returned' } */
    /* #swagger.responses[400] = { description: 'User not found' } */
    const u = await db.users.findByPk(req.params.userid);
    if (u) {
        res.status(200).send({ pubkey: u.key });
    } else {
        res.status(400).send('No user found');
    }
});

router.get('/parent/:parentemail', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get all users by parent email'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'List of users' } */
    /* #swagger.responses[404] = { description: 'Parent not found' } */
    const p = await db.parents.findOne({ where: { email: req.params.parentemail } });
    if (p) {
        const list = await util.getUserByParent(p.id);
        res.status(200).send(list);
    } else {
        res.status(404).send('No parent found');
    }
});

module.exports = router;
