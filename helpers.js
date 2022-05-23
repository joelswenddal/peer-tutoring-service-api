//Author: Joel Swenddal
//Course: CS 493
//Semester: Spring 2022
//Assignment: Authentication
//Sources: CS 493 - Module 7 Course Materials/Examples;

'use strict';

const axios = require("axios");

const google_auth_token_endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

const google_access_token_endpoint = 'https://oauth2.googleapis.com/token';

const CLIENT_APP_ID = process.env.CLIENT_APP_ID;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SECRET = process.env.SECRET;


const query_params = {
    client_id: CLIENT_APP_ID,
    redirect_uri: REDIRECT_URI,
};

// this object contains information that will be passed as query params to the auth // token endpoint
const auth_token_params = {
    ...query_params,
    response_type: 'code',
};

// the scopes (portion of user's data) we want to access
const scopes = ['profile'];

let params = new URLSearchParams(auth_token_params);

// a url formed with the auth token endpoint and scope
const request_get_auth_code_url = `${google_auth_token_endpoint}?${params.toString()}&scope=${scopes.join(' ')}`;

const get_access_token = async (access_code) => {
    const access_token_params = {
        ...query_params,
        client_secret: SECRET,
        code: access_code,
        grant_type: 'authorization_code',
    };
    let auth_params = new URLSearchParams(access_token_params)
    return await axios({
        method: 'post',
        url: `${google_access_token_endpoint}?${auth_params.toString()}&scope=${scopes.join(' ')}`,
    });
};


const get_profile_names = async access_token => {

    try {
        console.log(`Get_profile names received access token: ${access_token}`);


        const url = 'https://people.googleapis.com/v1/people/me?personFields=names';

        console.log('Url is ' + url);

        let config = {

            method: 'get',
            url: 'https://people.googleapis.com/v1/people/me',
            params: { personFields: 'names' },
            headers: { 'Authorization': `Bearer ${access_token}` }
        }

        return await axios.request(config)
            .catch((err) => {
                console.log('Error in call to https://people.googleapis.com/v1/people/me with axios to request person info');
                let error = new Error();
                throw (error);
            })

    } catch (err) {
        let error = new Error();
        console.log('Error thrown in utility function call with axios');
        throw (error);

    };
};






module.exports = { request_get_auth_code_url, get_access_token, get_profile_names };