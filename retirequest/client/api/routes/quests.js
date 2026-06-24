const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { getQuests, completeQuest } = require('../controllers/questController');

router.get('/', auth, getQuests);
router.post('/:id/complete', auth, completeQuest);

module.exports = router;
