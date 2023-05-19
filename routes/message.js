var router = require('express').Router();
const jwt = require('jsonwebtoken');
const util = require('../util.js');
const cred = require('../APIcred.js');

// MESSAGE STATUS
const MESS = {
    UNREAD: 0,
    READ: 1
};

router.get('/list/:msgStatus', cred.verifyToken, (req, res) => {
    jwt.verify(req.token, cred.secret, (err, tokenData) => {
        if (err) {
            console.log(err);
            res.status(401).send(err);
        } else {
            if (tokenData.profile == 'User') {
                if (util.userExists(tokenData.user)) {
                    let mList = [];
                    require('../models/index.js').messages.findAll({ where: { to: tokenData.user, status: req.params.msgStatus } }).then(msg => {
                        for (let i = 0; i < msg.length; i++) {
                            let m = msg[i].dataValues;
                            if (m.msgid.split('_')[0] == tokenData.user) {
                                mList.push({ msgID: m.msgid, from: m.from });
                            }
                        }
                        res.status(200).send(mList);
                    });
                } else {
                    res.status(400).send('No user found');
                }
            } else {
                res.status(401).send({ errCode: 7, errDesc: 'Profile Error' });
            }
        }
    });
});

router.get("/:msgID", cred.verifyToken, (req, res) => {
    jwt.verify(req.token, cred.secret, (err, tokenData) => {
        if (err) {
            res.status(401).send(err);
        } else {
            if (tokenData.profile == 'User') {
                require('../models/index.js').messages.findOne({ where: { id: req.params.msgID } }).then(msg => {
                    if (msg !== null) {
                        if (msg.from == tokenData.user || msg.to == tokenData.user) {
                            res.status(200).send(msg.dataValues);
                        } else {
                            res.status(400).send({msg: "Not YOUR message!"})
                        }
                    } else {
                        res.status(404).send({msg: "No msg found"});
                    }
                });
            } else {
                res.status(401).send({ errCode: 7, errDesc: 'Profile Error' });
            }
        }
    });
});


router.put('/:msgID/:status', cred.verifyToken, (req, res) => {
    jwt.verify(req.token, cred.secret, (err, tokenData) => {
        if (err) {
            res.status(401).send(err);
        } else {
            if (tokenData.profile == 'User') {
                require('../models/index.js').messages.findOne({ where: { msgid: req.params.msgID } }).then(msg => {
                    if (msg !== null) {
                        if (msg.from == tokenData.user || msg.to == tokenData.user) {
                            msg.update({ status: req.params.status }).then(res.sendStatus(204));
                        } else {
                            res.status(400).send({msg: "Not YOUR message!"})
                        }
                    } else {
                        res.status(404).send({msg: 'No msg found'});
                    }
                });
            } else {
                res.status(401).send({ errCode: 7, errDesc: 'Profile Error' });
            }
        }
    });
});

router.post('/', cred.verifyToken, (req, res) => {
    jwt.verify(req.token, cred.secret, (err, tokenData) => {
        if (err) {
            res.status(401).send(err);
        } else {
            if (tokenData.profile == 'User') {
                let fromID = tokenData.user;
                let toID = req.body.to;
                require('../models/index.js').users.findByPk(fromID).then(from => {
                    if (from !== null) {
                        require('../models/index.js').users.findByPk(toID).then(to => {
                            if (to !== null) {
                                if (req.body.message.trim != '') {
                                    let tmpmsg1 = {};
                                    let tmpmsg2 = {};
                                    let timestamp = new Date().getTime();
                                    let msg1ID = toID + '_' + timestamp;
                                    let msg2ID = fromID + '_' + timestamp;
                                    tmpmsg1.msgid = msg1ID;
                                    tmpmsg1.from = fromID;
                                    tmpmsg1.to = toID;
                                    tmpmsg1.body = req.body.message;
                                    tmpmsg1.status = MESS.UNREAD;
                                    tmpmsg2.msgid = msg2ID;
                                    tmpmsg2.from = fromID;
                                    tmpmsg2.to = toID;
                                    tmpmsg2.body = req.body.message;
                                    tmpmsg2.status = MESS.UNREAD;
                                    require('../models/index.js').messages.create(tmpmsg1).then(msg1 => {
                                        require('../models/index.js').messages.create(tmpmsg2).then(msg2 => {
                                            res.status(201).send({ "messageID": msg1.id });
                                        });
                                    });
                                } else {
                                    res.status(400).send({ msg: 'No empty body allowed' });
                                }
                            } else {
                                res.status(404).send({ msg: 'To: No user found' });
                            }
                        });
                    } else {
                        res.status(404).send({ msg: 'From: No user found' });
                    }
                });
            } else {
                res.status(401).send({ errCode: 7, errDesc: 'Profile Error' });
            }
        }
    });
});


module.exports = router;

