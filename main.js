#!/usr/bin/env casperjs

var conf = require('config.json');

var casper = require('casper').create(conf.casper);

var Login = require('modules/login').Login;
var Spider = require('modules/spider').Spider;
var utils = require('utils');
var fw = require('fs');

var spiderInstance = new Spider(conf.url, conf.fname);
var loginInstance = new Login();

casper.start(
	conf.url,
	function() {
		casper.echo('Liferay web crawler is running');
	}
);

casper.then(function() {
	spiderInstance.crawl(conf.homepage);
});

casper.then(function () {

});

casper.run(
	function() {
		casper.echo('Done.');

		fw.close();

		casper.test.renderResults(true, 0, 'test-results.xml');
	}
);
