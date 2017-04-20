const PubSub = require(`@google-cloud/pubsub`);
const ScrapeUtils = require('../utils/scrapeUtils');
const Config = require('../config');
const _ = require('lodash');
const Promise = require('bluebird');

/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event The Cloud Functions event.
 * @param {!Function} The callback function.
 */

const DESTINATION_TOPIC = Config.scrapedNewsArticleTopic;

function publishMessage (topicName, message) {
  const pubsub = PubSub({ maxRetries: 5 });
  const topic = pubsub.topic(topicName);
  const options = { raw: true };
  return topic.publish(message, options);
}

exports.scrapeArticleLinks = function scrapeArticleLinks(event, callback) {
  const pubsubMessage = event.data;
  const newsOrg = _.get(pubsubMessage, ['attributes'], null);

  if(!newsOrg) {
    console.error(`No attribues found on message: ${pubsubMessage}`);
    return callback();
  }

  ScrapeUtils.getOrgLinksFromRss(newsOrg)
    .then((newsOrgRss) => {
      const rssEntries = _.get(newsOrgRss, ['entries'], []);
      if(rssEntries.length === 0) {
        console.error(`No entries found at feed: ${newsOrg.rssUrl}`);
        return callback();
      }
      const linkMessages = _.map(rssEntries, (entry) => {
        const articleLink = _.get(entry, ['link'], '');
        if(articleLink) {
          return { 
            data: "", 
            attributes: Object.assign({}, newsOrg, { articleLink }) 
          }
        }
      });

      return publishMessage(DESTINATION_TOPIC, linkMessages);
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      callback();
    });
};