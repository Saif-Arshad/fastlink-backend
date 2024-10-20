const express = require("express");
const router = express.Router();
const { verifyUserToken } = require("../middlewares/jwt");
const { adminOnly } = require("../middlewares/admin");
const statsControllers = require("../controllers/stats.controler");



router.get("/users", statsControllers.getUserStats);
router.get("/card-stats", statsControllers.getConsolidatedStatusStats);
router.get("/tables", statsControllers.getProductStatusStats);



module.exports = router;
