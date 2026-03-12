const { verifyAccessToken } = require('../utils/jwt');

const auth = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        const cookieToken = req.cookies?.accessToken;

        if (!authHeader && !cookieToken) return res.status(401).json({ message: 'No token provided' });

        let token = null;
        if (authHeader) {
            const parts = authHeader.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                token = parts[1];
            } else if (!cookieToken) {
                return res.status(401).json({ message: 'Malformed token' });
            }
        }

        if (!token && cookieToken) {
            token = cookieToken;
        }

        try {
            const decoded = verifyAccessToken(token);
            if (roles.length && !roles.includes(decoded.role)) return res.status(403).json({ message: 'Forbidden' });
            req.user = decoded;
            next();
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
    };
};

module.exports = auth;