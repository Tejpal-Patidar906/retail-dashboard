const express = require('express');
const router = express.Router();
const { getStaff, getLeaderboard, updateStaff, addStaff, removeStaff } = require('../controllers/staffController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(protect);

router.get('/', roleCheck('admin', 'manager', 'store_owner'), getStaff);
router.get('/leaderboard', getLeaderboard);
router.post('/', roleCheck('admin', 'manager', 'store_owner'), addStaff);
router.put('/:id', roleCheck('admin', 'manager', 'store_owner'), updateStaff);
router.delete('/:id', roleCheck('admin', 'manager', 'store_owner'), removeStaff);

module.exports = router;
