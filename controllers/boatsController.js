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


const BOAT = "Boat";
const projectId = 'hw7-swenddaj-0422pm';
const urlString = 'https://hw7-swenddaj-0422pm.uc.r.appspot.com';
const CLIENT_APP_ID = process.env.CLIENT_APP_ID;


const client = new OAuth2Client(CLIENT_APP_ID);
/********************* Helper Functions ****************************/

function getBoatModel() {
    return require('../models/boatsModel');
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

        req.body.owner = userid;
        next();

    } catch (err) {
        if (!err.statusCode) {

            err.statusCode = '500';
        }

        errorResponseSwitch(err.statusCode, res);
    }
}

const verifyJwtMiddlewareNoError = async function (req, res, next) {

    try {

        if (!req.headers.authorization) {
            next();
        }

        let token = req.headers['authorization'];
        token = token.replace(/^Bearer\s+/, "");

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_APP_ID,
        })
            .catch((err) => {
                console.log("Unauthenticated JWT");
                next();
            })
        const payload = ticket.getPayload();
        const userid = payload['sub'];

        req.body.owner = userid;
        next();

    } catch (err) {
        if (!err.statusCode) {

            err.statusCode = '500';
        }
    }
}


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
            res.status(403).json({ 'Error': 'There is no boat with this id' });

        case '403-NotOwner':
            res.status(403).json({ 'Error': 'You cannot delete a boat if you are not its owner' });

        case '403-Uniqueness':
            res.status(403).json({ 'Error': 'There is aleady a boat with this name' });

        case '404':
            res.status(404).json({ 'Error': "No boat with this boat_id exists" });
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



/* -------------------- Create a boat ----------------------------------- */

/* -------------------- POST /boats ---------------------------------------*/

router.post('/', verifyJwtMiddleware, async (req, res, next) => {
    try {
        const data = req.body;
        let contype = req.headers['content-type'];

        //check if req has Json content type
        //
        if (!contype || req.header('Content-Type') !== 'application/json') {

            const err = generateError('415-UnsupportedType', 'POST controller');
            throw err;
        }

        //check that all required attributes are included
        if (data.name && data.type && data.length && data.owner && 'public' in data) {

            //check uniqueness constraint
            let allBoats = await getBoatModel().getBoats();

            for (let boat of allBoats.boats) {
                if (boat.name === data.name) {
                    const err = generateError('403-Uniqueness', 'POST controller');
                    throw err;
                }
            }

            //check that input is valid for all categories
            let valid = validInputCheck(data);

            if (!valid) {
                const err = generateError('400-InvalidInput', 'POST controller');
                throw err;
            }
            next();

        } else {
            console.log(JSON.stringify(data));
            const err = generateError('400-Missing', 'POST controller');
            throw err;
        }

    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';

        } else {

            errorResponseSwitch(err.statusCode, res);
        }

        console.error(`${err.statusCode} error caught in boatsController block 1`);

        next(err);
    }
})

router.post('/', async (req, res, next) => {
    const data = req.body;

    try {

        //check if req has Json content type
        if (req.header('Content-Type') !== 'application/json') {

            const err = generateError('415-UnsupportedType', 'POST controller');
            throw err;

        }

        const newRecord = await getBoatModel().updateBoat(null, data);

        if (!newRecord) {

            const err = generateError('404', 'POST controller');
            throw err;
        }

        res.status(201).send(newRecord);

    } catch (err) {


        if (!err.statusCode) {

            err.statusCode = '500';

        } else {

            errorResponseSwitch(err.statusCode, res);
        }

        console.error(`${err.statusCode} error caught in boatsController block 2`);

        next(err);
    }
});


/* ------ View all boats whose owner matches the sub property in the supplied JWT ---- */

/* -------------------- GET /boats ----------------------------------------------------*/

router.get('/', verifyJwtMiddlewareNoError, async (req, res, next) => {

    try {

        let results = [];

        if (req.body.owner) {

            let ownerid = req.body.owner;

            //get all the boats
            let allBoats = await getBoatModel().getBoats();

            for (let boat of allBoats.boats) {
                if (boat.owner === ownerid) {
                    results.push(boat);
                }
            }
        }

        else {
            //get all the boats
            let allBoats = await getBoatModel().getBoats();

            for (let boat of allBoats.boats) {
                if (boat.public) {
                    results.push(boat);
                }
            }
        }
        res.status(200).send(results);
    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';
        }
        errorResponseSwitch(err.statusCode, res);
    }
});


/* -------------------- Delete a boat --------------------------------------------- */

/* -------------------- DELETE /boats/:boat_id  -----------------------------------*/

//if no boat_id is provided
router.delete('/', (req, res) => {

    res.status(405).send({ 'Error': 'This operation is not supported on a list of boats. Use a boat_id' })

})


router.delete('/:boat_id', verifyJwtMiddleware, async function (req, res, next) {

    try {

        let ownerid = req.body.owner;

        //get the boat and check if this is the owner, if so, delete/success
        //read the file to check whether the entity exists
        let entityRecord = await getBoatModel().readBoat(req.params.boat_id)
            .catch(err => {
                console.error('Error when waiting for promise from readBoat in DELETE');
                next(err);
            })
        if (!entityRecord) {
            let err = generateError('403-NoBoat', 'DELETE controller');
            throw err;
        }

        if (entityRecord.owner === ownerid) {
            await getBoatModel().deleteBoat(req.params.boat_id);
            res.status(204).end();
        } else {

            let err = generateError('403-NotOwner', 'DELETE controller');
            throw err;
        }

    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';
            next(err);
        }
        errorResponseSwitch(err.statusCode, res);
        console.error(`${err.statusCode} error caught in DELETE boatsController`);
    }
});


/* ------------- End Controller Functions ------------- */

module.exports = router;
