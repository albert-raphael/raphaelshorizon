const express = require('express');
const router = express.Router();
const { submitContactForm, submitSpeakingRequest } = require('../controllers/contactController');

router.post('/', submitContactForm);
router.post('/speaking', submitSpeakingRequest);

module.exports = router;
