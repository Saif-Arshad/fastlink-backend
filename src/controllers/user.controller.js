const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const { sanitizeObject } = require("../utils/sanitize");
const nodemailer = require("nodemailer")
const { User, UserToken } = require("../models/user");
const { text } = require("express");
dotenv.config();
const cloudinary = require('../utils/Cloudnairy')
const busboy = require('busboy');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});
// Function to handle error responses
const handleError = (res, statusCode, message) => {
  return res.error({ status: statusCode, message });
};

const checkIn = async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user has already checked in today
    const hasCheckedInToday = user.timeSchedule.some(
      entry => entry.sign_in && entry.sign_in.toDateString() === today.toDateString()
    );

    if (hasCheckedInToday) {
      return res.status(400).send('User has already checked in today');
    }

    // Add new check-in
    const checkInEntry = {
      sign_in: new Date() // Records current time as check-in time
    };
    user.timeSchedule.push(checkInEntry);
    await user.save();

    res.status(200).json({ message: 'Check-in recorded', time: checkInEntry.sign_in });
  } catch (error) {
    console.error('Check-In Error:', error);
    res.status(500).send('Error checking in');
  }
};

// Check-Out
const checkOut = async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's check-in to record check-out
    const todayEntry = user.timeSchedule.find(
      entry => entry.sign_in && entry.sign_in.toDateString() === today.toDateString()
    );

    if (!todayEntry || todayEntry.sign_out) {
      return res.status(400).send('No check-in today or already checked out');
    }

    // Record check-out time
    todayEntry.sign_out = new Date();
    await user.save();

    res.status(200).json({ message: 'Check-out recorded', time: todayEntry.sign_out });
  } catch (error) {
    console.error('Check-Out Error:', error);
    res.status(500).send('Error checking out');
  }
};
async function signAdminIn(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return handleError(res, 400, "Email and password are required");
    }

    const adminUser = await User.findOne({ email });
    if (!adminUser) {
      return handleError(res, 401, "Incorrect credentials");
    }

    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (isMatch) {

      const token = jwt.sign({ id: adminUser._id }, process.env.SECRET, {
        expiresIn: "15d",
      });
      await UserToken.create({ token });

      await adminUser.save();

      return res.success({ token, user: adminUser });
    }

    return handleError(res, 401, "Incorrect credentials");
  } catch (err) {
    return handleError(res, 500, err.message);
  }
}




async function signAdminOut(req, res) {
  try {
    const { id: userId } = req.body;
    console.log("🚀 ~ signAdminOut ~ userId:", userId)

    if (!userId) {
      return handleError(res, 400, "User ID is required");
    }


    const user = await User.findById(userId);
    console.log("🚀 ~ signAdminOut ~ user:", user)

    if (user) {
      const lastLoginEntry = user.timeSchedule[user.timeSchedule.length - 1];
      if (lastLoginEntry && !lastLoginEntry.logOut) {
        lastLoginEntry.logOut = new Date();
      }

      await user.save();
    }

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
    console.log("🚀 ~ createAdminUser ~ sanitizedBody:", sanitizedBody)

    const isUserExist = await User.findOne({ email: sanitizedBody.email });
    if (isUserExist) {
      return handleError(res, 400, "User with this Email already exists");
    }
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(sanitizedBody.encryptedPassword ? sanitizedBody.encryptedPassword : sanitizedBody.password, salt);

    const user = await User.create({
      ...sanitizedBody,
      password: hashPassword
    });
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
    const users = await User.find({ type: "employee" });

    if (!users.length) {
      return res.error({ message: "No users found", status: 404 });
    }
    return res.success({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    return handleError(res, 500, "Server error");
  }
}

async function getUserById(req, res) {
  try {
    // Parse pagination parameters from the query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.params.id; // Use req.params.id to access user ID from URL parameter

    // Find the user by ID and select only the timeSchedule field
    const user = await User.findById(userId);

    if (!user) {
      return res.error({ message: "User not found", status: 404 });
    }

    // Pagination calculations
    const totalEntries = user.timeSchedule.length;
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalEntries);

    // Slice the timestamps for the current page
    const paginatedTimestamps = user.timeSchedule.slice(startIndex, endIndex);

    // Meta information for pagination
    const meta = {
      currentPage: page,
      pageItems: paginatedTimestamps.length,
      totalItems: totalEntries,
      totalPages: Math.ceil(totalEntries / limit),
    };

    // Return the paginated timestamps with meta information
    return res.success({ timestamps: paginatedTimestamps, name: user.full_name }, meta);
  } catch (err) {
    console.error("Error fetching user timestamps for user:", err); // Log error details for debugging
    return handleError(res, 500, "Server error");
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
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, newPassword, profileImage } = req.body;
    let updatedFields = {};

    console.log(req.body)
    if (name) {
      updatedFields.full_name = name;
    }

    // Hash and update password if provided
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      updatedFields.password = hashedPassword;
    }

    // Update profile image URL if provided
    if (profileImage) {
      updatedFields.profileImage = profileImage;
    }

    // Update user in the database
    const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, { new: true });

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

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
async function inviteUser(req, res) {
  const userId = req.user.id;
  console.log("🚀 ~ inviteUser ~ userId:", userId)
  const { email } = req.body;
  console.log("🚀 ~ inviteUser ~ email:", email)

  if (!email) {
    return handleError(res, 400, "Email is required");
  }

  try {
    // Check if the user already exists
    const isUserExisted = await User.findOne({ email });
    if (isUserExisted) {
      return handleError(res, 400, "User already exists");
    }

    const inviteLink = `${process.env.FRONTEND_URL}/register?invite=${userId}`;

    // Set up mail options
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Invitation to Register on the Fast link',
      html: `
  <div style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px; max-width: 600px; margin: 0 auto; border-radius: 8px;">
    
  
    
    <!-- Main Content -->
    <h2 style="color: #5950A8;font-size:24px;">Welcome to the Fast Link!</h2>
    <p>Hi </p>
    <p>We're thrilled to have you on board. The Fast Link a Management Dashboard will help you streamline your projects, collaborate with your team, and achieve your goals more efficiently.</p>
    
    <p>To get started, please complete your registration by clicking the button below:</p>
    
    <!-- Registration Button -->
    <div style="text-align: center; margin: 20px 0;">
      <a href="${inviteLink}" style="display: inline-block; padding: 8px 16px; font-size: 14px; color: #fff; background-color: #5950A8; text-decoration: none; border-radius: 4px;">
        Register Now
      </a>
    </div>
    
    <p>If the button above doesn't work, please :</p>
    <p style="word-break: break-all;"><a href="${inviteLink}" style="color: #5950A8;">Click Here</a></p>
    
    <p>If you have any questions or need assistance, feel free to reach out to our support team at <a href="mailto:lootah1999@gmail.com" style="color: #5950A8;">lootah1999@gmail.com</a>.</p>
    
    <!-- Closing -->
    <p>Thank you for joining us!</p>
    <p>Best regards,<br>The Fast Link Team</p>
    
    <!-- Footer -->
    <footer style="text-align: center; margin-top: 30px; font-size: 12px; color: #777;">
      <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
      <p>
        <a href="https://facebook.com" style="color: #777; margin: 0 5px; text-decoration: none;">Facebook</a> |
        <a href="https://twitter.com" style="color: #777; margin: 0 5px; text-decoration: none;">Twitter</a> |
        <a href="https://linkedin.com" style="color: #777; margin: 0 5px; text-decoration: none;">LinkedIn</a>
      </p>
    </footer>
  
  </div>
`,

    };

    const info = await transporter.sendMail(mailOptions);

    return res.json({
      message: "Invite sent successfully",
      success: true,
    });
  } catch (error) {
    return handleError(res, 500, error.message);
  }
}

// Protected Admin Route
async function protectedAdmin(req, res) {
  return res.success({ type: "user" });


}

async function authenticateAdmin(req, res) {
  const { id } = req.body
  try {


    const isAdmin = await User.findOne({ _id: id, type: "admin" })

    if (!isAdmin) {

      return handleError(res, 404, 'Admin not Found');
    }
    return res.json({
      success: true,
      message: "User is Authenticated"
    })
  } catch (error) {
    return handleError(res, 500, error.message);

  }

}

module.exports = {
  protectedAdmin,
  signAdminIn,
  signAdminOut,
  createAdminUser,
  getAllUsers,
  getUsers,
  inviteUser,
  checkIn,
  updateUserProfile,
  checkOut,
  authenticateAdmin,
  getUserById,
  updateUserById,
  deleteUserById,
};
