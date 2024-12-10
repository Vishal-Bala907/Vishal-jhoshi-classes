const express = require("express");
const {
  updateRole,
  getAllUsers,
  getAllStudents,
  getAllMentors,
} = require("../controllers/roleController");

const router = express.Router();

router.post("/roles/updateRole/:userId", updateRole);
router.get("/roles/users", getAllUsers);
router.get("/roles/users/mentors", getAllMentors);
router.get("/roles/users/:userId", getAllStudents);

module.exports = router;
