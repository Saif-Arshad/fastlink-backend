const express = require("express");
const router = express.Router();
const { verifyUserToken } = require("../middlewares/jwt");
const {
    getUserHistory
} = require("../controllers/me.controller")

router.get("/history", verifyUserToken, getUserHistory);

module.exports = router;
