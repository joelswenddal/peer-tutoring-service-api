//Author: Joel Swenddal
//Course: CS 493
//Semester: Spring 2022
//Assignment: Final Project
//Sources: CS 493 - Course Canvas materials and examples

'use strict';

const { Datastore } = require('@google-cloud/datastore');
const projectId = 'final-peertutor-1215pm';

module.exports.Datastore = Datastore;
//module.exports.datastore = new Datastore();

// Instantiate a datastore client
module.exports.datastore = new Datastore({
    projectId: projectId,
});

module.exports.fromDatastore = function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
}

module.exports.toDatastore = function toDatastore(obj, nonIndexed) {
    nonIndexed = nonIndexed || [];
    const results = [];
    Object.keys(obj).forEach((k) => {
        if (obj[k] === undefined) {
            return;
        }

        results.push({
            name: k,
            value: obj[k],
            excludeFromIndexes: nonIndexed.indexOf(k) !== -1
        });
    });
    return results;
}