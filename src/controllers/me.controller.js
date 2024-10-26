const dotenv = require("dotenv");
const { User } = require("../models/user");
dotenv.config();

const handleError = (res, statusCode, message) => {
    return res.error({ status: statusCode, message });
};

async function getUserHistory(req, res) {
    try {
        console.log("working")
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const userId = req.user.id;

        const user = await User.findById(userId).select("timeSchedule");

        if (!user) {
            return res.error({ message: "User not found", status: 404 });
        }

        const totalEntries = user.timeSchedule.length;
        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(startIndex + limit, totalEntries);

        const paginatedTimestamps = user.timeSchedule.slice(startIndex, endIndex);

        const meta = {
            currentPage: page,
            pageItems: paginatedTimestamps.length,
            totalItems: totalEntries,
            totalPages: Math.ceil(totalEntries / limit),
        };

        // Return the paginated timestamps with meta information
        return res.success({ timestamps: paginatedTimestamps }, meta);
    } catch (err) {
        console.error("Error fetching user timestamps:", err); // Log error details for debugging
        return handleError(res, 500, "Server error");
    }
}


module.exports = {
    getUserHistory
};