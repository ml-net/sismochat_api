var router = require('express').Router();
const jwt = require('jsonwebtoken');
const util = require('../util.js');
const cred = require('../APIcred.js');

// CONNECTION STATUS
const CONN = {
    ACCEPTED: 0,
    REQUESTED: 1,
    REJECTED: 2
}

router.post('/:from/:to', cred.verifyToken, (req, res) => {
    jwt.verify(req.token, cred.secret, (err, authData) => {
        if (err) {
            res.status(401).send(err);
        } else {
            let tokenData = JSON.parse(util.atob(req.token.split('.')[1]));
            if (tokenData.profile == 'Parent') {
                if (util.userExists(req.params.from) && util.userExists(req.params.to)) {
                    require('../models/index.js').connections.create({from: req.params.from, to: req.params.to, status: CONN.REQUESTED}).then(c => {
                        res.sendStatus(201);
                    });
                } else {
                    res.status(400).send("Users not found");
                }
            } else {
                res.status(401).send({errCode: 7, errDesc: 'Profile Error'});
            }
        }
    });
});

// Connection list for user, requested by parent
router.get('/:user', cred.verifyToken, (req, res) => {
    jwt.verify(req.token, cred.secret, (err) => {
        if (err) {
            res.status(401).send(err);
        } else {
            let tokenData = JSON.parse(util.atob(req.token.split('.')[1]));
            if (tokenData.profile == 'Parent') {
                if (util.userExists(req.params.user)) {
                    let cList = [];
                    require('../models/index.js').connections.findAll({where: {status: CONN.ACCEPTED, from: req.params.user}}).then(cl => {
                        cl.forEach(c => {
                            cList.push(c.dataValues.to);
                        });
                        res.status(200).send(cList);
                    });
                } else {
                    res.status(400).send("Users not found");
                }
            } else {
                res.status(401).send({errCode: 7, errDesc: 'Profile Error'});
            }
        }
    });
});

// Connection list for user, requested by same user
router.get('/', cred.verifyToken, (req, res) => {
    jwt.verify(req.token, cred.secret, (err) => {
        if (err) {
            res.status(401).send(err);
        } else {
            let tokenData = JSON.parse(util.atob(req.token.split('.')[1]));
            if (tokenData.profile == 'User') {
                if (util.userExists(tokenData.user)) {
                    let cList = [];
                    require('../models/index.js').connections.findAll({where: {status: CONN.ACCEPTED, from: tokenData.user}}).then(cl => {
                        cl.forEach(c => {
                            cList.push(c.dataValues.to);
                        });
                        res.status(200).send(cList);
                    });
                } else {
                    res.status(400).send("Users not found");
                }
            } else {
                res.status(401).send({errCode: 7, errDesc: 'Profile Error'});
            }
        }
    });
});

router.get('/approvalList/:parent', cred.verifyToken, (req, res) => {
    jwt.verify(req.token, cred.secret, (err) => {
        if (err) {
            res.status(401).send(err);
        } else {
            let tokenData = JSON.parse(util.atob(req.token.split('.')[1]));
            if (tokenData.profile == 'Parent') {
                if (util.parentExists(tokenData.user)) {
                    util.getUserByParent(tokenData.user).then(list => {
                        let toList = [];
                        let resList = [];
                        list.forEach((u) => {
                            toList.push(u.id);
                        });
                        require('../models/index.js').connections.findAll({where: {status: CONN.REQUESTED, to: toList}}).then(cList => {
                            cList.forEach(c => {
                                resList.push(c.dataValues);
                            });
                            res.status(200).send(resList);
                        });
                    });
                } else {
                    res.status(400).send("Users not found");
                }
            } else {
                res.status(401).send({errCode: 7, errDesc: 'Profile Error'});
            }
        }
    });
});

router.put('/:connid/:status', cred.verifyToken, (req, res) => {
    jwt.verify(req.token, cred.secret, (err) => {
        if (err) {
            res.status(401).send(err);
        } else {
            let tokenData = JSON.parse(util.atob(req.token.split('.')[1]));
            if (tokenData.profile == 'Parent') {
                require('../models/index.js').connections.findByPk(req.params.connid).then(c => {
                    if (c === null) {
                        res.status(400).send("Connection request not found");
                    } else {
                        if (req.params.status == CONN.ACCEPTED) {
                            c.update({status: req.params.status}).then(c1 => {
                                require('../models/index.js').connections.create({from: c1.to, to: c1.from, status: CONN.ACCEPTED}).then(c2 => {
                                    res.sendStatus(204);
                                });
                            });
                        } else
                        if (req.params.status == CONN.REJECTED) {
                            c.update({status: req.params.status}).then(res.sendStatus(204));
                        } else
                            res.status(400).send("Status not recognized");
                    }
                });
            } else {
                res.status(401).send({errCode: 7, errDesc: 'Profile Error'});
            }
        }
    });
});


module.exports = router;