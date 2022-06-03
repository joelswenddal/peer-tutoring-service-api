'use strict';

const router = module.exports = require('express').Router();


router.use('/oauth', require('./controllers/authController'));
router.use('/appointments', require('./controllers/apptController'));
router.use('/users', require('./controllers/usersController'));
router.use('/students', require('./controllers/studentsController'));
