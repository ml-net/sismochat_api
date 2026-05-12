const router = require('express').Router();
const bcrypt = require('bcrypt');
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const util = require('../util.js');
const db = require('../models/index.js');

const SALT_ROUNDS = 10;

router.post('/', [
    body('email').isEmail().normalizeEmail(),
    body('pwd').notEmpty().isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errCode: 4, errDesc: "Invalid input", details: errors.array() });
    }
    try {
        const found = await util.parentEmailExists(req.body.email);
        if (!found) {
            const hash = await bcrypt.hash(req.body.pwd, SALT_ROUNDS);
            const parent = await db.parents.create({ email: req.body.email, pwd: hash });
            res.status(201).json({ ID: parent.id });
        } else {
            res.status(400).send({ errCode: 2, errDesc: "Exists an User with this email" });
        }
    } catch (err) {
        res.status(500).send({ errCode: -1, errDesc: "Internal error" });
    }
});

router.get('/:email', authenticate, [
    param('email').isEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errCode: 4, errDesc: "Invalid input" });
    }
    const u = await db.parents.findOne({ where: { email: req.params.email } });
    if (u) {
        res.status(200).send({ parentID: u.id, email: u.email });
    } else {
        res.status(404).send('No parent found');
    }
});

module.exports = router;
