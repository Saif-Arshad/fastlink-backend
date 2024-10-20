const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const { sanitizeObject } = require("../utils/sanitize");
const { User, UserToken } = require("../models/user");
dotenv.config();

// Function to handle error responses
const handleError = (res, statusCode, message) => {
  return res.error({ status: statusCode, message });
};

// Sign In Admin
async function signAdminIn(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return handleError(res, 400, "Email and password are required");
    }
    console.log("🚀 ~ signAdminIn ~ password:", password);
    console.log("🚀 ~ signAdminIn ~ email:", email);

    const adminUser = await User.findOne({ email });
    console.log("🚀 ~ signAdminIn ~ adminUser:", adminUser);
    if (!adminUser) {
      return handleError(res, 401, "Incorrect credentials");
    }
    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (isMatch) {
      const token = jwt.sign({ id: adminUser._id }, process.env.SECRET, {
        expiresIn: "15d",
      });
      await UserToken.create({ token });
      return res.success({ token, user: adminUser });
    }

    return handleError(res, 401, "Incorrect credentials");
  } catch (err) {
    return handleError(res, 500, err.message);
  }
}

// Sign Out Admin
async function signAdminOut(req, res) {
  try {
    await UserToken.deleteOne({ token: req.token });
    return res.success({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    return handleError(res, 500, err.message);
  }
}

// Create Admin User
async function createAdminUser(req, res) {
  try {
    const sanitizedBody = sanitizeObject(req.body);
    console.log("🚀 ~ createAdminUser ~ sanitizedBody:", sanitizedBody);

    const isUserExist = await User.findOne({ email: sanitizedBody.email });
    if (isUserExist) {
      return handleError(res, 400, "User with this Email already exists");
    }
    const salt = await bcrypt.genSalt();
    sanitizedBody.password = await bcrypt.hash(sanitizedBody.password, salt);

    const user = await User.create(sanitizedBody);
    return res.success({ new_admin_user: user });
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      return handleError(res, 400, err.message);
    }
    return handleError(res, 500, err.message);
  }
}

// Retrieve All Users
async function getAllUsers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

    // Get the total number of users
    const totalUsers = await User.countDocuments();

    // Fetch the users with pagination
    const users = await User.find()
      .sort({ _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // If no users are found
    if (!users.length) {
      return res.error({ message: "No users found", status: 404 });
    }

    // Meta information for pagination
    const meta = {
      currentPage: page,
      pageItems: users.length,
      totalItems: totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
    };

    // Return the users with meta information
    return res.success({ users }, meta);
  } catch (err) {
    console.error("Error fetching users:", err); // Log error details for debugging
    return handleError(res, 500, "Server error");
  }
}
async function getUsers(req, res) {
  try {
    const users = await User.find({ type: 'user' });


    if (!users.length) {
      return res.error({ message: "No users found", status: 404 });
    }
    return res.success({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    return handleError(res, 500, "Server error");
  }
}

// Retrieve User by ID
async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return handleError(res, 404, "User not found");
    }
    return res.success({ user });
  } catch (err) {
    return handleError(res, 500, err.message);
  }
}

// Update User by ID
async function updateUserById(req, res) {
  try {
    const { id } = req.params;
    const updates = sanitizeObject(req.body);

    // If updating password, hash it first
    if (updates.encryptedPassword) {
      const salt = await bcrypt.genSalt();
      updates.password = await bcrypt.hash(updates.encryptedPassword, salt);
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) {
      return handleError(res, 404, "User not found");
    }

    return res.success({ updated_user: user });
  } catch (err) {
    return handleError(res, 500, err.message);
  }
}

// Delete User by ID
async function deleteUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return handleError(res, 404, "User not found");
    }

    return res.success({ message: "User deleted successfully" });
  } catch (err) {
    return handleError(res, 500, err.message);
  }
}

// Protected Admin Route
async function protectedAdmin(req, res) {
  return res.success({ type: "user" });
}

module.exports = {
  protectedAdmin,
  signAdminIn,
  signAdminOut,
  createAdminUser,
  getAllUsers,
  getUserById,
  getUsers,
  updateUserById,
  deleteUserById,
};
