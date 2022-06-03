//Author: Joel Swenddal
//Course: CS 493
//Semester: Spring 2022
//Assignment: Final Project
//Sources: CS 493 - Course Canvas materials and examples



'use strict';

const ds = require('../datastore');
const datastore = ds.datastore;
const USER = "Users";


function generateError(codeString, functionName) {


    let err = new Error(codeString);
    console.log(`ERROR: ${codeString} thrown in ${functionName}`);
    err.statusCode = codeString;

    return err;
};


async function updateUser(id, data) {

    let key;
    let kind = USER;

    if (id) {
        //if there's an id, then it is an update
        key = datastore.key([kind, parseInt(id, 10)]);
        //console.log(`The key is: ${key}`);

    } else {
        //if no id, it is a create
        key = datastore.key(kind);
        //create an empty appointments property array
        data.appointments = [];
    }

    const entity = {
        key: key,
        data: ds.toDatastore(data, ['description'])
    };

    try {
        await datastore.save(entity);

        console.log(`User id # ${entity.key.id} updated successfully`);

        data.id = entity.key.id;

        return data;

    } catch (err) {

        const error = generateError('500', 'Error saving to database in model');
        throw error;

    }
}

//returns all Users
async function listUsers() {

    try {

        const kind = USER;

        const q = datastore.createQuery(kind);

        let results = {};

        let entities = await datastore.runQuery(q);

        results.users = entities[0].map(ds.fromDatastore);

        return results;

    } catch (err) {

        const error = generateError('500', 'Error reading from database in model');
        throw error;
    }
}

module.exports = {
    updateUser,
    listUsers
};
