const { Task } = require("../models/task")
exports.createTask = async (req, res) => {
    try {
        const assignedBy = req.user.id
        console.log("🚀 ~ exports.createTask= ~ assignedBy:", assignedBy)
        const { task, userIds, dueDate, title, priority, fileUrl } = req.body;
        // console.log("🚀 ~ exports.createTask= ~ dueDate:", dueDate)
        // console.log("🚀 ~ exports.createTask= ~ assignedBy:", assignedBy)
        // console.log("🚀 ~ exports.createTask= ~ userIds:", userIds)
        // console.log("🚀 ~ exports.createTask= ~ task:", task)

        const newTask = new Task({
            task,
            userIds,
            assignedBy,
            dueDate,
            title,
            priority
        });
        newTask.fileUrl.push(fileUrl)
        await newTask.save();
        res.status(201).json({ message: 'Task created successfully', task: newTask });
    } catch (error) {
        console.log("🚀 ~ exports.createTask= ~ error:", error)
        res.status(500).json({ message: 'Failed to create task', error });
    }
};
exports.getUserTasks = async (req, res) => {
    try {
        const userId = req.user.id
        const tasks = await Task.find({ userIds: userId })
            .populate('userIds')
            .populate('assignedBy');

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get tasks', error });
    }
};
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate('userIds')
            .populate('assignedBy');

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get tasks', error });
    }
};

exports.updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;

        if (!["assigned", "in_progress", "completed", "on_hold", "cancelled", "review", "approved"].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const updatedTask = await Task.findByIdAndUpdate(taskId, { status }, { new: true });

        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task status updated', task: updatedTask });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update task status', error });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const deletedTask = await Task.findByIdAndDelete(taskId);

        if (!deletedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete task', error });
    }
};

exports.getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findById(taskId).populate('userId').populate('assignedBy');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get task', error });
    }
};
