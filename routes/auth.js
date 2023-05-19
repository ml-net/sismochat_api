var router = require('express').Router();
const jwt = require('jsonwebtoken');
const util = require('../util.js');
const cred = require('../APIcred.js');

router.post('/parent', (req, res) => {
    if (!req.body.email || !req.body.pwd) {
        res.status(401).send({ errCode: 4, errDesc: "Missing credentials" });
    } else {
        util.parentEmailExists(req.body.email).then(found => {
            if (!found) {
                res.status(401).send({ errCode: 3, errDesc: "User unknown" });
            } else {
                cred.parentAuth(req.body.email, require('crypto').createHash('md5').update(req.body.pwd).digest("hex"), (data) => {
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
    }
});

router.post('/user', (req, res) => {
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