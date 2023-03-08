var router = require('express').Router();
const jwt = require('jsonwebtoken');
const util = require('../util.js');
const cred = require('../APIcred.js');

router.post('/', cred.verifyToken, (req, res) => {
    jwt.verify(req.token, cred.secret, (err, authData) => {
        if (err) {
            res.status(401).send(err);
        } else {
            let tokenData = JSON.parse(util.atob(req.token.split('.')[1]));
            if (tokenData.profile == 'Parent') {
                util.parentExists(tokenData.user).then(found => {
                    if (found) {
                        if (req.body.pk && req.body.pk != '') {
                            require('../models/index.js').users.create({nick: req.body.nick, key: req.body.pk.replace(/\\n/g, '\n'), parent: tokenData.user}).then(user => {
                                res.setHeader('Content-Type', 'application/json');
                                res.status(201).send({ID: user.id, keys: {public: req.body.pk}});
                            });
                        } else {
                            const {generateKeyPair} = require('crypto');
                            generateKeyPair('rsa', {
                                modulusLength: 2048,
                                publicKeyEncoding: {
                                    type: 'spki',
                                    format: 'pem'
                                },
                                privateKeyEncoding: {
                                    type: 'pkcs8',
                                    format: 'pem',
                                    cipher: 'aes-256-cbc',
                                    passphrase: ''
                                }
                            }, (err, publicKey, privateKey) => {
                                if (err) {
                                    res.status(400).send(err);
                                } else {
                                    let keys = {private: privateKey, public: publicKey};
                                    require('../models/index.js').users.create({nick: req.body.nick, key: keys.public.replace(/\\n/g, '\n'), parent: tokenData.user}).then(user => {
                                        res.setHeader('Content-Type', 'application/json');
                                        res.status(201).send({ID: user.id, keys: keys});
                                    });

                                }
                            });
                        }
                    } else {
                        res.status(400).send("Parent not found");
                    }
                });
            } else {
                res.status(401).send({errCode: 7, errDesc: 'Profile Error'});
            }
        }
    });
});

router.get('/:userid', cred.verifyToken, (req, res) => {
    jwt.verify(req.token, cred.secret, (err, authData) => {
        if (err) {
            res.status(401).send(err);
        } else {
            let tokenData = JSON.parse(util.atob(req.token.split('.')[1]));
            if (tokenData.profile == 'User') {
                require('../models/index.js').users.findByPk(req.params.userid).then(u => {
                    if (u !== null) {
                        res.status(200).send({id: req.params.userid, nick: u.nick, parent: u.parent, pubkey: u.key});
                    } else {
                        res.status(400).send('No user found');
                    }
                });
            } else {
                res.status(401).send({errCode: 7, errDesc: 'Profile Error'});
            }
        }
    });
});

router.get('/pubkey/:userid', cred.verifyToken, (req, res) => {
    jwt.verify(req.token, cred.secret, (err, authData) => {
        if (err) {
            res.status(401).send(err);
        } else {
            let tokenData = JSON.parse(util.atob(req.token.split('.')[1]));
            if (tokenData.profile == 'User') {
                require('../models/index.js').users.findByPk(req.params.userid).then(u => {
                    if (u !== null) {
                        res.status(200).send({pubkey: u.key});
                    } else {
                        res.status(400).send('No user found');
                    }
                });
            } else {
                res.status(401).send({errCode: 7, errDesc: 'Profile Error'});
            }
        }
    });
});

router.get('/parent/:parentemail', cred.verifyToken, (req, res) => {
    jwt.verify(req.token, cred.secret, (err, authData) => {
        if (err) {
            res.status(401).send(err);
        } else {
            let tokenData = JSON.parse(util.atob(req.token.split('.')[1]));
            if (tokenData.profile == 'Parent') {
                require('../models/index.js').parents.findOne({where: {email: req.params.parentemail}}).then(p => {
                    if (p !== null) {
                        util.getUserByParent(p.id).then(list => {
                            res.status(200).send(list);
                        });
                    } else {
                        res.status(404).send('No parent found');
                    }
                });
            } else {
                res.status(401).send({errCode: 7, errDesc: 'Profile Error'});
            }
        }
    });
});

module.exports = router;