const express = require('express');
const router = express.Router();
const taskController = require('../controllers/test.controllers');

router.post('/tasks', taskController.createTask);
router.get('/tasks/user/:userId', taskController.getUserTasks);
router.put('/tasks/:taskId/status', taskController.updateTaskStatus);
router.delete('/tasks/:taskId', taskController.deleteTask);
router.get('/tasks/:taskId', taskController.getTaskById);

module.exports = router;
