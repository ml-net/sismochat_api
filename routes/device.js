var router = require('express').Router();
const jwt = require('jsonwebtoken');
const util = require('../util.js');
const cred = require('../APIcred.js');

router.post('/:userid', cred.verifyToken, (req, res) => {
    jwt.verify(req.token, cred.secret, async (err, authData) => {
        if (err) {
            res.status(401).send(err);
        } else {
            if (authData.profile == 'Parent') {
                if (await util.userExists(req.params.userid)) {
                    require('../models/index.js').devices.findOne({ where: { userid: req.params.userid } }).then(d => {
                        if (d == null) {
                            // Associazione UserID <-> DeviceId non presente
                            require('../models/index.js').devices.create({ userid: req.params.userid }).then(d => {
                                res.status(201).send(d.id);
                            });
                        } else {
                            res.status(400).send("User has Device registered yet");
                        }
                    });
                } else {
                    res.status(404).send("User doesn't exists");
                }
            } else {
                res.status(401).send({ errCode: 7, errDesc: 'Profile Error' });
            }
        }
    });
});

router.delete('/:userid', cred.verifyToken, (req, res) => {
    jwt.verify(req.token, cred.secret, (err, authData) => {
        if (err) {
            res.status(401).send(err);
        } else {
            if (authData.profile == 'Parent') {
                require('../models/index.js').devices.destroy({ where: { userid: req.params.userid } }).then(result => {
                    res.sendStatus(204);
                }).catch(error => {
                    res.status(400).send(error);
                })
            } else {
                res.status(401).send({ errCode: 7, errDesc: 'Profile Error' });
            }
        }
    });
});



module.exports = router;