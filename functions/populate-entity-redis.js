const MongoClient = require('mongodb').MongoClient;
const Config = require('../config');
const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');
const redis = require('redis');
const buildEntityAggregateQuery = require('../utils/MongoHelpers').buildEntityAggregateQuery;


function populateOrgEntitiesRedis(event, callback){
  const redisClient = redis.createClient({
    url: Config.redis.url
  });

  //Promisify Redis SET calls
  redisClient.set = Promise.promisify(redisClient.set);
  const startTime = moment().subtract(24, 'hours').valueOf();
  const endTime = moment().valueOf();
  let dbConn = null;
  let collection = null;
  let orgArray = [];
  MongoClient.connect(Config.mongoDB.url)
    .then((db) => {
        dbConn = db;
        collection = db.collection(Config.mongoDB.collectionName);
        return collection.distinct('orgId', {'created_at': {$gt: startTime, $lt: endTime}});
    })
    .then((uniqueOrgs) => {
      orgArray = uniqueOrgs;
      const queryPromises = _.map(uniqueOrgs, (orgId) => {
        const query = buildEntityAggregateQuery(orgId, startTime, endTime);
        return new Promise((resolve, reject) => {
          collection.aggregate(query, function(err, result) {
            if(err){ reject(err); }
            resolve({orgId, result});
          });
        });
      });

      return Promise.all(queryPromises);
    })
    .then((queryResults) => {
      let redisPromises = _.map(queryResults, (newsOrg) => {
        const orgId = _.get(newsOrg, ['orgId'], null);
        const value = JSON.stringify(_.get(newsOrg, ['result'], []));
        const key = `${orgId}:entities`;
        return redisClient.set(key, value);
      });
      return Promise.all(redisPromises);
    })
    .then((results)=> {
      // console.log(results);
      redisClient.quit()
      dbConn.close();
      return callback();
    })
    .catch(error => {
      console.error(error);
      redisClient.quit()
      dbConn.close();
      return callback();
    });
}

/*
For Testing
*/
// console.log(moment().subtract(24, 'hours').valueOf());
// console.log(Date.now());
// populateOrgEntitiesRedis("Start", function(){
//     console.log("Done");
// });

module.exports.populateOrgEntitiesRedis = populateOrgEntitiesRedis;