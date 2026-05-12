const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

// Verifies Bearer token and attaches decoded payload to req.user
function authenticate(req, res, next) {
    const header = req.headers['authorization'];
    if (!header) {
        return res.status(401).json({ errCode: 1, errDesc: 'Authentication required' });
    }
    const token = header.split(' ')[1];
    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(401).json(err);
        }
        req.user = decoded;
        next();
    });
}

// Restricts access to specific profiles (Parent, User)
function authorize(...profiles) {
    return (req, res, next) => {
        if (!profiles.includes(req.user.profile)) {
            return res.status(401).json({ errCode: 7, errDesc: 'Profile Error' });
        }
        next();
    };
}

module.exports = { authenticate, authorize };
