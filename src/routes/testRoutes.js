const express = require("express");
const { body, param } = require("express-validator");
const testController = require("../controllers/testController");
const testControllerSecond = require("../controllers/testControllerSecond");
const multer = require("multer");

const router = express.Router();

router.post("/tests/api/create", testController.createLiveTest);

router.post("/tests/api/create/meta", testController.createTestMeta);

router.post("/tests/api/create/res", testController.rescheduleTest);

router.post("/tests/api/create/int/:id", testController.createintTest);
router.post(
  "/tests/api/create/select/:id",
  testController.createSelectQuestion
);
router.post("/tests/api/create/match/:id", testController.createMatchQuestion);

router.get("/tests/api/get/test/:role", testControllerSecond.getTest);

router.get(
  "/tests/api/update/test-attempt/:testId",
  testControllerSecond.updateTestAttemp
);

router.get(
  "/tests/api/get/test/attended/:id",
  testControllerSecond.getAttendedTest
);
router.get(
  "/tests/api/get/test/testById/:id",
  testControllerSecond.getTestById
);

router.get(
  "/tests/api/attend/test/:testId/:studentId",
  testControllerSecond.attendTest
);
router.get(
  "/tests/api/attend/getdata/:testId/:userId",
  testControllerSecond.getTestData
);

router.get(
  "/tests/api/attend/question/:questionId/:questionType",
  testControllerSecond.getQuestion
);

router.get(
  "/tests/api/attend/question/:questionId/:questionType",
  testControllerSecond.getQuestion
);

// router.post(
//   "/tests/api/create/select/:id",
//   testController.createSelectQuestion
// );

// meta /
router.post(
  "/tests/create",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("questions").isArray().withMessage("Questions must be an array"),
  ],
  testController.createTest
);

router.patch(
  "/tests/update/:testId",
  [param("testId").isMongoId().withMessage("Valid test ID required")],
  testController.updateTest
);

router.delete(
  "/tests/delete/:testId",
  [param("testId").isMongoId().withMessage("Valid test ID required")],
  testController.deleteTest
);

router.get("/tests/all", testController.getAllTests);

router.get(
  "/tests/:testId",
  [param("testId").isMongoId().withMessage("Valid test ID required")],
  testController.getTestById
);

const upload = multer({ dest: "uploads/" });

router.post(
  "/tests/create_upload",
  upload.single("file"),
  testController.uploadTest
);

router.post("/tests/test-completed", testController.validateTestResult);

router.post(
  "/tests/test-leader-board/:testId",
  testController.getTestLeaderboard
);

module.exports = router;
