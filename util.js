let util = {
    pubEncode: function (msg, key) {
        let res = require('crypto').publicEncrypt(key, Buffer.from(msg, 'base64')).toString('base64');
        return res;
    },

    pubDecode: function (msg, key) {
        let res = require('crypto').publicDecrypt(key, Buffer.from(msg, 'base64')).toString();
        return res;
    },

    privEncode: function (msg, key) {
        let hash = require('crypto').createHash('md5').update(msg).digest('hex');
        require('fs').writeFileSync(hash, key);
        const privateKey = require('fs').readFileSync(hash, "utf8");
        // privateEncrypt() method with its parameters
        const encrypted = require('crypto').privateEncrypt({key: privateKey, passphrase: ''}, Buffer.from(msg));
        let res = encrypted.toString("base64");
        //let res = require('crypto').privateEncrypt({key: key, passphrase: ''}, Buffer.from(msg, 'base64')).toString('base64');
        return res;
    },

    privDecode: function (msg, key, done) {
        let res = require('crypto').privateDecrypt(key, Buffer.from(msg, 'base64'));
        done(res);
    },

    userExists: function (userid) {
        let u = require('./models/index.js').users.findByPk(userid);
        return (u !== null);
    },

    parentExists: function (userid) {
        let u = require('./models/index.js').parents.findByPk(userid);
        return (u !== null);
    },

    parentEmailExists: function (email) {
        return require('./models/index.js').parents.findOne({where: {email: email}}).then(u => {
            return (u !== null);
        });
    },

    getUserByParent: function (parent) {
        return require('./models/index.js').users.findAll({where: {parent: parent}}).then(u => {
            let list = [];
            for (let i = 0; i < u.length; i++) {
                let tmp = {
                    id: u[i].dataValues.id,
                    nick: u[i].dataValues.nick
                }
                list.push(tmp);
            }
            return list;
        });
    },

    getNickByID: function (userid) {
        return require('./models/index.js').users.findByPk(userid).then(u => {
            if (u !== null) {
                return u.nick;
            } else {
                return 'N/D';
            }
        });

    },

    btoa: function (plain) {
        return Buffer.from(plain, 'binary').toString('base64');
    },

    atob: function (b64) {
        return Buffer.from(b64, 'base64').toString();
    }
}

module.exports = util;