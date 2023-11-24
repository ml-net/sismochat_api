var router = require('express').Router();
const jwt = require('jsonwebtoken');
const util = require('../util.js');
const cred = require('../APIcred.js');


router.post('/', (req, res) => {
    util.parentEmailExists(req.body.email).then(found => {
        if (!found) {
            require('../models/index.js').parents.create({email: req.body.email, pwd: require('crypto').createHash('md5').update(req.body.pwd).digest("hex")}).then(parent => {
                res.setHeader('Content-Type', 'application/json');
                res.status(201).send({ID: parent.id});
            });
        } else {
            res.status(400).send({errCode: 2, errDesc: "Exists an User with this email"});
        }
    });
});

router.get('/:email', cred.verifyToken, (req, res) => {
    jwt.verify(req.token, cred.secret, (err, authData) => {
        if (err) {
            res.status(401).send(err);
        } else {
            require('../models/index.js').parents.findOne({where: {email: req.params.email}}).then(u => {
                if (u !== null) {
                    res.status(200).send({parentID: u.id, email: u.email});
                } else {
                    res.status(404).send('No parent found');
                }
            });
        }
    });
});

module.exports = router;