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
            res.status(400).json({ 'Error': 'Input values for one of the student attributes is invalid' });

        case '400-BadAttribute':
            res.status(400).json({ 'Error': 'The request object has at least one attribute that is not allowed in a student record' });

        case '401-Authentication':
            res.status(401).json({ 'Error': 'Authentication Error - A valid JWT must be in the Authorization header. Check that your JWT has not expired.' });

        case '403-NoStudent':
            res.status(403).json({ 'Error': 'There is no student with this id' });

        case '403-NotTutor':
            res.status(403).json({ 'Error': 'You cannot delete an appointment if you are not its associated tutor' });

        case '403-Uniqueness':
            res.status(403).json({ 'Error': 'There is aleady another student with this email address. Please use a different address' });

        case '404':
            res.status(404).json({ 'Error': "No student with this id exists" });
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



/* ------------- Begin Controller Functions ------------- */

/* -------------------- Create a student ----------------------------------- */

/* -------------------- POST /students ---------------------------------------*/

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

        } else {

            errorResponseSwitch(err.statusCode, res);
        }

        console.error(`${err.statusCode} error caught in students Controller block 1`);

        next(err);
    }

})





/* -------------------- GET /students ----------------------------------------------------*/

router.get('/', async (req, res, next) => {

    try {

        let results = [];

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

        } else {

            errorResponseSwitch(err.statusCode, res);
        }

        console.error(`${err.statusCode} error caught in students Controller`);

        next(err);
    }
});


/* -------------------- View a student ----------------------------------------------*/

/* -------------------- GET /students/:student_id ---------------------------------------*/

router.get('/:student_id', async (req, res, next) => {

    try {

        //check if req has Json content type
        //
        if (req.header("Accept") !== 'application/json') {

            console.log(`Response header is ${req.header("Accept")}`);
            const err = generateError('406', 'GET controller');
            throw err;
        }

        let entityRecord = await getStudentModel().readStudent(req.params.student_id)
            .catch(err => {
                console.error('Error when waiting for promise from readStudent');
                next(err);
            })

        if (!entityRecord) {
            let err = generateError('404', 'GET controller');
            throw err;

        } else {
            entityRecord.self = `${urlString}/students/${entityRecord.id}`;

            res.format({
                json: function () {
                    res.status(200).send(entityRecord);
                }
            })
        }

    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';

        } else {

            errorResponseSwitch(err.statusCode, res);
        }

        console.error(`${err.statusCode} error caught in students Controller`);

        next(err);
    }
})

/* -------------------- Update whole student record ------------------------------- */
/*
/* -------------------- PUT /students/:student_id  -----------------------------------*/

//if no student_id is provided
router.put('/', (req, res) => {

    res.status(405).send({ 'Error': 'This operation is not supported on a list of student records. Use a student_id' })

})

//start with validity check
router.put('/:student_id', async (req, res, next) => {

    try {

        const data = req.body;
        let contype = req.headers['content-type'];
        let props = ["firstName", "lastName", "email"];

        //check if req has Json content type
        //
        if (!contype || req.header('Content-Type') !== 'application/json') {

            const err = generateError('415-UnsupportedType', 'PUT controller');
            throw err;
        }

        //check that all required attributes are included
        if (data.firstName && data.lastName && data.email) {

            //check email uniqueness constraint
            let allStudents = await getStudentModel().listStudents();

            for (let student of allStudents.students) {
                if (student.email === data.email && student.id !== req.params.student_id) {
                    const err = generateError('403-Uniqueness', 'PUT controller');
                    throw err;
                }
            }

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

        console.error(`${err.statusCode} error caught in students Controller block 1`);

        next(err);
    }

})


router.put('/:student_id', async (req, res, next) => {


    try {
        const data = req.body;


        //read the file to check whether the entity exists
        let entityRecord = await getStudentModel().readStudent(req.params.student_id)
            .catch(err => {
                console.error('Error when waiting for promise from readStudent in PUT');
                next(err);
            })
        if (!entityRecord) {
            let err = generateError('404', 'PUT controller');
            throw err;
        }

        //appointments remain the same in an update; 
        //only adding or removing appointments at designated endpoints can alter relationships
        data.appointments = entityRecord.appointments;

        //read the file to check whether the entity exists
        const studentRecord = await getStudentModel().updateStudent(req.params.student_id, data)
            .catch(err => {
                console.error('Error when waiting for promise from updateStudent');
                next(err);
            })

        if (!studentRecord) {

            const err = generateError('404', 'PUT controller');
            throw err;
        }

        studentRecord.self = `${urlString}/students/${studentRecord.id}`;

        //The URL of the updated boat must be included in the Location header
        //res.status(303).setHeader("Location", studentRecord.self).send();
        res.status(201).send(studentRecord);


    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';

        } else {

            errorResponseSwitch(err.statusCode, res);
        }

        console.error(`${err.statusCode} error caught in students Controller block 2`);

        next(err);
    }

})



/* -------------------- Update partial student record - Edit ------------------------------- */
/*
/* -------------------- PATCH /students/:student_id  -----------------------------------*/

//if no student_id is provided
router.patch('/', (req, res) => {

    res.status(405).send({ 'Error': 'This operation is not supported on a list of student records. Use a student_id' })

})

//start with validity check
router.patch('/:student_id', async (req, res, next) => {

    try {

        const data = req.body;
        let contype = req.headers['content-type'];
        let props = ["firstName", "lastName", "email"];

        //check if req has Json content type
        //
        if (!contype || req.header('Content-Type') !== 'application/json') {

            const err = generateError('415-UnsupportedType', 'PUT controller');
            throw err;
        }

        //check that at least one required attributes is included
        if (data.firstName || data.lastName || data.email) {

            //check that all properties in the data are allowed
            for (const key in data) {
                if (!props.includes(key)) {
                    let err = generateError('400-BadAttribute', 'PUT controller');
                    throw err;
                }
            }

            if (data.email) {
                //check email uniqueness constraint
                let allStudents = await getStudentModel().listStudents();

                for (let student of allStudents.students) {
                    if (student.email === data.email && student.id !== req.params.student_id) {
                        const err = generateError('403-Uniqueness', 'PUT controller');
                        throw err;
                    }
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

        console.error(`${err.statusCode} error caught in students Controller block 1`);

        next(err);
    }

})


router.patch('/:student_id', async (req, res, next) => {


    try {
        const data = req.body;
        let dataKeys = Object.keys(data); //an array


        //read the file to check whether the entity exists
        let entityRecord = await getStudentModel().readStudent(req.params.student_id)
            .catch(err => {
                console.error('Error when waiting for promise from readStudent in PUT');
                next(err);
            })
        if (!entityRecord) {
            let err = generateError('404', 'PUT controller');
            throw err;
        }

        //appointments remain the same in an edit 
        //only adding or removing appointments at designated endpoints can alter relationships
        //data.appointments = entityRecord.appointments;

        for (const key in entityRecord) {

            if (!dataKeys.includes(key)) {

                if (key !== 'id') {
                    data[key] = entityRecord[key];
                }
            }
        }

        //update the db
        const studentRecord = await getStudentModel().updateStudent(req.params.student_id, data)
            .catch(err => {
                console.error('Error when waiting for promise from updateStudent');
                next(err);
            })

        if (!studentRecord) {

            const err = generateError('404', 'PUT controller');
            throw err;
        }

        studentRecord.self = `${urlString}/students/${studentRecord.id}`;

        res.status(201).send(studentRecord);


    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';

        } else {

            errorResponseSwitch(err.statusCode, res);
        }

        console.error(`${err.statusCode} error caught in students Controller block 2`);

        next(err);
    }

})

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

        } else {

            errorResponseSwitch(err.statusCode, res);
        }

        console.error(`${err.statusCode} error caught in DELETE students Controller`);

        next(err);
    }
});


/* ------------- End Controller Functions ------------- */

module.exports = router;
