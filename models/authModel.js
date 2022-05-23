//Author: Joel Swenddal
//Course: CS 493
//Semester: Spring 2022
//Assignment: Final Proejct
//Sources: CS 493 - Course Canvas materials and examples



'use strict';

const ds = require('../datastore');

const datastore = ds.datastore;

const USER = 'Users';


function generateError(codeString, functionName) {

    let err = new Error(codeString);
    console.log(`ERROR: ${codeString} thrown in ${functionName}`);
    err.statusCode = codeString;

    return err;
};


async function updateState(id, data) {

    try {
        let key;
        let kind = USER;
        //console.log("Reached updateState in model");
        //console.log("data.state is:" + data.state);

        if (id) {
            //if there's an id, then it is an update
            key = datastore.key([kind, parseInt(id, 10)]);

        } else {
            //if no id, it is a create
            key = datastore.key(kind);
            //console.log(`Key is ${key}`);
        }

        const entity = {
            key: key,
            data: ds.toDatastore(data, ['description'])
        };

        await datastore.save(entity)
            .then((response) => { console.log(`Received response object: ${JSON.stringify(response)}`) })
            .catch((err) => { console.error('Caught an error in save to datastore function') });

        //console.log(`User id # ${entity.key.id} updated successfully`);

        data.id = entity.key.id;

        //return data;
        return data;

    } catch (err) {

        console.error('ERROR caught in updateState model');

        throw err;

    }
}

async function getUsers() {

    const kind = USER;

    const q = datastore.createQuery(kind);

    let results = {};

    let entities = await datastore.runQuery(q);

    results.users = entities[0].map(ds.fromDatastore);

    return results;

}

async function deleteUser(user_id) {

    try {

        const key = datastore.key([USER, parseInt(user_id, 10)]);

        return await datastore.delete(key);

    } catch (err) {

        let error = new Error('Error caught in datastore operation in model');

        if (!err.statusCode) {

            error.statusCode = '500';

        } else {

            error.statusCode = err.statusCode
        }

        console.error(`Error caught in deleteUser model`);

        throw error;

    }

}

//async function updateAuthToken()


module.exports = {
    updateState,
    getUsers,
    deleteUser
};