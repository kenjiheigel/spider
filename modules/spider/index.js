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
	this.pendingLinks = [];
	this.visitedLinks = [];
	this.fname = file;

	fw.write(this.fname, '', 'w');
}

Spider.prototype = {
	constructor: Spider,

	crawl: function(link) {
		var instance = this;

		casper.viewport(1280, 1024);

		instance.visitedLinks.push(link);

		if (link['selector']) {
			casper.echo('click element with selector: ' + link['selector']);

			if (casper.exists('.modal-focused')) {
				casper.echo('closing modal....');
				casper.evaluate(instance.closeDialog, '.modal-focused');
			}
			else if (casper.exists('.overlay-focused')) {
				casper.echo('.....closing overlay.....');
				casper.evaluate(instance.closeDialog, '.overlay-focused');
			}

			casper.click(link['selector']);
		}
		else {
			casper.echo('open link');
			casper.open(link['url']);
		}

		/*
		casper.evaluate(function() {
			if (Liferay.Dockbar) {
				__utils__.echo('initializing dockbar....');
				Liferay.Dockbar._init();
			}
		});
*/

		casper.then(function() {
			casper.echo('url: ' + casper.getCurrentUrl());

			link.id = instance.visitedLinks.length;

			fw.write(instance.fname, JSON.stringify(link, null, '\t') + '\n', 'a');

			casper.wait(1000, function() {

				for (var i = 0; i < conf.viewport.length; i++) {
					var shName = 'screenshots/' + conf.viewport[i].name + '/' + link.id + ')' + link['name'] + '.png';
					instance.captureScreenshot(conf.viewport[i], shName);
				}

				casper.then(function() {
					instance.addNewLinks();

					nextLink = instance._nextLink();

					if (nextLink) {
						instance.crawl(nextLink);
					}
					else if (!nextLink && !instance.isSignedIn()) {
						casper.open(instance.domain);

						casper.echo('Going to sign in as ' + conf.login.username);

						casper.then(function() {
							loginInstance.signIn(conf.login.email, conf.login.password);
						});

						casper.then(function() {
							if (instance.isSignedIn()) {
								casper.echo('sign in successfully');

								link = conf.homepage;
								link.name = link.name + ' - signed in';
								instance.crawl(link);
							}
						});
					}
				});

			});
		});
	},

	getDialogId: function(selector) {
		var A = AUI().use('widget');
		var dialog = A.Widget.getByNode(selector);
		if (dialog) {
			return dialog.get('id');
		}
		return null;
	},

	closeDialog: function(selector) {
		__utils__.echo('------------------closing dialog-----------');
		var A = AUI().use('widget');
		var dialog = A.Widget.getByNode(selector);
		if (dialog) {
			dialog.hide();
		}
	},

	captureScreenshot: function(viewportNode, fname) {
		casper.echo('captureScreenshot for ' + viewportNode.name);
		casper.then(function() {
			casper.viewport(viewportNode.width, viewportNode.height).then(function() {
				this.capture(fname);
			});
		});
	},

	addNewLinks: function() {
		var instance = this;

		var links = casper.evaluate(instance.findLinks, 'a[href]');

		Array.prototype.forEach.call(links, function(link) {
			if(instance._isNewLink(link['url']) && instance._isNewPortletComponent(link) && !instance._isLanguageLink(link['url'])) {
				if(link['selector'])
					instance.pendingLinks.unshift(link);
				else
					instance.pendingLinks.push(link);
			}
		});
	},

	findLinks: function(selector) {
		var links = [];

		var linkElements = __utils__.findAll(selector);

		Array.prototype.forEach.call(linkElements, function(link) {
			var selector = null;
			var url = link.getAttribute('href');
			var id = link.getAttribute('id');
			var onclick = '';

			if (url.indexOf('javascript') > -1) {
				if (id) {
					selector = '#' + id;
				}
			}

			// change relative path to absolute path
			if (url.indexOf('/') == 0) {
				url = 'http://localhost:8080' + url;
			}

			// check if the element is clickable
			if (link.hasAttribute('onClick')) {
				onclick = link.getAttribute('onClick');
			}

			// check if the link opens up a pop-up window; if so, simulate a click event
			if (onclick.indexOf('state=pop_up') > -1 || url.indexOf('state=pop_up') > -1) {
				selector = 'a[href="' + url + '"]';
			}

			if (!id) {
				name = link.textContent.trim().replace('/', '-');
			}
			else {
				name = id + "_" + link.textContent.trim().replace('/', '-');
			}

			// filter portlet remove links
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
	},

	isSignedIn: function() {
		if (casper.exists('body.signed-in'))
			return true;
		else
			return false;
	},

	_isNewLink: function(url) {
		if (url.indexOf('javascript') > -1) {
			return true;
		}

		if ((url.indexOf(this.domain) > -1 && url.indexOf('logout') == -1 && !this.contains(this.pendingLinks, url) && !this.contains(this.visitedLinks, url))) {
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
