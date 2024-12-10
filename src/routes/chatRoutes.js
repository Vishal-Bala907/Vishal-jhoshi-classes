const express = require("express");
const { userChats, chatUserList } = require("../controllers/chatController");

const router = express.Router();

router.get("/chat/:userId/:selectedUser", userChats);
router.post("/chatUserList", chatUserList);

module.exports = router;
