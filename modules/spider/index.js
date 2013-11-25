// all links array are 2-D arrays
// each link node has attibutes: selector and url

function Spider(domain, file) {
	this.domain = domain;
	this.signedIn = false;
	this.pendingLinks = [];
	this.visitedLinks = [];
	this.fname = file;

	fw.write(fname, '', 'w');
}

Spider.prototype = {
	constructor: Spider,

	crawl: function(link) {
		var instance = this;

		instance.visitedLinks.push(link);

		if (link['selector']) {
			casper.echo('click link with selector: ' + link['selector']);
			casper.click(link['selector']);
		}
		else {
			casper.echo('open link');
			casper.open(link['url']);
		}

		casper.then(function() {
			casper.echo('url: ' + casper.getCurrentUrl());

			fw.write(instance.fname, '[' + link['source'] + '] ' + link['url'] + '\n', 'a');

			casper.wait(1000, function() {
				casper.capture('screenshots/' + instance.visitedLinks.length + ' - ' + casper.getTitle() + '.png');

				instance.getLinks();

				nextLink = instance._nextLink();

				if (nextLink) {
					instance.crawl(nextLink);
				}
				else if (!nextLink && !instance.signedIn) {
					casper.open(instance.domain);

					casper.then(function() {
						loginInstance.signIn('test@liferay.com', 'test');
					});

					casper.then(function() {
						if (!casper.exists('.sign-in-form')) {
							casper.echo('sign in successfully');
							instance.signedIn = true;

							instance.crawl(
								{
									selector: null,
									url: instance.domain
								}
							);
						}
					});
				}
			});
		});
	},

	getLinks: function() {
		var instance = this;

		var links = casper.evaluate(function() {
			var links = [];

			Array.prototype.forEach.call(__utils__.findAll('a[href]'), function(link) {
				var selector = null;
				var url = link.getAttribute('href');
				var onclick = '';

				if (link.hasAttribute('onClick'))
					onclick = link.getAttribute('onClick');

				if (onclick.indexOf('state=pop_up') > -1 || url.indexOf('state=pop_up') > -1)
					selector = 'a[href="' + url + '"]';

				links.push(
					{
						selector: selector,
						source: document.URL,
						url: url
					}
				);
			});

			return links;
		});

		casper.echo('Get ' + links.length + ' links');

		Array.prototype.forEach.call(links, function(link) {
			if(instance._isNewLink(link['url']) && !instance._isLanguageLink(link['url'])) {
				if(link['selector'])
					instance.pendingLinks.unshift(link);
				else
					instance.pendingLinks.push(link);
			}
		});
	},

	_isNewLink: function(url) {
		if(url.indexOf(this.domain) > -1 && !this.contains(this.pendingLinks, url) && !this.contains(this.visitedLinks, url)) {
			return true;
		}
		else {
			return false;
		}
	},

	_nextLink: function() {
		if(this.pendingLinks.length > 0) {
			return this.pendingLinks.shift();
		}
		else {
			return null;
		}
	},

	_isLanguageLink: function(url) {
		if(url.indexOf('languageId') > -1) {
			return true;
		}
		else {
			return false;
		}
	},

	contains: function(array, target) {
		for (var i = 0; i < array.length; i++) {
			if (array[i]['url'] == target)
				return true;
		}
		return false;
	}
};

module.exports.Spider = Spider;
