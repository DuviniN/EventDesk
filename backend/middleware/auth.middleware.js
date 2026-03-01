const { verifyAccessToken } = require('../utils/jwt');

const auth = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: 'No token provided' });

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Malformed token' });

        const token = parts[1];
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