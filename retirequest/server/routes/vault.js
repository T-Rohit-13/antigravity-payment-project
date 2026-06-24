const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const {
  getVault,
  saveToVault,
  earlyWithdraw,
  goalWithdraw,
  partialWithdraw,
  getProjection
} = require('../controllers/vaultController');

router.get('/', auth, getVault);
router.post('/save', auth, saveToVault);
router.post('/withdraw', auth, earlyWithdraw);
router.post('/withdraw/goal', auth, goalWithdraw);
router.post('/withdraw/partial', auth, partialWithdraw);
router.get('/projection', auth, getProjection);

module.exports = router;
