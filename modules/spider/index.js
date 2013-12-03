/*
link node attibutes:
{
	id: link id if <a> has the id attribute; otherwise, page title. Used for screenshot name
	selector: selector of the link if the link requires user click
	source: where the link is obtained from
	url: url of the link
}
*/

function Spider(domain, file) {
	this.domain = domain;
	this.signedIn = false;
	this.pendingLinks = [];
	this.visitedLinks = [];
	this.fname = file;

	fw.write(this.fname, '', 'w');
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

			link.id = instance.visitedLinks.length;

			fw.write(instance.fname, JSON.stringify(link, null, '\t') + '\n', 'a');

			casper.wait(1000, function() {
				casper.capture('screenshots_desktop/' + link.id + ')' + link['name'] + '.png');

				casper.then(function() {
					instance.findLinks();

					nextLink = instance._nextLink();

					if (nextLink) {
						instance.crawl(nextLink);
					}
					else if (!nextLink && !instance.signedIn) {
						casper.open(instance.domain);

						casper.echo('going to sign in as test');

						casper.then(function() {
							loginInstance.signIn('test@liferay.com', 'test');
						});

						casper.then(function() {
							if (casper.exists('.signed-in')) {
								casper.echo('sign in successfully');
								instance.signedIn = true;

								instance.crawl(
									{
										'name': "homepage - signed in",
										'selector': null,
										'url': instance.domain
									}
								);
							}
						});
					}
				});

			});
		});
	},

	captureScreenshots: function() {
		casper.viewport(1280, 1024).then(function() {
			this.capture('screenshots_desktop/' + link.id + ')' + link['name'] + '.png');

			this.viewport(768, 1024).then(function() {
				this.capture('screenshots_tablet/' + link.id + ')' + link['name'] + '.png');
			});
		});
	},

	findLinks: function() {
		var instance = this;

		var links = casper.evaluate(function() {
			var links = [];

			Array.prototype.forEach.call(__utils__.findAll('a[href]'), function(link) {
				var selector = null;
				var url = link.getAttribute('href');
				var name = link.getAttribute('id');
				var onclick = '';

				if (url.indexOf('/') == 0)
					url = 'http://localhost:8080' + url;

				if (link.hasAttribute('onClick'))
					onclick = link.getAttribute('onClick');

				if (onclick.indexOf('state=pop_up') > -1 || url.indexOf('state=pop_up') > -1)
					selector = 'a[href="' + url + '"]';

				if (!name) {
					name = link.text.trim().replace('/', '-');
				}
				else {
					name = name + "_" + link.text.trim().replace('/', '-');
				}

				// filter remove portlet links
				if (name.indexOf('remove') == -1) {
					links.push(
						{
							'name': name,
							'selector': selector,
							'source': document.URL,
							'url': url
						}
					);
				}
			});

			return links;
		});

		Array.prototype.forEach.call(links, function(link) {
			if(instance._isNewLink(link['url']) && instance._isNewPortletComponent(link) && !instance._isLanguageLink(link['url'])) {
				if(link['selector'])
					instance.pendingLinks.unshift(link);
				else
					instance.pendingLinks.push(link);
			}
		});
	},

	_isNewLink: function(url) {
		if((url.indexOf(this.domain) > -1 && url.indexOf('logout') == -1 && !this.contains(this.pendingLinks, url) && !this.contains(this.visitedLinks, url))) {
			return true;
		}
		else {
			return false;
		}
	},

	_isNewPortletComponent: function(node) {
		for (var i = 0; i < this.pendingLinks.length; i++) {
			if (this.pendingLinks[i]['name'] == node['name']) {
				return false;
			}
		}

		for (var i = 0; i < this.visitedLinks.length; i++) {
			if (this.visitedLinks[i]['name'] == node['name']) {
				return false;
			}
		}

		return true;
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

	escapeRegExp: function(str) {
		return str.replace(/([*+?^$()|\[\]\/\\])/g, "\\$1");
	},

	contains: function(array, target) {
		target = this.escapeRegExp(target);

		if (target.indexOf('_11_p_u_i_d') > -1) {
			target = target.replace(/(_11_p_u_i_d(=|%3D))[0-9]+/g, '$1[0-9]+');
		}

		target = new RegExp(target);

		var compare;

		for (var i = 0; i < array.length; i++) {
			compare = array[i]['url'].match(target);
			if (array[i]['url'] == compare) {
				return true;
			}
		}
		return false;
	}
};

module.exports.Spider = Spider;
