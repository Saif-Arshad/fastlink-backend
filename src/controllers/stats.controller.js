const { Task } = require('../models/task');

exports.getTasksSummary = async (req, res) => {
    try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const tasksInProgress = await Task.countDocuments({
            status: 'in_progress',
            createdAt: {
                $gte: new Date(`${currentYear}-${currentMonth}-01`),
                $lt: new Date(`${currentYear}-${currentMonth + 1}-01`)
            }
        });

        const tasksCompleted = await Task.countDocuments({
            status: 'completed',
            createdAt: {
                $gte: new Date(`${currentYear}-${currentMonth}-01`),
                $lt: new Date(`${currentYear}-${currentMonth + 1}-01`)
            }
        });

        const monthlyTasksSummary = await Task.countDocuments({
            createdAt: {
                $gte: new Date(`${currentYear}-${currentMonth}-01`),
                $lt: new Date(`${currentYear}-${currentMonth + 1}-01`)
            }
        });

        res.status(200).json({
            tasksInProgress,
            tasksCompleted,
            monthlyTasksSummary
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.getUpcomingTasks = async (req, res) => {
    try {
        const upcomingTasks = await Task.find({ dueDate: { $gte: new Date() } })
            .sort({ dueDate: 1 })
            .limit(4)
            .populate({
                path: 'userIds',
            });
        ;

        res.status(200).json(upcomingTasks);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};




exports.getTaskStatistics = async (req, res) => {
    try {
        const { view } = req.query;
        console.log(`Received request for view: ${view}`);

        if (!['day', 'week', 'month'].includes(view)) {
            console.warn(`Invalid view parameter: ${view}`);
            return res.status(400).json({ message: 'Invalid view parameter. Allowed values: day, week, month.' });
        }

        const now = new Date();
        let matchCriteria = {};
        let groupBy = {};
        let labels = [];

        if (view === 'day') {
            const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            matchCriteria = { createdAt: { $gte: startOfDay } };
            groupBy = { $hour: '$createdAt' };
            labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        } else if (view === 'week') {
            const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));
            matchCriteria = { createdAt: { $gte: startOfWeek } };
            groupBy = { $dayOfWeek: '$createdAt' };
            labels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        } else if (view === 'month') {
            const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            matchCriteria = { createdAt: { $gte: startOfMonth } };
            groupBy = { $dayOfMonth: '$createdAt' };
            const daysInMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getUTCDate();
            labels = Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`);
        }

        const aggregationPipeline = [
            { $match: matchCriteria },
            {
                $group: {
                    _id: groupBy,
                    tasksCreated: { $sum: 1 },
                    tasksCompleted: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    label: { $arrayElemAt: [labels, { $subtract: ["$_id", 1] }] },
                    tasksCreated: 1,
                    tasksCompleted: 1
                }
            },
            { $sort: { label: 1 } }
        ];

        const taskStatistics = await Task.aggregate(aggregationPipeline);
        const initializedData = labels.map(label => {
            const stat = taskStatistics.find(item => item.label === label);
            return {
                label,
                tasksCreated: stat ? stat.tasksCreated : 0,
                tasksCompleted: stat ? stat.tasksCompleted : 0
            };
        });

        res.status(200).json({ taskStatistics: initializedData });
    } catch (error) {
        console.error('Error in getTaskStatistics:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};







exports.getTeamPerformance = async (req, res) => {
    try {
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'completed' });
        const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0;

        // Calculating the score dynamically
        const timelyCompletions = await Task.countDocuments({ status: 'completed', completedOnTime: true });
        const score = totalTasks > 0 ? (timelyCompletions / totalTasks * 100).toFixed(2) : 0;

        // Calculating improvement dynamically
        const lastWeekTotalTasks = await Task.countDocuments({
            createdAt: {
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
                $lt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // excluding current week
            }
        });
        const lastWeekCompletedTasks = await Task.countDocuments({
            status: 'completed',
            createdAt: {
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                $lt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
            }
        });
        const lastWeekCompletionPercentage = lastWeekTotalTasks > 0 ? (lastWeekCompletedTasks / lastWeekTotalTasks * 100).toFixed(2) : 0;
        const improvement = (completionPercentage - lastWeekCompletionPercentage).toFixed(2);

        res.json({
            completedTasks,
            completionPercentage,
            score,
            improvement
        });
    } catch (error) {
        console.error('Failed to fetch performance data', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


