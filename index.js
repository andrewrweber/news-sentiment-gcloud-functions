const analyzeArticle = require('./functions/analyze-new-article').analyzeArticle;
const publishSitesToScrape = require('./functions/initiate-site-scrape').publishSitesToScrape;
const populateOrgEntitiesRedis = require('./functions/populate-entity-redis').populateOrgEntitiesRedis;
const pubArticlesToRedis = require('./functions/populate-unique-article-redis').pubArticlesToRedis;
const scrapeArticleLinks = require('./functions/scrape-news-sites').scrapeArticleLinks;
const removeOldMongoRecords = require('./functions/remove-old-mongo-records').removeOldMongoRecords;

module.exports = {
    analyzeArticle,
    publishSitesToScrape,
    populateOrgEntitiesRedis,
    pubArticlesToRedis,
    scrapeArticleLinks,
    removeOldMongoRecords
} 