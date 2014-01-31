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
		var newNode;

		var links = casper.evaluate(function(selector, domain) {
			return getLinks(selector, domain);
		}, 'a[href]', instance.domain);

		for (var i = 0; i < links.length; i++) {
			//console.log(links[i].selector);

			if (links[i].name.indexOf('#') == 0) {
				if (!instance.clickablElements[links[i].name]) {
					instance.clickablElements[links[i].name] = 1;
					newNode = node.addChild(tree.parse(links[i]));
					newNode.model.id = id + '\'' + (++count);
					instance.stack.push(newNode);
				}
			}
			else if (links[i].url) {
				if (!instance.clickablElements[links[i].url]) {
					instance.clickablElements[links[i].url] = 1;
					newNode = node.addChild(tree.parse(links[i]));
					newNode.model.id = id + '\'' + (++count);
					instance.stack.push(newNode);
				}
			}
			else {
				newNode = node.addChild(tree.parse(links[i]));
				newNode.model.id = id + '\'' + (++count);
				instance.stack.push(newNode);
			}
		}

		console.log(styleMsg('Found ' + count + ' new elements', 'info'));
	},

	captureScreenshot: function(viewportNode, fname) {
		casper.then(function setViewportSize() {
			casper.viewport(viewportNode.width, viewportNode.height).then(function takeScreenshot() {
				this.capture(fname);
			});
		});
	},

	crawl: function(node) {
		var instance = this;

		if (!node) {
			node = instance.root;
		}

		casper.then(function crawl() {
			casper.echo('====> processing node: ' + node.model.name);
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

	isSignedIn: function() {
		if (casper.exists('body.signed-in'))
			return true;
		else
			return false;
	},

	process: function(node) {
		var instance = this;

		casper.viewport(1280, 1024);

		// click on element or open a page
		if (node.model.selector) {
			if (node.model.selector.indexOf('_145_') > -1) {
				casper.echo('**** Calling Liferay.Dockbar._init()');
				casper.thenEvaluate(function initDockbar() {
					Liferay.Dockbar._init();
				});
				casper.echo('**** Dockbar has been initialized');
			}

			if (node.model.selector.indexOf('/') == 0) {
				node.model.selector = x(node.model.selector);
			}

			if (!casper.exists(node.model.selector)) {
				casper.echo('>>>> Opening up parent page ' + node.parent.model.url);
				casper.thenOpen(node.parent.model.url);
				casper.then(function() {
					casper.echo('>>>> Current page is ' + casper.getCurrentUrl());
				});
			}

			casper.echo('-------------------------------------------------');
			casper.then(function clickSelector() {
				casper.echo('++++ Click on ' + node.model.selector);
				var success = casper.click(node.model.selector);
				console.log(styleMsg('Click Successfully? ' + success, 'info'));
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