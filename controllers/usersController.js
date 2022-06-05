//Author: Joel Swenddal
//Course: CS 493
//Semester: Spring 2022
//Assignment: Final Proejct
//Sources: CS 493 - Course Canvas materials and examples


'use strict';

const express = require('express');
const res = require('express/lib/response');
const { OAuth2Client } = require('google-auth-library');


const router = express.Router();

//Parse URL-encoded bodies
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// Set Content-Type for all responses on the routes

router.use((req, res, next) => {
    res.set(('Content-Type', 'application/json'));
    next();
});


const projectId = 'final-peertutor-1215pm';
const urlString = 'https://final-peertutor-1215pm.uc.r.appspot.com';
const CLIENT_APP_ID = process.env.CLIENT_APP_ID;

const client = new OAuth2Client(CLIENT_APP_ID);


/********************* Helper Functions ****************************/

function getUserModel() {
    return require('../models/userModel');

}

function getApptModel() {
    return require('../models/apptModel');
};


function addZero(dateString) {

    dateString = '0' + dateString;
    return dateString.slice(-2);
}


//formats a dateTime object to just show the hour and minute string
function dateToTimeString(dateObject) {

    let result = "";

    let hours = addZero(dateObject.getHours());
    let minutes = addZero(dateObject.getMinutes());
    let seconds = addZero(dateObject.getSeconds());

    result += `${hours}:${minutes}:${seconds}`

    return result;
}

//adds student self ids to the students array in an appt record
function addSelftoStudents(studentsArray) {

    //add the self link to every student associated with the appointment
    let result = [];
    for (let student of studentsArray) {
        student.self = `${urlString}/students/${student.id}`;
        result.push(student);
    }

    return result;
}


function generateError(codeString, functionName) {


    let err = new Error(codeString);
    console.log(`ERROR: ${codeString} thrown in ${functionName}`);
    err.statusCode = codeString;

    return err;
};

const verifyJwtMiddleware = async function (req, res, next) {

    try {

        if (!req.headers.authorization) {
            const error = generateError('401-Authentication', 'Verify JWT middleware 1');
            throw error;
        }

        let token = req.headers['authorization'];
        token = token.replace(/^Bearer\s+/, "");

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_APP_ID,
        })
            .catch((err) => {
                const error = generateError('401-Authentication', 'Verify JWT middleware 2');
                throw error;
            })

        const payload = ticket.getPayload();
        const userid = payload['sub'];

        req.body.tutor = userid;
        next();

    } catch (err) {
        if (!err.statusCode) {

            err.statusCode = '500';
        }

        errorResponseSwitch(err.statusCode, res);
    }
}


function errorResponseSwitch(code, res) {

    switch (code) {

        case '400-BadContentType':
            res.status(400).json({ 'Error': 'Server only accepts Content-Type : application/json ' });
            break;

        case '400-Missing':
            res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' });
            break;

        case '400-InvalidInput':
            res.status(400).json({ 'Error': 'Input values for one of the user attributes is invalid' });

        case '400-BadAttribute':
            res.status(400).json({ 'Error': 'The request object has at least one attribute that is not allowed in a user record' });

        case '401-Authentication':
            res.status(401).json({ 'Error': 'Authentication Error - A valid JWT must be in the Authorization header. Check that your JWT has not expired.' });

        case '403-NotUser':
            res.status(403).json({ 'Error': 'You cannot update a user record if you are not authenticated as that user' });

        case '404':
            res.status(404).json({ 'Error': "No user with this user_id exists" });
            break;

        case '406':
            res.status(406).json({ 'Error': 'Incompatible response type request. Set Accept header to application/json or text/html' })

        case '415-UnsupportedType':
            res.status(415).json({ 'Error': "Server only accepts Content-Type : application/json; Request body must be formatted as JSON" });
            break;

        case '500':
            res.status(500).json({ 'Error': "Server error - something broke!" });
            break;
    }

};

//checks if an email string is a (basically) valid email format
function emailIsValid(email) {
    return /\S+@\S+\.\S+/.test(email);
}

//checks that input values meet criteria
function validInputCheck(data) {

    if (data.firstName) {
        if (typeof data.firstName !== 'string' || data.firstName.length > 40) {
            return false;
        }
    }
    if (data.lastName) {
        if (typeof data.lastName !== 'string' || data.lastName.length > 40) {
            return false;
        }
    }
    if (data.email) {
        if (typeof data.email !== 'string') {
            return false;
        }
        if (!emailIsValid(data.email)) {
            return false;
        }
    }
    return true;
}


/* ----------------------------- Begin Controller Functions ------------- */


/* -------------------- Get an Tutor's Appointments ----------------------------------- */

/* -------------------- GET /users/:user_id/appointments ---------------------------------------*/

router.get('/:user_id/appointments', verifyJwtMiddleware, async (req, res, next) => {

    try {

        const userId = req.params.user_id;
        let results = [];

        let allAppts = await getApptModel().listAppts()
            .catch((err) => {
                const error = generateError('500', 'Server error getting Appt results from db');
                throw error;
            })

        for (let appt of allAppts.appts) {
            if (appt.tutor === userId) {
                appt.self = `${urlString}/appointments/${appt.id}`;

                //reformat the dateTime measure as HH:MM for readability
                appt.startTime = dateToTimeString(appt.startTime);
                appt.endTime = dateToTimeString(appt.endTime);
                //add the self link to every student associated with the appointment
                appt.students = addSelftoStudents(appt.students);

                results.push(appt);
            }
        }
        res.status(200).send(results);

    } catch (err) {
        if (!err.statusCode) {

            err.statusCode = '500';
        }
        errorResponseSwitch(err.statusCode, res);
        console.error(`${err.statusCode} error caught in users Controller`);
    }

})

/* ----------------------Update user record ----------------------------------------------- */

/* -------------------- UPDATE /users ----------------------------------------------------*/

//start with validity check
router.patch('/:user_id', verifyJwtMiddleware, async (req, res, next) => {

    try {

        let tutorId = req.body.tutor;

        const data = req.body;
        let contype = req.headers['content-type'];
        let props = ["firstName", "lastName", "email", "tutor"];
        let userId = req.params.user_id;
        let realUserId = null;
        let userRecord;

        //check if req has Json Accept header
        //
        if (!contype || req.header('Content-Type') !== 'application/json') {
            const err = generateError('415-UnsupportedType', 'PUT controller');
            throw err;
        }

        if (req.header("Accept") !== 'application/json') {
            const err = generateError('406', 'PUT controller');
            throw err;
        }
        //check that the sub from the Jwt matches the user id in the query
        if (tutorId !== userId) {
            let err = generateError('403-NotUser', 'PUT controller');
            throw err;
        }

        //check that all required attributes are included
        if (data.firstName || data.lastName || data.email) {

            //check that all properties in the data are allowed
            for (const key in data) {
                if (!props.includes(key)) {
                    let err = generateError('400-BadAttribute', 'PUT controller');
                    throw err;
                }
            }

            //check that input is valid for all categories
            let valid = validInputCheck(data);

            if (!valid) {
                let err = generateError('400-InvalidInput', 'PUT controller');
                throw err;
            }

            //get the actual user idea based on the sub variable in the database
            let allUsers = await getUserModel().listUsers()
                .catch(err => {
                    console.error('Error when waiting for promise from listUsers');
                    next(err);
                })

            for (let user of allUsers.users) {
                if (userId === user.sub) {
                    realUserId = user.id;
                    userRecord = user;
                }
            }
            //user does not exist in the database
            if (realUserId === null) {
                let err = generateError('404', 'PUT controller');
                throw err;
            }

            //update the user Record fields
            userRecord.email = data.email;
            userRecord.firstName = data.firstName;
            userRecord.lastName = data.lastName;

            //update the user record
            const updatedRecord = await getUserModel().updateUser(realUserId, userRecord)
                .catch(err => {
                    console.error('Error when waiting for promise from updateUser');
                    next(err);
                })

            if (!updatedRecord) {
                const err = generateError('404', 'PUT controller');
                throw err;
            }

            //reformat the record for output viewing
            let result = {};
            result.id = updatedRecord.sub;
            result.firstName = updatedRecord.firstName;
            result.lastName = updatedRecord.lastName;
            result.email = updatedRecord.email;

            res.status(201).send(result);

        } else {
            let err = generateError('400-Missing', 'PUT controller');
            throw err;
        }

    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';

        } else {

            errorResponseSwitch(err.statusCode, res);
        }
        console.error(`${err.statusCode} error caught in users Controller`);
    }
})

/* ----------------------View all users - Collection ----------------------------------------------- */

/* -------------------- GET /users ----------------------------------------------------*/

router.get('/', async (req, res, next) => {

    try {

        //check accept header is JSON
        if (req.header("Accept") !== 'application/json') {
            const err = generateError('406', 'GET controller');
            throw err;
        }

        let allUsers = await getUserModel().listUsers()
            .catch(err => {
                console.error('Error when waiting for promise from listUsers');
                next(err);
            })

        let results = [];
        console.log(`Recieved list of users: ${allUsers}`);

        //reformat output for viewing
        for (let user of allUsers.users) {

            let temp = {};
            temp.id = user.sub;
            temp.firstName = user.firstName;
            temp.lastName = user.lastName;
            temp.email = user.email;
            results.push(temp);
        }

        res.status(200).send(results);

    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';
        }

        errorResponseSwitch(err.statusCode, res);
        console.error(`${err.statusCode} error caught in users Controller`);

    }
})
/* ------------- End Controller Functions ------------- */

module.exports = router;