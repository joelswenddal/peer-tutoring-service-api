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
const urlString = 'https://final-peertutor-1215pm.uc.r.appspot.com';


const CLIENT_APP_ID = process.env.CLIENT_APP_ID;


const client = new OAuth2Client(CLIENT_APP_ID);


/********************* Helper Functions ****************************/

function getApptModel() {
    return require('../models/apptModel');
};

function getStudentModel() {
    return require('../models/studentModel');
};

//checks that a date string is correctly formatted
function dateStringIsValid(dateString) {
    //return /\S+@\S+\.\S+/.test(email);
    return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(dateString);
}

//checks that time string is correctly formatted
function timeStringIsValid(timeString) {

    return /^([0-2][0-3]|[0-1][0-9]):[0-5][0-9]+$/.test(timeString);
}

//converts date string to date type
function toDate(dateString) {
    const [year, month, day] = dateString.split("-");
    return new Date(year, month - 1, day);
}

//converts time string to date type
function toTime(dateString, timeString) {
    let now = new Date();
    const [year, monthIndex, day] = dateString.split("-");
    const [hours, minutes] = timeString.split(":");
    return new Date(year, monthIndex - 1, day, hours, minutes)
}
//checks that time strings meet real hour and minute validity requirements
function timeRangeIsValid(startTime, endTime) {
    let startHour = parseInt(startTime.slice(0, 2));
    let endHour = parseInt(endTime.slice(0, 2));
    let startMin = parseInt(startTime.slice(3));
    let endMin = parseInt(endTime.slice(3));

    if (startHour <= endHour && endHour < 24 && startMin <= endMin && endMin < 60) {
        return true;
    } else {
        return false;
    }
}

//produces a new yyyy-mm-dd formatted string for use in setting times
function newDateString() {

    let result = "";


    let currentDate = new Date(2000, 1, 1);
    let cDay = currentDate.getDate()
    let cMonth = currentDate.getMonth() + 1
    let cYear = currentDate.getFullYear()

    result += `${cYear}-${cMonth}-${cDay}:`
    return result;
}

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
    if (data.date) {
        if (!dateStringIsValid(data.date)) {
            return false;
        }
    }
    if (data.startTime) {
        if (!timeStringIsValid(data.startTime)) {
            return false;
        }
    }
    if (data.endTime) {
        if (!timeStringIsValid(data.endTime)) {
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

        case '400-InvalidTimeInput':
            res.status(400).json({ 'Error': 'Input values for the time variables have some invalid characteristics' });

        case '400-BadAttribute':
            res.status(400).json({ 'Error': 'The request object has at least one attribute that is not allowed in an appointment record' });

        case '400-NoStudentsAttribute':
            res.status(400).json({ 'Error': 'Do not include the Students attribute in the body. Use the add/remove students from appointment endpoints.' });

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

router.post('/', verifyJwtMiddleware, (req, res, next) => {
    try {

        const tutorid = req.body.tutor;

        const data = req.body;
        let contype = req.headers['content-type'];
        let props = ["subject", "date", "startTime", "endTime", "notes", "tutor"];

        //check if req has Json content type
        //
        if (!contype || req.header('Content-Type') !== 'application/json') {

            const err = generateError('415-UnsupportedType', 'POST controller');
            throw err;
        }
        //check accept header is JSON
        if (req.header("Accept") !== 'application/json') {
            const err = generateError('406', 'POST controller');
            throw err;
        }

        //check that all required attributes are included -- subject and notes can be set to null (an 'open' appointment)
        //if (data.subject && data.date && data.startTime && data.endTime && data.notes) {
        if (typeof data.subject !== 'undefined' && data.date && data.startTime && data.endTime && typeof data.notes !== 'undefined') {

            //check that all properties in the data are allowed
            for (const key in data) {
                if (!props.includes(key)) {
                    let err = generateError('400-BadAttribute', 'POST controller');
                    throw err;
                }
            }

            //check that input is valid for all categories
            let valid = validInputCheck(data);
            if (!valid) {
                let err = generateError('400-InvalidInput', 'POST controller');
                throw err;
            }

            valid = timeRangeIsValid(data.startTime, data.endTime);
            if (!valid) {
                let err = generateError('400-InvalidTimeInput', 'POST controller');
                throw err;
            }

            //convert date string to correct date format
            let dateString = '2000-01-01';
            //let dateString = data.date;
            data.date = toDate(data.date);
            data.startTime = toTime(dateString, data.startTime);
            data.endTime = toTime(dateString, data.endTime);

            next();

        } else {

            let err = generateError('400-Missing', 'POST controller');
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

router.post('/', async (req, res, next) => {
    const data = req.body;

    try {

        const newRecord = await getApptModel().updateAppt(null, data);

        if (!newRecord) {

            const err = generateError('404', 'POST controller');
            throw err;
        }
        newRecord.self = `${urlString}/appointments/${newRecord.id}`;

        //reformat the dateTime measure as HH:MM for readability
        newRecord.startTime = dateToTimeString(newRecord.startTime);
        newRecord.endTime = dateToTimeString(newRecord.endTime);

        res.status(201).send(newRecord);

    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';

        }

        errorResponseSwitch(err.statusCode, res);

        console.error(`${err.statusCode} error caught in apptController block 2`);

    }
});



/* ------ View all appts whose tutor matches the sub property in the supplied JWT - Collection ---- */

/* -------------------- GET /appointments ----------------------------------------------------*/

router.get('/', verifyJwtMiddlewareNoError, async (req, res, next) => {

    try {

        //check accept header is JSON
        if (req.header("Accept") !== 'application/json') {
            const err = generateError('406', 'GET controller');
            throw err;
        }

        let results = [];

        if (req.body.tutor) {

            let apptsArr = [];
            let tutorid = req.body.tutor;
            let page;

            if (!req.query.page) {
                page = 1;
            }
            else {
                page = req.query.page;
            }

            let offset = (page - 1) * 5;
            let count = 0;
            let limCount = page * 5;

            //get all the appointments from the db
            let allAppts = await getApptModel().listAppts()
                .catch(err => {
                    console.error('Error when waiting for promise from listAppts');
                    next(err);
                })

            //sort the objects ascending
            //allAppts.sort()

            for (let appt of allAppts.appts) {

                if (appt.tutor === tutorid) {

                    if (count < offset) {
                        count++;
                    } else if (count < limCount) {
                        appt.self = `${urlString}/appointments/${appt.id}`;
                        appt.startTime = dateToTimeString(appt.startTime);
                        appt.endTime = dateToTimeString(appt.endTime);
                        //add the self link to every student associated with the appointment
                        appt.students = addSelftoStudents(appt.students);
                        apptsArr.push(appt);
                        count++;
                    }
                    else {
                        count++;
                    }
                }
            }

            let wrapper = {};
            wrapper.appointments = apptsArr;
            page++;
            wrapper.total_appointments = count;

            //attach url to next page
            if (apptsArr.length < 5) {
                wrapper.next = "Final page - There are no further records";
            } else {
                wrapper.next = `${urlString}/appointments?page=${page}&limit=5`;
            }
            results.push(wrapper);

        }
        //FOR DEVELOPMENT ONLY - WILL RETURN ALL APPT RECORDS WITHOUT AUTHENTICATION - NO PAGINATION
        else {
            //get all the appointments
            let allAppts = await getApptModel().listAppts();

            for (let appt of allAppts.appts) {
                appt.self = `${urlString}/appointments/${appt.id}`
                appt.startTime = dateToTimeString(appt.startTime);
                appt.endTime = dateToTimeString(appt.endTime);
                results.push(appt);

            }
        }

        //add the self link to every student associated with the appointment
        //results.students = addSelftoStudents(results.students);

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

        //check accept header is JSON
        if (req.header("Accept") !== 'application/json') {
            const err = generateError('406', 'GET controller');
            throw err;
        }

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

                //reformat the dateTime measure as HH:MM for readability
                entityRecord.startTime = dateToTimeString(entityRecord.startTime);
                entityRecord.endTime = dateToTimeString(entityRecord.endTime);

                //add the self link to every student associated with the appointment
                entityRecord.students = addSelftoStudents(entityRecord.students);

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

        //check accept header is JSON
        if (req.header("Accept") !== 'application/json') {
            const err = generateError('406', 'PUT controller');
            throw err;
        }

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

        //not allowed to edit the relationship in a patch
        if (data.students) {
            let err = generateError('400-NoStudentsAttribute', 'PATCH controller');
            throw err;
        }

        //check that all required attributes are included -- subject and notes can be set to null (an 'open' appointment)
        //if (data.subject && data.date && data.startTime && data.endTime && data.notes) {
        if (typeof data.subject !== 'undefined' && data.date && data.startTime && data.endTime && typeof data.notes !== 'undefined') {

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

            valid = timeRangeIsValid(data.startTime, data.endTime);
            if (!valid) {
                let err = generateError('400-InvalidTimeInput', 'PUT controller');
                throw err;
            }

            //convert date string to correct date format
            let dateString = '2000-01-01';
            data.date = toDate(data.date);
            data.startTime = toTime(dateString, data.startTime);
            data.endTime = toTime(dateString, data.endTime);

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

        //update the db
        const apptRecord = await getApptModel().updateAppt(req.params.appt_id, data)
            .catch(err => {
                console.error('Error when waiting for promise from updateAppt');
                next(err);
            })

        if (!apptRecord) {

            const err = generateError('404', 'PUT controller');
            throw err;
        }

        //create the self url string
        apptRecord.self = `${urlString}/appointments/${apptRecord.id}`;

        //reformat the dateTime measure as HH:MM for readability
        apptRecord.startTime = dateToTimeString(apptRecord.startTime);
        apptRecord.endTime = dateToTimeString(apptRecord.endTime);


        //add the self link to every student associated with the appointment
        apptRecord.students = addSelftoStudents(apptRecord.students);

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




/* -------------------- Update partial appointment record - Edit ------------------------------- */
/*
/* -------------------- PATCH /appointments/:appointment_id  -----------------------------------*/

//if no appt_id is provided
router.patch('/', verifyJwtMiddleware, (req, res) => {

    res.status(405).send({ 'Error': 'This operation is not supported on a list of appointment records. Use an appointment_id' })

})

//start with validity check
router.patch('/:appt_id', verifyJwtMiddleware, (req, res, next) => {

    try {

        //check accept header is JSON
        if (req.header("Accept") !== 'application/json') {
            const err = generateError('406', 'PATCH controller');
            throw err;
        }

        const tutorid = req.body.tutor;
        const data = req.body;
        let contype = req.headers['content-type'];
        let props = ["subject", "date", "startTime", "endTime", "notes", "tutor"];

        //check if req has Json content type
        //
        if (!contype || req.header('Content-Type') !== 'application/json') {

            const err = generateError('415-UnsupportedType', 'PATCH controller');
            throw err;
        }
        //not allowed to edit the relationship directly
        if (data.students) {
            let err = generateError('400-NoStudentsAttribute', 'PATCH controller');
            throw err;
        }

        //check that all required attributes are included
        if (typeof data.subject !== 'undefined' || data.date || data.startTime || data.endTime || typeof data.notes !== 'undefined') {

            //check that all properties in the data are allowed
            for (const key in data) {
                if (!props.includes(key)) {
                    let err = generateError('400-BadAttribute', 'PATCH controller');
                    throw err;
                }
            }

            //check that input is valid for all categories
            let valid = validInputCheck(data);

            if (!valid) {
                let err = generateError('400-InvalidInput', 'PATCH controller');
                throw err;
            }

            //convert the date variable first if it is present in the new data
            if (data.date) {
                //let dateString = data.date
                data.date = toDate(data.date);
            }

            //update the time variables with the new date
            //convert date string to correct date format
            let dateString = '2000-01-01'

            if (data.startTime) {
                data.startTime = toTime(dateString, data.startTime);
            }

            if (data.endTime) {
                data.endTime = toTime(dateString, data.endTime);
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


router.patch('/:appt_id', async (req, res, next) => {


    try {
        const data = req.body;
        let dataKeys = Object.keys(data);

        //editing

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
        //data.students = entityRecord.students;
        for (const key in entityRecord) {

            if (!dataKeys.includes(key)) {

                if (key != 'id') {
                    data[key] = entityRecord[key];
                }
            }
        }

        //before updating db, check to see if any updated times (startTime, endTime) have invalid range
        if (data.startTime >= data.endTime) {
            let err = generateError('400-InvalidTimeInput', 'PUT controller');
            throw err;
        }

        //update the db
        const apptRecord = await getApptModel().updateAppt(req.params.appt_id, data)
            .catch(err => {
                console.error('Error when waiting for promise from updateAppt');
                next(err);
            })

        if (!apptRecord) {

            const err = generateError('404', 'PUT controller');
            throw err;
        }
        //update self url string
        apptRecord.self = `${urlString}/appointments/${apptRecord.id}`;

        //reformat the dateTime measure as HH:MM for readability
        apptRecord.startTime = dateToTimeString(apptRecord.startTime);
        apptRecord.endTime = dateToTimeString(apptRecord.endTime);

        //add the self link to every student associated with the appointment
        apptRecord.students = addSelftoStudents(apptRecord.students);

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
router.delete('/', verifyJwtMiddleware, (req, res) => {
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

            //remove the appointment record from any student records that its associated with
            let studentsArr = entityRecord.students;

            for (let student of studentsArr) {

                let studentRecord = await getStudentModel().readStudent(student.id)
                    .catch(err => {
                        console.error('Error when waiting for promise from readStudent in Delete operation');
                        next(err);
                    })

                //delete the appt id from the appointments array in the student record
                let appointmentsArr = [];
                if (studentRecord) {
                    for (let appt of studentRecord.appointments) {
                        if (appt.id !== req.params.appt_id) {
                            appointmentsArr.push(appt);
                        }
                    }
                    studentRecord.appointments = appointmentsArr;
                }
                //update the db
                await getStudentModel().updateStudent(studentRecord.id, studentRecord)
                    .catch(err => {
                        console.error('Error when waiting for promise from updateStudent in DELETE appointment operation');
                        next(err);
                    })
            }

            await getApptModel().deleteAppt(req.params.appt_id)
                .catch(err => {
                    console.error('Error when waiting for promise from deleteAppt in DELETE appointment operation');
                    next(err);
                });
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


/* -------------------- Add a student to an appointment ------------------------------- */
/*
/* -------------------- PUT /appointments/:appt_id/:student_id  -----------------------------------*/

router.put('/:appt_id/:student_id', async function (req, res, next) {

    //get the appointment record
    try {

        //check accept header is JSON
        if (req.header("Accept") !== 'application/json') {
            const err = generateError('406', 'PUT controller');
            throw err;
        }

        const data = req.body;

        //read the file to check whether the entity exists
        let apptRecord = await getApptModel().readAppt(req.params.appt_id)
            .catch(err => {
                console.error('Error when waiting for promise from readAppt in Controller');
                next(err);
            })
        if (!apptRecord) {
            let err = generateError('404', 'PUT controller');
            throw err;
        }

        //get the student record
        //read the file to check whether the entity exists
        let studentRecord = await getStudentModel().readStudent(req.params.student_id)
            .catch(err => {
                console.error('Error when waiting for promise from readStudent in Controller');
                next(err);
            })
        if (!studentRecord) {
            let err = generateError('404', 'PUT controller');
            throw err;
        }


        //add the id of each to the other
        let newAppt = {};
        newAppt.id = apptRecord.id;
        studentRecord.appointments.push(newAppt);

        let newStudent = {};
        newStudent.id = studentRecord.id;
        apptRecord.students.push(newStudent);


        //update apptRecord in the db

        let updatedApptRecord = await getApptModel().updateAppt(apptRecord.id, apptRecord)
            .catch(err => {
                console.error('Error when waiting for promise from updateAppt');
                next(err);
            })

        if (!updatedApptRecord) {

            const err = generateError('404', 'PUT controller');
            throw err;
        }
        //update self url string
        updatedApptRecord.self = `${urlString}/appointments/${updatedApptRecord.id}`;

        //reformat the dateTime measure as HH:MM for readability
        updatedApptRecord.startTime = dateToTimeString(updatedApptRecord.startTime);
        updatedApptRecord.endTime = dateToTimeString(updatedApptRecord.endTime);

        //res.status(201).send(apptRecord);

        //update the studentRecord in the db
        let updatedStudentRecord = await getStudentModel().updateStudent(studentRecord.id, studentRecord);

        if (!updatedStudentRecord) {

            const err = generateError('404', 'POST controller');
            throw err;
        }


        //add the self link to every student associated with the appointment
        updatedApptRecord.students = addSelftoStudents(updatedApptRecord.students);

        res.status(201).send(updatedApptRecord);

    }
    catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';

        } else {

            errorResponseSwitch(err.statusCode, res);
        }

        console.error(`${err.statusCode} error caught in appointments Controller`);

        next(err);

    }

})

/* -------------------- Remove a student from an appointment (Deletes relationship) ------------------------------- */
/*
/* -------------------- DELETE /appointments/:appt_id/:student_id  -------------------------------------------------*/

router.delete('/:appt_id/:student_id', async function (req, res, next) {

    //get the appointment record
    try {

        //get the appointment record
        //check whether the entity exists
        let apptRecord = await getApptModel().readAppt(req.params.appt_id)
            .catch(err => {
                console.error('Error when waiting for promise from readAppt in Controller');
                next(err);
            })
        if (!apptRecord) {
            let err = generateError('404', 'PUT controller');
            throw err;
        }

        //get the student record
        //read the file to check whether the entity exists
        let studentRecord = await getStudentModel().readStudent(req.params.student_id)
            .catch(err => {
                console.error('Error when waiting for promise from readStudent in Controller');
                next(err);
            })
        if (!studentRecord) {
            let err = generateError('404', 'PUT controller');
            throw err;
        }

        let studentsArray = [];
        let apptsArray = [];

        for (let student of apptRecord.students) {
            if (student.id !== studentRecord.id) {
                studentsArray.push(student);
            }
        }

        for (let appt of studentRecord.appointments) {
            if (appt.id !== apptRecord.id) {
                apptsArray.push(appt);
            }
        }

        studentRecord.appointments = apptsArray;
        apptRecord.students = studentsArray;

        //update the studentRecord in the db
        let updatedStudentRecord = await getStudentModel().updateStudent(studentRecord.id, studentRecord);

        if (!updatedStudentRecord) {

            const err = generateError('404', 'POST controller');
            throw err;
        }
        //update the apptRecord in the db
        let updatedApptRecord = await getApptModel().updateAppt(apptRecord.id, apptRecord)
            .catch(err => {
                console.error('Error when waiting for promise from updateAppt');
                next(err);
            })

        if (!updatedApptRecord) {

            const err = generateError('404', 'PUT controller');
            throw err;
        }

        //await remove_student_from_appointment(req.params.appt_id, req.params.student_id);

        res.status(204).end();

    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';

        } else {

            errorResponseSwitch(err.statusCode, res);
        }
        console.error(`${err.statusCode} error caught in appointments Controller`);
        next(err);
    }
});






/* ------------- End Controller Functions ------------- */

module.exports = router;