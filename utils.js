'use strict';

//const { OAuth2Client } = require('google-auth-library');  //for authentication

//module.exports.OAuth2Client = OAuth2Client;

//const google_auth_token_endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

//const google_access_token_endpoint = 'https://oauth2.googleapis.com/token'

const CLIENT_APP_ID = 'XXXXXXXX';

//const REDIRECT_URI = 'https://hw7-swenddaj-0422pm.uc.r.appspot.com/oauth';

//const SECRET = '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';

//module.exports.client = new OAuth2Client(CLIENT_APP_ID);  //for authentication

let verify = async function verify() {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_APP_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();

    const userid = payload['sub'];
    // If request specified a G Suite domain:
    // const domain = payload['hd'];

    return userid;
}