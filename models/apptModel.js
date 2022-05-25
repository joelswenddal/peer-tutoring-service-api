//Author: Joel Swenddal
//Course: CS 493
//Semester: Spring 2022
//Assignment: Final Project
//Sources: CS 493 - Course Canvas materials and examples



'use strict';

const ds = require('../datastore');


const datastore = ds.datastore;

const APPT = "Appointments";


function generateError(codeString, functionName) {


    let err = new Error(codeString);
    console.log(`ERROR: ${codeString} thrown in ${functionName}`);
    err.statusCode = codeString;

    return err;
};


async function updateAppt(id, data) {

    let key;
    let kind = APPT;

    if (id) {
        //if there's an id, then it is an update
        key = datastore.key([kind, parseInt(id, 10)]);

    } else {
        //if no id, it is a create
        key = datastore.key(kind);
        //create an empty students property array
        data.students = [];
    }

    const entity = {
        key: key,
        data: ds.toDatastore(data, ['description'])
    };

    try {
        await datastore.save(entity);

        console.log(`Appt id # ${entity.key.id} updated successfully`);

        data.id = entity.key.id;

        return data;

    } catch (err) {

        console.error('ERROR caught in updateAppt model');

        throw err;

    }
}


//used to get a boat with a specific id
async function readAppt(id) {

    try {
        let kind = APPT;

        const key = datastore.key([kind, parseInt(id, 10)]);
        //console.log(`The key is: ${key}`);

        let entity = await datastore.get(key);

        if (typeof entity[0] !== 'undefined') {

            return ds.fromDatastore(entity[0]);


        } else {

            let err = generateError('404', 'readAppt model');
            throw err;

        }

    } catch (err) {

        let error = new Error('Error caught in readAppt model');

        if (!err.statusCode) {

            error.statusCode = '500';

        } else {

            error.statusCode = err.statusCode
        }

        console.error(`${error.statusCode} error caught in readAppt model`);

        throw error;

    }

}

//returns all appointments (needs pagination)
async function listAppts() {

    const kind = APPT;

    const q = datastore.createQuery(kind);

    let results = {};

    let entities = await datastore.runQuery(q);

    results.appts = entities[0].map(ds.fromDatastore);

    return results;

}



async function deleteAppt(appt_id) {

    try {

        let entityRecord = await readAppt(appt_id);

        if (!entityRecord) {
            let err = generateError('404', 'DELETE model');
            throw err;

        } else {

            //res.status(200).send(entityRecord);
            const key = datastore.key([APPT, parseInt(appt_id, 10)]);

            return await datastore.delete(key);

        }

    } catch (err) {

        let error = new Error('Error caught in datastore operation in model');

        if (!err.statusCode) {

            error.statusCode = '500';

        } else {

            error.statusCode = err.statusCode
        }

        console.error(`Error caught in deleteAppt model`);

        throw error;

    }

}

module.exports = {
    updateAppt,
    readAppt,
    deleteAppt,
    listAppts
};