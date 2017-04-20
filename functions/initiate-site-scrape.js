/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event The Cloud Functions event.
 * @param {!Function} The callback function.
 */

const _ = require('lodash');
const Config = require('../config');
const PublishMessage = require('../utils/PubSubUtils').publishMessage;
const Promise = require('bluebird');

exports.publishSitesToScrape = function publishSitesToScrape(event, callback) {

	// We got a message, but we don't really care about the contents since we're just using it
	// To trigger sending off the batch of messages to kick of the link scrape function for 
	// Each news organization
	const newsOrgs = _.get(Config, ['newsOrgs'], {});
	const DESTINATION_TOPIC = _.get(Config, ['startSiteScrapeTopic'], null);

	if(!DESTINATION_TOPIC){
		console.error('No destination topic set.'); 
		return callback();
	}

	let pubSubPromises = _.map(newsOrgs, (value, key)=>{
		let message = { 
            data: "", 
            attributes: value 
          };
		return PublishMessage(DESTINATION_TOPIC, message)
	});

	Promise.all(pubSubPromises)
		.catch((error) => {
			console.error(error);
		})
		.finally(() => {
			return callback();
		});
};
