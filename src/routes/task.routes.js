const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controllers');
const { verifyUserToken } = require("../middlewares/jwt");
const { adminOnly } = require("../middlewares/admin");
router.post('/', verifyUserToken, adminOnly, taskController.createTask);
router.get('/user', verifyUserToken, taskController.getUserTasks);
router.put('/:taskId/status', taskController.updateTaskStatus);
router.delete('/:taskId', taskController.deleteTask);
router.get('/:taskId', taskController.getTaskById);
router.get("/", verifyUserToken, adminOnly, taskController.getAllTasks)
module.exports = router;
