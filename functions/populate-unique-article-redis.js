/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event The Cloud Functions event.
 * @param {!Function} The callback function.
 */
const _ = require('lodash');
const redis = require("redis");
const PubSub = require(`@google-cloud/pubsub`);
const PubSubUtils = require('../utils/PubSubUtils');

const Config = require('../config');

const NEW_ARTICLES_TOPIC_NAME = Config.newArticleTopic;

exports.pubArticlesToRedis = function pubArticlesToRedis(event, callback) {
  const client = redis.createClient({
    url: Config.redis.url
  });

  const attributes = _.get(event, ['data', 'attributes'], null);

  if(attributes && attributes['orgId']) {
    //get last part of url for set key
    const articleLink = _.get(attributes, ['articleLink'], "");
    const splitLink = articleLink.split('/');

    const key1 = _.get(splitLink, [splitLink.length -1], null);
    const key2 = _.get(splitLink, [splitLink.length -2], "");
   
    if(!key1) {
      console.error(`Not a valid link ${articleLink}`);
      callback();
    }
    const key = key1 + key2;

    client.sadd(attributes['orgId'], key, function(err, reply) {
      if(!err && reply === 1) {
        // New Article added -- Publish message to initiate sentiment analysis worker
        PubSubUtils.publishMessage(NEW_ARTICLES_TOPIC_NAME, {
          data: "",
          attributes
        });
      }
    });
  }

  client.quit();
  // Don't forget to call the callback.
  callback();
};