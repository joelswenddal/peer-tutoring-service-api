//Author: Joel Swenddal
//Course: CS 493
//Semester: Spring 2022
//Assignment: Final Proejct
//Sources: CS 493 - Course Canvas materials and examples



'use strict';

const ds = require('../datastore');


const datastore = ds.datastore;

const BOAT = "Boat";


function generateError(codeString, functionName) {


    let err = new Error(codeString);
    console.log(`ERROR: ${codeString} thrown in ${functionName}`);
    err.statusCode = codeString;

    return err;
};


async function updateBoat(id, data) {

    let key;
    let kind = BOAT;

    if (id) {
        //if there's an id, then it is an update
        key = datastore.key([kind, parseInt(id, 10)]);

    } else {
        //if no id, it is a create
        key = datastore.key(kind);
    }

    const entity = {
        key: key,
        data: ds.toDatastore(data, ['description'])
    };

    try {
        await datastore.save(entity);

        console.log(`Boat id # ${entity.key.id} updated successfully`);

        data.id = entity.key.id;

        return data;

    } catch (err) {

        console.error('ERROR caught in readBoat model');

        throw err;

    }
}


//used to get a boat with a specific id
async function readBoat(id) {

    try {
        let kind = BOAT;

        const key = datastore.key([kind, parseInt(id, 10)]);
        //console.log(`The key is: ${key}`);

        let entity = await datastore.get(key);

        if (typeof entity[0] !== 'undefined') {

            return ds.fromDatastore(entity[0]);


        } else {

            let err = generateError('404', 'readBoat model');
            throw err;

        }

    } catch (err) {

        let error = new Error('Error caught in readBoat model');

        if (!err.statusCode) {

            error.statusCode = '500';

        } else {

            error.statusCode = err.statusCode
        }

        console.error(`${error.statusCode} error caught in readBoat model`);

        throw error;

    }

}

//returns all boats with no pagination (basic list all)
async function getBoats() {

    const kind = BOAT;

    const q = datastore.createQuery(kind);

    let results = {};

    let entities = await datastore.runQuery(q);

    results.boats = entities[0].map(ds.fromDatastore);

    return results;

}



async function deleteBoat(boat_id) {

    try {

        let entityRecord = await readBoat(boat_id);

        if (!entityRecord) {
            let err = generateError('404', 'DELETE model');
            throw err;

        } else {
            //entityRecord.self = `${urlString}/boats/${entityRecord.id}`;
            //res.status(200).send(entityRecord);
            const key = datastore.key([BOAT, parseInt(boat_id, 10)]);

            return await datastore.delete(key);

        }

    } catch (err) {

        let error = new Error('Error caught in datastore operation in model');

        if (!err.statusCode) {

            error.statusCode = '500';

        } else {

            error.statusCode = err.statusCode
        }

        console.error(`Error caught in deleteBoat model`);

        throw error;

    }

}

module.exports = {
    updateBoat,
    readBoat,
    deleteBoat,
    getBoats
};