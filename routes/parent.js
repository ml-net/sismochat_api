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
    // #swagger.tags = ['Parents']
    // #swagger.summary = 'Register a new parent'
    // #swagger.description = 'Create a new parent account with email and password (min 6 chars).'
    /* #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: { $ref: '#/definitions/Parent' }
    } */
    /* #swagger.responses[201] = { description: 'Parent created, returns ID' } */
    /* #swagger.responses[400] = { description: 'Email already exists or invalid input' } */
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
    // #swagger.tags = ['Parents']
    // #swagger.summary = 'Get parent by email'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'Parent found' } */
    /* #swagger.responses[401] = { description: 'Authentication required' } */
    /* #swagger.responses[404] = { description: 'Parent not found' } */
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
