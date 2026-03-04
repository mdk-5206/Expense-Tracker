const jwt = require('jsonwebtoken');

const attachUser = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        res.clearCookie('token');
        req.user = null;
    }

    next();
};

module.exports = attachUser;