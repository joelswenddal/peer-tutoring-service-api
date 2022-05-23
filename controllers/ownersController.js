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

const BOAT = "Boat";
const projectId = 'final-peertutor-1215pm';
const urlString = 'https://final-peertutor-1215pm.uc.r.appspot.com';
const CLIENT_APP_ID = process.env.CLIENT_APP_ID;




/********************* Helper Functions ****************************/

function getBoatModel() {
    return require('../models/boatsModel');
};

function generateError(codeString, functionName) {


    let err = new Error(codeString);
    console.log(`ERROR: ${codeString} thrown in ${functionName}`);
    err.statusCode = codeString;

    return err;
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



/* -------------------- Get an Owner's Boats ----------------------------------- */

/* -------------------- GET /owners/:owner_id/boats ---------------------------------------*/

router.get('/:owner_id/boats', async (req, res, next) => {

    try {

        const ownerId = req.params.owner_id;
        let results = [];

        let allBoats = await getBoatModel().getBoats()
            .catch((err) => {
                const error = generateError('500', 'Server error getting Boat results from db');
                throw error;
            })

        for (let boat of allBoats.boats) {
            if (boat.public === true && boat.owner === ownerId) {
                results.push(boat);
            }
        }

        res.status(200).send(results);

    } catch (err) {
        if (!err.statusCode) {

            err.statusCode = '500';
        }

        errorResponseSwitch(err.statusCode, res);
        console.error(`${err.statusCode} error caught in owners Controller`);
    }

})


/* ------------- End Controller Functions ------------- */

module.exports = router;