'use strict';

const router = module.exports = require('express').Router();


router.use('/oauth', require('./controllers/authController'));
router.use('/boats', require('./controllers/boatsController'));
router.use('/owners', require('./controllers/ownersController'));
