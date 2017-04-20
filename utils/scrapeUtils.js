const cheerio = require('cheerio');
const request = require('request');
const parse = require('feed-reader').parse;
const _ = require('lodash');
const Promise = require('bluebird');

function fetchRss(url) {
  return new Promise (( resolve, reject ) => {
    parse(url)
      .then((feed) => {
        resolve(feed);
      })
      .catch((reason) => { reject(reason) });
  });
}

function getOrgLinksFromRss(org) {
  const url = _.get(org, ['rssUrl'], null);
  if(!url) {
    console.error("No RSS URL Found"); 
    return null; 
  }

  return fetchRss(url);
}

module.exports.getOrgLinksFromRss = getOrgLinksFromRss;