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


const APPT = "Appointments";
const projectId = process.env.PROJECT_ID;
const urlString = 'https://final-peertutor-1215pm.uc.r.appspot.com'
const CLIENT_APP_ID = process.env.CLIENT_APP_ID;


const client = new OAuth2Client(CLIENT_APP_ID);


/********************* Helper Functions ****************************/

function getApptModel() {
    return require('../models/apptModel');
};


//checks that input values meet criteria
function validInputCheck(data) {

    if (data.subject) {
        if (typeof data.subject !== 'string' && data.subject !== null) {
            return false;
        }
    }
    if (data.notes) {
        if (typeof data.notes !== 'string' && data.notes !== null) {
            return false;
        }
    }

    return true;
}

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

        req.body.tutor = userid;
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
            res.status(400).json({ 'Error': 'Input values for one of the appointment attributes is invalid' });

        case '400-BadAttribute':
            res.status(400).json({ 'Error': 'The request object has at least one attribute that is not allowed in an appointment record' });

        case '401-Authentication':
            res.status(401).json({ 'Error': 'Authentication Error - A valid JWT must be in the Authorization header. Check that your JWT has not expired.' });

        case '403-NoAppt':
            res.status(403).json({ 'Error': 'There is no appointment with this id' });

        case '403-NotTutor':
            res.status(403).json({ 'Error': 'You cannot delete an appointment if you are not its associated tutor' });

        case '403-Uniqueness':
            res.status(403).json({ 'Error': 'There is aleady an appointment with a start time in this time range - no double-booking allowed' });

        case '404':
            res.status(404).json({ 'Error': "No appointment with this id exists" });
            break;

        case '406':
            res.status(406).json({ 'Error': 'Incompatible response type request. Set Accept header to application/json' })

        case '415-UnsupportedType':
            res.status(415).json({ 'Error': "Server only accepts Content-Type : application/json; Request body must be formatted as JSON" });
            break;

        case '500':
            res.status(500).json({ 'Error': "Something broke!" });
            break;
    }

};




/* ------------- Begin Controller Functions ------------- */

/* -------------------- Create an appointment ----------------------------------- */

/* -------------------- POST /appointments ---------------------------------------*/

router.post('/', verifyJwtMiddleware, async (req, res, next) => {
    try {
        /*
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
            let allAppts = await getApptModel().listAppts();
            
            for (let appt of allAppts.appts) {
                if (appt.name === data.name) {
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
        */
        next();


    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';

        } else {

            errorResponseSwitch(err.statusCode, res);
        }

        console.error(`${err.statusCode} error caught in apptsController block 1`);

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

        const newRecord = await getApptModel().updateAppt(null, data);

        if (!newRecord) {

            const err = generateError('404', 'POST controller');
            throw err;
        }
        newRecord.self = `${urlString}/appointments/${newRecord.id}`;

        res.status(201).send(newRecord);

    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';

        }

        errorResponseSwitch(err.statusCode, res);

        console.error(`${err.statusCode} error caught in apptController block 2`);

    }
});


/* ------ View all appts whose tutor matches the sub property in the supplied JWT ---- */

/* -------------------- GET /appointments ----------------------------------------------------*/

router.get('/', verifyJwtMiddlewareNoError, async (req, res, next) => {

    try {

        let results = [];

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
        res.status(200).send(results);

    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';
        }
        errorResponseSwitch(err.statusCode, res);
    }
});

/* -------------------- View an appointment ----------------------------------------------*/

/* -------------------- GET /appointments/:appt_id ---------------------------------------*/

router.get('/:appt_id', verifyJwtMiddleware, async (req, res, next) => {

    try {

        let tutorid = req.body.tutor;

        //check if req has Json content type
        //
        if (req.header("Accept") !== 'application/json') {

            console.log(`Response header is ${req.header("Accept")}`);
            const err = generateError('406', 'GET controller');
            throw err;
        }

        let entityRecord = await getApptModel().readAppt(req.params.appt_id)
            .catch(err => {
                console.error('Error when waiting for promise from readAppt');
                next(err);
            })

        if (!entityRecord) {
            let err = generateError('404', 'GET controller');
            throw err;

        } else {

            if (entityRecord.tutor === tutorid) {

                entityRecord.self = `${urlString}/appointments/${entityRecord.id}`;

                res.format({
                    json: function () {
                        res.status(200).send(entityRecord);
                    }
                })

            } else {

                let err = generateError('403-NotTutor', 'DELETE controller');
                throw err;
            }
        }

    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';

        }
        errorResponseSwitch(err.statusCode, res);
        console.error(`${err.statusCode} error caught in appts Controller`);
    }
})

/* -------------------- Update whole appointment record ------------------------------- */
/*
/* -------------------- PUT /appointments/:appointment_id  -----------------------------------*/

//if no appt_id is provided
router.put('/', verifyJwtMiddleware, (req, res) => {

    res.status(405).send({ 'Error': 'This operation is not supported on a list of appointment records. Use an appointment_id' })

})

//start with validity check
router.put('/:appt_id', verifyJwtMiddleware, (req, res, next) => {

    try {

        const tutorid = req.body.tutor;

        const data = req.body;
        let contype = req.headers['content-type'];
        let props = ["subject", "date", "startTime", "endTime", "notes", "tutor"];

        //check if req has Json content type
        //
        if (!contype || req.header('Content-Type') !== 'application/json') {

            const err = generateError('415-UnsupportedType', 'PUT controller');
            throw err;
        }

        //check that all required attributes are included
        if (data.subject && data.date && data.startTime && data.endTime && data.notes) {

            //check email uniqueness constraint
            //let allStudents = await getApptModel().listAppts();


            //need to adjust this for dataTime calculation to check if start time is outside all other appointment windows
            /*
            for (let appt of allAppointments.appointments) {
                if (tutorid = data.tutor && data.date === appt.date && appt.id !== req.params.appt_id) {
                    const err = generateError('403-Uniqueness', 'PUT controller');
                    throw err;
                }
            }
            */

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

            next();

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

        console.error(`${err.statusCode} error caught in appointments Controller block 1`);
        next(err);
    }
})


router.put('/:appt_id', async (req, res, next) => {


    try {
        const data = req.body;

        //read the file to check whether the entity exists
        let entityRecord = await getApptModel().readAppt(req.params.appt_id)
            .catch(err => {
                console.error('Error when waiting for promise from readAppt in PUT');
                next(err);
            })
        if (!entityRecord) {
            let err = generateError('404', 'PUT controller');
            throw err;
        }

        //students remain the same in an update; 
        //only adding or removing students at designated endpoints can alter relationships
        data.students = entityRecord.students;

        //read the file to check whether the entity exists
        const apptRecord = await getApptModel().updateAppt(req.params.appt_id, data)
            .catch(err => {
                console.error('Error when waiting for promise from updateAppt');
                next(err);
            })

        if (!apptRecord) {

            const err = generateError('404', 'PUT controller');
            throw err;
        }

        apptRecord.self = `${urlString}/appointments/${apptRecord.id}`;
        res.status(201).send(apptRecord);

    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';

        } else {

            errorResponseSwitch(err.statusCode, res);
        }

        console.error(`${err.statusCode} error caught in appointments Controller block 2`);

        next(err);
    }

})


/* -------------------- Delete an appointment --------------------------------------------- */

/* -------------------- DELETE /appointments/:appt_id  -----------------------------------*/

//if no appt_id is provided
router.delete('/', (req, res) => {

    res.status(405).send({ 'Error': 'This operation is not supported on a list of appointments. Use a appt_id' })

})


router.delete('/:appt_id', verifyJwtMiddleware, async function (req, res, next) {

    try {

        let tutorid = req.body.tutor;

        //get the appointment and check if this is the tutor, if so, delete/success
        //read the file to check whether the entity exists
        let entityRecord = await getApptModel().readAppt(req.params.appt_id)
            .catch(err => {
                console.error('Error when waiting for promise from readAppt in DELETE');
                next(err);
            })
        if (!entityRecord) {
            let err = generateError('404', 'DELETE controller');
            throw err;
        }

        if (entityRecord.tutor === tutorid) {
            await getApptModel().deleteAppt(req.params.appt_id);
            res.status(204).end();
        } else {

            let err = generateError('403-NotTutor', 'DELETE controller');
            throw err;
        }

    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';
            next(err);
        }
        errorResponseSwitch(err.statusCode, res);
        console.error(`${err.statusCode} error caught in DELETE apptController`);
    }
});


/* ------------- End Controller Functions ------------- */

module.exports = router;