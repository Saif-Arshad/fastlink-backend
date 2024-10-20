const { Table } = require("../models/tables");
const { User, UserToken } = require("../models/user");


const calculateDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};

// user stats
exports.getUserStats = async (req, res) => {
    console.log("working");
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Users registered today
        const usersRegisteredToday = await User.countDocuments({
            createdAt: { $gte: today },
        });

        // Admins registered today
        const adminsRegisteredToday = await User.countDocuments({
            createdAt: { $gte: today },
            type: 'admin',
        });

        // Users registered today (excluding admins)
        const regularUsersRegisteredToday = await User.countDocuments({
            createdAt: { $gte: today },
            type: 'user',
        });

        // Users registered in the last 7 days
        const lastWeek = calculateDaysAgo(7);
        const usersRegisteredLastWeek = await User.countDocuments({
            createdAt: { $gte: lastWeek },
        });

        // Admins registered in the last 7 days
        const adminsRegisteredLastWeek = await User.countDocuments({
            createdAt: { $gte: lastWeek },
            type: 'admin',
        });

        // Regular users registered in the last 7 days
        const regularUsersRegisteredLastWeek = await User.countDocuments({
            createdAt: { $gte: lastWeek },
            type: 'user',
        });

        // Total users
        const totalUsers = await User.countDocuments();

        // Total admins
        const totalAdmins = await User.countDocuments({ type: 'admin' });

        // Total regular users
        const totalRegularUsers = await User.countDocuments({ type: 'user' });

        res.json({
            today: {
                total: usersRegisteredToday,
                admins: adminsRegisteredToday,
                regularUsers: regularUsersRegisteredToday,
            },
            lastWeek: {
                total: usersRegisteredLastWeek,
                admins: adminsRegisteredLastWeek,
                regularUsers: regularUsersRegisteredLastWeek,
            },
            total: {
                users: totalUsers,
                admins: totalAdmins,
                regularUsers: totalRegularUsers,
            },
        });
    } catch (error) {
        console.log("🚀 ~ exports.getUserStats= ~ error:", error);
        res.status(500).json({ message: 'Failed to fetch user stats', error });
    }
};


// table stats

exports.getProductStatusStats = async (req, res) => {
    try {
        const tables = await Table.aggregate([
            { $unwind: "$products" },
            {
                $group: {
                    _id: { tableId: "$_id", status: "$products.status" },
                    count: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: "$_id.tableId",
                    statuses: {
                        $push: { status: "$_id.status", count: "$count" },
                    },
                },
            },
            // Perform lookup to get the table name from the Table collection
            {
                $lookup: {
                    from: "tables", // This is the collection name in MongoDB
                    localField: "_id", // Matches with the table ID
                    foreignField: "_id", // The field to join from the table collection
                    as: "tableInfo",
                },
            },
            // Extract the name field from the tableInfo array
            {
                $project: {
                    _id: 1,
                    statuses: 1,
                    name: { $arrayElemAt: ["$tableInfo.name", 0] }, // Extract the first element from tableInfo array
                },
            },
        ]);

        res.json({ tables });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch product stats', error });
    }
};

exports.getConsolidatedStatusStats = async (req, res) => {
    try {
        const statusData = await Table.aggregate([
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.status",
                    count: { $sum: 1 }, // Count of products per status
                }
            }
        ]);

        // Get the total number of products across all tables
        const totalProducts = await Table.aggregate([
            { $unwind: "$products" },
            {
                $group: {
                    _id: null,
                    totalCount: { $sum: 1 } // Count of all products
                }
            }
        ]);

        res.json({ statusData, totalProducts: totalProducts[0]?.totalCount || 0 });
    } catch (error) {
        console.error("Error fetching consolidated status stats:", error);
        res.status(500).json({ message: 'Failed to fetch consolidated status stats', error });
    }
};