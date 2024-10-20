const { Router } = require("express");
const router = Router();

const testController = require("../controllers/test.controllers");

router.get("/health", testController.getHealth);
router.get("/version", testController.getVersion);
router.get("/environment", testController.getEnvironment);

module.exports = router;
