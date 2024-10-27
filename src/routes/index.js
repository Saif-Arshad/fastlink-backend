const { Router } = require("express");
const router = Router();
const testRuleRouter = require("./test.routes.js");
const userRouter = require("./user.routes.js");
const meRouter = require("./me.routes")
const taskRouter = require("./task.routes.js")
const statsRouter = require("./stats.routes.js")
router.use("/test", testRuleRouter);
router.use("/users", userRouter);
router.use("/me", meRouter);
router.use("/tasks", taskRouter);
router.use("/stats",statsRouter)
module.exports = router;

