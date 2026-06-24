const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const {
  getTransactions,
  logRoundup,
  logCashback
} = require('../controllers/transactionController');

router.get('/', auth, getTransactions);
router.post('/roundup', auth, logRoundup);
router.post('/cashback', auth, logCashback);

module.exports = router;
