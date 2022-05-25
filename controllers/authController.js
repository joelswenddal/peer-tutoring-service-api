//Author: Joel Swenddal
//Course: CS 493
//Semester: Spring 2022
//Assignment: Final Proejct
//Sources: CS 493 - Course Canvas materials and examples




'use strict';

const express = require('express');
const res = require('express/lib/response');

const router = express.Router();

const helpers = require('../helpers');

const crypto = require('crypto');

//*************************for verifying the JWT ********************************/

const CLIENT_APP_ID = process.env.CLIENT_APP_ID;
const { OAuth2Client } = require('google-auth-library');  //for authentication
const client = new OAuth2Client(CLIENT_APP_ID);

//************************ */

//For Handlebars view engine to render the final respnse content dynamically
const hbs = require('hbs');
//hbs.registerPartials(path.join(__dirname, 'views/partials'));


//Parse URL-encoded bodies
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// Set Content-Type for all responses on the routes

router.use((req, res, next) => {
    res.set(('Content-Type', 'application/json'));
    next();
});

const projectId = process.env.PROJECT_ID;
const urlString = 'https://final-peertutor-1215pm.uc.r.appspot.com'




/*************** Helper Functions *********************/

function getAuthModel() {
    return require('../models/authModel');
};

function generateError(codeString, functionName) {


    let err = new Error(codeString);
    console.error(`ERROR: ${codeString} thrown in ${functionName}`);
    err.statusCode = codeString;

    return err;
};

function errorResponseSwitch(code, res) {

    switch (code) {

        case '400':
            res.status(400).json({ 'Error': 'General bad request' });
            break;

        case '404-State':
            res.status(404).json({ 'Error': "The incoming state value does not match in state in the database" });
            break;

        case '500':
            res.status(500).json({ 'Error': 'Server - Something is not right in the server!' });
            break;
    }

};


async function startNewRecord(state) {
    try {

        let data = {};

        data.state = state;
        data.firstName = null;
        data.lastName = null;
        data.dateTime = new Date();

        const newRecord = await getAuthModel().updateState(null, data);

        if (!newRecord) {

            const err = generateError('500', 'in function startNewRecord');
            throw err;
        } else {

            // save the id variable into the db so the server can update the names
            //property later
            const updatedRecord = await getAuthModel().updateState(newRecord.id, newRecord)
                .catch((err) => {
                    const error = generateError('500', 'startNewRecord -> updateState');
                    throw error;
                });

            return updatedRecord;

        }

    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';

        }

        let error = generateError(err.statusCode, 'in function startNewRecord');

        throw error;

    }
}

async function verify(token, OAuthClient) {

    try {
        const ticket = await OAuthClient.verifyIdToken({
            idToken: token,
            audience: CLIENT_APP_ID,
        });
        const payload = ticket.getPayload();

        const userid = payload['sub'];

        return userid;

    } catch (err) {
        const error = generateError('500', 'Controller router.get /');
        throw error;
    }
}



/******** Controller Functions ***********************/

router.get('/auth', async (req, res) => {

    try {
        let newState = crypto.randomBytes(4).toString('hex');
        console.log("New random state string is: " + newState);

        let newRecord = await startNewRecord(newState);

        if (!newRecord) {

            const err = generateError('500', 'Controller router.get /auth');
            throw err;

        } else {
            let redirect = `${helpers.request_get_auth_code_url}&state=${newRecord.state}`;
            res.redirect(303, redirect);
            console.log("User request to connect to Google server is sent on/redirected");

        }
    }

    catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';
        }

        errorResponseSwitch(err.statusCode, res);

    }
});


router.get('/', async (req, res, next) => {

    try {
        // will use the access_code to get the access token later
        const access_code = req.query.code;
        const received_state = req.query.state

        let allUsers = await getAuthModel().getUsers();

        let matched_state = false;

        let userRecord = null;

        for (let user of allUsers.users) {
            if (user.state === received_state) {

                matched_state = true;
                userRecord = user;

                break;
            }
        }
        if (matched_state === true) {

            const response = await helpers.get_access_token(access_code);

            // get access token from payload
            const { access_token, id_token } = response.data;

            //console.log('Success! Received access_token is:' + access_token);
            //console.log('Success! Received id_token is:' + id_token);

            /*******************REMOVING CALL TO PEOPLE API GET PROFILE NAMES FOR AUTHENTICATION************ */
            //const user = await helpers.get_profile_names(access_token);
            //const user_data = user.data;

            //update the names of the user in the db
            //userRecord.firstName = user_data.names[1].givenName;
            //userRecord.lastName = user_data.names[1].familyName;
            /************************************************************************************************ */

            userRecord.id_token = id_token;

            //translate the JWT (id_token) and get the sub property
            //save the sub property as sub in the User Record
            userRecord.sub = await verify(id_token, client);

            console.log(`Verify succeeded. Sub (ID) variable is ${userRecord.sub}`);

            //db maintenance -- get all prior records for this user, keeping only the most recent one
            let ids = [];


            let allUsers = await getAuthModel().getUsers()
                .catch((err) => {
                    const error = generateError('500', 'Controller router.get /');
                    throw error;
                });

            for (let user of allUsers.users) {
                if (userRecord.sub === user.sub) {
                    ids.push(user.id);
                }
            }
            //update the db with most recent auth record
            await getAuthModel().updateState(userRecord.id, userRecord)
                .catch((err) => {
                    const error = generateError('500', 'Controller router.get /');
                    throw error;
                });

            //delete all prior records for this user, leaving only the most recent
            for (let id of ids) {
                await getAuthModel().deleteUser(id)
                    .catch((err) => {
                        const error = generateError('500', 'Controller router.get /');
                        throw error;
                    });
            }

            res.render('userInfo', {
                //firstName: user_data.names[1].givenName,
                //familyName: user_data.names[1].familyName,
                idToken: id_token,
                userID: userRecord.sub
            });


        } else {
            const err = generateError('404-State', 'Controller - matching incoming state variable');
            throw err;
        }
    } catch (err) {

        if (!err.statusCode) {

            err.statusCode = '500';
        }

        errorResponseSwitch(err.statusCode, res);

    }

});

/* ------------- End Controller Functions ------------- */

module.exports = router;