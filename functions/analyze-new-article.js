/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event The Cloud Functions event.
 * @param {!Function} The callback function.
 */
const cheerio = require('cheerio');
const rp = require('request-promise');
const Promise = require('bluebird');
const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');
const Config = require('../config');
const NLPUtils = require('../utils/NLPUtils');

function analyzeArticle(event, callback) {
    const pubsubMessage = event.data;
    const messageAttributes = _.get(pubsubMessage, ['attributes'], null);

    if(!messageAttributes || !messageAttributes['articleLink']) {
        console.error(`analyzeArticle choked on: ${pubsubMessage}`);
        return callback();
    }
    var options = {
        uri: messageAttributes['articleLink'],
        transform: function (body) {
            return cheerio.load(body, {
                normalizeWhitespace: true
            });
        }
    };

    rp(options)
        .then(function ($) {
            // Process html like you would with jQuery...
            // const text = $('.article-copy')[0].innerText;
            const newsOrg = _.get(messageAttributes, ['orgId'], null);
            const articleSelector = _.get(Config, ["newsOrgs", newsOrg, 'articleSelector'], null);
            const article = $(articleSelector);
            const articleText = article.text();

            if( !articleSelector || !article || !articleText.length ) {
                console.error(`Unable to extract article from ${newsOrg} with selector: ${articleSelector}, article: ${messageAttributes.articleLink}`);
                return callback();
            } 
            NLPUtils.extractEntities(articleText)
                .then((entities) => {
                    
                    if(!entities || !entities.length || entities.length === 0) {
                        console.error(`No entities found in article ${messageAttributes.articleLink}`);
                        return callback();
    
                    }

                    const created_at = Date.now();
                    const entityDocuments = _.map(entities, (entity) => {
                        return Object.assign({}, messageAttributes, entity, {created_at})
                    });
                    
                    MongoClient.connect(Config.mongoDB.url)
                        .then((db) => {
                            const collection = db.collection(Config.mongoDB.collectionName);
                            collection.insertMany(entityDocuments, function(err, result){
                                if(err){
                                    console.error(err);
                                }
                                db.close();
                                return callback();
            
                            });
                        })
                        .catch((err) => {
                            console.error(err);
                            return callback();
        
                        });
                })
                .catch((err) => {
                    console.error(err);
                    return callback();

                });                   
        })
        .catch(function (err) {
            // Crawling failed or Cheerio choked...
            console.error(err);
            return callback()
        });

};

/*
For Testing
*/


// const SAMPLE_DATA  = {
//     data: {
//         attributes: {
//             articleLink: "http://rss.cnn.com/~r/rss/cnn_topstories/~3/_lS9RZbmYa8/index.html",
//             name: "ABC",
//             orgId: "abc",
//             rssUrl: "http://feeds.abcnews.com/abcnews/topstories",
//             rootUrl: "http://www.cnn.com"
//         }
//     }
// };

// analyzeArticle(SAMPLE_DATA, function(){ console.log('done') });


module.exports.analyzeArticle = analyzeArticle;