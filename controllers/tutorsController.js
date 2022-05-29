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
            res.status(400).json({ 'Error': 'Input values for one of the boat attributes is invalid' });

        case '400-BadAttribute':
            res.status(400).json({ 'Error': 'The request object has at least one attribute that is not allowed in a boat record' });

        case '401-Authentication':
            res.status(401).json({ 'Error': 'Authentication Error - A valid JWT must be in the Authorization header. Check that your JWT has not expired.' });

        case '403-NoBoat':
            res.status(403).json({ 'Error': 'There is already a boat by this name. Name attribute must be unique' });

        case '403-NotOwner':
            res.status(403).json({ 'Error': 'You cannot delete a boat if you are not its owner' });

        case '404':
            res.status(404).json({ 'Error': "No boat with this boat_id exists" });
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



/* ------------- Begin Controller Functions ------------- */



/* -------------------- Get an Tutor's Appointments ----------------------------------- */

/* -------------------- GET /tutors/:tutor_id/appointments ---------------------------------------*/

router.get('/:tutor_id/appointments', verifyJwtMiddleware, async (req, res, next) => {

    try {

        const tutorId = req.params.tutor_id;
        let results = [];

        let allAppts = await getApptModel().listAppts()
            .catch((err) => {
                const error = generateError('500', 'Server error getting Appt results from db');
                throw error;
            })

        for (let appt of allAppts.appts) {
            if (appt.tutor === tutorId) {
                appt.self = `${urlString}/appointments/${appt.id}`;

                //reformat the dateTime measure as HH:MM for readability
                appt.startTime = dateToTimeString(appt.startTime);
                appt.endTime = dateToTimeString(appt.endTime);
                results.push(appt);
            }

        }

        res.status(200).send(results);

    } catch (err) {
        if (!err.statusCode) {

            err.statusCode = '500';
        }

        errorResponseSwitch(err.statusCode, res);
        console.error(`${err.statusCode} error caught in tutors Controller`);
    }

})


/* ------------- End Controller Functions ------------- */

module.exports = router;