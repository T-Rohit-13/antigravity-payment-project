const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  submitClaim,
  getClaimStatus,
  reviewClaim
} = require('../controllers/emergencyController');

router.post('/submit', auth, upload.single('document'), submitClaim);
router.get('/status', auth, getClaimStatus);
router.put('/:id/review', auth, reviewClaim);

module.exports = router;
