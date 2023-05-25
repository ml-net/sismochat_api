const request = require('supertest');
const app = require('../app');
const util = require('../util.js');
const newParent = {
    email: 'me@me.com',
    pwd: "blablabla",
}

const testMsg = 'The quick brown fox jumps over the lazy dog!';

const newUserWithoutKey = {
    nick: 'mynick1'
}

const newUserWithoutKey2 = {
    nick: 'mynick1'
}

const newUserWithKey = {
    nick: 'mynick2',
    pk: '-----BEGIN PUBLIC KEY-----\n' +
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7rE907tEU0tBkxsC44Dy\n' +
        '6wsmoMwRs0k8NHkU6tDr6Oje1NYHEQe0YLN22OXnqYZmpzwkbH9cgkcufjalSRX7\n' +
        'odCqLM14UrBJenqZ03iXq0Kqhf2h3L6C6VpOlaqqnN1BibTTA3aI5W0VnDgAQxPB\n' +
        'WSbfJN543tj6rBgsMzJyJMPvNREVaBvkdeUVb3qBJVw6quoLJ7mTwZE+6fuoYHl5\n' +
        'pBVmT9ixHWhXM8UnV2eBg8/z2ogpvZq2amgiapV3WsHH5OXOP9TO3zg73FstlhRE\n' +
        'VaFnhx+YqbVFcUnYn9/8YvtsFJcXw2rdiNRbE2h2Iy39MA9GJEH8MEHHKrOXqOot\n' +
        '1QIDAQAB\n' +
        '-----END PUBLIC KEY-----\n'
}

let JWTtokenParent, JWTTokenUser, JWTTokenUser2;
let pk1, pv1, pk2, pv2;
let id1, id2;
let deviceId1, deviceId2;
let msgId;

describe('Parent endpoint', () => {
    it('Create a new parent', () => {
        return (
            request(app)
                .post('/api/super')
                .send(newParent)
                .expect('Content-Type', /json/)
                .expect(201)
                .then((response) => {
                    expect(response.body).toHaveProperty('ID');
                })
        );
    });

    it('Failing get parent without auth', () => {
        return (
            request(app)
                .get('/api/super/' + newParent.email)
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('Get JWT Token by parent auth', () => {
        return (
            request(app)
                .post('/api/auth/parent')
                .send(newParent)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((authResponse) => {
                    expect(authResponse.body).toHaveProperty('token');
                    JWTtokenParent = authResponse.body.token;
                })
        );
    });

    it('Failing parent auth - missing credentials', () => {
        return (
            request(app)
                .post('/api/auth/parent')
                .send({
                    email: 'me@me.com'
                })
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('Failing parent auth - invalid credentials', () => {
        return (
            request(app)
                .post('/api/auth/parent')
                .send({
                    email: 'me@me.com', pwd: "pippo"
                })
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('Failing parent auth - user does not exists', () => {
        return (
            request(app)
                .post('/api/auth/parent')
                .send({
                    email: 'me@meme.com', pwd: "pippo"
                })
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('Get parent by email', () => {
        return (
            request(app)

                .get('/api/super/' + newParent.email)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((response) => {
                    expect(response.body).toHaveProperty('email');
                    expect(response.body.email).toEqual(newParent.email);
                })
        );
    });

});

describe('User endpoint', () => {

    it('Failing create user without auth', () => {
        return (
            request(app)
                .post('/api/user/')
                .send(newUserWithoutKey)
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('Failing getting users without auth', () => {
        return (
            request(app)
                .get('/api/user/parent/me@me.org')
                .expect(401)
        );
    });

    it('Create user not sending keys #1', () => {
        return (
            request(app)
                .post('/api/user/')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .send(newUserWithoutKey)
                .expect('Content-Type', /json/)
                .expect(201)
                .then((response) => {
                    expect(response.body).toHaveProperty('ID');
                    expect(response.body).toHaveProperty('keys.private');
                    expect(response.body).toHaveProperty('keys.public');
                    pv1 = response.body.keys.private;
                    pk1 = response.body.keys.public;
                    id1 = response.body.ID;
                })
        );
    });

    it('Create user not sending keys #2', () => {
        return (
            request(app)
                .post('/api/user/')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .send(newUserWithoutKey2)
                .expect('Content-Type', /json/)
                .expect(201)
                .then((response) => {
                    expect(response.body).toHaveProperty('ID');
                    expect(response.body).toHaveProperty('keys.private');
                    expect(response.body).toHaveProperty('keys.public');
                    pv2 = response.body.keys.private;
                    pk2 = response.body.keys.public;
                    id2 = response.body.ID;
                })
        );
    });

    it('Getting single users by parent', () => {
        return (
            request(app)
                .get('/api/user/parent/me@me.com')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual(expect.arrayContaining([{ id: id1, nick: newUserWithoutKey.nick }]));
                })
        );
    });

    it('Create user sending keys', () => {
        return (
            request(app)
                .post('/api/user/')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .send(newUserWithKey)
                .expect('Content-Type', /json/)
                .expect(201)
                .then((response) => {
                    expect(response.body).toHaveProperty('ID');
                    expect(response.body).toHaveProperty('keys.public');
                    expect(response.body.keys.public).toEqual(newUserWithKey.pk);
                })
        );
    });

    it('Getting multiple users by parent', () => {
        return (
            request(app)
                .get('/api/user/parent/me@me.com')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual(expect.arrayContaining([{ id: id1, nick: newUserWithoutKey.nick }, { id: id2, nick: newUserWithoutKey2.nick }]));
                })
        );
    });

    it('Failing getting users by non existent parent', () => {
        return (
            request(app)
                .get('/api/user/parent/me@me.org')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(404)
        );
    });

    it('Creating new parent', () => {
        return (
            request(app)
                .post('/api/super')
                .send({ email: "me@me.org", pwd: "blabla" })
                .expect('Content-Type', /json/)
                .expect(201)
                .then((response) => {
                    expect(response.body).toHaveProperty('ID');
                })
        )
    })

    it('Getting no users by parent', () => {
        return (
            request(app)
                .get('/api/user/parent/me@me.org')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual([]);
                })
        );
    });

    it('Failing getting user by ID with wrong token', () => {
        return (
            request(app)
                .get('/api/user/' + id1)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('Failing getting user by ID withouth token', () => {
        return (
            request(app)
                .get('/api/user/' + id1)
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('Failing create device and pair with existent user and no auth', () => {
        return (
            request(app)
                .post('/api/device/' + id1)
                .expect(401)
        );
    });

    it('Creating device and pair with existent user #1', () => {
        return (
            request(app)
                .post('/api/device/' + id1)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(201)
                .then((response) => {
                    deviceId1 = response.text
                })
        );
    });

    it('Creating device and pair with existent user #2', () => {
        return (
            request(app)
                .post('/api/device/' + id2)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(201)
                .then((response) => {
                    deviceId2 = response.text
                })
        );
    });

    it('Failing creating device and pair with non existent user', () => {
        return (
            request(app)
                .post('/api/device/asdfasdf')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(404)
        );
    });

    it('Get JWT Token by user auth #1', () => {
        let token = util.btoa(id1) + '.' + util.btoa(deviceId1) + '.' + util.privEncode(deviceId1, pv1);
        return (
            request(app)
                .post('/api/auth/user')
                .send({ token: token })
                .expect('Content-Type', /json/)
                .expect(200)
                .then((authResponse) => {
                    expect(authResponse.body).toHaveProperty('token');
                    JWTTokenUser = authResponse.body.token;
                })
        );
    });

    it('Get JWT Token by user auth #2', () => {
        let token = util.btoa(id2) + '.' + util.btoa(deviceId2) + '.' + util.privEncode(deviceId2, pv2);
        return (
            request(app)
                .post('/api/auth/user')
                .send({ token: token })
                .expect('Content-Type', /json/)
                .expect(200)
                .then((authResponse) => {
                    expect(authResponse.body).toHaveProperty('token');
                    JWTTokenUser2 = authResponse.body.token;
                })
        );
    });

    it('Failing user auth - user unknown', () => {
        let token = util.btoa('s' + id1) + '.' + util.btoa(deviceId1) + '.' + util.privEncode(deviceId1, pv1);
        return (
            request(app)
                .post('/api/auth/user')
                .send({ token: token })
                .expect('Content-Type', /json/)
                .expect(401)
                .then((authResponse) => {
                    expect(authResponse.body.errDesc).toEqual('User unknown');
                })
        );
    });

    it('Failing user auth - invalid token', () => {
        let token = util.btoa(id2) + '.' + util.btoa(deviceId2) + '.' + util.privEncode(deviceId1, pv2);
        return (
            request(app)
                .post('/api/auth/user')
                .send({ token: token })
                .expect('Content-Type', /json/)
                .expect(401)
                .then((authResponse) => {
                    expect(authResponse.body.errDesc).toEqual('Token not valid');
                })
        );
    });

});

describe('Message endpoint', () => {
    it('Sending message', () => {
        return (
            request(app)
                .post('/api/message/')
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .send({ to: id1, message: util.privEncode(testMsg, pv1) })
                .expect('Content-Type', /json/)
                .expect(201)
                .then((content) => {
                    msgId = content.body.messageID;
                    console.log(msgId)
                })
        );
    });

    it('Failing sending message without auth', () => {
        return (
            request(app)
                .post('/api/message/')
                .send({ to: id2, message: util.privEncode(testMsg, pv1) })
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('Failing sending message to non-existent user', () => {
        return (
            request(app)
                .post('/api/message/')
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .send({ to: 'nouser', message: util.privEncode(testMsg, pv1) })
                .expect('Content-Type', /json/)
                .expect(404)
        );
    });

    it('Retrieving message', () => {
        return (
            request(app)
                .get('/api/message/' + msgId)
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((content) => {
                    expect(util.pubDecode(content.body.body, pk1)).toEqual(testMsg)
                })
        );
    });

    it('Failing getting non existent message', () => {
        return (
            request(app)
                .get('/api/message/nonexists')
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .expect('Content-Type', /json/)
                .expect(404)
        );
    });

    it('Failing getting message without token', () => {
        return (
            request(app)
                .get('/api/message/' + msgId)
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('Failing getting message with invalid token', () => {
        return (
            request(app)
                .get('/api/message/' + msgId)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('Failing getting message - NOT YOUR MESSAGE (No sender, no receiver)', () => {
        return (
            request(app)
                .get('/api/message/' + msgId)
                .set('Authorization', 'Bearer ' + JWTTokenUser2)
                .expect('Content-Type', /json/)
                .expect(400)
        );
    });

    it('Getting unread message list', () => {
        return (
            request(app)
                .get('/api/message/list/' + util.MESS.UNREAD)
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .expect(200)
                .then((content) => {
                    expect(content.body.length).toEqual(1)
                })
        );
    });

    it('Failing getting read message list', () => {
        return (
            request(app)
                .get('/api/message/list/' + util.MESS.READ)
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .expect(404)
        );
    });

    it('Marking message as READ', () => {
        return (
            request(app)
                .put('/api/message/' + msgId + '/' + util.MESS.READ)
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .expect(204)
        );
    });

    it('Failing getting unread message list now empty', () => {
        return (
            request(app)
                .get('/api/message/list/' + util.MESS.UNREAD)
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .expect(404)
        );
    });

    it('Getting read message list', () => {
        return (
            request(app)
                .get('/api/message/list/' + util.MESS.READ)
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .expect(200)
                .then((content) => {
                    expect(content.body.length).toEqual(1)
                })
        );
    });

});