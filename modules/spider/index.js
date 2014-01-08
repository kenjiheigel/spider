/**
 * The class for web crawling
 */
function Spider(domain, file) {

	this.domain = domain;

	if (casper.cli.has('depth')) {
		this.depth = casper.cli.get('depth');
	}
	else {
		this.depth = conf.depth;
	}

	casper.echo(this.depth);

	// tree that stores the hierarchy of portal
	this.root = tree.parse(
		{
			name: 'Homepage',
			occurrence: 1,
			url: domain,
			id: '0'
		}
	);

	// stack that stores the list of elements to visit
	this.stack = [];

	this.fname = file;

	// object that serves as a lookup table for duplicate links
	this.clickablElements = {};
	this.clickablElements[domain] = 1;

	fw.write(this.fname, '', 'w');
}

Spider.prototype = {
	constructor: Spider,

	addNewLinks: function(node) {
		var instance = this;
		var id = node.model.id;
		var count = 0;

		var links = casper.evaluate(instance.getLinks, 'a[href]', instance.domain, instance.clickablElements);

		if (links.length == 0) {
			return;
		}

		console.log(styleMsg('Found ' + links.length + ' new elements', 'info'));

		var newNode;

		for (var i = 0; i < links.length; i++) {
			// add new link to lookup table
			instance.clickablElements[links[i].url] = 1;

			// add new link to tree
			newNode = tree.parse(links[i]);
			newNode.model.id = id + '\'' + (i+1);
			node.addChild(newNode);

			// push new link to stack
			instance.stack.push(newNode);
		}
	},

	captureScreenshot: function(viewportNode, fname) {
		casper.then(function setViewportSize() {
			casper.viewport(viewportNode.width, viewportNode.height).then(function takeScreenshot() {
				this.capture(fname);
			});
		});
	},

	closeDialog: function(selector) {
		__utils__.echo('------------------closing dialog-----------');
		var A = AUI().use('widget');
		var dialog = A.Widget.getByNode(selector);

		if (dialog) {
			dialog.hide();
		}
	},

	crawl: function(node) {
		var instance = this;

		if (!node) {
			node = instance.root;
		}

		casper.then(function crawl() {
			instance.process(node);
		});

		casper.then(function printStackStatus() {
			console.log(styleMsg(instance.stack.length + ' elements left to visit', 'status'));
		});

		casper.then(function getNextElement() {
			if (instance.stack.length) {
				instance.crawl(instance.stack.shift());
			}
			else {
				if (!instance.isSignedIn()) {
					instance.signIn();

					casper.then(function afterSignIn() {
						if (instance.isSignedIn()) {
							console.log(styleMsg('Successfully signed in as ' + conf.login.username, 'pass'));
							instance.root.model.name +=  ' - signedIn';
							instance.crawl();
						}
					});
				}
				else {
					console.log(styleMsg('End of crawling!', 'status'));
				}
			}
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

	getLinks: function(selector, domain, lookup) {
		var links = [];

		var list = __utils__.findAll(selector);

		Array.prototype.forEach.call(list, function(item) {
			var obj = {};
			var id = item.getAttribute('id');
			var url = item.getAttribute('href');

			if (id) {
				obj.name = '#' + id + '_' + item.textContent.trim().replace('/', '-');
			}
			else {
				obj.name = item.textContent.trim().replace('/', '-');
			}

			// change relative path to absolute path
			if (url) {
				if (url.indexOf('/') == 0) {
					obj.url = 'http://localhost:8080' + url;
				}
				else {
					obj.url = url;
				}

				obj.selector = 'a[href="' + url + '"]';
			}
			else if (id) {
				obj.selector = '#' + id;
			}

			if ( (obj.url.indexOf(domain) != 0 /*&& obj.url.indexOf('javascript') == -1*/) || obj.url.indexOf('logout') > -1 || obj.url.indexOf('languageId') > -1 || obj.url.indexOf('delete') > -1 || obj.name.indexOf('Return to Full Page') > -1) {
			}
			else if (!lookup[obj.url]) {
				lookup[obj.url] = 1;
				links.push(obj);
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

	lookup: function(node) {
		if (this.clickablElements[node.model.url]) {
			this.clickablElements[node.model.url]++;
			return true;
		}
		else {
			this.clickablElements[node.model.url] = 1;
			return false;
		}
	},

	process: function(node) {
		var instance = this;

		casper.viewport(1280, 1024);

		// click on element or open a page
		if (node.model.selector) {

			if (!casper.exists(node.model.selector)) {
				casper.open(node.parent.model.url);
			}

			casper.then(function clickSelector() {
				casper.click(node.model.selector);
			});
		}
		else {
			casper.open(node.model.url);
		}

		casper.then(function waitForPageLoad() {
			casper.wait(1000, function screenshots() {

				//take screenshots
				for (var i = 0; i < conf.viewport.length; i++) {
					var shName = 'screenshots/' + conf.viewport[i].name + '/' + node.model.id + '_' + node.model.name + '.png';
					instance.captureScreenshot(conf.viewport[i], shName);
				}
/*
				casper.then(function writeToJSON() {
					//fw.write(instance.fname, JSON.stringify(node.model, null, '\t') + '\n', 'a');

					fw.write(instance.fname, node.model.id + '_' + node.model.name + ': ' + node.model.url + '\n', 'a');
				});
*/
				casper.then(function findNewElements() {
					if (node.model.id.split("\'").length <= instance.depth) {
						instance.addNewLinks(node);
					}

				});

			});
		});
	},

	signIn: function() {
		var instance = this;

		casper.open(instance.domain);

		console.log(styleMsg('Going to sign in as ' + conf.login.username, 'warning'));

		casper.then(function signIn() {
			loginInstance.signIn(conf.login.email, conf.login.password);
		});
	},
};

module.exports.Spider = Spider;
