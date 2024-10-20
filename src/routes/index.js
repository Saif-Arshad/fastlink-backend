const { Router } = require("express");
const router = Router();
const testRuleRouter = require("./test.routes.js");
const statsRoutes = require("./stats.routes.js")
const userRouter = require("./user.routes.js");
const productRouter = require("./products.routes.js");
const { verifyUserToken } = require("../middlewares/jwt.js");

router.use("/test", testRuleRouter);
router.use("/users", userRouter);
router.use("/products", verifyUserToken, productRouter);
router.use("/stats", statsRoutes)

module.exports = router;

