const express = require('express');
const { body, param } = require('express-validator');
const testController = require('../controllers/testController');
const multer = require('multer');

const router = express.Router();

router.post(
    '/tests/create',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('questions').isArray().withMessage('Questions must be an array')
    ],
    testController.createTest
);

router.patch(
    '/tests/update/:testId',
    [
        param('testId').isMongoId().withMessage('Valid test ID required'),
    ],
    testController.updateTest
);

router.delete(
    '/tests/delete/:testId',
    [param('testId').isMongoId().withMessage('Valid test ID required')],
    testController.deleteTest
);

router.get('/tests/all', testController.getAllTests);

router.get(
    '/tests/:testId',
    [param('testId').isMongoId().withMessage('Valid test ID required')],
    testController.getTestById
);

const upload = multer({ dest: 'uploads/' });

router.post('/tests/create_upload', upload.single('file'), testController.uploadTest);

router.post('/tests/test-completed', testController.validateTestResult);

router.post('/tests/test-leader-board/:testId', testController.getTestLeaderboard);

module.exports = router;
