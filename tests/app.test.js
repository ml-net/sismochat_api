const request = require('supertest');
const app = require('../app');
const util = require('../util.js');
const newParent = {
    email: 'me@me.com',
    pwd: "blablabla",
}

const newUserWithoutKey = {
    nick: 'mynick1'
}

const newUserWithKey = {
    nick: 'mynick2',
    pk: '-----BEGIN PUBLIC KEY-----\n' +
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA28DLojvHlUZN6heEF4dc\n' +
        'sOAVcj4f5ULZa8O7l+aAahzEXvIll/CWoNIy0OliYzkBtnqPt3cl2q2sTBrJ6DbN\n' +
        'CRDlrSjIwXQsu/nXK4A/6uS7wlL3ajGpxtwdgfaU/gOTiyFRLRI+oCaObw6VhuHS\n' +
        'ksBmG0iYNxe2ygq0bQrn2iZFi0FlimEvn8FvK1+KUOMtrhei73Gl4eB2wiZknaw6\n' +
        '7Krd/wEvllMBNot+vE7S0vjm65W8OShfUPQW5Umoefv1SBrvgkxWiQ6G+p9zbcud\n' +
        'VA+QcWkRxPPn78jhNtex6Cir4swIiwqSuNN3FGPsJogaZjZo8e1Our6F8ggSdfMB\n' +
        '2wIDAQAB\n' +
        '-----END PUBLIC KEY-----\n'
}

let JWTtoken;
let pk1, pk2, pv1;
let id1, id2;
let deviceId1;

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
                    JWTtoken = authResponse.body.token;


                })
        );
    });

    it('Get parent by email', () => {
        return (
            request(app)

                .get('/api/super/' + newParent.email)
                .set('Authorization', 'Bearer ' + JWTtoken)
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

    it('Create user not sending keys', () => {
        return (
            request(app)
                .post('/api/user/')
                .set('Authorization', 'Bearer ' + JWTtoken)
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

    it('Getting single users by parent', () => {
        return (
            request(app)
                .get('/api/user/parent/me@me.com')
                .set('Authorization', 'Bearer ' + JWTtoken)
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
                .set('Authorization', 'Bearer ' + JWTtoken)
                .send(newUserWithKey)
                .expect('Content-Type', /json/)
                .expect(201)
                .then((response) => {
                    expect(response.body).toHaveProperty('ID');
                    expect(response.body).toHaveProperty('keys.public');
                    pk2 = response.body.keys.public;
                    expect(response.body.keys.public).toEqual(newUserWithKey.pk);
                    id2 = response.body.ID;
                })
        );
    });

    it('Getting multiple users by parent', () => {
        return (
            request(app)
                .get('/api/user/parent/me@me.com')
                .set('Authorization', 'Bearer ' + JWTtoken)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual(expect.arrayContaining([{ id: id1, nick: newUserWithoutKey.nick }, { id: id2, nick: newUserWithKey.nick }]));
                })
        );
    });

    it('Failing getting users by non existent parent', () => {
        return (
            request(app)
                .get('/api/user/parent/me@me.org')
                .set('Authorization', 'Bearer ' + JWTtoken)
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
                .set('Authorization', 'Bearer ' + JWTtoken)
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
                .set('Authorization', 'Bearer ' + JWTtoken)
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

    it('Creating device and pair with existent user', () => {
        return (
            request(app)
                .post('/api/device/' + id1)
                .set('Authorization', 'Bearer ' + JWTtoken)
                .expect(201)
                .then((response) => {
                    deviceId1 = response.text
                })
        );
    });

    it('Creating device and pair with non existent user', () => {
        return (
            request(app)
                .post('/api/device/asdfasdf')
                .set('Authorization', 'Bearer ' + JWTtoken)
                .expect(404)
        );
    });

    it('Get JWT Token by user auth', () => {
        let token = util.btoa(id1) + '.' + util.btoa(deviceId1) + '.' + util.privEncode(deviceId1, pv1);
        return (
            request(app)
                .post('/api/auth/user')
                .send({ token: token })
                .expect('Content-Type', /json/)
                .expect(200)
                .then((authResponse) => {
                    expect(authResponse.body).toHaveProperty('token');
                    JWTtoken = authResponse.body.token;
                })
        );
    });

});