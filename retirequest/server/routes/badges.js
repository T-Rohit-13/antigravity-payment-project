const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const {
  getAllBadges,
  getEarnedBadges,
  checkBadges
} = require('../controllers/badgeController');

router.get('/', auth, getAllBadges);
router.get('/earned', auth, getEarnedBadges);
router.post('/check', auth, checkBadges);

module.exports = router;
