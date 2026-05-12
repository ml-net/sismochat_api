const router = require('express').Router();
const { generateKeyPair } = require('crypto');
const { authenticate, authorize } = require('../middleware/auth');
const util = require('../util.js');
const db = require('../models/index.js');

router.post('/', authenticate, authorize('Parent'), async (req, res) => {
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
    const u = await db.users.findByPk(req.params.userid);
    if (u) {
        res.status(200).send({ id: req.params.userid, nick: u.nick, parent: u.parent, pubkey: u.key });
    } else {
        res.status(404).send('No user found');
    }
});

router.get('/pubkey/:userid', authenticate, authorize('User'), async (req, res) => {
    const u = await db.users.findByPk(req.params.userid);
    if (u) {
        res.status(200).send({ pubkey: u.key });
    } else {
        res.status(400).send('No user found');
    }
});

router.get('/parent/:parentemail', authenticate, authorize('Parent'), async (req, res) => {
    const p = await db.parents.findOne({ where: { email: req.params.parentemail } });
    if (p) {
        const list = await util.getUserByParent(p.id);
        res.status(200).send(list);
    } else {
        res.status(404).send('No parent found');
    }
});

module.exports = router;
