'use strict';

const router = module.exports = require('express').Router();


router.use('/oauth', require('./controllers/authController'));
router.use('/appointments', require('./controllers/apptController'));
router.use('/tutors', require('./controllers/tutorsController'));
router.use('/students', require('./controllers/studentsController'));
