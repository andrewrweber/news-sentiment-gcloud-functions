const MongoClient = require('mongodb').MongoClient;
const Promise = require('bluebird');
const Config = require('../config');

function removeOldMongoRecords(event, callback){
    let dbConn = null;

    MongoClient.connect(Config.mongoDB.url)
        .then((db) => {
            dbConn = db;
            const collection = db.collection(Config.mongoDB.collectionName);
            const twoWeeksAgoMs = Date.now() - (60 * 60 * 24 * 7 * 2 * 1000);
            return collection.deleteMany({"created_at": {$lt: twoWeeksAgoMs}});
        })
        .then((result) => {
            // success
            dbConn.close();
            callback();
        })
        .catch((err) => {
            console.error(err);
            if(dbConn) {
                dbConn.close();
            }
            callback();
        });
}

module.exports.removeOldMongoRecords = removeOldMongoRecords;