const { mongoose } = require("../../config/database");


const taskSchema = new mongoose.Schema({
    task: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true

    },
    dueDate: {
        type: Date,
        require: true,
    },
    priority: {
        type: String,
        required: true,
        enum: ["medium", "high", "low", "critical"],
        default: "low"
    },
    status: {
        type: String,
        require: true,
        enum: ["assigned", "in_progress", "completed", "on_hold", "cancelled", "review", "approved"],
        default: "assigned"
    }

}, {
    timestamps: true
})
const Task = mongoose.model("Task", taskSchema);
module.exports = { Task }

