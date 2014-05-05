/**
 * The class for web crawling
 */
function Spider(domain) {
	var instance = this;
	
	instance.depth = casper.cli.get('depth') || conf.depth;
	instance.domain = domain;
	instance.threshold = casper.cli.get('threshold') || conf.threshold;

	// tree that stores the hierarchy of portal
	conf.homepage.id = '0';
	instance.root = tree.parse(conf.homepage);

	// stack that stores the list of elements to visit
	instance.stack = [];

	// object that serves as a lookup table for duplicate links
	instance.clickablElements = {};
	instance.clickablElements[domain] = 1;

	// image comparator that process duplicate screenshots
	instance.ic = {};

	for(var i = 0; i < conf.viewport.length; i++) {
		instance.ic[conf.viewport[i].name] = new ImageComparator(conf.viewport[i].name, instance.threshold);
	}

	casper.on('screenshot.saved', function(viewport, file) {
		instance.ic[viewport.name].processImage(file, fs.absolute(viewport.dir) + '/junk');
	});
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
			this.viewport(viewportNode.width, viewportNode.height).then(function takeScreenshot() {
				this.capture(fname).then(function checkDuplicate() {
					casper.emit('screenshot.saved', viewportNode, fs.absolute(fname));
				});
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

	doClick: function(node) {
		var instance = this;

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
				if (!casper.exists(node.model.selector)) {
					return false;
				}

				casper.echo('++++ Click on ' + node.model.selector);
				var success = casper.click(node.model.selector);
				console.log(styleMsg('Click Successfully? ' + success, 'info'));
			});
		}
		else {
			casper.open(node.model.url);
		}

		return true;
	},

	process: function(node) {
		var instance = this;

		casper.viewport(1280, 1024);

		if (!instance.doClick(node)) {
			return;
		}

		casper.then(function waitForPageLoad() {
			casper.wait(1000, function screenshots() {

				//take screenshots
				for (var i = 0; i < conf.viewport.length; i++) {
					var dir = conf.viewport[i].dir + '/';
					var filename = dir + node.model.id + '_' + node.model.name + '.png';
					instance.captureScreenshot(conf.viewport[i], filename);
				}

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