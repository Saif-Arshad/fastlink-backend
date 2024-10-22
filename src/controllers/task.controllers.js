const Task = require('../models/task');

exports.createTask = async (req, res) => {
    try {
        const { task, userId, assignedBy, dueDate } = req.body;

        const newTask = new Task({
            task,
            userId,
            assignedBy,
            dueDate
        });

        await newTask.save();
        res.status(201).json({ message: 'Task created successfully', task: newTask });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create task', error });
    }
};

exports.getUserTasks = async (req, res) => {
    try {
        const { userId } = req.params;
        const tasks = await Task.find({ userId }).populate('userId').populate('assignedBy');

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
