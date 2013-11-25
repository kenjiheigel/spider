#!/usr/bin/env casperjs

var casper = require('casper').create(
	{
		verbose: true,
		viewportSize: {
			height: 1024,
			width: 1280
		}
	}
);

var Login = require('modules/login').Login;
var Spider = require('modules/spider').Spider;
var utils = require('utils');
var fw = require('fs');

var url = 'http://localhost:8080';
var fname = 'url_list';

var spiderInstance = new Spider(url, fname);
var loginInstance = new Login()

casper.start(
	url,
	function() {
		casper.echo('Liferay web crawler is running');
	}
);

casper.then(function() {
	spiderInstance.crawl(
		{
			selector: null,
			url: url
		}
	);
});

casper.then(function () {

});

casper.run(
	function() {
		casper.echo('Done.');

		casper.test.renderResults(true, 0, 'test-results.xml');
	}
);