const { Router } = require("express");
const router = Router();
const testRuleRouter = require("./test.routes.js");
const userRouter = require("./user.routes.js");
const { verifyUserToken } = require("../middlewares/jwt.js");

router.use("/test", testRuleRouter);
router.use("/users", userRouter);

module.exports = router;

