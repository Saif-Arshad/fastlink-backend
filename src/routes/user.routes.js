const express = require("express");
const router = express.Router();
const {
  signAdminIn,
  signAdminOut,
  createAdminUser,
  protectedAdmin,
  getAllUsers,
  getUserById,
  authenticateAdmin,
  updateUserById,
  inviteUser,
  getUsers,
  deleteUserById,
} = require("../controllers/user.controller"); // Adjust the path as needed
const { verifyUserToken } = require("../middlewares/jwt");
const { adminOnly } = require("../middlewares/admin");

// Route to sign in an admin
router.post("/sign-in", signAdminIn);

// Route to sign out an admin
router.post("/sign-out", signAdminOut);

// Route to create a new admin user
router.post("/", createAdminUser);
router.post("/authenticate", authenticateAdmin);

// Retrieve all users
router.get("/", verifyUserToken, getAllUsers);
router.post("/invite", verifyUserToken, adminOnly, inviteUser);

// Retrieve user by ID
router.get("/user-without-pagination", verifyUserToken, adminOnly, getUsers);
router.get("/:id", verifyUserToken, adminOnly, getUserById);

// Update user by ID
router.put("/:id", verifyUserToken, adminOnly, updateUserById);

// Delete user by ID
router.delete("/:id", verifyUserToken, adminOnly, deleteUserById);

// Route to access protected admin data (for testing purposes)
router.get("/protected", verifyUserToken, protectedAdmin);

module.exports = router;
