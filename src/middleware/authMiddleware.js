const jwt = require('jsonwebtoken');
const { forbidden, unauthorized } = require('../helpers/responseType');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.json(unauthorized());

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.json(forbidden())
    }
};

module.exports = authenticateToken;

