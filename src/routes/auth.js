const express = require('express');
const { body } = require('express-validator');
const { signInController, signUpController, forgetPassword, updatePassword } = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
    '/signup',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('name').notEmpty().withMessage('Name is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    ],
    signUpController
);

router.post(
    '/signin',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').exists().withMessage('Password is required'),
    ],
    signInController
);

router.post(
    '/forgetPassword',
    [
        body('email').isEmail().withMessage('Valid email is required')
    ],
    forgetPassword
);

router.post(
    '/updatePassword',
    authenticateToken,
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    ],
    updatePassword
)

module.exports = router;
