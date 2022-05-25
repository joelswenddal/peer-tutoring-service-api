//Author: Joel Swenddal
//Course: CS 493
//Semester: Spring 2022
//Assignment: Final Proejct
//Sources: CS 493 - Course Canvas materials and examples


'use strict';

const express = require('express');
const res = require('express/lib/response');
//const { OAuth2Client } = require('google-auth-library');


const router = express.Router();

//Parse URL-encoded bodies
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// Set Content-Type for all responses on the routes

router.use((req, res, next) => {
    res.set(('Content-Type', 'application/json'));
    next();
});


const STUDENT = "Students";
const projectId = process.env.PROJECT_ID;
const urlString = 'https://final-peertutor-1215pm.uc.r.appspot.com'
const CLIENT_APP_ID = process.env.CLIENT_APP_ID;


//const client = new OAuth2Client(CLIENT_APP_ID);

/********************* Helper Functions ****************************/

function getStudentModel() {
    return require('../models/studentModel');
};


function errorResponseSwitch(code, res) {

    switch (code) {

        case '400-BadContentType':
            res.status(400).json({ 'Error': 'Server only accepts Content-Type : application/json ' });
            break;

        case '400-Missing':
            res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' });
            break;

        case '400-InvalidInput':
            res.status(400).json({ 'Error': 'Input values for one of the boat attributes is invalid' });

        case '400-BadAttribute':
            res.status(400).json({ 'Error': 'The request object has at least one attribute that is not allowed in a boat record' });

        case '401-Authentication':
            res.status(401).json({ 'Error': 'Authentication Error - A valid JWT must be in the Authorization header. Check that your JWT has not expired.' });

        case '403-NoStudent':
            res.status(403).json({ 'Error': 'There is no student with this id' });

        case '403-NotTutor':
            res.status(403).json({ 'Error': 'You cannot delete an appointment if you are not its associated tutor' });

        case '403-Uniqueness':
            res.status(403).json({ 'Error': 'There is aleady a boat with this name' });

        case '404':
            res.status(404).json({ 'Error': "No appointment with this id exists" });
            break;

        case '406':
            res.status(406).json({ 'Error': 'Incompatible response type request. Set Accept header to application/json or text/html' })

        case '415-UnsupportedType':
            res.status(415).json({ 'Error': "Server only accepts Content-Type : application/json; Request body must be formatted as JSON" });
            break;

        case '500':
            res.status(500).json({ 'Error': "Something broke!" });
            break;
    }

};
//checks that input values meet criteria
function validInputCheck(data) {

    if (data.name) {
        if (typeof data.name !== 'string' || data.name.length > 40) {
            return false;
        }
    }
    if (data.type) {
        if (typeof data.type !== 'string' || data.type.length > 40) {
            return false;
        }
    }
    if (data.length) {
        if (typeof data.length !== 'number') {
            return false;
        }
    }
    return true;
}



/* ------------- Begin Controller Functions ------------- */

/* -------------------- Create an appointment ----------------------------------- */

/* -------------------- POST /appointments ---------------------------------------*/

router.post('/', async (req, res, next) => {
    const data = req.body;

    try {

        //check if req has Json content type
        if (req.header('Content-Type') !== 'application/json') {

            const err = generateError('415-UnsupportedType', 'POST controller');
            throw err;

        }

        const newRecord = await getStudentModel().updateStudent(null, data);

        if (!newRecord) {

            const err = generateError('404', 'POST controller');
            throw err;
        }
        newRecord.self = `${urlString}/students/${newRecord.id}`;

        res.status(201).send(newRecord);

    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';

        }

        errorResponseSwitch(err.statusCode, res);

        console.error(`${err.statusCode} error caught in studentsController block 2`);

    }
});





/* -------------------- GET /students ----------------------------------------------------*/

router.get('/', async (req, res, next) => {

    try {

        let results = [];


        /*
        if (req.body.tutor) {

            let tutorid = req.body.tutor;

            //get all the appointments from the db
            let allAppts = await getApptModel().listAppts();

            for (let appt of allAppts.appts) {
                if (appt.tutor === tutorid) {
                    appt.self = `${urlString}/appointments/${appt.id}`
                    results.push(appt);
                }
            }
        }
        //FOR DEVELOPMENT ONLY - WILL RETURN ALL APPT RECORDS WITHOUT AUTHENTICATION
        else {
            //get all the appointments
            let allAppts = await getApptModel().listAppts();

            for (let appt of allAppts.appts) {
                appt.self = `${urlString}/appointments/${appt.id}`
                results.push(appt);

            }
        }
        */

        //get all the appointments
        let allStudents = await getStudentModel().listStudents();

        for (let student of allStudents.students) {
            student.self = `${urlString}/students/${student.id}`
            results.push(student);
        }

        res.status(200).send(results);

    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';
        }
        errorResponseSwitch(err.statusCode, res);
    }
});

/* -------------------- Delete a Student record --------------------------------------------- */

/* -------------------- DELETE /students/:student_id  -----------------------------------*/

//if no appt_id is provided
router.delete('/', (req, res) => {

    res.status(405).send({ 'Error': 'This operation is not supported on a list of students. Use a student_id' })
})


router.delete('/:student_id', async function (req, res, next) {

    try {

        let student_id = req.params.student_id

        //get the student record
        let entityRecord = await getStudentModel().readStudent(student_id)
            .catch(err => {
                console.error('Error when waiting for promise from readStudent in DELETE in studentController');
                next(err);
            })
        if (!entityRecord) {
            let err = generateError('403-NoStudent', 'DELETE controller');
            throw err;

        } else {

            //HERE need to get all appointments and delete all that have this student

            await getStudentModel().deleteStudent(student_id);

            res.status(204).end();
        }

    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';
            next(err);
        }
        errorResponseSwitch(err.statusCode, res);
        console.error(`${err.statusCode} error caught in DELETE studentsController`);
    }
});


/* ------------- End Controller Functions ------------- */

module.exports = router;
