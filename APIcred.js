let db = require('./models/index.js');
let util = require('./util.js');
let cred = {
    secret: process.env.JWT_SECRET,
    credenziali: {},

    parentAuth: function (email, pwd, cb) {
        db.parents.findOne({where: {email: email, pwd: pwd}}).then(p => {
            if (p && p.dataValues.id != "") {
                cb({esito: 0, userid: p.dataValues.id});
            } else {
                cb({esito: 1});
            }
        });
    },

    userAuth: function (usertoken, cb) {
        let userid = parseInt(util.atob(usertoken[0]));
        let deviceId = util.atob(usertoken[1]).trim();
        let encrDevice = usertoken[2].replace(/ /g, '+');
        db.users.findByPk(userid).then(u => {
            if (u !== null) {
                let decryptDeviceId = util.pubDecode(encrDevice, u.key).replace('\n','');
                if (decryptDeviceId == deviceId) {
                    db.devices.findOne({where: {userid: userid}}).then(d => {
                        if (d == null) {
                            // Associazione UserID <-> DeviceId non presente
                            cb({errCode: 7, errDesc: "User don't have DeviceId registered"});
                        } else {
                            if (d.deviceid == deviceId) {
                                cb({errCode: 0, jwt: {user: userid, nick: u.nick, profile: 'User'}});
                            } else {
                                cb({errCode: 8, errDesc: "Other DeviceID associated with user"});
                            }
                        }
                    });
                } else {
                    cb({errCode: 6, errDesc: "Token not valid"});
                }
            } else {
                cb({errCode: 3, errDesc: "User unknown"});
            }
        });
    },

    verifyToken: function (req, res, next) {
        //credenziali = requireUncached('./APIcredentials.json');
        const bearerHeader = req.headers['authorization'];
        if (typeof bearerHeader !== 'undefined') {
            const bearerToken = bearerHeader.split(' ')[1];
            req.token = bearerToken;
            next();
        } else {
            res.status(401).send({errCode: 1, errDesc: "Authentication required"});
        }
    },

}
module.exports = cred;
