const jwt = require("jsonwebtoken");
const { UserToken } = require("../models/user");

const verifyUserToken = async (req, res, next) => {
  try {
    let token = req.header("Authorization");
    console.log("🚀 ~ verifyUserToken ~ token:", token)

    if (!token) {
      return res.error({ status: 403, message: "Access Denied" });
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.SECRET);
    req.user = decoded;

    // Check if the token has expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.error({ status: 401, message: "Expired token" });
    }

    // Check if the token exists in the database
    const tokenInstance = await UserToken.findOne({ token: token });
    if (!tokenInstance) {
      return res.error({ status: 401, message: "Session expired" });
    }

    // Pass the token to the next middleware
    req.token = token;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.error({ status: 401, message: "Invalid token" });
    }

    if (error.name === "TokenExpiredError") {
      return res.error({ status: 401, message: "Expired token" });
    }

    return res.erorr({ status: 500, message: error.message });
  }
};

module.exports = { verifyUserToken };
