const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');


router.get('/summary', statsController.getTasksSummary);
router.get('/up-comming-task', statsController.getUpcomingTasks);
router.get('/task-statistics', statsController.getTaskStatistics);
router.get('/performance', statsController.getTeamPerformance);

module.exports = router;

