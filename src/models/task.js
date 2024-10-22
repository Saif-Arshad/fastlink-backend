import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    task: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true

    },
    dueDate: {
        type: Date,
        require: true,
    },
    staus: {
        type: String,
        require: true,
        enum: ["assigned", "in_progress", "completed", "on_hold", "cancelled", "review", "approved"],
        default: "assigned"
    }

}, {
    timestamps: true
})
const Task = mongoose.model("Task", taskSchema);
module.exports({ Task })
