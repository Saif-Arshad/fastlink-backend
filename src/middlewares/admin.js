const { User } = require("../models/user");

async function adminOnly(req, res, next) {
  console.log(req.user)
  const user = await User.findById(req.user.id);
  console.log("🚀 ~ adminOnly ~ user:", user)
  if (user && user.type === "admin") {
    next();
  } else {
    return res.error({
      status: 403,
      message: "Admins only",
    });
  }
}

module.exports = { adminOnly };
