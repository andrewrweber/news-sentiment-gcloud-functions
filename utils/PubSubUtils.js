'use strict';

const PubSub = require(`@google-cloud/pubsub`);
const _ = require('lodash');

function publishMessage (topicName, message) {
  const pubsub = PubSub();
  const topic = pubsub.topic(topicName);
  const options = { raw: true };
  return topic.publish(message, options);
}

module.exports.publishMessage = publishMessage;